import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, space, type } from '../theme';

export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  label,
}: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (value: T) => void;
  label?: string;
}) {
  return (
    <View style={{ gap: space.sm }}>
      {label && <Text style={type.sectionLabel}>{label}</Text>}
      <View style={styles.segmented}>
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <Pressable
              key={String(opt.value)}
              onPress={() => onChange(opt.value)}
              style={[styles.segment, active && styles.segmentActive]}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{opt.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function Stepper({
  label,
  value,
  step = 15,
  min = 5,
  max = 480,
  suffix = 'm',
  onChange,
}: {
  label: string;
  value: number;
  step?: number;
  min?: number;
  max?: number;
  suffix?: string;
  onChange: (value: number) => void;
}) {
  return (
    <View style={{ gap: space.sm }}>
      <Text style={type.sectionLabel}>{label}</Text>
      <View style={styles.stepper}>
        <Pressable
          onPress={() => onChange(Math.max(min, value - step))}
          style={styles.stepButton}
          accessibilityLabel={`Decrease ${label}`}
        >
          <Text style={styles.stepText}>−</Text>
        </Pressable>
        <Text style={[type.figure, styles.stepValue]}>
          {value}
          {suffix}
        </Text>
        <Pressable
          onPress={() => onChange(Math.min(max, value + step))}
          style={styles.stepButton}
          accessibilityLabel={`Increase ${label}`}
        >
          <Text style={styles.stepText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function TagPicker({
  available,
  selected,
  onToggle,
}: {
  available: string[];
  selected: string[];
  onToggle: (tag: string) => void;
}) {
  const all = Array.from(new Set([...available, ...selected]));
  if (all.length === 0) return null;
  return (
    <View style={styles.tagWrap}>
      {all.map((tag) => {
        const active = selected.includes(tag);
        return (
          <Pressable
            key={tag}
            onPress={() => onToggle(tag)}
            style={[styles.tag, active && styles.tagActive]}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: active }}
          >
            <Text style={[styles.tagText, active && styles.tagTextActive]}>{tag}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  segmented: {
    flexDirection: 'row',
    backgroundColor: colors.paper,
    borderRadius: radius.md,
    padding: 3,
    gap: 3,
  },
  segment: { flex: 1, paddingVertical: space.sm, borderRadius: radius.sm, alignItems: 'center', minHeight: 38, justifyContent: 'center' },
  segmentActive: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.rule },
  segmentText: { ...type.bodySoft, fontWeight: '600', fontSize: 14 },
  segmentTextActive: { color: colors.ink },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  stepButton: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.paper,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: { fontSize: 22, color: colors.ink, lineHeight: 26 },
  stepValue: { minWidth: 64, textAlign: 'center', fontSize: 17 },
  tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  tag: {
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.rule,
  },
  tagActive: { backgroundColor: colors.pineSoft, borderColor: colors.pine },
  tagText: { ...type.bodySoft, fontSize: 13 },
  tagTextActive: { color: colors.pine, fontWeight: '600' },
});
