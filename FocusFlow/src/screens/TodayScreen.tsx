import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../state/AppContext';
import { useToday } from '../state/useToday';
import { CapacityMeter } from '../components/CapacityMeter';
import { TaskRow } from '../components/TaskRow';
import { WhyPanel } from '../components/WhyPanel';
import { QuickAdd } from '../components/QuickAdd';
import { Button, Card, Chip, EmptyState, SectionLabel } from '../components/primitives';
import { Ranked, headlineReason } from '../domain/recommender';
import { addDaysToKey, formatDayHeading, formatMinutes } from '../domain/time';
import { colors, space, type } from '../theme';

export function TodayScreen({ navigation }: { navigation: any }) {
  const { today, now, settings, createTask, completeTask, reopenTask, snoozeTask, scheduleTask } = useApp();
  const { ordered, rankings, done, assessment, nextUp, predictive } = useToday();
  const [why, setWhy] = useState<Ranked | null>(null);

  const taskActions = (id: string, title: string) => {
    Alert.alert(title, 'Move this task', [
      { text: 'Tomorrow', onPress: () => void snoozeTask(id, 1) },
      { text: 'In three days', onPress: () => void scheduleTask(id, addDaysToKey(today, 3)) },
      { text: 'Back to the backlog', onPress: () => void scheduleTask(id, null) },
      { text: 'Edit', onPress: () => navigation.navigate('TaskEdit', { taskId: id }) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={type.sectionLabel}>{predictive ? 'Suggested order' : 'Your order'}</Text>
            <Text style={type.screenTitle}>{formatDayHeading(now)}</Text>
          </View>
          <Chip label={`v${settings.appVersion}`} tone={predictive ? 'pine' : 'neutral'} />
        </View>

        <Card style={styles.meterCard}>
          <CapacityMeter assessment={assessment} showAdjusted={predictive} />
        </Card>

        {predictive && nextUp && (
          <Pressable onPress={() => setWhy(nextUp)}>
            <Card style={styles.nextCard}>
              <Text style={type.sectionLabel}>Start here</Text>
              <Text style={styles.nextTitle}>{nextUp.task.title}</Text>
              <Text style={styles.nextReason}>{headlineReason(nextUp)}</Text>
              <View style={styles.nextMeta}>
                <Text style={type.figureSmall}>{formatMinutes(nextUp.task.estimateMin)}</Text>
                {nextUp.likelihood != null && (
                  <Text style={type.figureSmall}>
                    {Math.round(nextUp.likelihood * 100)}% chance you finish it today
                  </Text>
                )}
                <Text style={[type.figureSmall, styles.link]}>Why this?</Text>
              </View>
            </Card>
          </Pressable>
        )}

        {predictive && assessment.atRisk.length > 0 && (
          <Card style={styles.riskCard}>
            <Text style={type.sectionLabel}>Least likely to happen</Text>
            {assessment.atRisk.map((r) => (
              <View key={r.task.id} style={styles.riskRow}>
                <Text style={styles.riskTitle} numberOfLines={1}>
                  {r.task.title}
                </Text>
                <Text style={[type.figure, { color: colors.clay }]}>{Math.round((r.likelihood ?? 0) * 100)}%</Text>
              </View>
            ))}
            <Text style={styles.riskHint}>Move one of these to another day and the rest get more realistic.</Text>
          </Card>
        )}

        <View style={styles.listBlock}>
          <SectionLabel style={styles.listLabel}>
            {`Planned · ${ordered.length} task${ordered.length === 1 ? '' : 's'}`}
          </SectionLabel>
          {ordered.length === 0 ? (
            <EmptyState
              title="Nothing on today's plan"
              body="Add something below, or pull a task in from your backlog."
              action={<Button title="Open backlog" variant="secondary" onPress={() => navigation.navigate('Tasks')} />}
            />
          ) : (
            ordered.map((task, i) => (
              <TaskRow
                key={task.id}
                task={task}
                index={i}
                now={now}
                ranking={rankings.get(task.id)}
                onToggle={() => void completeTask(task.id)}
                onPress={() => taskActions(task.id, task.title)}
                onWhy={() => setWhy(rankings.get(task.id) ?? null)}
              />
            ))
          )}
        </View>

        {done.length > 0 && (
          <View style={styles.listBlock}>
            <SectionLabel style={styles.listLabel}>{`Done today · ${done.length}`}</SectionLabel>
            {done.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                now={now}
                onToggle={() => void reopenTask(task.id)}
                onPress={() => navigation.navigate('TaskEdit', { taskId: task.id })}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <QuickAdd
        onAdd={(title, estimateMin) => void createTask({ title, estimateMin, scheduledFor: today })}
      />
      <WhyPanel ranked={why} onClose={() => setWhy(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  scroll: { paddingBottom: space.xxl, gap: space.lg },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    gap: space.md,
  },
  headerText: { flex: 1, gap: 2 },
  meterCard: { marginHorizontal: space.lg },
  nextCard: { marginHorizontal: space.lg, gap: 4, borderColor: colors.pine, borderWidth: 1.5 },
  nextTitle: { ...type.body, fontSize: 19, fontWeight: '700' },
  nextReason: { ...type.bodySoft },
  nextMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md, marginTop: space.sm },
  link: { color: colors.pine, textDecorationLine: 'underline' },
  riskCard: { marginHorizontal: space.lg, gap: space.sm, backgroundColor: colors.claySoft, borderColor: colors.claySoft },
  riskRow: { flexDirection: 'row', justifyContent: 'space-between', gap: space.md },
  riskTitle: { ...type.body, flex: 1, fontSize: 15 },
  riskHint: { ...type.caption },
  listBlock: { gap: 0 },
  listLabel: { paddingHorizontal: space.lg },
});
