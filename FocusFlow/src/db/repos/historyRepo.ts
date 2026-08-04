import { getDb } from '../index';
import { CompletionRecord, DayAttempt, Priority } from '../../domain/types';
import { dateKey, dateKeyToTs } from '../../domain/time';
import { tagNamesForTasks } from './tagRepo';

/** Every finished task, newest last. This is the learning layer's raw input. */
export async function listCompletions(limit = 500): Promise<CompletionRecord[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{
    id: string;
    project_id: string | null;
    estimate_min: number;
    actual_min: number | null;
    completed_at: number;
    deferral_count: number;
    due_at: number | null;
  }>(
    `SELECT id, project_id, estimate_min, actual_min, completed_at, deferral_count, due_at
     FROM tasks WHERE status = 'done' AND completed_at IS NOT NULL
     ORDER BY completed_at DESC LIMIT ?;`,
    [limit],
  );
  const tagMap = await tagNamesForTasks(rows.map((r) => r.id));
  return rows
    .map((r) => ({
      taskId: r.id,
      tags: tagMap[r.id] ?? [],
      projectId: r.project_id,
      estimateMin: r.estimate_min,
      actualMin: r.actual_min,
      completedAt: r.completed_at,
      deferralCount: r.deferral_count,
      dueAt: r.due_at,
    }))
    .reverse();
}

/**
 * Labelled training rows: for every past day a task was planned, did it get
 * done that day? Signals are re-derived from the stored snapshot as if we were
 * standing at 9 AM on that morning.
 */
export async function listAttempts(limit = 1000, now = Date.now()): Promise<DayAttempt[]> {
  const db = await getDb();
  const today = dateKey(now);
  const rows = await db.getAllAsync<{
    scheduled_for: string;
    task_id: string;
    estimate_min: number;
    completed_on_day: number;
    priority: number;
    due_at: number | null;
    deferral_count: number;
  }>(
    `SELECT p.scheduled_for, p.task_id, p.estimate_min, p.completed_on_day,
            t.priority, t.due_at, t.deferral_count
     FROM day_plans p JOIN tasks t ON t.id = p.task_id
     WHERE p.scheduled_for < ?
     ORDER BY p.scheduled_for DESC LIMIT ?;`,
    [today, limit],
  );

  const loadByDay = new Map<string, number>();
  for (const r of rows) {
    loadByDay.set(r.scheduled_for, (loadByDay.get(r.scheduled_for) ?? 0) + r.estimate_min);
  }

  const tagMap = await tagNamesForTasks(rows.map((r) => r.task_id));
  return rows
    .map((r) => ({
      taskId: r.task_id,
      scheduledFor: r.scheduled_for,
      evaluatedAt: dateKeyToTs(r.scheduled_for, 9),
      tags: tagMap[r.task_id] ?? [],
      priority: r.priority as Priority,
      estimateMin: r.estimate_min,
      dueAt: r.due_at,
      deferralCount: r.deferral_count,
      dayLoadMin: loadByDay.get(r.scheduled_for) ?? r.estimate_min,
      completed: r.completed_on_day === 1,
    }))
    .reverse();
}
