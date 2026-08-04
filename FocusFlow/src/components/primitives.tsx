import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, radius, space, type } from '../theme';

export function SectionLabel({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return (
    <View style={[styles.sectionLabelWrap, style]}>
      <Text style={type.sectionLabel}>{children}</Text>
      <View style={styles.rule} />
    </View>
  );
}

export function Chip({
  label,
  tone = 'neutral',
  small = false,
}: {
  label: string;
  tone?: 'neutral' | 'pine' | 'clay' | 'mustard' | 'slate';
  small?: boolean;
}) {
  const palette = {
    neutral: { bg: colors.paper, fg: colors.inkSoft },
    pine: { bg: colors.pineSoft, fg: colors.pine },
    clay: { bg: colors.claySoft, fg: colors.clay },
    mustard: { bg: colors.mustardSoft, fg: colors.mustard },
    slate: { bg: colors.slateSoft, fg: colors.slate },
  }[tone];
  return (
    <View style={[styles.chip, { backgroundColor: palette.bg }, small && styles.chipSmall]}>
      <Text style={[styles.chipText, { color: palette.fg }, small && { fontSize: 10 }]}>{label}</Text>
    </View>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled,
  style,
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  disabled?: boolean;
  style?: ViewStyle;
}) {
  const palette = {
    primary: { bg: colors.pine, fg: '#FFFFFF', border: colors.pine },
    secondary: { bg: colors.card, fg: colors.ink, border: colors.rule },
    danger: { bg: colors.card, fg: colors.clay, border: colors.claySoft },
    ghost: { bg: 'transparent', fg: colors.pine, border: 'transparent' },
  }[variant];
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: palette.bg, borderColor: palette.border, opacity: disabled ? 0.4 : pressed ? 0.7 : 1 },
        style,
      ]}
    >
      <Text style={[styles.buttonText, { color: palette.fg }]}>{title}</Text>
    </Pressable>
  );
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyBody}>{body}</Text>
      {action}
    </View>
  );
}

/** Horizontal bars for the statistics screen. Values are absolute; the tallest fills. */
export function Bars({
  data,
  color = colors.pine,
  height = 84,
}: {
  data: { label: string; value: number; highlight?: boolean }[];
  color?: string;
  height?: number;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <View style={[styles.bars, { height }]}>
      {data.map((d, i) => (
        <View key={`${d.label}-${i}`} style={styles.barColumn}>
          <View style={styles.barTrack}>
            <View
              style={[
                styles.barFill,
                {
                  height: `${Math.max(2, (d.value / max) * 100)}%`,
                  backgroundColor: d.highlight ? colors.clay : color,
                },
              ]}
            />
          </View>
          <Text style={styles.barLabel} numberOfLines={1}>
            {d.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionLabelWrap: { flexDirection: 'row', alignItems: 'center', gap: space.md, marginBottom: space.sm },
  rule: { flex: 1, height: 1, backgroundColor: colors.rule },
  chip: {
    paddingHorizontal: space.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  chipSmall: { paddingHorizontal: 6, paddingVertical: 2 },
  chipText: { fontSize: 11, fontWeight: '600' },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: space.lg,
    borderWidth: 1,
    borderColor: colors.rule,
  },
  button: {
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  buttonText: { fontSize: 15, fontWeight: '600' },
  empty: { alignItems: 'center', paddingVertical: space.xxl, paddingHorizontal: space.xl, gap: space.sm },
  emptyTitle: { ...type.body, fontWeight: '700' },
  emptyBody: { ...type.bodySoft, textAlign: 'center' },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
  barColumn: { flex: 1, alignItems: 'center', height: '100%' },
  barTrack: { flex: 1, width: '100%', justifyContent: 'flex-end', backgroundColor: colors.paper, borderRadius: 3 },
  barFill: { width: '100%', borderRadius: 3 },
  barLabel: { ...type.figureSmall, marginTop: 4, fontSize: 9 },
});
