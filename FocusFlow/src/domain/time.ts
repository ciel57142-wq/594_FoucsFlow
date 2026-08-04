import { DateKey } from './types';

export const MINUTE = 60_000;
export const HOUR = 3_600_000;
export const DAY = 86_400_000;

export function dateKey(ts: number | Date): DateKey {
  const d = ts instanceof Date ? ts : new Date(ts);
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function startOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function endOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

/** Turns 'YYYY-MM-DD' plus an hour into a local epoch timestamp. */
export function dateKeyToTs(key: DateKey, hour = 0, minute = 0): number {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d, hour, minute, 0, 0).getTime();
}

export function addDaysToKey(key: DateKey, days: number): DateKey {
  return dateKey(dateKeyToTs(key) + days * DAY);
}

export function daysBetweenKeys(a: DateKey, b: DateKey): number {
  return Math.round((dateKeyToTs(b) - dateKeyToTs(a)) / DAY);
}

export function minutesLeftInDay(now: number, dayEndHour = 22): number {
  const end = startOfDay(now) + dayEndHour * HOUR;
  return Math.max(0, Math.round((end - now) / MINUTE));
}

export function clamp(v: number, lo = 0, hi = 1): number {
  return Math.min(hi, Math.max(lo, v));
}

export function formatMinutes(min: number): string {
  const m = Math.max(0, Math.round(min));
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rest = m % 60;
  return rest === 0 ? `${h}h` : `${h}h ${rest}m`;
}

export function formatHour(hour: number): string {
  const h = ((hour % 24) + 24) % 24;
  const suffix = h < 12 ? 'AM' : 'PM';
  const display = h % 12 === 0 ? 12 : h % 12;
  return `${display} ${suffix}`;
}

export function formatClock(ts: number): string {
  const d = new Date(ts);
  const h = d.getHours();
  const m = `${d.getMinutes()}`.padStart(2, '0');
  const suffix = h < 12 ? 'AM' : 'PM';
  const display = h % 12 === 0 ? 12 : h % 12;
  return `${display}:${m} ${suffix}`;
}

export function formatRelativeDue(dueAt: number, now: number): string {
  const diff = dueAt - now;
  const absHours = Math.abs(diff) / HOUR;
  if (diff < 0) {
    if (absHours < 1) return 'Overdue';
    if (absHours < 24) return `${Math.round(absHours)}h overdue`;
    return `${Math.round(absHours / 24)}d overdue`;
  }
  if (absHours < 1) return `Due in ${Math.max(1, Math.round(diff / MINUTE))}m`;
  if (absHours < 24) return `Due in ${Math.round(absHours)}h`;
  const days = Math.round(absHours / 24);
  return days === 1 ? 'Due tomorrow' : `Due in ${days}d`;
}

export function formatDayHeading(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

/** Deterministic pseudo-random source so seeded datasets and tests reproduce. */
export function seededRandom(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x1_0000_0000;
  };
}
