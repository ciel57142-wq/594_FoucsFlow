import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../state/AppContext';
import { TaskRow } from '../components/TaskRow';
import { Button, EmptyState, SectionLabel } from '../components/primitives';
import { Task } from '../domain/types';
import { addDaysToKey } from '../domain/time';
import { colors, radius, space, type } from '../theme';

type Filter = { kind: 'all' } | { kind: 'project'; id: string } | { kind: 'tag'; name: string };

/** The backlog: everything not on today's plan, grouped by when it is due. */
export function TasksScreen({ navigation }: { navigation: any }) {
  const { tasks, projects, tags, today, now, completeTask, reopenTask, scheduleTask } = useApp();
  const [filter, setFilter] = useState<Filter>({ kind: 'all' });
  const [showDone, setShowDone] = useState(false);

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (!showDone && t.status === 'done') return false;
      if (showDone && t.status !== 'done') return false;
      if (filter.kind === 'project') return t.projectId === filter.id;
      if (filter.kind === 'tag') return t.tags.includes(filter.name);
      return true;
    });
  }, [tasks, filter, showDone]);

  const groups = useMemo(() => groupByDue(filtered, today, now), [filtered, today, now]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={type.screenTitle}>{showDone ? 'Completed' : 'All tasks'}</Text>
        <Button
          title={showDone ? 'Show open' : 'Show done'}
          variant="ghost"
          onPress={() => setShowDone((v) => !v)}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        <FilterPill label="Everything" active={filter.kind === 'all'} onPress={() => setFilter({ kind: 'all' })} />
        {projects.map((p) => (
          <FilterPill
            key={p.id}
            label={p.name}
            color={p.color}
            active={filter.kind === 'project' && filter.id === p.id}
            onPress={() => setFilter({ kind: 'project', id: p.id })}
          />
        ))}
        {tags.map((t) => (
          <FilterPill
            key={t.id}
            label={`#${t.name}`}
            active={filter.kind === 'tag' && filter.name === t.name}
            onPress={() => setFilter({ kind: 'tag', name: t.name })}
          />
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.scroll}>
        {filtered.length === 0 && (
          <EmptyState
            title={showDone ? 'Nothing finished yet' : 'The backlog is empty'}
            body={showDone ? 'Completed tasks show up here with the time they actually took.' : 'Add a task from the Today screen and it will show up here.'}
          />
        )}

        {groups.map((group) => (
          <View key={group.title}>
            <SectionLabel style={styles.groupLabel}>{`${group.title} · ${group.tasks.length}`}</SectionLabel>
            {group.tasks.map((task) => (
              <View key={task.id}>
                <TaskRow
                  task={task}
                  now={now}
                  onToggle={() => void (task.status === 'done' ? reopenTask(task.id) : completeTask(task.id))}
                  onPress={() => navigation.navigate('TaskEdit', { taskId: task.id })}
                />
                {task.status === 'open' && task.scheduledFor !== today && (
                  <View style={styles.quickRow}>
                    <Pressable onPress={() => void scheduleTask(task.id, today)} style={styles.quickAction}>
                      <Text style={styles.quickText}>Plan for today</Text>
                    </Pressable>
                    <Pressable onPress={() => void scheduleTask(task.id, addDaysToKey(today, 1))} style={styles.quickAction}>
                      <Text style={styles.quickText}>Tomorrow</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            ))}
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <Button title="New task" onPress={() => navigation.navigate('TaskEdit', {})} />
      </View>
    </SafeAreaView>
  );
}

function FilterPill({
  label,
  active,
  onPress,
  color,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  color?: string;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.pill, active && styles.pillActive]}>
      {color && <View style={[styles.dot, { backgroundColor: color }]} />}
      <Text style={[styles.pillText, active && styles.pillTextActive]}>{label}</Text>
    </Pressable>
  );
}

function groupByDue(tasks: Task[], today: string, now: number): { title: string; tasks: Task[] }[] {
  const buckets: Record<string, Task[]> = {
    'On today’s plan': [],
    Overdue: [],
    'Due this week': [],
    Later: [],
    'No due date': [],
  };
  const weekEnd = now + 7 * 86_400_000;

  for (const task of tasks) {
    if (task.scheduledFor === today && task.status === 'open') buckets['On today’s plan'].push(task);
    else if (task.dueAt == null) buckets['No due date'].push(task);
    else if (task.dueAt < now && task.status === 'open') buckets.Overdue.push(task);
    else if (task.dueAt <= weekEnd) buckets['Due this week'].push(task);
    else buckets.Later.push(task);
  }

  return Object.entries(buckets)
    .filter(([, list]) => list.length > 0)
    .map(([title, list]) => ({
      title,
      tasks: list.sort((a, b) => (a.dueAt ?? Infinity) - (b.dueAt ?? Infinity)),
    }));
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
    paddingTop: space.md,
  },
  filters: { paddingHorizontal: space.lg, paddingVertical: space.md, gap: space.sm },
  scroll: { paddingBottom: space.xxl },
  groupLabel: { paddingHorizontal: space.lg, marginTop: space.lg },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.rule,
  },
  pillActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  pillText: { ...type.bodySoft, fontSize: 13 },
  pillTextActive: { color: '#FFFFFF', fontWeight: '600' },
  dot: { width: 8, height: 8, borderRadius: 4 },
  quickRow: {
    flexDirection: 'row',
    gap: space.sm,
    paddingHorizontal: space.lg,
    paddingBottom: space.sm,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.rule,
  },
  quickAction: {
    paddingHorizontal: space.md,
    paddingVertical: 6,
    borderRadius: radius.sm,
    backgroundColor: colors.paper,
  },
  quickText: { ...type.caption, color: colors.pine, fontWeight: '600' },
  footer: { padding: space.lg, borderTopWidth: 1, borderTopColor: colors.rule, backgroundColor: colors.card },
});
