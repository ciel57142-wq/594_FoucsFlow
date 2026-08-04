import { CompletionRecord, DayAttempt, Task } from './types';
import { DAY, dateKey, startOfDay } from './time';
export interface WeeklyStats {
  windowDays: number;
  planned: number;
  completed: number;
  completionRate: number;
  /** Mean of |actual − estimate| ÷ estimate across tasks with both numbers. */
  estimateError: number;
  /** >1 means work takes longer than the user expects. */
  estimateRatio: number;
  medianCompletionHour: number | null;
  currentStreakDays: number;
  perDay: { key: string; planned: number; completed: number; minutes: number }[];
  perTag: { tag: string; planned: number; completed: number; rate: number }[];
  busiestHours: { hour: number; count: number }[];
}

export function weeklyStats(
  completions: CompletionRecord[],
  attempts: DayAttempt[],
  now = Date.now(),
  windowDays = 7,
): WeeklyStats {
  const since = startOfDay(now) - (windowDays - 1) * DAY;
  const recentCompletions = completions.filter((c) => c.completedAt >= since);
  const recentAttempts = attempts.filter((a) => a.evaluatedAt >= since);

  const perDayMap = new Map<string, { planned: number; completed: number; minutes: number }>();
  for (let i = 0; i < windowDays; i++) {
    perDayMap.set(dateKey(since + i * DAY), { planned: 0, completed: 0, minutes: 0 });
  }
  for (const a of recentAttempts) {
    const bucket = perDayMap.get(a.scheduledFor);
    if (bucket) bucket.planned += 1;
  }
  for (const c of recentCompletions) {
    const bucket = perDayMap.get(dateKey(c.completedAt));
    if (bucket) {
      bucket.completed += 1;
      bucket.minutes += c.actualMin ?? c.estimateMin;
    }
  }

  let errSum = 0;
  let ratioSum = 0;
  let measured = 0;
  const hours: number[] = [];
  const hourCounts = new Array(24).fill(0);
  for (const c of recentCompletions) {
    hours.push(new Date(c.completedAt).getHours());
    hourCounts[new Date(c.completedAt).getHours()] += 1;
    if (c.actualMin != null && c.estimateMin > 0) {
      errSum += Math.abs(c.actualMin - c.estimateMin) / c.estimateMin;
      ratioSum += c.actualMin / c.estimateMin;
      measured += 1;
    }
  }
  hours.sort((a, b) => a - b);

  const perTagMap = new Map<string, { planned: number; completed: number }>();
  for (const a of recentAttempts) {
    for (const tag of a.tags) {
      const t = perTagMap.get(tag) ?? { planned: 0, completed: 0 };
      t.planned += 1;
      if (a.completed) t.completed += 1;
      perTagMap.set(tag, t);
    }
  }

  const planned = recentAttempts.length;
  const completed = recentAttempts.filter((a) => a.completed).length;

  return {
    windowDays,
    planned,
    completed,
    completionRate: planned > 0 ? completed / planned : 0,
    estimateError: measured > 0 ? errSum / measured : 0,
    estimateRatio: measured > 0 ? ratioSum / measured : 1,
    medianCompletionHour: hours.length > 0 ? hours[Math.floor(hours.length / 2)] : null,
    currentStreakDays: completionStreak(completions, now),
    perDay: [...perDayMap.entries()].map(([key, v]) => ({ key, ...v })),
    perTag: [...perTagMap.entries()]
      .map(([tag, t]) => ({ tag, ...t, rate: t.planned > 0 ? t.completed / t.planned : 0 }))
      .sort((a, b) => b.planned - a.planned),
    busiestHours: hourCounts
      .map((count, hour) => ({ hour, count }))
      .filter((h) => h.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3),
  };
}

/** Consecutive days ending today (or yesterday) with at least one completion. */
export function completionStreak(completions: CompletionRecord[], now = Date.now()): number {
  const days = new Set(completions.map((c) => dateKey(c.completedAt)));
  let streak = 0;
  let cursor = startOfDay(now);
  if (!days.has(dateKey(cursor))) {
    cursor -= DAY;
    if (!days.has(dateKey(cursor))) return 0;
  }
  while (days.has(dateKey(cursor))) {
    streak += 1;
    cursor -= DAY;
  }
  return streak;
}

export function taskToCompletionRecord(task: Task): CompletionRecord | null {
  if (task.status !== 'done' || task.completedAt == null) return null;
  return {
    taskId: task.id,
    tags: task.tags,
    projectId: task.projectId,
    estimateMin: task.estimateMin,
    actualMin: task.actualMin,
    completedAt: task.completedAt,
    deferralCount: task.deferralCount,
    dueAt: task.dueAt,
  };
}
