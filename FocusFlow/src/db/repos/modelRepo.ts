import { getDb } from '../index';
import { LogisticModel, deserialiseModel, serialiseModel } from '../../domain/logistic';
import { Weights } from '../../domain/weights';

const MODEL_KEY = 'completion_logistic';
const WEIGHTS_KEY = 'ranking_weights';

async function put(key: string, value: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('INSERT OR REPLACE INTO model_state (key, value, updated_at) VALUES (?, ?, ?);', [
    key,
    value,
    Date.now(),
  ]);
}

async function get(key: string): Promise<string | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM model_state WHERE key = ?;', [key]);
  return row?.value ?? null;
}

export async function saveModel(model: LogisticModel): Promise<void> {
  await put(MODEL_KEY, serialiseModel(model));
}

export async function loadModel(): Promise<LogisticModel | null> {
  return deserialiseModel(await get(MODEL_KEY));
}

export async function saveWeights(weights: Weights): Promise<void> {
  await put(WEIGHTS_KEY, JSON.stringify(weights));
}

export async function loadWeights(): Promise<Weights | null> {
  const raw = await get(WEIGHTS_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Weights;
  } catch {
    return null;
  }
}
