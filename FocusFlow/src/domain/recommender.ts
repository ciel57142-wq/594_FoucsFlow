import { Task } from './types';
import { HistoryProfile } from './profile';
import {
  SIGNAL_KEYS,
  SIGNAL_LABELS,
  SignalContext,
  SignalKey,
  Signals,
  computeSignals,
  loadRatio,
  signalDetail,
  taskToSignalInput,
} from './signals';
import { Weights, DEFAULT_WEIGHTS } from './weights';
import { LogisticModel, featureVector, predict } from './logistic';

export interface Contribution {
  key: SignalKey;
  label: string;
  weight: number;
  value: number;
  /** weight × value — the share of the score this signal is responsible for. */
  contribution: number;
  detail: string;
}

export interface Ranked {
  task: Task;
  score: number;
  signals: Signals;
  /** Version 2 only: probability this gets finished today. */
  likelihood: number | null;
  contributions: Contribution[];
  /** True while the app is still running on default rules. */
  coldStart: boolean;
}

export interface RankContext {
  now: number;
  profile: HistoryProfile;
  weights?: Weights;
  model?: LogisticModel | null;
  /** Working minutes between now and the user's usual stopping hour. */
  remainingMin: number;
  capacityMin: number;
}

/**
 * Version 2's ordering. The score is a plain weighted sum of five normalised
 * signals, which is what makes the "Why this?" panel possible: the panel just
 * shows the terms of the sum, sorted.
 */
export function rankTasks(tasks: Task[], ctx: RankContext): Ranked[] {
  const weights = ctx.weights ?? DEFAULT_WEIGHTS;
  const dayLoadMin = tasks.reduce((sum, t) => sum + t.estimateMin, 0);
  const signalCtx: SignalContext = { now: ctx.now, profile: ctx.profile, remainingMin: ctx.remainingMin };
  const load = loadRatio(dayLoadMin, ctx.capacityMin);

  const ranked = tasks.map((task) => {
    const input = taskToSignalInput(task, dayLoadMin);
    const signals = computeSignals(input, signalCtx);

    const contributions: Contribution[] = SIGNAL_KEYS.map((key) => ({
      key,
      label: SIGNAL_LABELS[key],
      weight: weights[key],
      value: signals[key],
      contribution: weights[key] * signals[key],
      detail: signalDetail(key, input, signalCtx, signals[key]),
    })).sort((a, b) => b.contribution - a.contribution);

    const score = contributions.reduce((sum, c) => sum + c.contribution, 0);
    const likelihood = ctx.model ? predict(ctx.model, featureVector(signals, load)) : null;

    return { task, score, signals, likelihood, contributions, coldStart: ctx.profile.coldStart };
  });

  return ranked.sort((a, b) => b.score - a.score || a.task.title.localeCompare(b.task.title));
}

/** Version 1's ordering: exactly what the user dragged into place. */
export function manualOrder(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => a.manualOrder - b.manualOrder || a.createdAt - b.createdAt);
}

/** One sentence for the top of the Today list. */
export function headlineReason(ranked: Ranked): string {
  const top = ranked.contributions[0];
  if (!top || top.contribution === 0) return 'Next on your list';
  return top.detail;
}
