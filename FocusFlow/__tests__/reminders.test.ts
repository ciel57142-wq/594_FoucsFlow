import { fixedReminder, adaptiveReminder, planReminder, isQuietHour } from '../src/domain/reminders';
import { buildProfile, emptyProfile } from '../src/domain/profile';
import { MORNING_WORKER_PERSONA, STUDENT_PERSONA, generateHistory } from '../src/domain/synthetic';
import { DEFAULT_SETTINGS, Settings } from '../src/domain/types';
import { HOUR, DAY, dateKey } from '../src/domain/time';
import { makeTask } from './factories';

const NOW = new Date(2026, 4, 26, 9, 0, 0).getTime();
const v1: Settings = { ...DEFAULT_SETTINGS, appVersion: 1, defaultReminderOffsetMin: 30 };
const v2: Settings = { ...DEFAULT_SETTINGS, appVersion: 2 };

describe('FR-6.1/FR-6.2 quiet hours', () => {
  it('handles a window that wraps past midnight', () => {
    expect(isQuietHour(23, v1)).toBe(true);
    expect(isQuietHour(3, v1)).toBe(true);
    expect(isQuietHour(7, v1)).toBe(false);
    expect(isQuietHour(14, v1)).toBe(false);
  });
});

describe('version 1 reminders', () => {
  it('fires a fixed offset before the due time', () => {
    const task = makeTask({ dueAt: NOW + 4 * HOUR });
    const plan = fixedReminder(task, v1, NOW)!;
    expect(plan.adaptive).toBe(false);
    expect(plan.fireAt).toBe(NOW + 4 * HOUR - 30 * 60000);
  });

  it('respects a per-task offset', () => {
    const task = makeTask({ dueAt: NOW + 4 * HOUR, reminderOffsetMin: 120 });
    expect(fixedReminder(task, v1, NOW)!.fireAt).toBe(NOW + 2 * HOUR);
  });

  it('does not schedule anything in the past', () => {
    expect(fixedReminder(makeTask({ dueAt: NOW - HOUR }), v1, NOW)).toBeNull();
  });

  it('needs a due date or a planned day', () => {
    expect(fixedReminder(makeTask(), v1, NOW)).toBeNull();
    expect(fixedReminder(makeTask({ scheduledFor: dateKey(NOW + DAY) }), v1, NOW)).not.toBeNull();
  });

  it('pushes an overnight reminder to the morning', () => {
    const dueAt = new Date(2026, 4, 27, 8, 0, 0).getTime(); // 8 AM, offset would land at 2:30 AM
    const plan = fixedReminder(makeTask({ dueAt, reminderOffsetMin: 330 }), v1, NOW)!;
    expect(new Date(plan.fireAt).getHours()).toBe(v1.quietEndHour);
  });

  it('returns null when a fixed reminder would land after the due date', () => {
    const dueAt = new Date(2026, 4, 27, 6, 30, 0).getTime();
    expect(fixedReminder(makeTask({ dueAt, reminderOffsetMin: 480 }), v1, NOW)).toBeNull();
  });
});

describe('version 2 adaptive reminders', () => {
  it('moves the reminder to the hour this user does that kind of work', () => {
    const { completions, attempts } = generateHistory(STUDENT_PERSONA, 60, NOW);
    const profile = buildProfile(completions, attempts, NOW);
    const task = makeTask({ tags: ['school'], dueAt: NOW + 2 * DAY, estimateMin: 45 });
    const plan = adaptiveReminder(task, v2, profile, NOW)!;
    expect(plan.adaptive).toBe(true);
    const hour = new Date(plan.fireAt).getHours();
    const target = STUDENT_PERSONA.peakHourByTag['school'];
    expect(Math.min(Math.abs(hour - target), 24 - Math.abs(hour - target))).toBeLessThanOrEqual(2);
    expect(plan.reason).toMatch(/school/);
  });

  it('never lands in quiet hours', () => {
    const { completions, attempts } = generateHistory(STUDENT_PERSONA, 60, NOW);
    const profile = buildProfile(completions, attempts, NOW);
    const nightOwl: Settings = { ...v2, quietStartHour: 20, quietEndHour: 8 };
    const task = makeTask({ tags: ['school'], dueAt: NOW + 2 * DAY });
    const plan = adaptiveReminder(task, nightOwl, profile, NOW)!;
    expect(isQuietHour(new Date(plan.fireAt).getHours(), nightOwl)).toBe(false);
  });

  it('leaves enough runway to actually do the task', () => {
    const { completions, attempts } = generateHistory(STUDENT_PERSONA, 60, NOW);
    const profile = buildProfile(completions, attempts, NOW);
    const task = makeTask({ tags: ['deep work'], dueAt: NOW + 2 * DAY, estimateMin: 90 });
    const plan = adaptiveReminder(task, v2, profile, NOW)!;
    expect(task.dueAt! - plan.fireAt).toBeGreaterThanOrEqual(90 * 60000);
  });

  it('lands in the morning for a morning worker and the evening for a night student', () => {
    const check = (persona: typeof STUDENT_PERSONA, tag: string) => {
      const { completions, attempts } = generateHistory(persona, 90, NOW);
      const profile = buildProfile(completions, attempts, NOW);
      const task = makeTask({ tags: [tag], dueAt: NOW + 2 * DAY, estimateMin: 30 });
      const plan = adaptiveReminder(task, v2, profile, NOW)!;
      const hour = new Date(plan.fireAt).getHours();
      const target = persona.peakHourByTag[tag];
      return Math.min(Math.abs(hour - target), 24 - Math.abs(hour - target));
    };
    expect(check(MORNING_WORKER_PERSONA, 'deep work')).toBeLessThanOrEqual(2);
    expect(check(STUDENT_PERSONA, 'school')).toBeLessThanOrEqual(2);
  });

  it('falls back to the fixed offset during cold start, and says so', () => {
    const task = makeTask({ dueAt: NOW + 4 * HOUR });
    const plan = adaptiveReminder(task, v2, emptyProfile(NOW), NOW)!;
    expect(plan.adaptive).toBe(false);
    expect(plan.reason).toMatch(/learning/);
  });

  it('falls back when adaptive scheduling cannot find any non-quiet candidate time', () => {
    const { completions, attempts } = generateHistory(STUDENT_PERSONA, 60, NOW);
    const profile = buildProfile(completions, attempts, NOW);
    const quietAllDay: Settings = { ...v2, quietStartHour: 0, quietEndHour: 24 };
    const task = makeTask({ tags: ['school'], dueAt: NOW + 2 * DAY });
    const plan = adaptiveReminder(task, quietAllDay, profile, NOW);
    expect(plan).not.toBeNull();
    expect(plan?.adaptive).toBe(false);
  });
});

describe('version gate', () => {
  it('routes to fixed timing on version 1 and adaptive on version 2', () => {
    const { completions, attempts } = generateHistory(STUDENT_PERSONA, 60, NOW);
    const profile = buildProfile(completions, attempts, NOW);
    const task = makeTask({ tags: ['school'], dueAt: NOW + 2 * DAY });
    expect(planReminder(task, v1, profile, NOW)!.adaptive).toBe(false);
    expect(planReminder(task, v2, profile, NOW)!.adaptive).toBe(true);
  });

  it('schedules nothing when notifications are off or the task is done', () => {
    const task = makeTask({ dueAt: NOW + 4 * HOUR });
    expect(planReminder(task, { ...v1, notificationsEnabled: false }, emptyProfile(NOW), NOW)).toBeNull();
    expect(planReminder({ ...task, status: 'done' }, v1, emptyProfile(NOW), NOW)).toBeNull();
  });
});
