import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Settings, Task } from '../domain/types';
import { HistoryProfile } from '../domain/profile';
import { planReminder } from '../domain/reminders';
import { formatClock } from '../domain/time';
import { getDb } from '../db';
import { logEvent } from '../db/repos/eventRepo';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: true,
  }),
});

export async function requestPermissions(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Task reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
      lightColor: '#0F6E63',
    });
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted;
}

async function cancelFor(taskId: string): Promise<void> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ notification_id: string }>(
    'SELECT notification_id FROM scheduled_notifications WHERE task_id = ?;',
    [taskId],
  );
  if (row) {
    try {
      await Notifications.cancelScheduledNotificationAsync(row.notification_id);
    } catch {
      // Already fired or cleared by the OS; the row below is the source of truth.
    }
    await db.runAsync('DELETE FROM scheduled_notifications WHERE task_id = ?;', [taskId]);
  }
}

/**
 * Reschedules one task's reminder. Version 1 puts it a fixed number of minutes
 * before the due time; Version 2 asks the history profile for the hour this
 * user actually acts on tasks like this one.
 */
export async function syncTaskReminder(
  task: Task,
  settings: Settings,
  profile: HistoryProfile,
  now = Date.now(),
): Promise<void> {
  await cancelFor(task.id);
  const plan = planReminder(task, settings, profile, now);
  if (!plan || plan.fireAt <= now) return;

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: task.title,
      body: plan.adaptive ? plan.reason : `Due ${formatClock(task.dueAt ?? plan.fireAt)}`,
      data: { taskId: task.id, adaptive: plan.adaptive },
      ...(Platform.OS === 'android' ? { channelId: 'reminders' } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: new Date(plan.fireAt),
    },
  });

  const db = await getDb();
  await db.runAsync(
    `INSERT OR REPLACE INTO scheduled_notifications (task_id, notification_id, fire_at, adaptive, reason)
     VALUES (?, ?, ?, ?, ?);`,
    [task.id, id, plan.fireAt, plan.adaptive ? 1 : 0, plan.reason],
  );
}

/** Rebuilds the whole notification set — cheap, and keeps the OS in step after a version switch. */
export async function syncAllReminders(
  tasks: Task[],
  settings: Settings,
  profile: HistoryProfile,
  now = Date.now(),
): Promise<number> {
  if (!settings.notificationsEnabled) {
    await Notifications.cancelAllScheduledNotificationsAsync();
    const db = await getDb();
    await db.execAsync('DELETE FROM scheduled_notifications;');
    return 0;
  }
  let count = 0;
  for (const task of tasks.filter((t) => t.status === 'open')) {
    await syncTaskReminder(task, settings, profile, now);
    count += 1;
  }
  return count;
}

export async function getPlannedReminder(taskId: string) {
  const db = await getDb();
  return db.getFirstAsync<{ fire_at: number; adaptive: number; reason: string | null }>(
    'SELECT fire_at, adaptive, reason FROM scheduled_notifications WHERE task_id = ?;',
    [taskId],
  );
}

/**
 * Engagement is itself a signal: if the user opens a reminder and finishes the
 * task, that hour gets a vote. Wire this up once, in App.tsx.
 */
export function attachEngagementListener(): () => void {
  const sub = Notifications.addNotificationResponseReceivedListener((response) => {
    const taskId = response.notification.request.content.data?.taskId as string | undefined;
    void logEvent('notification_engaged', taskId ?? null, { hour: new Date().getHours() });
  });
  const received = Notifications.addNotificationReceivedListener((notification) => {
    const taskId = notification.request.content.data?.taskId as string | undefined;
    void logEvent('notification_fired', taskId ?? null, { hour: new Date().getHours() });
  });
  return () => {
    sub.remove();
    received.remove();
  };
}
