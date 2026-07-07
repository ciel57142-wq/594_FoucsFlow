import { getDb } from "./database";

/**
 * V1 exposes these descriptively only. Version 2 reuses the same
 * completion_log rows as feature inputs for the recommendation/prediction
 * models (see proposal section 2.5) -- no new data collection needed.
 */

export interface WeeklyStats {
  completionRate: number; // completed / scheduled, 0-1
  estimateAccuracy: number; // avg(actual/estimated) where estimate exists, 1.0 = perfect
  neglectedTags: { tagName: string; pendingCount: number }[];
}

export async function getWeeklyStats(sinceIso: string): Promise<WeeklyStats> {
  const db = await getDb();

  const totals = await db.getFirstAsync<any>(
    `SELECT
       COUNT(*) FILTER (WHERE status = 'completed') AS completed,
       COUNT(*) AS scheduled
     FROM tasks
     WHERE created_at >= ?`,
    sinceIso
  );

  const accuracyRows = await db.getAllAsync<any>(
    `SELECT estimated_duration_minutes AS est, actual_duration_minutes AS act
     FROM completion_log
     WHERE completed_at >= ? AND estimated_duration_minutes IS NOT NULL AND estimated_duration_minutes > 0`,
    sinceIso
  );
  const ratios = accuracyRows.map((r) => r.act / r.est);
  const estimateAccuracy = ratios.length
    ? ratios.reduce((a, b) => a + b, 0) / ratios.length
    : 1;

  const neglected = await db.getAllAsync<any>(
    `SELECT t.name AS tagName, COUNT(*) AS pendingCount
     FROM task_tags tt
     JOIN tags t ON t.id = tt.tag_id
     JOIN tasks task ON task.id = tt.task_id
     WHERE task.status = 'pending' AND task.due_date < date('now')
     GROUP BY t.name
     ORDER BY pendingCount DESC
     LIMIT 5`
  );

  return {
    completionRate: totals?.scheduled ? totals.completed / totals.scheduled : 0,
    estimateAccuracy,
    neglectedTags: neglected.map((r) => ({
      tagName: r.tagName,
      pendingCount: r.pendingCount,
    })),
  };
}
