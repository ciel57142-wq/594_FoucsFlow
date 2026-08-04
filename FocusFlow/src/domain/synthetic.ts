import { CompletionRecord, DayAttempt, Priority } from './types';
import { DAY, dateKey, dateKeyToTs, seededRandom, startOfDay, clamp } from './time';

/**
 * A synthetic user with known habits. This is what the system-test plan means
 * by "seeded historical datasets with known optimal answers": because the
 * generator's ground truth is explicit, tests can assert that the learned
 * profile recovers it and that predictions stay calibrated.
 */
export interface Persona {
  seed: number;
  /** Tag → the hour of day this person actually finishes that kind of work. */
  peakHourByTag: Record<string, number>;
  /** Tag → actual ÷ estimated minutes. 1.5 means they underestimate by half. */
  estimateBiasByTag: Record<string, number>;
  /** Ground-truth logistic used to decide whether a planned task got done. */
  truth: { intercept: number; due: number; hourFit: number; priority: number; load: number };
  tasksPerDay: [number, number];
  capacityMin: number;
}

export const STUDENT_PERSONA: Persona = {
  seed: 20260526,
  peakHourByTag: { school: 21, 'deep work': 10, errands: 17, admin: 13 },
  estimateBiasByTag: { school: 1.45, 'deep work': 1.15, errands: 0.9, admin: 1.0 },
  truth: { intercept: -0.3, due: 2.4, hourFit: 1.1, priority: 0.9, load: -1.8 },
  tasksPerDay: [3, 6],
  capacityMin: 240,
};

/** A second habit profile, used to prove the timing logic is not tuned to one shape of user. */
export const MORNING_WORKER_PERSONA: Persona = {
  seed: 990211,
  peakHourByTag: { 'deep work': 7, admin: 11, errands: 12, school: 9 },
  estimateBiasByTag: { 'deep work': 1.05, admin: 0.85, errands: 1.0, school: 1.2 },
  truth: { intercept: 0.4, due: 1.6, hourFit: 1.6, priority: 0.5, load: -2.2 },
  tasksPerDay: [2, 5],
  capacityMin: 300,
};

export interface SyntheticHistory {
  completions: CompletionRecord[];
  attempts: DayAttempt[];
  /** Everything needed to replay the same history into SQLite. */
  rows: SyntheticTaskRow[];
}

export interface SyntheticTaskRow {
  title: string;
  tags: string[];
  priority: Priority;
  estimateMin: number;
  dueAt: number | null;
  scheduledFor: string;
  completed: boolean;
  completedAt: number | null;
  actualMin: number | null;
  deferralCount: number;
}

const TITLES: Record<string, string[]> = {
  school: ['Read chapter 4', 'Problem set 3', 'Lab writeup', 'Review lecture notes', 'Draft essay outline'],
  'deep work': ['Refactor parser', 'Write design doc', 'Debug import job', 'Prototype ranking', 'Code review'],
  errands: ['Pick up prescription', 'Return package', 'Groceries', 'Laundry', 'Fix bike tire'],
  admin: ['Email advisor', 'Submit timesheet', 'Book appointment', 'File receipts', 'Update resume'],
};

function sigmoid(z: number): number {
  return 1 / (1 + Math.exp(-z));
}

export function generateHistory(persona: Persona, days: number, endTs = Date.now()): SyntheticHistory {
  const rand = seededRandom(persona.seed);
  const tags = Object.keys(persona.peakHourByTag);
  const completions: CompletionRecord[] = [];
  const attempts: DayAttempt[] = [];
  const rows: SyntheticTaskRow[] = [];
  let idCounter = 0;

  for (let d = days; d >= 1; d--) {
    const dayStart = startOfDay(endTs - d * DAY);
    const key = dateKey(dayStart);
    const [lo, hi] = persona.tasksPerDay;
    const count = lo + Math.floor(rand() * (hi - lo + 1));

    const planned: {
      tag: string;
      priority: Priority;
      estimateMin: number;
      dueAt: number | null;
      deferralCount: number;
      title: string;
    }[] = [];

    for (let i = 0; i < count; i++) {
      const tag = tags[Math.floor(rand() * tags.length)];
      const titles = TITLES[tag] ?? ['Task'];
      planned.push({
        tag,
        priority: Math.floor(rand() * 4) as Priority,
        estimateMin: [15, 30, 45, 60, 90][Math.floor(rand() * 5)],
        // Two thirds of tasks carry a due date, most of them within three days.
        dueAt: rand() < 0.66 ? dayStart + Math.floor(rand() * 4) * DAY + 17 * 3600_000 : null,
        deferralCount: rand() < 0.25 ? 1 + Math.floor(rand() * 3) : 0,
        title: titles[Math.floor(rand() * titles.length)],
      });
    }

    const dayLoadMin = planned.reduce((s, p) => s + p.estimateMin, 0);
    const load = dayLoadMin / persona.capacityMin;
    const evaluatedAt = dayStart + 9 * 3600_000;

    for (const p of planned) {
      const dueSignal = p.dueAt == null ? 0.25 : clamp(1 - Math.max(0, p.dueAt - evaluatedAt) / (7 * DAY));
      const peak = persona.peakHourByTag[p.tag];
      // How much of the person's good window is still ahead of them at 9 AM.
      const hourFit = clamp(1 - Math.abs(peak - 14) / 14);
      const z =
        persona.truth.intercept +
        persona.truth.due * dueSignal +
        persona.truth.hourFit * hourFit +
        persona.truth.priority * (p.priority / 3) +
        persona.truth.load * clamp(load, 0, 2) * 0.5;
      const completed = rand() < sigmoid(z);

      const taskId = `syn-${idCounter++}`;
      attempts.push({
        taskId,
        scheduledFor: key,
        evaluatedAt,
        tags: [p.tag],
        priority: p.priority,
        estimateMin: p.estimateMin,
        dueAt: p.dueAt,
        deferralCount: p.deferralCount,
        dayLoadMin,
        completed,
      });

      let completedAt: number | null = null;
      let actualMin: number | null = null;
      if (completed) {
        const jitter = Math.round((rand() - 0.5) * 3); // ±1.5 hours around the habit
        const hour = ((peak + jitter) % 24 + 24) % 24;
        completedAt = dateKeyToTs(key, hour, Math.floor(rand() * 60));
        const bias = persona.estimateBiasByTag[p.tag] ?? 1;
        actualMin = Math.max(5, Math.round(p.estimateMin * bias * (0.85 + rand() * 0.3)));
        completions.push({
          taskId,
          tags: [p.tag],
          projectId: null,
          estimateMin: p.estimateMin,
          actualMin,
          completedAt,
          deferralCount: p.deferralCount,
          dueAt: p.dueAt,
        });
      }

      rows.push({
        title: p.title,
        tags: [p.tag],
        priority: p.priority,
        estimateMin: p.estimateMin,
        dueAt: p.dueAt,
        scheduledFor: key,
        completed,
        completedAt,
        actualMin,
        deferralCount: p.deferralCount,
      });
    }
  }

  completions.sort((a, b) => a.completedAt - b.completedAt);
  return { completions, attempts, rows };
}
