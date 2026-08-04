import * as SQLite from 'expo-sqlite';
import { LATEST_VERSION, MIGRATIONS } from './schema';

export const DB_NAME = 'focusflow.db';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync(DB_NAME);
      await db.execAsync('PRAGMA journal_mode = WAL;');
      await db.execAsync('PRAGMA foreign_keys = ON;');
      await migrate(db);
      return db;
    })();
  }
  return dbPromise;
}

async function migrate(db: SQLite.SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version;');
  let current = row?.user_version ?? 0;
  if (current >= LATEST_VERSION) return;

  for (const migration of MIGRATIONS) {
    if (migration.version <= current) continue;
    await db.withTransactionAsync(async () => {
      for (const statement of migration.statements) {
        await db.execAsync(statement);
      }
    });
    current = migration.version;
    // PRAGMA does not accept bound parameters.
    await db.execAsync(`PRAGMA user_version = ${current};`);
  }
}

/** Drops every row but keeps the schema. Used by Settings → Reset. */
export async function resetDatabase(): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    for (const table of [
      'task_tags',
      'scheduled_notifications',
      'day_plans',
      'events',
      'tasks',
      'tags',
      'projects',
      'model_state',
    ]) {
      await db.execAsync(`DELETE FROM ${table};`);
    }
  });
}

export function uuid(): string {
  // RFC-4122-shaped id; collision risk is irrelevant for a single-device app.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
