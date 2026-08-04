import { DayAttempt } from './types';
import { HistoryProfile } from './profile';
import { SIGNAL_KEYS, SignalKey, Signals, attemptSignals } from './signals';
import { clamp } from './time';

export type Weights = Record<SignalKey, number>;

/** Starting point before the app has seen anything about this user. */
export const DEFAULT_WEIGHTS: Weights = {
  due: 0.32,
  timeOfDay: 0.18,
  priority: 0.2,
  deferral: 0.12,
  effort: 0.18,
};

/** How far a strong correlation is allowed to move a weight. */
const TUNING_STRENGTH = 0.6;
/** Shrinkage constant: a signal needs roughly this many attempts to be trusted. */
const SHRINK_K = 20;
const MIN_WEIGHT = 0.05;
const MAX_WEIGHT = 0.45;

/** Point-biserial correlation between one signal and "did it get done that day". */
export function signalCorrelation(values: number[], labels: number[]): number {
  const n = values.length;
  if (n < 3) return 0;
  const mx = values.reduce((a, b) => a + b, 0) / n;
  const my = labels.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < n; i++) {
    const a = values[i] - mx;
    const b = labels[i] - my;
    num += a * b;
    dx += a * a;
    dy += b * b;
  }
  if (dx === 0 || dy === 0) return 0;
  return num / Math.sqrt(dx * dy);
}

export interface TunedWeights {
  weights: Weights;
  correlations: Record<SignalKey, number>;
  sampleSize: number;
  tuned: boolean;
}

/**
 * Nudges the default weights toward the signals that have actually predicted
 * this user's completions, shrinking hard toward the defaults while the sample
 * is small. This is the "weights tuned on the user's own history" step, and it
 * is deliberately conservative: no signal can be driven to zero or take over.
 */
export function tuneWeights(attempts: DayAttempt[], profile: HistoryProfile): TunedWeights {
  const correlations = Object.fromEntries(SIGNAL_KEYS.map((k) => [k, 0])) as Record<SignalKey, number>;
  if (attempts.length < 10) {
    return { weights: { ...DEFAULT_WEIGHTS }, correlations, sampleSize: attempts.length, tuned: false };
  }

  const rows: Signals[] = attempts.map((a) => attemptSignals(a, profile));
  const labels = attempts.map((a) => (a.completed ? 1 : 0));
  const shrink = attempts.length / (attempts.length + SHRINK_K);

  const raw: Weights = { ...DEFAULT_WEIGHTS };
  for (const key of SIGNAL_KEYS) {
    const r = signalCorrelation(rows.map((s) => s[key]), labels);
    correlations[key] = r;
    const effect = 1 + TUNING_STRENGTH * r * shrink;
    raw[key] = clamp(DEFAULT_WEIGHTS[key] * effect, MIN_WEIGHT, MAX_WEIGHT);
  }

  const total = SIGNAL_KEYS.reduce((sum, k) => sum + raw[k], 0);
  const weights = Object.fromEntries(SIGNAL_KEYS.map((k) => [k, raw[k] / total])) as Weights;
  return { weights, correlations, sampleSize: attempts.length, tuned: true };
}
