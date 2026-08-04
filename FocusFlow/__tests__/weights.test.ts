import { tuneWeights, DEFAULT_WEIGHTS, signalCorrelation } from '../src/domain/weights';
import { buildProfile, emptyProfile } from '../src/domain/profile';
import { STUDENT_PERSONA, generateHistory } from '../src/domain/synthetic';
import { SIGNAL_KEYS } from '../src/domain/signals';

const NOW = new Date(2026, 4, 26, 9, 0, 0).getTime();

describe('weight tuning', () => {
  it('keeps the defaults until there is a real sample', () => {
    const { attempts } = generateHistory(STUDENT_PERSONA, 2, NOW);
    const tuned = tuneWeights(attempts.slice(0, 6), emptyProfile(NOW));
    expect(tuned.tuned).toBe(false);
    expect(tuned.weights).toEqual(DEFAULT_WEIGHTS);
  });

  it('always produces a normalised, bounded weight vector', () => {
    const { completions, attempts } = generateHistory(STUDENT_PERSONA, 90, NOW);
    const tuned = tuneWeights(attempts, buildProfile(completions, attempts, NOW));
    const total = SIGNAL_KEYS.reduce((s, k) => s + tuned.weights[k], 0);
    expect(total).toBeCloseTo(1, 10);
    for (const k of SIGNAL_KEYS) {
      expect(tuned.weights[k]).toBeGreaterThan(0.01);
      expect(tuned.weights[k]).toBeLessThan(0.6);
    }
  });

  it('leans on the deadline for a user whose completions track deadlines', () => {
    const { completions, attempts } = generateHistory(STUDENT_PERSONA, 120, NOW);
    const tuned = tuneWeights(attempts, buildProfile(completions, attempts, NOW));
    // The persona's ground truth weights the due date most heavily.
    expect(tuned.correlations.due).toBeGreaterThan(0);
    expect(tuned.weights.due).toBeGreaterThan(DEFAULT_WEIGHTS.due * 0.95);
  });

  it('computes a sane correlation', () => {
    expect(signalCorrelation([0, 0.5, 1], [0, 0, 1])).toBeGreaterThan(0.5);
    expect(signalCorrelation([1, 0.5, 0], [0, 0, 1])).toBeLessThan(-0.5);
    expect(signalCorrelation([1, 1, 1], [0, 1, 0])).toBe(0);
    expect(signalCorrelation([1], [1])).toBe(0);
  });
});
