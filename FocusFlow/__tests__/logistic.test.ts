import {
  train,
  predict,
  buildTrainingSet,
  calibration,
  calibrationError,
  accuracy,
  newModel,
  featureVector,
  MODEL_MIN_SAMPLES,
  serialiseModel,
  deserialiseModel,
} from '../src/domain/logistic';
import { buildProfile } from '../src/domain/profile';
import { STUDENT_PERSONA, generateHistory } from '../src/domain/synthetic';
import { Signals } from '../src/domain/signals';

const NOW = new Date(2026, 4, 26, 9, 0, 0).getTime();

function fit(days: number) {
  const { completions, attempts } = generateHistory(STUDENT_PERSONA, days, NOW);
  const profile = buildProfile(completions, attempts, NOW);
  const samples = buildTrainingSet(attempts, profile, STUDENT_PERSONA.capacityMin);
  return { model: train(samples), samples, profile, attempts };
}

const flatSignals: Signals = { due: 0.5, timeOfDay: 0.5, priority: 0.5, deferral: 0, effort: 1 };

describe('FR-5.1/FR-7/NFR-1 completion-likelihood model', () => {
  it('beats always-guessing-the-majority-class on a seeded 90-day history', () => {
    const { model, samples } = fit(90);
    const majority = Math.max(
      samples.filter((s) => s.y === 1).length,
      samples.filter((s) => s.y === 0).length,
    ) / samples.length;
    expect(accuracy(model, samples)).toBeGreaterThanOrEqual(majority);
  });

  it('is calibrated: predicted rates track observed rates', () => {
    const { model, samples } = fit(120);
    const buckets = calibration(model, samples);
    expect(calibrationError(buckets)).toBeLessThan(0.1);
    for (const b of buckets.filter((x) => x.count >= 10)) {
      expect(Math.abs(b.predicted - b.actual)).toBeLessThan(0.2);
    }
  });

  it('learns that a near deadline raises the odds', () => {
    const { model } = fit(120);
    const soon = predict(model, featureVector({ ...flatSignals, due: 1 }, 0.8));
    const distant = predict(model, featureVector({ ...flatSignals, due: 0 }, 0.8));
    expect(soon).toBeGreaterThan(distant);
  });

  it('learns that an overloaded day lowers the odds', () => {
    const { model } = fit(120);
    const light = predict(model, featureVector(flatSignals, 0.4));
    const crushed = predict(model, featureVector(flatSignals, 2));
    expect(crushed).toBeLessThan(light);
  });

  it('holds predictions near the base rate until enough days are logged', () => {
    const { model } = fit(4);
    expect(model.n).toBeLessThan(MODEL_MIN_SAMPLES);
    const p = predict(model, featureVector({ ...flatSignals, due: 1, priority: 1 }, 0.2));
    expect(Math.abs(p - model.baseRate)).toBeLessThan(0.35);
  });

  it('never returns a degenerate 0 or 1', () => {
    const { model, samples } = fit(90);
    for (const s of samples) {
      const p = predict(model, s.x);
      expect(p).toBeGreaterThan(0);
      expect(p).toBeLessThan(1);
    }
  });

  it('retrains reproducibly from the same log', () => {
    const a = fit(60).model;
    const b = fit(60).model;
    expect(a.weights).toEqual(b.weights);
  });

  it('round-trips through storage', () => {
    const { model } = fit(30);
    const restored = deserialiseModel(serialiseModel(model));
    expect(restored?.weights).toEqual(model.weights);
    expect(deserialiseModel('not json')).toBeNull();
    expect(deserialiseModel(null)).toBeNull();
  });

  it('an untrained model answers with the base rate', () => {
    const model = newModel(0.4);
    expect(predict(model, featureVector(flatSignals, 1))).toBeCloseTo(0.4, 5);
  });
});
