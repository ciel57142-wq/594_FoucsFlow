import { Settings } from '../domain/types';
import { HistoryProfile, buildProfile, emptyProfile } from '../domain/profile';
import { DEFAULT_WEIGHTS, Weights, tuneWeights } from '../domain/weights';
import {
  CalibrationBucket,
  LogisticModel,
  buildTrainingSet,
  calibration,
  calibrationError,
  accuracy,
  train,
} from '../domain/logistic';
import { listAttempts, listCompletions } from '../db/repos/historyRepo';
import { loadModel, loadWeights, saveModel, saveWeights } from '../db/repos/modelRepo';

export interface Intelligence {
  profile: HistoryProfile;
  weights: Weights;
  model: LogisticModel | null;
  /** Diagnostics surfaced on the Stats screen so the model is never a black box. */
  diagnostics: {
    attempts: number;
    completions: number;
    trainAccuracy: number;
    calibrationError: number;
    buckets: CalibrationBucket[];
    tuned: boolean;
  } | null;
}

export const IDLE_INTELLIGENCE: Intelligence = {
  profile: emptyProfile(),
  weights: DEFAULT_WEIGHTS,
  model: null,
  diagnostics: null,
};

/**
 * Rebuilds everything Version 2 needs from the log. Runs in a few milliseconds
 * on a phone-sized dataset, so it is called on launch and after any change to
 * the log rather than on a schedule.
 *
 * With Version 1 selected this returns the profile only — the descriptive stats
 * still need it — and leaves the model null so nothing ranks or predicts.
 */
export async function rebuildIntelligence(settings: Settings, now = Date.now()): Promise<Intelligence> {
  const [completions, attempts] = await Promise.all([listCompletions(), listAttempts(1000, now)]);
  const profile = buildProfile(completions, attempts, now);

  if (settings.appVersion < 2) {
    return { profile, weights: DEFAULT_WEIGHTS, model: null, diagnostics: null };
  }

  const tuned = tuneWeights(attempts, profile);
  const samples = buildTrainingSet(attempts, profile, settings.dailyCapacityMin);
  const model = train(samples);
  const buckets = calibration(model, samples);

  await Promise.all([saveWeights(tuned.weights), saveModel(model)]);

  return {
    profile,
    weights: tuned.weights,
    model,
    diagnostics: {
      attempts: attempts.length,
      completions: completions.length,
      trainAccuracy: accuracy(model, samples),
      calibrationError: calibrationError(buckets),
      buckets,
      tuned: tuned.tuned,
    },
  };
}

/** Fast path on cold launch: use the cached model while the rebuild runs. */
export async function loadCachedIntelligence(): Promise<Pick<Intelligence, 'model' | 'weights'>> {
  const [model, weights] = await Promise.all([loadModel(), loadWeights()]);
  return { model, weights: weights ?? DEFAULT_WEIGHTS };
}
