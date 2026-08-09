import { rankTasks, manualOrder, headlineReason } from '../src/domain/recommender';
import { buildProfile, emptyProfile } from '../src/domain/profile';
import { DEFAULT_WEIGHTS } from '../src/domain/weights';
import { STUDENT_PERSONA, generateHistory } from '../src/domain/synthetic';
import { HOUR, DAY } from '../src/domain/time';
import { makeTask } from './factories';

const NOW = new Date(2026, 4, 26, 10, 0, 0).getTime();

function ctx(profile = emptyProfile(NOW), remainingMin = 480) {
  return { now: NOW, profile, weights: DEFAULT_WEIGHTS, remainingMin, capacityMin: 240, model: null };
}

describe('FR-3.1/FR-3.2/FR-4/FR-5.2 next-task recommendation', () => {
  it('puts an overdue high-priority task above a distant low-priority one', () => {
    const overdue = makeTask({ id: 'overdue', priority: 3, dueAt: NOW - 2 * HOUR });
    const later = makeTask({ id: 'later', priority: 0, dueAt: NOW + 6 * DAY });
    const ranked = rankTasks([later, overdue], ctx());
    expect(ranked[0].task.id).toBe('overdue');
    expect(ranked[0].score).toBeGreaterThan(ranked[1].score);
  });

  it('surfaces a task that keeps getting pushed', () => {
    const stuck = makeTask({ id: 'stuck', deferralCount: 4, dueAt: NOW + 3 * DAY });
    const fresh = makeTask({ id: 'fresh', deferralCount: 0, dueAt: NOW + 3 * DAY });
    const ranked = rankTasks([fresh, stuck], ctx());
    expect(ranked[0].task.id).toBe('stuck');
  });

  it('demotes work that cannot fit in the time left', () => {
    const long = makeTask({ id: 'long', estimateMin: 240, priority: 2 });
    const short = makeTask({ id: 'short', estimateMin: 20, priority: 2 });
    const ranked = rankTasks([long, short], ctx(emptyProfile(NOW), 30));
    expect(ranked[0].task.id).toBe('short');
    const longEffort = ranked.find((r) => r.task.id === 'long')!.signals.effort;
    expect(longEffort).toBeLessThan(0.5);
  });

  it('prefers the tasks this user historically does at this hour', () => {
    const { completions, attempts } = generateHistory(STUDENT_PERSONA, 60, NOW);
    const profile = buildProfile(completions, attempts, NOW);
    // 10 AM is the persona's deep-work window; school work happens at 9 PM.
    const deep = makeTask({ id: 'deep', tags: ['deep work'] });
    const school = makeTask({ id: 'school', tags: ['school'] });
    const ranked = rankTasks([school, deep], ctx(profile));
    expect(ranked[0].task.id).toBe('deep');
  });

  it('explains itself: contributions sum to the score, largest first', () => {
    const task = makeTask({ priority: 3, dueAt: NOW + HOUR, deferralCount: 2 });
    const [ranked] = rankTasks([task], ctx());
    const summed = ranked.contributions.reduce((s, c) => s + c.contribution, 0);
    expect(summed).toBeCloseTo(ranked.score, 10);
    const values = ranked.contributions.map((c) => c.contribution);
    expect([...values].sort((a, b) => b - a)).toEqual(values);
    expect(headlineReason(ranked)).toMatch(/\w/);
    expect(ranked.contributions.every((c) => c.detail.length > 0)).toBe(true);
  });

  it('falls back to default weights and flags cold start on a new install', () => {
    const [ranked] = rankTasks([makeTask()], ctx());
    expect(ranked.coldStart).toBe(true);
  });

  it('version 1 ordering is exactly what the user dragged', () => {
    const a = makeTask({ id: 'a', manualOrder: 2, priority: 3, dueAt: NOW - DAY });
    const b = makeTask({ id: 'b', manualOrder: 1, priority: 0 });
    expect(manualOrder([a, b]).map((t) => t.id)).toEqual(['b', 'a']);
  });

  it('is deterministic for identical input', () => {
    const tasks = [makeTask({ id: 'x' }), makeTask({ id: 'y' }), makeTask({ id: 'z' })];
    const first = rankTasks(tasks, ctx()).map((r) => r.task.id);
    const second = rankTasks(tasks, ctx()).map((r) => r.task.id);
    expect(first).toEqual(second);
  });
});
