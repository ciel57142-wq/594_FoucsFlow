import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../state/AppContext';
import { Button, Card, SectionLabel } from '../components/primitives';
import { Segmented, Stepper } from '../components/controls';
import { requestPermissions } from '../services/notifications';
import { createProject } from '../db/repos/projectRepo';
import { formatHour, formatMinutes } from '../domain/time';
import { colors, space, type } from '../theme';

export function SettingsScreen() {
  const { settings, updateSetting, projects, intelligence, seed, reset, refresh, busy } = useApp();
  const [working, setWorking] = useState(false);

  const confirm = (title: string, message: string, action: () => Promise<void>) => {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Continue',
        style: 'destructive',
        onPress: async () => {
          setWorking(true);
          try {
            await action();
          } finally {
            setWorking(false);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={type.screenTitle}>Settings</Text>

        <Card>
          <Segmented
            label="Version"
            value={settings.appVersion}
            onChange={(v) => void updateSetting('appVersion', v as 1 | 2)}
            options={[
              { label: 'Version 1', value: 1 },
              { label: 'Version 2', value: 2 },
            ]}
          />
          <Text style={styles.hint}>
            {settings.appVersion === 1
              ? 'Version 1: you order Today yourself, reminders fire a fixed number of minutes before the due time, and statistics only describe what happened.'
              : 'Version 2: Today is ordered by the recommender with a completion likelihood on every task, overcommitted days are flagged, and reminders move to the hours you actually work.'}
          </Text>
          {settings.appVersion === 2 && intelligence.profile.coldStart && (
            <Text style={styles.warning}>
              Cold start: fewer than 12 completed tasks, so the app is still using default rules. Load the demo
              dataset below to see the trained behaviour.
            </Text>
          )}
        </Card>

        <Card>
          <Stepper
            label="Focus time per day"
            value={settings.dailyCapacityMin}
            step={30}
            min={30}
            max={720}
            onChange={(v) => void updateSetting('dailyCapacityMin', v)}
          />
          <Text style={styles.hint}>
            The line on the Today meter. Currently {formatMinutes(settings.dailyCapacityMin)}.
          </Text>
        </Card>

        <Card>
          <SectionLabel>Reminders</SectionLabel>
          <View style={styles.switchRow}>
            <Text style={type.body}>Send reminders</Text>
            <Switch
              value={settings.notificationsEnabled}
              onValueChange={async (value) => {
                if (value) await requestPermissions();
                await updateSetting('notificationsEnabled', value);
              }}
              trackColor={{ true: colors.pine, false: colors.rule }}
            />
          </View>
          <Stepper
            label="Default offset before due"
            value={settings.defaultReminderOffsetMin}
            step={15}
            min={0}
            max={720}
            onChange={(v) => void updateSetting('defaultReminderOffsetMin', v)}
          />
          <Text style={styles.hint}>
            {settings.appVersion === 2
              ? 'Used as the fallback while there is not enough history to place a reminder adaptively.'
              : 'Every reminder fires this far before the due time.'}
          </Text>
          <View style={styles.quietRow}>
            <Stepper
              label="Quiet from"
              value={settings.quietStartHour}
              step={1}
              min={0}
              max={23}
              suffix=":00"
              onChange={(v) => void updateSetting('quietStartHour', v)}
            />
            <Stepper
              label="Quiet until"
              value={settings.quietEndHour}
              step={1}
              min={0}
              max={23}
              suffix=":00"
              onChange={(v) => void updateSetting('quietEndHour', v)}
            />
          </View>
          <Text style={styles.hint}>
            No reminder fires between {formatHour(settings.quietStartHour)} and {formatHour(settings.quietEndHour)}.
          </Text>
        </Card>

        <Card>
          <SectionLabel>Projects</SectionLabel>
          {projects.length === 0 ? (
            <Text style={styles.hint}>No projects yet.</Text>
          ) : (
            projects.map((p) => (
              <View key={p.id} style={styles.projectRow}>
                <View style={[styles.dot, { backgroundColor: p.color }]} />
                <Text style={type.body}>{p.name}</Text>
              </View>
            ))
          )}
          <Button
            title="Add a project"
            variant="secondary"
            onPress={() =>
              Alert.prompt
                ? Alert.prompt('New project', 'Name it', async (name) => {
                    if (name?.trim()) {
                      await createProject(name);
                      await refresh();
                    }
                  })
                : Alert.alert('Add a project', 'Project creation from this screen needs iOS prompt support.')
            }
          />
        </Card>

        <Card>
          <SectionLabel>Data</SectionLabel>
          <Text style={styles.hint}>
            The demo dataset is 60 days of seeded history with known habits — the same fixture the system tests
            run against.
          </Text>
          <Button
            title="Load the demo dataset"
            variant="secondary"
            onPress={() => confirm('Load demo data?', 'This adds 60 days of generated history.', seed)}
          />
          <Button
            title="Delete everything"
            variant="danger"
            onPress={() => confirm('Delete all data?', 'Tasks, history and the trained model are removed. This cannot be undone.', reset)}
          />
        </Card>

        <Text style={styles.footer}>
          FocusFlow {settings.appVersion === 2 ? '2.0.0' : '1.0.0'} · CISC 594{'\n'}
          All data stays on this device.
        </Text>
        {(busy || working) && <Text style={styles.hint}>Working…</Text>}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  scroll: { padding: space.lg, gap: space.lg, paddingBottom: space.xxl },
  hint: { ...type.bodySoft, lineHeight: 20, marginTop: space.sm },
  warning: {
    ...type.bodySoft,
    backgroundColor: colors.mustardSoft,
    padding: space.md,
    borderRadius: 8,
    marginTop: space.md,
    lineHeight: 20,
  },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.md },
  quietRow: { flexDirection: 'row', gap: space.lg, marginTop: space.md },
  projectRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: 6 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  footer: { ...type.caption, textAlign: 'center', lineHeight: 18 },
});
