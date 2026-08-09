import { dateKeyToTs, addDaysToKey, daysBetweenKeys, minutesLeftInDay, formatHour, formatClock, formatRelativeDue, startOfDay, endOfDay } from '../src/domain/time';

const NOW = new Date(2026, 4, 26, 13, 45, 30).getTime();

describe('time helpers', () => {
  it('converts a date key and hour to a timestamp', () => {
    expect(dateKeyToTs('2026-05-26', 13, 45)).toBe(new Date(2026, 4, 26, 13, 45).getTime());
  });

  it('advances date keys across month and year boundaries', () => {
    expect(addDaysToKey('2026-05-31', 1)).toBe('2026-06-01');
    expect(addDaysToKey('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDaysToKey('2026-01-01', -1)).toBe('2025-12-31');
  });

  it('computes day differences between date keys', () => {
    expect(daysBetweenKeys('2026-05-26', '2026-06-02')).toBe(7);
    expect(daysBetweenKeys('2026-05-26', '2026-05-26')).toBe(0);
  });

  it('reports minutes remaining in the day for a custom end hour', () => {
    expect(minutesLeftInDay(NOW, 20)).toBe(6 * 60 + 15);
    expect(minutesLeftInDay(NOW, 13)).toBeGreaterThanOrEqual(0);
  });

  it('formats hours and clocks correctly', () => {
    expect(formatHour(0)).toBe('12 AM');
    expect(formatHour(12)).toBe('12 PM');
    expect(formatHour(15)).toBe('3 PM');
    expect(formatClock(dateKeyToTs('2026-05-26', 9, 5))).toBe('9:05 AM');
  });

  it('describes relative due dates in human form', () => {
    expect(formatRelativeDue(NOW + 90 * 60_000, NOW)).toMatch(/Due in 2h/);
    expect(formatRelativeDue(NOW - 90 * 60_000, NOW)).toMatch(/overdue/i);
  });

  it('computes start and end of day timestamps', () => {
    expect(startOfDay(NOW)).toBe(new Date(2026, 4, 26, 0, 0, 0, 0).getTime());
    expect(endOfDay(NOW)).toBe(new Date(2026, 4, 26, 23, 59, 59, 999).getTime());
  });
});
