import { getDb, uuid } from '../index';
import { Tag } from '../../domain/types';

export async function listTags(): Promise<Tag[]> {
  const db = await getDb();
  return db.getAllAsync<Tag>('SELECT id, name FROM tags ORDER BY name ASC;');
}

/** Creates any tag that does not exist yet and returns every id, in input order. */
export async function ensureTags(names: string[]): Promise<string[]> {
  const db = await getDb();
  const ids: string[] = [];
  for (const raw of names) {
    const name = raw.trim().toLowerCase();
    if (!name) continue;
    const existing = await db.getFirstAsync<{ id: string }>('SELECT id FROM tags WHERE name = ?;', [name]);
    if (existing) {
      ids.push(existing.id);
      continue;
    }
    const id = uuid();
    await db.runAsync('INSERT INTO tags (id, name) VALUES (?, ?);', [id, name]);
    ids.push(id);
  }
  return ids;
}

export async function tagNamesForTasks(taskIds: string[]): Promise<Record<string, string[]>> {
  if (taskIds.length === 0) return {};
  const db = await getDb();
  const placeholders = taskIds.map(() => '?').join(',');
  const rows = await db.getAllAsync<{ task_id: string; name: string }>(
    `SELECT tt.task_id, t.name FROM task_tags tt
     JOIN tags t ON t.id = tt.tag_id
     WHERE tt.task_id IN (${placeholders})
     ORDER BY t.name ASC;`,
    taskIds,
  );
  const out: Record<string, string[]> = {};
  for (const r of rows) (out[r.task_id] ||= []).push(r.name);
  return out;
}

export async function deleteTag(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM tags WHERE id = ?;', [id]);
}
