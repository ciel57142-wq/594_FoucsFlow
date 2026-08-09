import { getDb, uuid } from '../index';
import type { SQLiteBindParams } from 'expo-sqlite';
import { DateKey, Priority, Task } from '../../domain/types';
import { dateKey, dateKeyToTs, DAY } from '../../domain/time';
import { logEvent } from './eventRepo';
import { ensureTags, tagNamesForTasks } from './tagRepo';

interface TaskRow {
  id: string;
  title: string;
  notes: string | null;
  project_id: string | null;
  priority: number;
  estimate_min: number;
  due_at: number | null;
  scheduled_for: string | null;
  status: string;
  manual_order: number;
  deferral_count: number;
  actual_min: number | null;
  completed_at: number | null;
  reminder_offset_min: number | null;
  created_at: number;
  updated_at: number;
}

function rowToTask(row: TaskRow, tags: string[]): Task {
  return {
    id: row.id,
    title: row.title,
    notes: row.notes,
    projectId: row.project_id,
    priority: row.priority as Priority,
    estimateMin: row.estimate_min,
    dueAt: row.due_at,
    scheduledFor: row.scheduled_for,
    status: row.status === 'done' ? 'done' : 'open',
    manualOrder: row.manual_order,
    deferralCount: row.deferral_count,
    actualMin: row.actual_min,
    completedAt: row.completed_at,
    reminderOffsetMin: row.reminder_offset_min,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    tags,
  };
}

async function hydrate(rows: TaskRow[]): Promise<Task[]> {
  if (rows.length === 0) return [];
  const tagMap = await tagNamesForTasks(rows.map((r) => r.id));
  return rows.map((r) => rowToTask(r, tagMap[r.id] ?? []));
}

export async function listAllTasks(): Promise<Task[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<TaskRow>('SELECT * FROM tasks ORDER BY manual_order ASC, created_at ASC;');
  return hydrate(rows);
}

export async function listOpenTasks(): Promise<Task[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<TaskRow>(
    "SELECT * FROM tasks WHERE status = 'open' ORDER BY manual_order ASC, created_at ASC;",
  );
  return hydrate(rows);
}

export async function tasksForDay(day: DateKey): Promise<Task[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<TaskRow>(
    'SELECT * FROM tasks WHERE scheduled_for = ? ORDER BY manual_order ASC, created_at ASC;',
    [day],
  );
  return hydrate(rows);
}

export async function getTask(id: string): Promise<Task | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<TaskRow>('SELECT * FROM tasks WHERE id = ?;', [id]);
  if (!row) return null;
  const [task] = await hydrate([row]);
  return task;
}

export interface TaskInput {
  title: string;
  notes?: string | null;
  projectId?: string | null;
  priority?: Priority;
  estimateMin?: number;
  dueAt?: number | null;
  scheduledFor?: DateKey | null;
  tags?: string[];
  reminderOffsetMin?: number | null;
}

export async function createTask(input: TaskInput): Promise<Task> {
  const db = await getDb();
  const now = Date.now();
  const id = uuid();
  const orderRow = await db.getFirstAsync<{ max: number | null }>(
    'SELECT MAX(manual_order) AS max FROM tasks WHERE scheduled_for IS ?;',
    [input.scheduledFor ?? null],
  );
  const manualOrder = (orderRow?.max ?? 0) + 1;

  await db.runAsync(
    `INSERT INTO tasks (id, title, notes, project_id, priority, estimate_min, due_at, scheduled_for,
      status, manual_order, deferral_count, reminder_offset_min, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'open', ?, 0, ?, ?, ?);`,
    [
      id,
      input.title.trim(),
      input.notes ?? null,
      input.projectId ?? null,
      input.priority ?? 1,
      input.estimateMin ?? 30,
      input.dueAt ?? null,
      input.scheduledFor ?? null,
      manualOrder,
      input.reminderOffsetMin ?? null,
      now,
      now,
    ],
  );

  if (input.tags?.length) await setTaskTags(id, input.tags);
  await logEvent('created', id, { title: input.title, scheduledFor: input.scheduledFor ?? null });
  if (input.scheduledFor) await recordPlan(id, input.scheduledFor, input.estimateMin ?? 30);

  return (await getTask(id))!;
}

export async function updateTask(id: string, patch: Partial<TaskInput>): Promise<void> {
  const db = await getDb();
  const before = await getTask(id);
  if (!before) return;

  const columns: Record<string, string | number | null> = {};
  if (patch.title !== undefined) columns.title = patch.title.trim();
  if (patch.notes !== undefined) columns.notes = patch.notes;
  if (patch.projectId !== undefined) columns.project_id = patch.projectId;
  if (patch.priority !== undefined) columns.priority = patch.priority;
  if (patch.estimateMin !== undefined) columns.estimate_min = patch.estimateMin;
  if (patch.dueAt !== undefined) columns.due_at = patch.dueAt;
  if (patch.scheduledFor !== undefined) columns.scheduled_for = patch.scheduledFor;
  if (patch.reminderOffsetMin !== undefined) columns.reminder_offset_min = patch.reminderOffsetMin;
  columns.updated_at = Date.now();

  const assignments = Object.keys(columns)
    .map((c) => `${c} = ?`)
    .join(', ');
  await db.runAsync(`UPDATE tasks SET ${assignments} WHERE id = ?;`, [...Object.values(columns), id] as SQLiteBindParams);

  if (patch.tags !== undefined) await setTaskTags(id, patch.tags);
  await logEvent('edited', id, { changed: Object.keys(columns) });

  if (patch.scheduledFor) {
    await recordPlan(id, patch.scheduledFor, patch.estimateMin ?? before.estimateMin);
  }
}

