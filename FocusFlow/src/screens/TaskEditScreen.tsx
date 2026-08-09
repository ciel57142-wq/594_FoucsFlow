import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useApp } from '../state/AppContext';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button, Card, SectionLabel } from '../components/primitives';
import { Segmented, Stepper, TagPicker } from '../components/controls';
import { Priority, Task } from '../domain/types';
import type { RootStackParamList } from '../navigation';
import { addDaysToKey, formatClock, formatMinutes } from '../domain/time';
import { planReminder } from '../domain/reminders';
import { adjustedEstimate } from '../domain/profile';
import { colors, radius, space, type } from '../theme';

type TaskEditScreenProps = NativeStackScreenProps<RootStackParamList, 'TaskEdit'>;

export function TaskEditScreen({ route, navigation }: TaskEditScreenProps) {
  const taskId: string | undefined = route.params?.taskId;
  const { tasks, projects, tags, today, settings, intelligence, createTask, updateTask, deleteTask, completeTask } = useApp();
  const existing = useMemo(() => tasks.find((t) => t.id === taskId), [tasks, taskId]);

  const [title, setTitle] = useState(existing?.title ?? '');
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [priority, setPriority] = useState<Priority>(existing?.priority ?? 1);
  const [estimateMin, setEstimateMin] = useState(existing?.estimateMin ?? 30);
  const [projectId, setProjectId] = useState<string | null>(existing?.projectId ?? null);
  const [selectedTags, setSelectedTags] = useState<string[]>(existing?.tags ?? []);
  const [dueAt, setDueAt] = useState<number | null>(existing?.dueAt ?? null);
  const [scheduledFor, setScheduledFor] = useState<string | null>(existing?.scheduledFor ?? null);
  const [reminderOffsetMin, setReminderOffsetMin] = useState<number | null>(existing?.reminderOffsetMin ?? null);
  const [picker, setPicker] = useState<'date' | 'time' | null>(null);
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    navigation.setOptions({ title: existing ? 'Edit task' : 'New task' });
  }, [navigation, existing]);

  const previewTask: Task = {
    ...(existing ?? {
      id: 'preview',
      status: 'open' as const,
      manualOrder: 0,
      deferralCount: 0,
      actualMin: null,
      completedAt: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      notes: null,
      projectId: null,
      tags: [],
      reminderOffsetMin: null,
    }),
    title,
    priority,
    estimateMin,
    dueAt,
    scheduledFor,
    tags: selectedTags,
    reminderOffsetMin,
  };
  const reminder = planReminder(previewTask, settings, intelligence.profile);
  const adjusted = adjustedEstimate(estimateMin, selectedTags, intelligence.profile);

  const save = async () => {
    if (!title.trim()) {
      Alert.alert('Add a title', 'A task needs a title before it can be saved.');
      return;
    }
    const payload = {
      title,
      notes: notes || null,
      priority,
      estimateMin,
      projectId,
      tags: selectedTags,
      dueAt,
      scheduledFor,
      reminderOffsetMin,
    };
    if (existing) await updateTask(existing.id, payload);
    else await createTask(payload);
    navigation.goBack();
  };

  const confirmDelete = () => {
    if (!existing) return;
    Alert.alert('Delete this task?', 'Its history is removed from your statistics too.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteTask(existing.id);
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="What needs doing?"
          placeholderTextColor={colors.inkFaint}
          style={styles.titleInput}
          accessibilityLabel="Task title"
        />

        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Notes"
          placeholderTextColor={colors.inkFaint}
          style={styles.notesInput}
          multiline
          accessibilityLabel="Notes"
        />

        <Segmented
          label="Priority"
          value={priority}
          onChange={(v) => setPriority(v as Priority)}
          options={[
            { label: 'None', value: 0 },
            { label: 'Low', value: 1 },
            { label: 'Medium', value: 2 },
            { label: 'High', value: 3 },
          ]}
        />

        <Stepper label="Estimate" value={estimateMin} onChange={setEstimateMin} />
        {settings.appVersion === 2 && adjusted !== estimateMin && (
          <Text style={styles.hint}>
            Tasks like this usually take you {formatMinutes(adjusted)}. Today's load uses that number.
          </Text>
        )}

        <View>
          <SectionLabel>Project</SectionLabel>
          <View style={styles.pillRow}>
            <Pressable onPress={() => setProjectId(null)} style={[styles.pill, projectId === null && styles.pillActive]}>
              <Text style={[styles.pillText, projectId === null && styles.pillTextActive]}>No project</Text>
            </Pressable>
            {projects.map((p) => (
              <Pressable
                key={p.id}
                onPress={() => setProjectId(p.id)}
                style={[styles.pill, projectId === p.id && styles.pillActive]}
              >
                <View style={[styles.dot, { backgroundColor: p.color }]} />
                <Text style={[styles.pillText, projectId === p.id && styles.pillTextActive]}>{p.name}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View>
          <SectionLabel>Tags</SectionLabel>
          <TagPicker
            available={tags.map((t) => t.name)}
            selected={selectedTags}
            onToggle={(tag) =>
              setSelectedTags((current) =>
                current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag],
              )
            }
          />
          <View style={styles.newTagRow}>
            <TextInput
              value={newTag}
              onChangeText={setNewTag}
              placeholder="New tag"
              placeholderTextColor={colors.inkFaint}
              style={styles.newTagInput}
              autoCapitalize="none"
              onSubmitEditing={() => {
                const name = newTag.trim().toLowerCase();
                if (name && !selectedTags.includes(name)) setSelectedTags([...selectedTags, name]);
                setNewTag('');
              }}
            />
          </View>
        </View>

        <View>
          <SectionLabel>Due</SectionLabel>
          <View style={styles.pillRow}>
            <Pressable onPress={() => setPicker('date')} style={[styles.pill, dueAt != null && styles.pillActive]}>
              <Text style={[styles.pillText, dueAt != null && styles.pillTextActive]}>
                {dueAt != null ? `${new Date(dueAt).toLocaleDateString()} ${formatClock(dueAt)}` : 'Set a due date'}
              </Text>
            </Pressable>
            {dueAt != null && (
              <Pressable onPress={() => setDueAt(null)} style={styles.pill}>
                <Text style={styles.pillText}>Clear</Text>
              </Pressable>
            )}
          </View>
        </View>

        <View>
          <SectionLabel>Plan for</SectionLabel>
          <View style={styles.pillRow}>
            {[
              { label: 'Backlog', value: null },
              { label: 'Today', value: today },
              { label: 'Tomorrow', value: addDaysToKey(today, 1) },
              { label: 'Next week', value: addDaysToKey(today, 7) },
            ].map((opt) => (
              <Pressable
                key={opt.label}
                onPress={() => setScheduledFor(opt.value)}
                style={[styles.pill, scheduledFor === opt.value && styles.pillActive]}
              >
                <Text style={[styles.pillText, scheduledFor === opt.value && styles.pillTextActive]}>{opt.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Card style={styles.reminderCard}>
          <SectionLabel>Reminder</SectionLabel>
          {reminder ? (
            <>
              <Text style={type.body}>
                {new Date(reminder.fireAt).toLocaleDateString()} at {formatClock(reminder.fireAt)}
              </Text>
              <Text style={styles.hint}>{reminder.reason}</Text>
            </>
          ) : (
            <Text style={styles.hint}>
              {settings.notificationsEnabled
                ? 'No reminder — add a due date or plan this for a day.'
                : 'Reminders are switched off in Settings.'}
            </Text>
          )}
          {settings.appVersion === 1 && (
            <Stepper
              label="Minutes before due"
              value={reminderOffsetMin ?? settings.defaultReminderOffsetMin}
              step={15}
              min={0}
              max={1440}
              onChange={setReminderOffsetMin}
            />
          )}
        </Card>

        {existing?.status === 'done' && existing.actualMin != null && (
          <Card>
            <SectionLabel>Recorded</SectionLabel>
            <Text style={type.figure}>
              {formatMinutes(existing.actualMin)}
              <Text style={type.figureSmall}> actual vs {formatMinutes(existing.estimateMin)} estimated</Text>
            </Text>
          </Card>
        )}

        <View style={styles.actions}>
          <Button title="Save" onPress={save} style={{ flex: 1 }} />
          {existing?.status === 'open' && (
            <Button
              title="Complete"
              variant="secondary"
              onPress={async () => {
                await completeTask(existing.id);
                navigation.goBack();
              }}
              style={{ flex: 1 }}
            />
          )}
        </View>
        {existing && <Button title="Delete task" variant="danger" onPress={confirmDelete} />}
      </ScrollView>

      {picker && (
        <DateTimePicker
          value={new Date(dueAt ?? Date.now() + 3600_000)}
          mode={picker}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selected) => {
            if (event.type === 'dismissed' || !selected) {
              setPicker(null);
              return;
            }
            if (picker === 'date') {
              const base = new Date(dueAt ?? Date.now());
              const next = new Date(selected);
              next.setHours(base.getHours(), base.getMinutes(), 0, 0);
              setDueAt(next.getTime());
              setPicker(Platform.OS === 'android' ? 'time' : null);
            } else {
              setDueAt(selected.getTime());
              setPicker(null);
            }
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  scroll: { padding: space.lg, gap: space.lg, paddingBottom: space.xxl },
  titleInput: {
    ...type.body,
    fontSize: 20,
    fontWeight: '600',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: space.md,
    borderWidth: 1,
    borderColor: colors.rule,
  },
  notesInput: {
    ...type.body,
    minHeight: 80,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: space.md,
    borderWidth: 1,
    borderColor: colors.rule,
    textAlignVertical: 'top',
  },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
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
    minHeight: 38,
  },
  pillActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  pillText: { ...type.bodySoft, fontSize: 13 },
  pillTextActive: { color: '#FFFFFF', fontWeight: '600' },
  dot: { width: 8, height: 8, borderRadius: 4 },
  newTagRow: { marginTop: space.sm },
  newTagInput: {
    ...type.body,
    fontSize: 14,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    height: 40,
    borderWidth: 1,
    borderColor: colors.rule,
  },
  reminderCard: { gap: space.sm },
  hint: { ...type.caption, lineHeight: 17 },
  actions: { flexDirection: 'row', gap: space.md },
});
