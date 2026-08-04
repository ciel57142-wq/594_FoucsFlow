import { getDb, uuid } from '../index';
import { Project } from '../../domain/types';

const PALETTE = ['#0F6E63', '#3C5A72', '#C08A1E', '#C2543D', '#5A6B4A', '#6C4F7C'];

export async function listProjects(includeArchived = false): Promise<Project[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{
    id: string;
    name: string;
    color: string;
    archived: number;
    created_at: number;
  }>(
    includeArchived
      ? 'SELECT * FROM projects ORDER BY name ASC;'
      : 'SELECT * FROM projects WHERE archived = 0 ORDER BY name ASC;',
  );
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    color: r.color,
    archived: r.archived === 1,
    createdAt: r.created_at,
  }));
}

export async function createProject(name: string, color?: string): Promise<Project> {
  const db = await getDb();
  const id = uuid();
  const existing = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM projects;');
  const chosen = color ?? PALETTE[(existing?.n ?? 0) % PALETTE.length];
  const now = Date.now();
  await db.runAsync('INSERT INTO projects (id, name, color, archived, created_at) VALUES (?, ?, ?, 0, ?);', [
    id,
    name.trim(),
    chosen,
    now,
  ]);
  return { id, name: name.trim(), color: chosen, archived: false, createdAt: now };
}

export async function renameProject(id: string, name: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE projects SET name = ? WHERE id = ?;', [name.trim(), id]);
}

export async function archiveProject(id: string, archived = true): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE projects SET archived = ? WHERE id = ?;', [archived ? 1 : 0, id]);
}

export async function deleteProject(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM projects WHERE id = ?;', [id]);
}