export async function deleteTask(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM tasks WHERE id = ?;', [id]);
  await logEvent('deleted', id);
}

/** Completing writes the two numbers Version 2 cannot be built without. */
export async function completeTask(id: string, actualMin?: number | null): Promise<void> {
  const db = await getDb();
  const task = await getTask(id);
  if (!task) return;
  const now = Date.now();
  await db.runAsync(
    "UPDATE tasks SET status = 'done', completed_at = ?, actual_min = ?, updated_at = ? WHERE id = ?;",
    [now, actualMin ?? task.estimateMin, now, id],
  );
  const day = task.scheduledFor ?? dateKey(now);
  await db.runAsync('UPDATE day_plans SET completed_on_day = 1 WHERE task_id = ? AND scheduled_for = ?;', [id, day]);
  await logEvent('completed', id, {
    estimateMin: task.estimateMin,
    actualMin: actualMin ?? task.estimateMin,
    hour: new Date(now).getHours(),
    deferralCount: task.deferralCount,
  });
}

export async function reopenTask(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    "UPDATE tasks SET status = 'open', completed_at = NULL, actual_min = NULL, updated_at = ? WHERE id = ?;",
    [Date.now(), id],
  );
  await logEvent('reopened', id);
}

/** Pushing work to another day is the deferral signal, so it is counted. */
export async function snoozeTask(id: string, days = 1): Promise<void> {
  const db = await getDb();
  const task = await getTask(id);
  if (!task) return;
  const base = task.scheduledFor ?? dateKey(Date.now());
  const next = dateKey(dateKeyToTs(base) + days * DAY);
  await db.runAsync(
    'UPDATE tasks SET scheduled_for = ?, deferral_count = deferral_count + 1, updated_at = ? WHERE id = ?;',
    [next, Date.now(), id],
  );
  await recordPlan(id, next, task.estimateMin);
  await logEvent('snoozed', id, { from: base, to: next, deferralCount: task.deferralCount + 1 });
}

export async function scheduleTask(id: string, day: DateKey | null): Promise<void> {
  const db = await getDb();
  const task = await getTask(id);
  if (!task) return;
  const isDeferral = task.scheduledFor != null && day != null && day > task.scheduledFor;
  await db.runAsync(
    `UPDATE tasks SET scheduled_for = ?, deferral_count = deferral_count + ?, updated_at = ? WHERE id = ?;`,
    [day, isDeferral ? 1 : 0, Date.now(), id],
  );
  if (day) {
    await recordPlan(id, day, task.estimateMin);
    await logEvent(isDeferral ? 'rescheduled' : 'scheduled', id, { from: task.scheduledFor, to: day });
  } else {
    await logEvent('rescheduled', id, { from: task.scheduledFor, to: null });
  }
}

/** Version 1's manual ordering on Today. */
export async function reorderTasks(orderedIds: string[]): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    for (let i = 0; i < orderedIds.length; i++) {
      await db.runAsync('UPDATE tasks SET manual_order = ?, updated_at = ? WHERE id = ?;', [
        i,
        Date.now(),
        orderedIds[i],
      ]);
    }
  });
}

async function setTaskTags(taskId: string, tagNames: string[]): Promise<void> {
  const db = await getDb();
  const ids = await ensureTags(tagNames);
  await db.runAsync('DELETE FROM task_tags WHERE task_id = ?;', [taskId]);
  for (const tagId of ids) {
    await db.runAsync('INSERT OR IGNORE INTO task_tags (task_id, tag_id) VALUES (?, ?);', [taskId, tagId]);
  }
}

/**
 * Snapshots "this task was on the plan for this day". Version 2 trains on these
 * rows, so they are written the moment a task lands on a day — not reconstructed
 * later from whatever survived.
 */
export async function recordPlan(taskId: string, day: DateKey, estimateMin: number): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO day_plans (scheduled_for, task_id, planned_at, estimate_min, completed_on_day)
     VALUES (?, ?, ?, ?, 0)
     ON CONFLICT(scheduled_for, task_id) DO UPDATE SET estimate_min = excluded.estimate_min;`,
    [day, taskId, Date.now(), estimateMin],
  );
}

export async function countTasks(): Promise<{ open: number; done: number }> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ open: number; done: number }>(
    "SELECT SUM(status = 'open') AS open, SUM(status = 'done') AS done FROM tasks;",
  );
  return { open: row?.open ?? 0, done: row?.done ?? 0 };
}
