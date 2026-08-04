/**
 * Schema migrations, applied in order against PRAGMA user_version.
 *
 * Version 1 risk register entry "data model lock-in": the event log and the
 * actual_min / completed_at columns exist from migration 1 even though Version 1
 * only displays them descriptively. Version 2's learning layer reads exactly
 * these columns, so no migration is needed to turn prediction on.
 */
export interface Migration {
  version: number;
  statements: string[];
}

export const MIGRATIONS: Migration[] = [
  {
    version: 1,
    statements: [
      `CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        color TEXT NOT NULL DEFAULT '#0F6E63',
        archived INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL
      );`,
      `CREATE TABLE IF NOT EXISTS tags (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL UNIQUE
      );`,
      `CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        notes TEXT,
        project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
        priority INTEGER NOT NULL DEFAULT 1,
        estimate_min INTEGER NOT NULL DEFAULT 30,
        due_at INTEGER,
        scheduled_for TEXT,
        status TEXT NOT NULL DEFAULT 'open',
        manual_order REAL NOT NULL DEFAULT 0,
        deferral_count INTEGER NOT NULL DEFAULT 0,
        actual_min INTEGER,
        completed_at INTEGER,
        reminder_offset_min INTEGER,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );`,
      `CREATE TABLE IF NOT EXISTS task_tags (
        task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
        PRIMARY KEY (task_id, tag_id)
      );`,
      `CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task_id TEXT,
        type TEXT NOT NULL,
        payload TEXT,
        created_at INTEGER NOT NULL
      );`,
      `CREATE TABLE IF NOT EXISTS day_plans (
        scheduled_for TEXT NOT NULL,
        task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        planned_at INTEGER NOT NULL,
        estimate_min INTEGER NOT NULL,
        completed_on_day INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (scheduled_for, task_id)
      );`,
      `CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      );`,
      `CREATE TABLE IF NOT EXISTS scheduled_notifications (
        task_id TEXT PRIMARY KEY NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        notification_id TEXT NOT NULL,
        fire_at INTEGER NOT NULL,
        adaptive INTEGER NOT NULL DEFAULT 0,
        reason TEXT
      );`,
      `CREATE INDEX IF NOT EXISTS idx_tasks_scheduled ON tasks(scheduled_for, status);`,
      `CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status, due_at);`,
      `CREATE INDEX IF NOT EXISTS idx_events_task ON events(task_id, created_at);`,
      `CREATE INDEX IF NOT EXISTS idx_day_plans_day ON day_plans(scheduled_for);`,
    ],
  },
  {
    version: 2,
    statements: [
      // Version 2 adds only the learned-model cache. Every input it needs was
      // already being written by Version 1.
      `CREATE TABLE IF NOT EXISTS model_state (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      );`,
    ],
  },
];

export const LATEST_VERSION = MIGRATIONS[MIGRATIONS.length - 1].version;
