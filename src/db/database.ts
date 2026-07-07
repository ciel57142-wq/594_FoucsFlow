import * as SQLite from "expo-sqlite";

/**
 * V1 schema. Deliberately includes the columns V2's predictive layer will
 * need (actual_duration_minutes, deferral_count, time_of_day) so no
 * migration is required when Version 2 development starts -- see
 * RISKS.md, "Data model lock-in".
 */
const SCHEMA = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  notes TEXT,
  estimated_duration_minutes INTEGER,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high')),
  due_date TEXT,
  project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','completed','snoozed')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  scheduled_order INTEGER,
  completed_at TEXT,
  actual_duration_minutes INTEGER,
  deferral_count INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS task_tags (
  task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, tag_id)
);

-- Append-only completion event log. Never updated in place; this is the
-- dataset Version 2 trains its recommendation/prediction logic on.
CREATE TABLE IF NOT EXISTS completion_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  estimated_duration_minutes INTEGER,
  actual_duration_minutes INTEGER NOT NULL,
  completed_at TEXT NOT NULL,
  time_of_day TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS notification_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  offset_minutes_before_due INTEGER NOT NULL DEFAULT 60,
  enabled INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_completion_log_task ON completion_log(task_id);
`;

let dbInstance: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) return dbInstance;
  dbInstance = await SQLite.openDatabaseAsync("focusflow.db");
  await dbInstance.execAsync(SCHEMA);
  return dbInstance;
}

/** Only for tests / dev reset. Never call this from production UI code. */
export async function resetDb(): Promise<void> {
  const db = await getDb();
  await db.execAsync(`
    DROP TABLE IF EXISTS notification_rules;
    DROP TABLE IF EXISTS completion_log;
    DROP TABLE IF EXISTS task_tags;
    DROP TABLE IF EXISTS tasks;
    DROP TABLE IF EXISTS tags;
    DROP TABLE IF EXISTS projects;
  `);
  await db.execAsync(SCHEMA);
}
