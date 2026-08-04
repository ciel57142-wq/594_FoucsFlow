import { getDb, uuid } from '../db';
import { ensureTags } from '../db/repos/tagRepo';
import { createProject, listProjects } from '../db/repos/projectRepo';
import { logEvent } from '../db/repos/eventRepo';
import { STUDENT_PERSONA, generateHistory } from '../domain/synthetic';
import { DAY, HOUR, dateKey, startOfDay } from '../domain/time';

/**
 * Loads the demo dataset used in the system-test scripts: a realistic history
 * plus a live plan for today. The history is generated from a fixed seed, so
 * every run produces the same numbers and the statistics screen can be checked
 * against known answers.
 */
export async function seedDemoData(days = 60, now = Date.now()): Promise<{ tasks: number; completed: number }> {
  const db = await getDb();
  const { rows } = generateHistory(STUDENT_PERSONA, days, now);

  const projects = await listProjects();
  const school = projects.find((p) => p.name === 'Coursework') ?? (await createProject('Coursework', '#0F6E63'));
  const side = projects.find((p) => p.name === 'Side project') ?? (await createProject('Side project', '#3C5A72'));

  const tagIdCache = new Map<string, string>();
  const tagId = async (name: string): Promise<string> => {
    const cached = tagIdCache.get(name);
    if (cached) return cached;
    const [id] = await ensureTags([name]);
    tagIdCache.set(name, id);
    return id;
  };

  let completed = 0;
  await db.withTransactionAsync(async () => {
    for (const [index, row] of rows.entries()) {
      const id = uuid();
      const createdAt = new Date(`${row.scheduledFor}T08:00:00`).getTime();
      await db.runAsync(
        `INSERT INTO tasks (id, title, notes, project_id, priority, estimate_min, due_at, scheduled_for,
          status, manual_order, deferral_count, actual_min, completed_at, reminder_offset_min, created_at, updated_at)
         VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?);`,
        [
          id,
          row.title,
          row.tags.includes('deep work') ? side.id : school.id,
          row.priority,
          row.estimateMin,
          row.dueAt,
          row.scheduledFor,
          row.completed ? 'done' : 'open',
          index,
          row.deferralCount,
          row.actualMin,
          row.completedAt,
          createdAt,
          row.completedAt ?? createdAt,
        ],
      );
      for (const tag of row.tags) {
        await db.runAsync('INSERT OR IGNORE INTO task_tags (task_id, tag_id) VALUES (?, ?);', [id, await tagId(tag)]);
      }
      await db.runAsync(
        `INSERT OR REPLACE INTO day_plans (scheduled_for, task_id, planned_at, estimate_min, completed_on_day)
         VALUES (?, ?, ?, ?, ?);`,
        [row.scheduledFor, id, createdAt, row.estimateMin, row.completed ? 1 : 0],
      );
      if (row.completed) completed += 1;
    }
  });

  await seedToday(now);
  await logEvent('created', null, { seeded: rows.length, days });
  return { tasks: rows.length, completed };
}

/** A plausible plan for today, so the app is not empty on first launch. */
async function seedToday(now: number): Promise<void> {
  const db = await getDb();
  const today = dateKey(now);
  const existing = await db.getFirstAsync<{ n: number }>(
    "SELECT COUNT(*) AS n FROM tasks WHERE scheduled_for = ? AND status = 'open';",
    [today],
  );
  if ((existing?.n ?? 0) > 0) return;

  const projects = await listProjects();
  const school = projects.find((p) => p.name === 'Coursework');
  const side = projects.find((p) => p.name === 'Side project');
  const base = startOfDay(now);

  const plan = [
    { title: 'Finish problem set 4', tags: ['school'], priority: 3, estimateMin: 90, due: base + 21 * HOUR, project: school?.id, deferrals: 2 },
    { title: 'Read chapter 7', tags: ['school'], priority: 2, estimateMin: 45, due: base + DAY + 17 * HOUR, project: school?.id, deferrals: 0 },
    { title: 'Rewrite the ranking module', tags: ['deep work'], priority: 2, estimateMin: 60, due: null, project: side?.id, deferrals: 1 },
    { title: 'Email the TA about the lab', tags: ['admin'], priority: 1, estimateMin: 10, due: base + 18 * HOUR, project: school?.id, deferrals: 0 },
    { title: 'Pick up the package', tags: ['errands'], priority: 1, estimateMin: 25, due: base + 19 * HOUR, project: null, deferrals: 3 },
  ];

  for (const [i, item] of plan.entries()) {
    const id = uuid();
    await db.runAsync(
      `INSERT INTO tasks (id, title, notes, project_id, priority, estimate_min, due_at, scheduled_for,
        status, manual_order, deferral_count, created_at, updated_at)
       VALUES (?, ?, NULL, ?, ?, ?, ?, ?, 'open', ?, ?, ?, ?);`,
      [id, item.title, item.project ?? null, item.priority, item.estimateMin, item.due, today, i, item.deferrals, now, now],
    );
    for (const tag of item.tags) {
      const [tid] = await ensureTags([tag]);
      await db.runAsync('INSERT OR IGNORE INTO task_tags (task_id, tag_id) VALUES (?, ?);', [id, tid]);
    }
    await db.runAsync(
      `INSERT OR REPLACE INTO day_plans (scheduled_for, task_id, planned_at, estimate_min, completed_on_day)
       VALUES (?, ?, ?, ?, 0);`,
      [today, id, now, item.estimateMin],
    );
  }
}
