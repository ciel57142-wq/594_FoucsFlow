import * as Notifications from "expo-notifications";
import { Task } from "@/types";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

/**
 * V1: fixed-offset reminder, N minutes before due_date.
 *
 * V2 (not implemented here): offsetMinutes will be computed per-task from
 * historical engagement time-of-day instead of being a constant -- see
 * proposal 2.4 and 4. The call site (this function's signature) is
 * intentionally the seam where that logic will plug in.
 */
export async function scheduleFixedOffsetReminder(
  task: Task,
  offsetMinutesBeforeDue: number
): Promise<string | null> {
  if (!task.dueDate) return null;

  const dueTime = new Date(task.dueDate).getTime();
  const triggerTime = dueTime - offsetMinutesBeforeDue * 60 * 1000;
  if (triggerTime <= Date.now()) return null; // already past, don't schedule

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: task.title,
      body: `Due in ${offsetMinutesBeforeDue} minutes`,
      data: { taskId: task.id },
    },
    trigger: { date: new Date(triggerTime) },
  });
  return id;
}

export async function cancelReminder(notificationId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}
