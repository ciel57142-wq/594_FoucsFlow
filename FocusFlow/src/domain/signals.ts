import { DayAttempt, Priority, Task } from './types';
import { DAY, HOUR, clamp, dateKeyToTs } from './time';
import { HistoryProfile, adjustedEstimate, hourFit } from './profile';

/** The five things FocusFlow looks at. Every one is normalised to 0–1. */
export type SignalKey = 'due' | 'timeOfDay' | 'priority' | 'deferral' | 'effort';

export const SIGNAL_KEYS: SignalKey[] = ['due', 'timeOfDay', 'priority', 'deferral', 'effort'];

export const SIGNAL_LABELS: Record<SignalKey, string> = {
  due: 'Due soon',
  timeOfDay: 'Right time of day',
  priority: 'Priority',
  deferral: 'Kept getting pushed',
  effort: 'Fits the time left',
};

export type Signals = Record<SignalKey, number>;

export interface SignalInput {
  tags: string[];
  priority: Priority;
  estimateMin: number;
  dueAt: number | null;
  deferralCount: number;
  /** Total estimated minutes on the plan for the day being scored. */
  dayLoadMin: number;
}

export interface SignalContext {
  now: number;
  profile: HistoryProfile;
  /** Working minutes left before the user's usual stopping hour. */
  remainingMin: number;
  /** How far ahead a due date still counts as urgent. */
  horizonDays?: number;
}

export function taskToSignalInput(task: Task, dayLoadMin: number): SignalInput {
  return {
    tags: task.tags,
    priority: task.priority,
    estimateMin: task.estimateMin,
    dueAt: task.dueAt,
    deferralCount: task.deferralCount,
    dayLoadMin,
  };
}

export function attemptToSignalInput(a: DayAttempt): SignalInput {
  return {
    tags: a.tags,
    priority: a.priority,
    estimateMin: a.estimateMin,
    dueAt: a.dueAt,
    deferralCount: a.deferralCount,
    dayLoadMin: a.dayLoadMin,
  };
}

export function computeSignals(input: SignalInput, ctx: SignalContext): Signals {
  const horizon = (ctx.horizonDays ?? 7) * DAY;

  // Due: overdue and due-now sit at 1, then fall off linearly across the horizon.
  // A task with no due date gets a small constant so it is never simply invisible.
  let due = 0.25;
  if (input.dueAt != null) {
    const remaining = input.dueAt - ctx.now;
    due = remaining <= 0 ? 1 : clamp(1 - remaining / horizon);
  }

  const timeOfDay = hourFit(new Date(ctx.now).getHours(), input.tags, ctx.profile);

  const priority = input.priority / 3;

  // Three pushes is enough to call something stuck.
  const deferral = clamp(input.deferralCount / 3);

  const adjusted = Math.max(1, adjustedEstimate(input.estimateMin, input.tags, ctx.profile));
  const effort = ctx.remainingMin <= 0 ? 0 : clamp(ctx.remainingMin / adjusted);

  return { due, timeOfDay, priority, deferral, effort };
}

/** Load on the day being scored: 1.0 means the plan exactly fills capacity. */
export function loadRatio(dayLoadMin: number, capacityMin: number): number {
  if (capacityMin <= 0) return 2;
  return dayLoadMin / capacityMin;
}

export function signalDetail(key: SignalKey, input: SignalInput, ctx: SignalContext, value: number): string {
  switch (key) {
    case 'due': {
      if (input.dueAt == null) return 'No due date';
      const diff = input.dueAt - ctx.now;
      if (diff <= 0) return `Overdue by ${Math.max(1, Math.round(-diff / HOUR))}h`;
      if (diff < DAY) return `Due in ${Math.max(1, Math.round(diff / HOUR))}h`;
      return `Due in ${Math.round(diff / DAY)} days`;
    }
    case 'timeOfDay': {
      const hour = new Date(ctx.now).getHours();
      if (ctx.profile.coldStart) return 'Not enough history yet';
      const strength = value >= 0.75 ? 'one of your strongest hours' : value >= 0.45 ? 'a normal hour' : 'a weak hour';
      const scope = input.tags.length > 0 ? input.tags.join(', ') : 'your tasks';
      return `${hour}:00 is ${strength} for ${scope}`;
    }
    case 'priority':
      return ['No priority set', 'Low priority', 'Medium priority', 'High priority'][input.priority];
    case 'deferral':
      return input.deferralCount === 0
        ? 'Never pushed'
        : `Pushed ${input.deferralCount} time${input.deferralCount === 1 ? '' : 's'}`;
    case 'effort': {
      const adjusted = adjustedEstimate(input.estimateMin, input.tags, ctx.profile);
      const note = adjusted !== input.estimateMin ? ` (you usually need ${adjusted}m for these)` : '';
      return value >= 0.99
        ? `${input.estimateMin}m fits the ${ctx.remainingMin}m left${note}`
        : `${adjusted}m needed but only ${ctx.remainingMin}m left${note}`;
    }
  }
}

/** Rebuilds the signals a past day would have produced, for training and tuning. */
export function attemptSignals(a: DayAttempt, profile: HistoryProfile, dayEndHour = 22): Signals {
  const remainingMin = Math.max(0, (dateKeyToTs(a.scheduledFor, dayEndHour) - a.evaluatedAt) / 60000);
  return computeSignals(attemptToSignalInput(a), {
    now: a.evaluatedAt,
    profile,
    remainingMin: Math.round(remainingMin),
  });
}
