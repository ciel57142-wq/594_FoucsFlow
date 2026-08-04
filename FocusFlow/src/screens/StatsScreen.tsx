import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../state/AppContext';
import { Bars, Button, Card, Chip, EmptyState, SectionLabel } from '../components/primitives';
import { taskToCompletionRecord, weeklyStats } from '../domain/stats';
import { CompletionRecord, DayAttempt } from '../domain/types';
import { dateKeyToTs, formatHour, formatMinutes } from '../domain/time';
import { localSummary } from '../services/summary';
import { colors, space, type } from '../theme';

const WEEKDAY = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export function StatsScreen() {
  const { tasks, settings, intelligence, now, seed } = useApp();
  const [summary, setSummary] = useState<string | null>(null);

  const { completions, attempts } = useMemo(() => {
    const done = tasks.map(taskToCompletionRecord).filter((c): c is CompletionRecord => c != null);
    // Attempts are re-derived from the plan snapshots the profile already loaded.
    const rebuilt: DayAttempt[] = tasks
      .filter((t) => t.scheduledFor != null)
      .map((t) => ({
        taskId: t.id,
        scheduledFor: t.scheduledFor!,
        evaluatedAt: dateKeyToTs(t.scheduledFor!, 9),
        tags: t.tags,
        priority: t.priority,
        estimateMin: t.estimateMin,
        dueAt: t.dueAt,
        deferralCount: t.deferralCount,
        dayLoadMin: t.estimateMin,
        completed: t.status === 'done',
      }));
    return { completions: done, attempts: rebuilt };
  }, [tasks]);

  const stats = useMemo(() => weeklyStats(completions, attempts, now), [completions, attempts, now]);
  const diagnostics = intelligence.diagnostics;

  if (completions.length === 0 && attempts.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <EmptyState
          title="No history yet"
          body="Finish a few tasks and this fills in: completion rate, how far off your estimates run, and the hours you actually get work done."
          action={<Button title="Load the demo dataset" variant="secondary" onPress={() => void seed()} />}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[type.screenTitle, styles.title]}>Last 7 days</Text>

        <Card>
          <View style={styles.figureRow}>
            <Figure value={`${Math.round(stats.completionRate * 100)}%`} label="of planned tasks finished" />
            <Figure value={`${stats.completed}/${stats.planned}`} label="done vs planned" />
            <Figure value={`${stats.currentStreakDays}d`} label="current streak" />
          </View>
        </Card>

        <Card>
          <SectionLabel>Finished per day</SectionLabel>
          <Bars
            data={stats.perDay.map((d) => ({
              label: WEEKDAY[new Date(dateKeyToTs(d.key)).getDay()],
              value: d.completed,
            }))}
          />
          <Text style={styles.caption}>
            {formatMinutes(stats.perDay.reduce((s, d) => s + d.minutes, 0))} of work logged this week.
          </Text>
        </Card>

        <Card>
          <SectionLabel>Estimate accuracy</SectionLabel>
          <Text style={type.figureLarge}>
            {stats.estimateRatio.toFixed(2)}×
          </Text>
          <Text style={styles.caption}>
            {stats.estimateRatio > 1.1
              ? `Work runs about ${Math.round((stats.estimateRatio - 1) * 100)}% longer than you plan for.`
              : stats.estimateRatio < 0.9
                ? `You finish about ${Math.round((1 - stats.estimateRatio) * 100)}% faster than you plan for.`
                : 'Your estimates are close to what actually happens.'}
            {' '}Typical miss: {Math.round(stats.estimateError * 100)}%.
          </Text>
        </Card>

        {stats.busiestHours.length > 0 && (
          <Card>
            <SectionLabel>When you finish work</SectionLabel>
            <View style={styles.chipRow}>
              {stats.busiestHours.map((h) => (
                <Chip key={h.hour} label={`${formatHour(h.hour)} · ${h.count}`} tone="slate" />
              ))}
            </View>
            <Text style={styles.caption}>
              {settings.appVersion === 2
                ? 'Version 2 shifts reminders toward these hours instead of a fixed offset.'
                : 'Switch to Version 2 in Settings and reminders start moving toward these hours.'}
            </Text>
          </Card>
        )}

        {intelligence.profile.neglectedTags.length > 0 && (
          <Card>
            <SectionLabel>Tags that keep slipping</SectionLabel>
            {intelligence.profile.neglectedTags.map((t) => (
              <View key={t.tag} style={styles.tagRow}>
                <Text style={type.body}>{t.tag}</Text>
                <Text style={type.figure}>
                  {t.completed}/{t.planned}
                  <Text style={type.figureSmall}> {Math.round(t.rate * 100)}%</Text>
                </Text>
              </View>
            ))}
          </Card>
        )}

        {settings.appVersion === 2 && diagnostics && (
          <Card>
            <SectionLabel>Prediction model</SectionLabel>
            <View style={styles.figureRow}>
              <Figure value={`${diagnostics.attempts}`} label="planned days learned from" />
              <Figure value={`${Math.round(diagnostics.trainAccuracy * 100)}%`} label="accuracy on your history" />
              <Figure value={`±${Math.round(diagnostics.calibrationError * 100)}%`} label="calibration gap" />
            </View>
            <Text style={styles.caption}>
              {diagnostics.tuned
                ? 'Ranking weights have been tuned on your own completions.'
                : 'Ranking still uses the default weights — not enough planned days yet.'}
            </Text>
            <View style={styles.calibration}>
              {diagnostics.buckets
                .filter((b) => b.count > 0)
                .map((b) => (
                  <View key={b.lower} style={styles.calibrationRow}>
                    <Text style={type.figureSmall}>
                      {Math.round(b.lower * 100)}–{Math.round(b.upper * 100)}%
                    </Text>
                    <Text style={type.figureSmall}>
                      said {Math.round(b.predicted * 100)}% · happened {Math.round(b.actual * 100)}% · n={b.count}
                    </Text>
                  </View>
                ))}
            </View>
          </Card>
        )}

        <Card>
          <SectionLabel>Your week in a sentence</SectionLabel>
          {summary ? (
            <Text style={type.body}>{summary}</Text>
          ) : (
            <Text style={styles.caption}>Built from the numbers above, on this device.</Text>
          )}
          <Button
            title={summary ? 'Rewrite it' : 'Write the summary'}
            variant="secondary"
            onPress={() => setSummary(localSummary(stats, intelligence.profile))}
          />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function Figure({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.figure}>
      <Text style={type.figureLarge}>{value}</Text>
      <Text style={styles.figureLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  scroll: { padding: space.lg, gap: space.lg, paddingBottom: space.xxl },
  title: { marginBottom: space.xs },
  figureRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.lg },
  figure: { flex: 1, minWidth: 90, gap: 2 },
  figureLabel: { ...type.caption, lineHeight: 15 },
  caption: { ...type.bodySoft, marginTop: space.sm, lineHeight: 20 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  tagRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  calibration: { marginTop: space.md, gap: 4 },
  calibrationRow: { flexDirection: 'row', justifyContent: 'space-between', gap: space.md },
});
