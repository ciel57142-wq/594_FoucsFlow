import { getDb } from "./database";
import { Task, Priority } from "@/types";

export interface NewTaskInput {
  title: string;
  notes?: string;
  estimatedDurationMinutes?: number;
  priority?: Priority;
  dueDate?: string;
  projectId?: number;
  tagIds?: number[];
}

function rowToTask(row: any): Task {
  return {
    id: row.id,
    title: row.title,
    notes: row.notes,
    estimatedDurationMinutes: row.estimated_duration_minutes,
    priority: row.priority,
    dueDate: row.due_date,
    projectId: row.project_id,
    status: row.status,
    createdAt: row.created_at,
    scheduledOrder: row.scheduled_order,
    completedAt: row.completed_at,
    actualDurationMinutes: row.actual_duration_minutes,
    deferralCount: row.deferral_count,
  };
}

/** Two-tap capture: title is the only required field. */
export async function createTask(input: NewTaskInput): Promise<number> {
  const db = await getDb();
  const result = await db.runAsync(
    `INSERT INTO tasks (title, notes, estimated_duration_minutes, priority, due_date, project_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
    input.title,
    input.notes ?? null,
    input.estimatedDurationMinutes ?? null,
    input.priority ?? "medium",
    input.dueDate ?? null,
    input.projectId ?? null
  );
  const taskId = result.lastInsertRowId;

  if (input.tagIds?.length) {
    for (const tagId of input.tagIds) {
      await db.runAsync(
        `INSERT OR IGNORE INTO task_tags (task_id, tag_id) VALUES (?, ?)`,
        taskId,
        tagId
      );
    }
  }
  return taskId;
}

/** Today view: pending tasks due today or overdue, in manual scheduled order. */
export async function getTodayTasks(todayIso: string): Promise<Task[]> {
  const db = await getDb();
  const rows = await db.getAllAsync(
    `SELECT * FROM tasks
     WHERE status != 'completed'
       AND (due_date IS NULL OR due_date <= ?)
     ORDER BY scheduled_order IS NULL, scheduled_order ASC, priority DESC, due_date ASC`,
    todayIso
  );
  return rows.map(rowToTask);
}

export async function completeTask(
  taskId: number,
  actualDurationMinutes: number
): Promise<void> {
  const db = await getDb();
  const now = new Date();
  const completedAt = now.toISOString();
  const timeOfDay = completedAt.slice(11, 16); // "HH:mm"

  const task = await db.getFirstAsync<any>(
    `SELECT estimated_duration_minutes FROM tasks WHERE id = ?`,
    taskId
  );

  await db.runAsync(
    `UPDATE tasks
     SET status = 'completed', completed_at = ?, actual_duration_minutes = ?
     WHERE id = ?`,
    completedAt,
    actualDurationMinutes,
    taskId
  );

  await db.runAsync(
    `INSERT INTO completion_log (task_id, estimated_duration_minutes, actual_duration_minutes, completed_at, time_of_day)
     VALUES (?, ?, ?, ?, ?)`,
    taskId,
    task?.estimated_duration_minutes ?? null,
    actualDurationMinutes,
    completedAt,
    timeOfDay
  );
}

/** Snooze/reschedule both increment deferral_count -- a V2 recommendation input. */
export async function rescheduleTask(taskId: number, newDueDate: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE tasks SET due_date = ?, status = 'pending', deferral_count = deferral_count + 1 WHERE id = ?`,
    newDueDate,
    taskId
  );
}

export async function snoozeTask(taskId: number): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE tasks SET status = 'snoozed', deferral_count = deferral_count + 1 WHERE id = ?`,
    taskId
  );
}

export async function reorderTask(taskId: number, newOrder: number): Promise<void> {
  const db = await getDb();
  await db.runAsync(`UPDATE tasks SET scheduled_order = ? WHERE id = ?`, newOrder, taskId);
}

export async function deleteTask(taskId: number): Promise<void> {
  const db = await getDb();
  await db.runAsync(`DELETE FROM tasks WHERE id = ?`, taskId);
}
