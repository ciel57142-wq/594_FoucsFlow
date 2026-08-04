import { WeeklyStats } from '../domain/stats';
import { HistoryProfile } from '../domain/profile';
import { formatHour } from '../domain/time';

/**
 * Optional stretch goal from the proposal: a plain-language read on the week.
 *
 * The default path is written locally from the same numbers the Stats screen
 * shows — no key, no network, no version gate depends on it. If a key is
 * present the same numbers are handed to an LLM for nicer prose, and any
 * failure falls straight back to the local text.
 */
export function localSummary(stats: WeeklyStats, profile: HistoryProfile): string {
  const lines: string[] = [];
  const rate = Math.round(stats.completionRate * 100);
  lines.push(`You planned ${stats.planned} tasks over the last ${stats.windowDays} days and finished ${stats.completed} of them (${rate}%).`);

  if (stats.estimateRatio > 1.15) {
    lines.push(`Work takes you about ${Math.round((stats.estimateRatio - 1) * 100)}% longer than you expect, so padding your estimates would make the day plan honest.`);
  } else if (stats.estimateRatio < 0.85) {
    lines.push('You finish faster than you plan for, so there is probably room for one more task a day.');
  } else {
    lines.push('Your estimates are close to reality.');
  }

  if (stats.busiestHours.length > 0) {
    lines.push(`Most of your work lands around ${formatHour(stats.busiestHours[0].hour)}.`);
  }

  const worst = profile.neglectedTags[0];
  if (worst && worst.rate < 0.5) {
    lines.push(`"${worst.tag}" keeps slipping — ${worst.completed} of ${worst.planned} planned got done.`);
  }

  if (stats.currentStreakDays >= 2) {
    lines.push(`Current streak: ${stats.currentStreakDays} days.`);
  }

  return lines.join(' ');
}

const ENDPOINT = 'https://api.anthropic.com/v1/messages';

export async function llmSummary(
  stats: WeeklyStats,
  profile: HistoryProfile,
  apiKey: string | null,
): Promise<{ text: string; source: 'llm' | 'local' }> {
  const fallback = { text: localSummary(stats, profile), source: 'local' as const };
  if (!apiKey) return fallback;

  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 300,
        system:
          'You summarise one week of task data in three sentences, second person, plain language, no advice the numbers do not support.',
        messages: [{ role: 'user', content: JSON.stringify({ stats, neglectedTags: profile.neglectedTags }) }],
      }),
    });
    if (!response.ok) return fallback;
    const data = await response.json();
    const text = (data?.content ?? [])
      .filter((block: { type: string }) => block.type === 'text')
      .map((block: { text: string }) => block.text)
      .join('\n')
      .trim();
    return text ? { text, source: 'llm' } : fallback;
  } catch {
    return fallback;
  }
}
