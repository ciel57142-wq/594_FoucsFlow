import { Settings, Task } from './types';
import { HistoryProfile, hourFit } from './profile';
import { DAY, HOUR, MINUTE, dateKeyToTs, formatHour, startOfDay } from './time';

export interface ReminderPlan {
  fireAt: number;
  /** Shown in the task detail so the timing is never a mystery. */
  reason: string;
  adaptive: boolean;
}

export function isQuietHour(hour: number, settings: Settings): boolean {
  const { quietStartHour: start, quietEndHour: end } = settings;
  const h = ((hour % 24) + 24) % 24;
  return start > end ? h >= start || h < end : h >= start && h < end;
}

/** Version 1: a fixed offset before the due time. */
export function fixedReminder(task: Task, settings: Settings, now: number): ReminderPlan | null {
  const offset = (task.reminderOffsetMin ?? settings.defaultReminderOffsetMin) * MINUTE;
  const anchor = task.dueAt ?? (task.scheduledFor ? dateKeyToTs(task.scheduledFor, 9) : null);
  if (anchor == null) return null;
  let fireAt = anchor - offset;
  if (fireAt <= now) return null;
  if (isQuietHour(new Date(fireAt).getHours(), settings)) {
    fireAt = nextWakingMoment(fireAt, settings);
    if (fireAt >= anchor) return null;
  }
  return {
    fireAt,
    reason: `${task.reminderOffsetMin ?? settings.defaultReminderOffsetMin} minutes before it is due`,
    adaptive: false,
  };
}

function nextWakingMoment(ts: number, settings: Settings): number {
  const d = new Date(ts);
  const hour = d.getHours();
  const base = startOfDay(ts);
  // Before the quiet window ends on the same morning, wait for the end hour.
  if (hour < settings.quietEndHour) return base + settings.quietEndHour * HOUR;
  return base + DAY + settings.quietEndHour * HOUR;
}

/**
 * Version 2: instead of a fixed offset, look for the hour the user has
 * historically engaged with tasks like this one, inside the window between now
 * and the deadline.
 */
export function adaptiveReminder(
  task: Task,
  settings: Settings,
  profile: HistoryProfile,
  now: number,
): ReminderPlan | null {
  const fallback = fixedReminder(task, settings, now);
  if (profile.coldStart) {
    return fallback
      ? { ...fallback, reason: `${fallback.reason} — still learning your patterns` }
      : null;
  }

  const anchor = task.dueAt ?? (task.scheduledFor ? dateKeyToTs(task.scheduledFor, 22) : null);
  if (anchor == null) return fallback;

  // Never nag after the fact, and always leave room to actually do the work.
  const latest = anchor - Math.max(15, Math.min(task.estimateMin, 120)) * MINUTE;
  const earliest = now + 5 * MINUTE;
  if (latest <= earliest) return fallback;

  let best: { ts: number; fit: number } | null = null;
  for (let ts = ceilToHour(earliest); ts <= latest; ts += HOUR) {
    const hour = new Date(ts).getHours();
    if (isQuietHour(hour, settings)) continue;
    // Prefer strong hours, but discount ones far from the deadline so a great
    // Tuesday morning does not beat a decent hour on the due day.
    const proximity = 1 - Math.min(1, (anchor - ts) / (3 * DAY));
    const fit = hourFit(hour, task.tags, profile) * (0.6 + 0.4 * proximity);
    if (!best || fit > best.fit) best = { ts, fit };
  }

  if (!best) return fallback;

  const hour = new Date(best.ts).getHours();
  const scope = task.tags.length > 0 ? `${task.tags.join(', ')} tasks` : 'tasks like this';
  return {
    fireAt: best.ts,
    reason: `You usually get ${scope} done around ${formatHour(hour)}`,
    adaptive: true,
  };
}

export function planReminder(
  task: Task,
  settings: Settings,
  profile: HistoryProfile,
  now = Date.now(),
): ReminderPlan | null {
  if (!settings.notificationsEnabled || task.status === 'done') return null;
  return settings.appVersion === 2
    ? adaptiveReminder(task, settings, profile, now)
    : fixedReminder(task, settings, now);
}

function ceilToHour(ts: number): number {
  const d = new Date(ts);
  if (d.getMinutes() === 0 && d.getSeconds() === 0 && d.getMilliseconds() === 0) return ts;
  d.setMinutes(0, 0, 0);
  return d.getTime() + HOUR;
}
