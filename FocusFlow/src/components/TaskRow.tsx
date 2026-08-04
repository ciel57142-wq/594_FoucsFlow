import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Task } from '../domain/types';
import { Ranked } from '../domain/recommender';
import { formatMinutes, formatRelativeDue } from '../domain/time';
import { colors, radius, space, type } from '../theme';
import { Chip } from './primitives';

const PRIORITY_LABEL = ['—', 'Low', 'Med', 'High'];

export function TaskRow({
  task,
  ranking,
  now,
  onToggle,
  onPress,
  onWhy,
  index,
}: {
  task: Task;
  ranking?: Ranked;
  now: number;
  onToggle: () => void;
  onPress: () => void;
  onWhy?: () => void;
  index?: number;
}) {
  const overdue = task.dueAt != null && task.dueAt < now && task.status === 'open';
  const likelihood = ranking?.likelihood ?? null;
  const atRisk = likelihood != null && likelihood < 0.45;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: task.status === 'done' }}
        accessibilityLabel={task.status === 'done' ? `Reopen ${task.title}` : `Complete ${task.title}`}
        hitSlop={10}
        onPress={onToggle}
        style={[styles.checkbox, task.status === 'done' && styles.checkboxDone]}
      >
        {task.status === 'done' && <Text style={styles.check}>✓</Text>}
      </Pressable>

      <View style={styles.body}>
        <View style={styles.titleRow}>
          {index != null && <Text style={styles.rank}>{`${index + 1}`.padStart(2, '0')}</Text>}
          <Text style={[styles.title, task.status === 'done' && styles.titleDone]} numberOfLines={2}>
            {task.title}
          </Text>
        </View>

        <View style={styles.meta}>
          <Text style={type.figureSmall}>{formatMinutes(task.estimateMin)}</Text>
          {task.dueAt != null && (
            <Text style={[type.figureSmall, overdue && { color: colors.clay }]}>
              {formatRelativeDue(task.dueAt, now)}
            </Text>
          )}
          {task.priority > 0 && <Text style={type.figureSmall}>{PRIORITY_LABEL[task.priority]}</Text>}
          {task.deferralCount > 0 && (
            <Text style={[type.figureSmall, { color: colors.mustard }]}>pushed {task.deferralCount}×</Text>
          )}
        </View>

        {task.tags.length > 0 && (
          <View style={styles.tags}>
            {task.tags.map((tag) => (
              <Chip key={tag} label={tag} small />
            ))}
          </View>
        )}
      </View>

      {likelihood != null && (
        <Pressable onPress={onWhy} hitSlop={8} style={styles.likelihood} accessibilityLabel="Why this task">
          <Text style={[styles.likelihoodValue, atRisk && { color: colors.clay }]}>
            {Math.round(likelihood * 100)}
            <Text style={styles.percent}>%</Text>
          </Text>
          <Text style={styles.why}>why?</Text>
        </Pressable>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.md,
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.rule,
  },
  rowPressed: { backgroundColor: colors.paper },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: colors.inkFaint,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxDone: { backgroundColor: colors.pine, borderColor: colors.pine },
  check: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  body: { flex: 1, gap: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'baseline', gap: space.sm },
  rank: { ...type.figureSmall, color: colors.inkFaint },
  title: { ...type.body, flex: 1, lineHeight: 21 },
  titleDone: { color: colors.inkFaint, textDecorationLine: 'line-through' },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 2 },
  likelihood: { alignItems: 'flex-end', minWidth: 52 },
  likelihoodValue: { ...type.figure, fontSize: 18, color: colors.slate },
  percent: { fontSize: 11 },
  why: { ...type.figureSmall, fontSize: 10, color: colors.inkFaint, textDecorationLine: 'underline' },
});
