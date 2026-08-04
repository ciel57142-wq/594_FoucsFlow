import { getDb } from '../index';
import { DEFAULT_SETTINGS, Settings } from '../../domain/types';

export async function loadSettings(): Promise<Settings> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ key: string; value: string }>('SELECT key, value FROM settings;');
  const stored: Record<string, string> = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  const out: Settings = { ...DEFAULT_SETTINGS };
  for (const key of Object.keys(DEFAULT_SETTINGS) as (keyof Settings)[]) {
    const raw = stored[key];
    if (raw == null) continue;
    const fallback = DEFAULT_SETTINGS[key];
    if (typeof fallback === 'boolean') {
      (out[key] as boolean) = raw === 'true';
    } else {
      const n = Number(raw);
      if (!Number.isNaN(n)) (out[key] as number) = n;
    }
  }
  return out;
}

export async function saveSetting<K extends keyof Settings>(key: K, value: Settings[K]): Promise<void> {
  const db = await getDb();
  await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?);', [key, String(value)]);
}
