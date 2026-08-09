import { computeSignals, signalDetail, attemptSignals, taskToSignalInput } from '../src/domain/signals';
import { buildProfile, emptyProfile } from '../src/domain/profile';
import { dateKeyToTs } from '../src/domain/time';

const NOW = new Date(2026, 4, 26, 12, 0, 0).getTime();

const baseInput = taskToSignalInput({
  id: 't',
  title: 'Test',
  notes: null,
  projectId: null,
  priority: 3,
  estimateMin: 60,
  dueAt: NOW + 2 * 3600_000,
  scheduledFor: null,
  status: 'open',
  manualOrder: 0,
  deferralCount: 2,
  actualMin: null,
  completedAt: null,
  reminderOffsetMin: null,
  tags: ['school'],
  createdAt: NOW,
  updatedAt: NOW,
}, 240);

const ctx = {
  now: NOW,
  profile: emptyProfile(NOW),
  remainingMin: 120,
};

describe('signals module', () => {
  it('computes due, priority, deferral, and effort correctly', () => {
    const signals = computeSignals(baseInput, ctx);
    expect(signals.due).toBeGreaterThan(0.5);
    expect(signals.priority).toBe(1);
    expect(signals.deferral).toBeCloseTo(2 / 3, 5);
    expect(signals.effort).toBe(1);
  });

  it('caps deferral at 1.0 when a task is pushed many times', () => {
    const input = { ...baseInput, deferralCount: 99 };
    expect(computeSignals(input, ctx).deferral).toBe(1);
  });

  it('returns a no-due-date detail for tasks without a due date', () => {
    const input = { ...baseInput, dueAt: null };
    expect(signalDetail('due', input, ctx, 0.25)).toBe('No due date');
  });

  it('formats overdue and upcoming due details correctly', () => {
    const overdueInput = { ...baseInput, dueAt: NOW - 1800_000 };
    expect(signalDetail('due', overdueInput, ctx, 1)).toMatch(/Overdue/);
    const upcomingInput = { ...baseInput, dueAt: NOW + 3 * 3600_000 };
    expect(signalDetail('due', upcomingInput, ctx, 0)).toMatch(/Due in 3h/);
  });

  it('produces attempt signals from a past evaluation timestamp', () => {
    const attempt = {
      taskId: 'a',
      tags: ['school'],
      priority: 2 as const,
      estimateMin: 30,
      dueAt: null,
      deferralCount: 0,
      scheduledFor: '2026-05-26',
      evaluatedAt: dateKeyToTs('2026-05-26', 14),
      dayLoadMin: 120,
      completed: true,
    };
    const signals = attemptSignals(attempt, emptyProfile(attempt.evaluatedAt));
    expect(signals.due).toBeGreaterThanOrEqual(0);
    expect(signals.effort).toBeGreaterThanOrEqual(0);
  });
});
