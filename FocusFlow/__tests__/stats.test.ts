import { weeklyStats, completionStreak } from '../src/domain/stats';
import { STUDENT_PERSONA, generateHistory } from '../src/domain/synthetic';
import { CompletionRecord } from '../src/domain/types';
import { DAY, dateKey, dateKeyToTs, formatMinutes, formatRelativeDue, addDaysToKey, daysBetweenKeys } from '../src/domain/time';

const NOW = new Date(2026, 4, 26, 18, 0, 0).getTime();

const record = (daysAgo: number, hour: number, estimate = 30, actual = 30): CompletionRecord => ({
  taskId: `t-${daysAgo}-${hour}`,
  tags: ['school'],
  projectId: null,
  estimateMin: estimate,
  actualMin: actual,
  completedAt: dateKeyToTs(dateKey(NOW - daysAgo * DAY), hour),
  deferralCount: 0,
  dueAt: null,
});

describe('FR-5.1 weekly statistics', () => {
  it('counts only the last seven days', () => {
    const { completions, attempts } = generateHistory(STUDENT_PERSONA, 40, NOW);
    const stats = weeklyStats(completions, attempts, NOW);
    expect(stats.perDay).toHaveLength(7);
    expect(stats.completed).toBeLessThanOrEqual(stats.planned);
    expect(stats.completionRate).toBeGreaterThanOrEqual(0);
    expect(stats.completionRate).toBeLessThanOrEqual(1);
  });

  it('measures how far off the estimates are', () => {
    const completions = [record(1, 10, 30, 45), record(2, 11, 60, 90)];
    const stats = weeklyStats(completions, [], NOW);
    expect(stats.estimateRatio).toBeCloseTo(1.5, 5);
    expect(stats.estimateError).toBeCloseTo(0.5, 5);
  });

  it('counts a streak of days with at least one completion', () => {
    expect(completionStreak([record(0, 9), record(1, 9), record(2, 9)], NOW)).toBe(3);
    expect(completionStreak([record(0, 9), record(2, 9)], NOW)).toBe(1);
    expect(completionStreak([], NOW)).toBe(0);
    // Finished yesterday but not yet today: the streak is still alive.
    expect(completionStreak([record(1, 9), record(2, 9)], NOW)).toBe(2);
  });

  it('reports the hours the user actually finishes work', () => {
    const stats = weeklyStats([record(1, 21), record(2, 21), record(3, 9)], [], NOW);
    expect(stats.busiestHours[0].hour).toBe(21);
    expect(stats.medianCompletionHour).not.toBeNull();
  });
});

describe('formatting helpers', () => {
  it('writes durations the way a person would say them', () => {
    expect(formatMinutes(45)).toBe('45m');
    expect(formatMinutes(60)).toBe('1h');
    expect(formatMinutes(135)).toBe('2h 15m');
  });

  it('describes due dates relative to now', () => {
    expect(formatRelativeDue(NOW - 3600_000, NOW)).toMatch(/overdue/i);
    expect(formatRelativeDue(NOW + 2 * 3600_000, NOW)).toMatch(/Due in 2h/);
    expect(formatRelativeDue(NOW + DAY, NOW)).toMatch(/tomorrow|Due in 1d|Due in 24h/);
  });

  it('moves between calendar days without drifting', () => {
    expect(addDaysToKey('2026-05-31', 1)).toBe('2026-06-01');
    expect(addDaysToKey('2026-01-01', -1)).toBe('2025-12-31');
    expect(daysBetweenKeys('2026-05-26', '2026-06-02')).toBe(7);
  });
});
