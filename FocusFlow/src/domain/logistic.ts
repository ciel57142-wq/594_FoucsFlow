import { DayAttempt } from './types';
import { HistoryProfile } from './profile';
import { SIGNAL_KEYS, Signals, attemptSignals, loadRatio } from './signals';
import { clamp, seededRandom } from './time';

/**
 * A six-feature logistic regression trained with regularised SGD on the
 * completion log. It answers one question: if this task is on today's plan,
 * how likely is it to actually get finished today?
 *
 * Deliberately small and inspectable — no deep learning, no external service,
 * and it retrains in milliseconds on a phone.
 */
export const FEATURE_NAMES = [...SIGNAL_KEYS, 'load'] as const;
export type FeatureName = (typeof FEATURE_NAMES)[number];

export interface LogisticModel {
  weights: number[];
  bias: number;
  /** Number of labelled attempts the model has seen. */
  n: number;
  trainedAt: number;
  featureNames: readonly string[];
  /** Mean training-set label, used as the cold-start answer. */
  baseRate: number;
}

export const MODEL_MIN_SAMPLES = 20;

export function newModel(baseRate = 0.5): LogisticModel {
  return {
    weights: new Array(FEATURE_NAMES.length).fill(0),
    bias: Math.log(clamp(baseRate, 0.05, 0.95) / (1 - clamp(baseRate, 0.05, 0.95))),
    n: 0,
    trainedAt: 0,
    featureNames: FEATURE_NAMES,
    baseRate,
  };
}

export function sigmoid(z: number): number {
  if (z >= 0) return 1 / (1 + Math.exp(-z));
  const e = Math.exp(z);
  return e / (1 + e);
}

export function featureVector(signals: Signals, load: number): number[] {
  return [...SIGNAL_KEYS.map((k) => signals[k]), clamp(load / 2, 0, 1)];
}

export interface TrainingSample {
  x: number[];
  y: number;
}

export function buildTrainingSet(
  attempts: DayAttempt[],
  profile: HistoryProfile,
  capacityMin: number,
): TrainingSample[] {
  return attempts.map((a) => ({
    x: featureVector(attemptSignals(a, profile), loadRatio(a.dayLoadMin, capacityMin)),
    y: a.completed ? 1 : 0,
  }));
}

export interface TrainOptions {
  learningRate?: number;
  l2?: number;
  epochs?: number;
  seed?: number;
}

/**
 * Full refit from the stored log. Cheap enough to re-run whenever the log
 * changes, and reproducible because the shuffle is seeded.
 */
export function train(samples: TrainingSample[], opts: TrainOptions = {}): LogisticModel {
  const { learningRate = 0.15, l2 = 0.02, epochs = 60, seed = 42 } = opts;
  const positives = samples.filter((s) => s.y === 1).length;
  const baseRate = samples.length > 0 ? (positives + 1) / (samples.length + 2) : 0.5;
  const model = newModel(baseRate);
  model.n = samples.length;
  model.trainedAt = Date.now();
  if (samples.length === 0) return model;

  const rand = seededRandom(seed);
  const order = samples.map((_, i) => i);

  for (let epoch = 0; epoch < epochs; epoch++) {
    // Fisher–Yates with the seeded source.
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    const lr = learningRate / (1 + epoch * 0.05); // decay keeps late epochs from thrashing
    for (const idx of order) {
      const { x, y } = samples[idx];
      const p = sigmoid(dot(model.weights, x) + model.bias);
      const err = p - y;
      for (let k = 0; k < model.weights.length; k++) {
        model.weights[k] -= lr * (err * x[k] + l2 * model.weights[k]);
      }
      model.bias -= lr * err;
    }
  }
  return model;
}

function dot(a: number[], b: number[]): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

/**
 * Predicted completion likelihood. Under MODEL_MIN_SAMPLES the model output is
 * blended toward the plain base rate so a handful of days cannot produce
 * confident-looking nonsense.
 */
export function predict(model: LogisticModel, x: number[]): number {
  const raw = sigmoid(dot(model.weights, x) + model.bias);
  if (model.n >= MODEL_MIN_SAMPLES) return clamp(raw, 0.01, 0.99);
  const trust = model.n / MODEL_MIN_SAMPLES;
  return clamp(trust * raw + (1 - trust) * model.baseRate, 0.01, 0.99);
}

/** Which features pushed this particular prediction, largest effect first. */
export function contributions(model: LogisticModel, x: number[]): { feature: string; value: number; effect: number }[] {
  return model.featureNames
    .map((feature, i) => ({ feature, value: x[i], effect: model.weights[i] * x[i] }))
    .sort((a, b) => Math.abs(b.effect) - Math.abs(a.effect));
}

export interface CalibrationBucket {
  lower: number;
  upper: number;
  count: number;
  predicted: number;
  actual: number;
}

/** Reliability table: in the days we said were ~70% likely, how many landed? */
export function calibration(model: LogisticModel, samples: TrainingSample[], buckets = 5): CalibrationBucket[] {
  const out: CalibrationBucket[] = Array.from({ length: buckets }, (_, i) => ({
    lower: i / buckets,
    upper: (i + 1) / buckets,
    count: 0,
    predicted: 0,
    actual: 0,
  }));
  for (const s of samples) {
    const p = predict(model, s.x);
    const idx = Math.min(buckets - 1, Math.floor(p * buckets));
    out[idx].count += 1;
    out[idx].predicted += p;
    out[idx].actual += s.y;
  }
  return out.map((b) => ({
    ...b,
    predicted: b.count > 0 ? b.predicted / b.count : 0,
    actual: b.count > 0 ? b.actual / b.count : 0,
  }));
}

/** Mean absolute gap between predicted and observed rates, weighted by bucket size. */
export function calibrationError(buckets: CalibrationBucket[]): number {
  const total = buckets.reduce((s, b) => s + b.count, 0);
  if (total === 0) return 0;
  return buckets.reduce((s, b) => s + (b.count / total) * Math.abs(b.predicted - b.actual), 0);
}

export function accuracy(model: LogisticModel, samples: TrainingSample[], threshold = 0.5): number {
  if (samples.length === 0) return 0;
  const hits = samples.filter((s) => (predict(model, s.x) >= threshold ? 1 : 0) === s.y).length;
  return hits / samples.length;
}

export function serialiseModel(model: LogisticModel): string {
  return JSON.stringify(model);
}

export function deserialiseModel(raw: string | null): LogisticModel | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as LogisticModel;
    if (!Array.isArray(parsed.weights) || parsed.weights.length !== FEATURE_NAMES.length) return null;
    return parsed;
  } catch {
    return null;
  }
}
