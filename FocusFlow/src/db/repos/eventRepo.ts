import { getDb } from '../index';
import { EventType, TaskEvent } from '../../domain/types';

/**
 * The append-only log. Version 1 writes it, Version 2 learns from it — nothing
 * in here is derived, so the history stays trustworthy across versions.
 */
export async function logEvent(
  type: EventType,
  taskId: string | null = null,
  payload: Record<string, unknown> | null = null,
): Promise<void> {
  const db = await getDb();
  await db.runAsync('INSERT INTO events (task_id, type, payload, created_at) VALUES (?, ?, ?, ?);', [
    taskId,
    type,
    payload ? JSON.stringify(payload) : null,
    Date.now(),
  ]);
}

export async function listEvents(limit = 200): Promise<TaskEvent[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{
    id: number;
    task_id: string | null;
    type: string;
    payload: string | null;
    created_at: number;
  }>('SELECT * FROM events ORDER BY created_at DESC LIMIT ?;', [limit]);
  return rows.map((r) => ({
    id: r.id,
    taskId: r.task_id,
    type: r.type as EventType,
    payload: r.payload ? JSON.parse(r.payload) : null,
    createdAt: r.created_at,
  }));
}

export async function countEvents(): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM events;');
  return row?.n ?? 0;
}
