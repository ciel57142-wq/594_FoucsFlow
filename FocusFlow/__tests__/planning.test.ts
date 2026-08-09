import { assessDay } from '../src/domain/planning';
import { rankTasks } from '../src/domain/recommender';
import { buildProfile, emptyProfile } from '../src/domain/profile';
import { buildTrainingSet, train } from '../src/domain/logistic';
import { STUDENT_PERSONA, generateHistory } from '../src/domain/synthetic';
import { DEFAULT_WEIGHTS } from '../src/domain/weights';
import { makeTask } from './factories';

const NOW = new Date(2026, 4, 26, 9, 0, 0).getTime();

describe('FR-3.1/FR-3.2/FR-5.1 overcommitment warning', () => {
  it('calls a light day light', () => {
    const tasks = [makeTask({ estimateMin: 30 }), makeTask({ estimateMin: 25 })];
    const day = assessDay(tasks, emptyProfile(NOW), 240, null);
    expect(day.status).toBe('light');
    expect(day.committedMin).toBe(55);
  });

  it('flags a plan that runs past the day', () => {
    const tasks = Array.from({ length: 6 }, () => makeTask({ estimateMin: 60 }));
    const day = assessDay(tasks, emptyProfile(NOW), 240, null);
    expect(day.status).toBe('over');
    expect(day.message).toMatch(/past your/);
  });

  it('uses the user’s real pace, not their estimates, to judge the day', () => {
    const { completions, attempts } = generateHistory(STUDENT_PERSONA, 60, NOW);
    const profile = buildProfile(completions, attempts, NOW);
    // Four hours of "school" work, which this persona consistently underestimates.
    const tasks = Array.from({ length: 4 }, () => makeTask({ estimateMin: 60, tags: ['school'] }));
    const day = assessDay(tasks, profile, 240, null);
    expect(day.committedMin).toBe(240);
    expect(day.adjustedMin).toBeGreaterThan(day.committedMin);
    expect(day.status).toBe('over');
    expect(day.message).toMatch(/usually take you/);
  });

  it('reports how many tasks are actually likely to land', () => {
    const { completions, attempts } = generateHistory(STUDENT_PERSONA, 90, NOW);
    const profile = buildProfile(completions, attempts, NOW);
    const model = train(buildTrainingSet(attempts, profile, 240));
    const tasks = Array.from({ length: 5 }, (_, i) => makeTask({ estimateMin: 45, tags: ['school'], priority: (i % 4) as 0 | 1 | 2 | 3 }));
    const ranked = rankTasks(tasks, {
      now: NOW,
      profile,
      weights: DEFAULT_WEIGHTS,
      model,
      remainingMin: 480,
      capacityMin: 240,
    });
    const day = assessDay(tasks, profile, 240, ranked);
    expect(day.expectedCompletions).not.toBeNull();
    expect(day.expectedCompletions!).toBeGreaterThan(0);
    expect(day.expectedCompletions!).toBeLessThanOrEqual(tasks.length);
    expect(day.message).toMatch(/likely to get done/);
  });

  it('says something useful about an empty day', () => {
    const day = assessDay([], emptyProfile(NOW), 240, null);
    expect(day.taskCount).toBe(0);
    expect(day.message).toMatch(/Nothing planned/);
  });

  it('calls a tight day tight when the plan is nearly full', () => {
    const tasks = Array.from({ length: 8 }, () => makeTask({ estimateMin: 30 }));
    const day = assessDay(tasks, emptyProfile(NOW), 240, null);
    expect(day.status).toBe('tight');
    expect(day.message).toMatch(/Not much room for anything unexpected/);
  });
});
