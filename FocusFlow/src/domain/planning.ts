import { Task } from './types';
import { HistoryProfile, adjustedEstimate } from './profile';
import { Ranked } from './recommender';
import { formatMinutes } from './time';

export type DayStatus = 'light' | 'ok' | 'tight' | 'over';

export interface DayAssessment {
  taskCount: number;
  /** Sum of the user's own estimates. */
  committedMin: number;
  /** Same tasks, corrected by how this user has historically estimated. */
  adjustedMin: number;
  capacityMin: number;
  loadRatio: number;
  status: DayStatus;
  /** Version 2 only: sum of per-task completion likelihoods. */
  expectedCompletions: number | null;
  message: string;
  /** Version 2 only: the tasks the plan is most likely to shed, worst first. */
  atRisk: Ranked[];
}

export function assessDay(
  tasks: Task[],
  profile: HistoryProfile,
  capacityMin: number,
  ranked: Ranked[] | null,
): DayAssessment {
  const committedMin = tasks.reduce((sum, t) => sum + t.estimateMin, 0);
  const adjustedMin = tasks.reduce((sum, t) => sum + adjustedEstimate(t.estimateMin, t.tags, profile), 0);
  const load = capacityMin > 0 ? adjustedMin / capacityMin : 2;

  const status: DayStatus = load > 1.15 ? 'over' : load > 0.9 ? 'tight' : load > 0.4 ? 'ok' : 'light';

  const expectedCompletions = ranked ? ranked.reduce((sum, r) => sum + (r.likelihood ?? 0), 0) : null;
  const atRisk = ranked ? [...ranked].filter((r) => (r.likelihood ?? 1) < 0.5).sort((a, b) => (a.likelihood ?? 0) - (b.likelihood ?? 0)) : [];

  let message: string;
  if (tasks.length === 0) {
    message = 'Nothing planned yet. Pull a task in from Tasks, or add one below.';
  } else if (status === 'over') {
    const overBy = adjustedMin - capacityMin;
    message = `This plan runs ${formatMinutes(overBy)} past your ${formatMinutes(capacityMin)} of focus time.`;
    if (adjustedMin > committedMin) {
      message += ` Your estimates add up to ${formatMinutes(committedMin)}, but tasks like these usually take you ${formatMinutes(adjustedMin)}.`;
    }
  } else if (status === 'tight') {
    message = `${formatMinutes(adjustedMin)} planned against ${formatMinutes(capacityMin)}. Not much room for anything unexpected.`;
  } else {
    message = `${formatMinutes(adjustedMin)} planned, ${formatMinutes(Math.max(0, capacityMin - adjustedMin))} still free.`;
  }

  if (expectedCompletions != null && tasks.length > 0) {
    message += ` Based on your history, about ${Math.round(expectedCompletions)} of ${tasks.length} are likely to get done.`;
  }

  return {
    taskCount: tasks.length,
    committedMin,
    adjustedMin,
    capacityMin,
    loadRatio: load,
    status,
    expectedCompletions,
    message,
    atRisk: atRisk.slice(0, 3),
  };
}

export const STATUS_COPY: Record<DayStatus, string> = {
  light: 'Room to spare',
  ok: 'Reasonable day',
  tight: 'Tight',
  over: 'Overcommitted',
};
