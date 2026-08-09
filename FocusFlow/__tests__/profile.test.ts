import { buildProfile, adjustedEstimate, peakHour, COLD_START_MIN_COMPLETIONS } from '../src/domain/profile';
import { STUDENT_PERSONA, generateHistory } from '../src/domain/synthetic';
import { CompletionRecord } from '../src/domain/types';
import { dateKeyToTs, dateKey } from '../src/domain/time';

const NOW = new Date(2026, 4, 26, 12, 0, 0).getTime();

describe('FR-5.2/NFR-1 history profile', () => {
  it('starts in cold start with no data', () => {
    const p = buildProfile([], [], NOW);
    expect(p.coldStart).toBe(true);
    expect(p.totalCompletions).toBe(0);
    expect(p.hourWeights.every((w) => w === 0.5)).toBe(true);
    expect(p.baseCompletionRate).toBe(0.5);
  });

  it('leaves cold start once enough tasks are logged', () => {
    const { completions, attempts } = generateHistory(STUDENT_PERSONA, 30, NOW);
    expect(completions.length).toBeGreaterThan(COLD_START_MIN_COMPLETIONS);
    expect(buildProfile(completions, attempts, NOW).coldStart).toBe(false);
  });

  it('recovers the hour of day each kind of work actually happens', () => {
    const { completions, attempts } = generateHistory(STUDENT_PERSONA, 60, NOW);
    const profile = buildProfile(completions, attempts, NOW);
    for (const [tag, trueHour] of Object.entries(STUDENT_PERSONA.peakHourByTag)) {
      const learned = peakHour([tag], profile);
      const distance = Math.min(Math.abs(learned - trueHour), 24 - Math.abs(learned - trueHour));
      expect(distance).toBeLessThanOrEqual(2);
    }
  });

  it('learns that school work takes longer than the user estimates', () => {
    const { completions, attempts } = generateHistory(STUDENT_PERSONA, 60, NOW);
    const profile = buildProfile(completions, attempts, NOW);
    const school = profile.byTag['school'];
    expect(school).toBeDefined();
    expect(school.estimateRatio).toBeGreaterThan(1.1);
    // A 60-minute estimate on school work should be corrected upward.
    expect(adjustedEstimate(60, ['school'], profile)).toBeGreaterThan(65);
    // Errands, which this persona overestimates, should not be inflated.
    expect(adjustedEstimate(60, ['errands'], profile)).toBeLessThan(
      adjustedEstimate(60, ['school'], profile),
    );
  });

  it('weights recent completions above old ones', () => {
    const mk = (hour: number, daysAgo: number, i: number): CompletionRecord => ({
      taskId: `t${i}`,
      tags: ['school'],
      projectId: null,
      estimateMin: 30,
      actualMin: 30,
      completedAt: dateKeyToTs(dateKey(NOW - daysAgo * 86400000), hour),
      deferralCount: 0,
      dueAt: null,
    });
    // Twelve old morning finishes against six recent evening ones.
    const old = Array.from({ length: 12 }, (_, i) => mk(8, 60 + i, i));
    const recent = Array.from({ length: 6 }, (_, i) => mk(21, i, 100 + i));
    const profile = buildProfile([...old, ...recent], [], NOW);
    expect(peakHour(['school'], profile)).toBeGreaterThanOrEqual(20);
  });

  it('flags tags that get planned but not finished', () => {
    const { completions, attempts } = generateHistory(STUDENT_PERSONA, 45, NOW);
    const profile = buildProfile(completions, attempts, NOW);
    expect(profile.neglectedTags.length).toBeGreaterThan(0);
    const rates = profile.neglectedTags.map((t) => t.rate);
    expect([...rates].sort((a, b) => a - b)).toEqual(rates); // worst first
  });
});
