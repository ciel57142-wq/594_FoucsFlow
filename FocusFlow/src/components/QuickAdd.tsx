import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, radius, space, type } from '../theme';

const ESTIMATES = [15, 30, 45, 60, 90];

/**
 * Two taps to a logged task: type, hit add. The estimate stepper is right there
 * because the whole system is worthless without duration data, but it defaults
 * to 30 minutes so nobody has to touch it.
 */
export function QuickAdd({ onAdd }: { onAdd: (title: string, estimateMin: number) => void }) {
  const [title, setTitle] = useState('');
  const [estimateIndex, setEstimateIndex] = useState(1);

  const submit = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    onAdd(trimmed, ESTIMATES[estimateIndex]);
    setTitle('');
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.wrap}>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Add a task for today"
          placeholderTextColor={colors.inkFaint}
          style={styles.input}
          returnKeyType="done"
          onSubmitEditing={submit}
          accessibilityLabel="New task title"
        />
        <Pressable
          onPress={() => setEstimateIndex((i) => (i + 1) % ESTIMATES.length)}
          style={styles.estimate}
          accessibilityLabel={`Estimate ${ESTIMATES[estimateIndex]} minutes, tap to change`}
        >
          <Text style={type.figure}>{ESTIMATES[estimateIndex]}m</Text>
        </Pressable>
        <Pressable onPress={submit} style={[styles.add, !title.trim() && styles.addDisabled]} accessibilityRole="button">
          <Text style={styles.addText}>Add</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    padding: space.md,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.rule,
  },
  input: {
    flex: 1,
    height: 44,
    paddingHorizontal: space.md,
    backgroundColor: colors.paper,
    borderRadius: radius.md,
    ...type.body,
  },
  estimate: {
    height: 44,
    paddingHorizontal: space.md,
    borderRadius: radius.md,
    backgroundColor: colors.paper,
    alignItems: 'center',
    justifyContent: 'center',
  },
  add: {
    height: 44,
    paddingHorizontal: space.lg,
    borderRadius: radius.md,
    backgroundColor: colors.pine,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addDisabled: { opacity: 0.4 },
  addText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
});
