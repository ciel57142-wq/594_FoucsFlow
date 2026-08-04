import { CompletionRecord, DayAttempt } from './types';
import { DAY, clamp } from './time';

/**
 * How the app summarises "how this person actually works".
 *
 * Everything here is a weighted average over the completion log, with older
 * completions discounted on a 14-day half-life so the profile tracks the
 * current semester rather than the whole history. No training, no network.
 */
export const HALF_LIFE_DAYS = 14;

/** Below this many completions the app falls back to default rules (cold start). */
export const COLD_START_MIN_COMPLETIONS = 12;

export interface TagStat {
  /** Raw count of completions carrying this tag. */
  n: number;
  /** Recency-weighted count. */
  weight: number;
  /** Weighted mean of actual ÷ estimated minutes. >1 means the user underestimates. */
  estimateRatio: number;
  /** 24 slots, normalised so the user's best hour for this tag is 1. */
  hourWeights: number[];
  /** Mean deferrals before completion. */
  meanDeferrals: number;
}

export interface HistoryProfile {
  builtAt: number;
  totalCompletions: number;
  /** Recency-weighted completion count; drives the cold-start blend. */
  effectiveN: number;
  /** Share of planned tasks that got finished on the day they were planned. */
  baseCompletionRate: number;
  /** Global hour-of-day engagement, normalised to a max of 1. */
  hourWeights: number[];
  globalEstimateRatio: number;
  byTag: Record<string, TagStat>;
  /** Tags planned often but finished rarely, worst first. */
  neglectedTags: { tag: string; planned: number; completed: number; rate: number }[];
  coldStart: boolean;
}

export function recencyWeight(ts: number, now: number): number {
  const days = Math.max(0, (now - ts) / DAY);
  return Math.pow(0.5, days / HALF_LIFE_DAYS);
}

/** Spreads a completion into neighbouring hours so a single 2:07 PM finish also votes for 1 PM and 3 PM. */
function addSmoothed(hist: number[], hour: number, weight: number): void {
  hist[hour] += weight;
  hist[(hour + 23) % 24] += weight * 0.5;
  hist[(hour + 1) % 24] += weight * 0.5;
}

function normalise(hist: number[]): number[] {
  const max = Math.max(...hist);
  if (max <= 0) return new Array(24).fill(0.5); // no data: every hour is equally plausible
  return hist.map((v) => v / max);
}

export function emptyProfile(now = Date.now()): HistoryProfile {
  return {
    builtAt: now,
    totalCompletions: 0,
    effectiveN: 0,
    baseCompletionRate: 0.5,
    hourWeights: new Array(24).fill(0.5),
    globalEstimateRatio: 1,
    byTag: {},
    neglectedTags: [],
    coldStart: true,
  };
}

export function buildProfile(
  completions: CompletionRecord[],
  attempts: DayAttempt[] = [],
  now = Date.now(),
): HistoryProfile {
  const profile = emptyProfile(now);
  if (completions.length === 0 && attempts.length === 0) return profile;

  const globalHours = new Array(24).fill(0);
  let ratioNum = 0;
  let ratioDen = 0;
  let effectiveN = 0;

  const tagBuckets: Record<string, { hours: number[]; n: number; weight: number; rNum: number; rDen: number; def: number }> = {};

  for (const c of completions) {
    const w = recencyWeight(c.completedAt, now);
    effectiveN += w;
    const hour = new Date(c.completedAt).getHours();
    addSmoothed(globalHours, hour, w);

    if (c.actualMin != null && c.estimateMin > 0) {
      ratioNum += w * (c.actualMin / c.estimateMin);
      ratioDen += w;
    }

    for (const tag of c.tags) {
      const b = (tagBuckets[tag] ||= { hours: new Array(24).fill(0), n: 0, weight: 0, rNum: 0, rDen: 0, def: 0 });
      b.n += 1;
      b.weight += w;
      b.def += c.deferralCount;
      addSmoothed(b.hours, hour, w);
      if (c.actualMin != null && c.estimateMin > 0) {
        b.rNum += w * (c.actualMin / c.estimateMin);
        b.rDen += w;
      }
    }
  }

  profile.totalCompletions = completions.length;
  profile.effectiveN = effectiveN;
  profile.hourWeights = normalise(globalHours);
  profile.globalEstimateRatio = ratioDen > 0 ? clamp(ratioNum / ratioDen, 0.25, 4) : 1;
  profile.coldStart = completions.length < COLD_START_MIN_COMPLETIONS;

  for (const [tag, b] of Object.entries(tagBuckets)) {
    // Shrink each tag's estimate ratio toward the global one until the tag has
    // enough completions to speak for itself.
    const shrink = b.n / (b.n + 5);
    const tagRatio = b.rDen > 0 ? b.rNum / b.rDen : profile.globalEstimateRatio;
    profile.byTag[tag] = {
      n: b.n,
      weight: b.weight,
      estimateRatio: clamp(shrink * tagRatio + (1 - shrink) * profile.globalEstimateRatio, 0.25, 4),
      hourWeights: normalise(b.hours),
      meanDeferrals: b.n > 0 ? b.def / b.n : 0,
    };
  }

  if (attempts.length > 0) {
    const done = attempts.filter((a) => a.completed).length;
    // Laplace smoothing keeps the base rate off 0 and 1 on tiny samples.
    profile.baseCompletionRate = (done + 1) / (attempts.length + 2);

    const perTag: Record<string, { planned: number; completed: number }> = {};
    for (const a of attempts) {
      for (const tag of a.tags) {
        const t = (perTag[tag] ||= { planned: 0, completed: 0 });
        t.planned += 1;
        if (a.completed) t.completed += 1;
      }
    }
    profile.neglectedTags = Object.entries(perTag)
      .filter(([, t]) => t.planned >= 3)
      .map(([tag, t]) => ({ tag, planned: t.planned, completed: t.completed, rate: t.completed / t.planned }))
      .sort((a, b) => a.rate - b.rate)
      .slice(0, 5);
  }

  return profile;
}

/** Blended estimate: what the user said, corrected by how they have historically been wrong. */
export function adjustedEstimate(estimateMin: number, tags: string[], profile: HistoryProfile): number {
  if (profile.coldStart) return estimateMin;
  const ratios = tags.map((t) => profile.byTag[t]?.estimateRatio).filter((r): r is number => r != null);
  const ratio = ratios.length > 0 ? ratios.reduce((a, b) => a + b, 0) / ratios.length : profile.globalEstimateRatio;
  return Math.round(estimateMin * ratio);
}

/** How well this hour matches when the user finishes tasks like this one, 0–1. */
export function hourFit(hour: number, tags: string[], profile: HistoryProfile): number {
  const h = ((Math.round(hour) % 24) + 24) % 24;
  const tagged = tags.map((t) => profile.byTag[t]).filter((s): s is TagStat => s != null && s.n >= 3);
  if (tagged.length === 0) return profile.hourWeights[h];
  return tagged.reduce((sum, s) => sum + s.hourWeights[h], 0) / tagged.length;
}

/** The hour of day this kind of task is most often finished. */
export function peakHour(tags: string[], profile: HistoryProfile): number {
  let best = 9;
  let bestScore = -1;
  for (let h = 0; h < 24; h++) {
    const score = hourFit(h, tags, profile);
    if (score > bestScore) {
      bestScore = score;
      best = h;
    }
  }
  return best;
}
