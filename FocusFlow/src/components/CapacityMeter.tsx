import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { DayAssessment, STATUS_COPY } from '../domain/planning';
import { formatMinutes } from '../domain/time';
import { colors, radius, space, type } from '../theme';

const STATUS_COLOR = {
  light: colors.pine,
  ok: colors.pine,
  tight: colors.mustard,
  over: colors.clay,
} as const;

/**
 * The one loud element in the app: today's plan drawn as a ruler.
 *
 * Ticks are 30 minutes. The solid run is what the user committed to, the hatched
 * run past the capacity line is what will not fit. In Version 2 a second, lighter
 * bar shows the same plan corrected by how long these tasks usually really take.
 */
export function CapacityMeter({ assessment, showAdjusted }: { assessment: DayAssessment; showAdjusted: boolean }) {
  const { committedMin, adjustedMin, capacityMin, status } = assessment;
  const scaleMax = Math.max(capacityMin, adjustedMin, committedMin, 60);
  const pct = (min: number) => `${Math.min(100, (min / scaleMax) * 100)}%`;
  const capacityLeft = `${Math.min(100, (capacityMin / scaleMax) * 100)}%`;
  const ticks = Math.min(16, Math.round(scaleMax / 30));

  return (
    <View style={styles.wrap}>
      <View style={styles.headRow}>
        <Text style={type.sectionLabel}>Today's load</Text>
        <Text style={[styles.status, { color: STATUS_COLOR[status] }]}>{STATUS_COPY[status]}</Text>
      </View>

      <View style={styles.track}>
        {Array.from({ length: ticks }, (_, i) => (
          <View key={i} style={[styles.tick, { left: `${((i + 1) / ticks) * 100}%` }]} />
        ))}
        <View style={[styles.fill, { width: pct(committedMin), backgroundColor: STATUS_COLOR[status] }]} />
        <View style={[styles.capacityLine, { left: capacityLeft }]} />
      </View>

      {showAdjusted && adjustedMin !== committedMin && (
        <View style={[styles.track, styles.trackGhost]}>
          <View style={[styles.fill, styles.fillGhost, { width: pct(adjustedMin), borderColor: STATUS_COLOR[status] }]} />
          <View style={[styles.capacityLine, { left: capacityLeft }]} />
        </View>
      )}

      <View style={styles.legend}>
        <Text style={type.figure}>
          {formatMinutes(committedMin)}
          <Text style={type.figureSmall}> planned</Text>
        </Text>
        {showAdjusted && adjustedMin !== committedMin && (
          <Text style={type.figure}>
            {formatMinutes(adjustedMin)}
            <Text style={type.figureSmall}> your real pace</Text>
          </Text>
        )}
        <Text style={type.figure}>
          {formatMinutes(capacityMin)}
          <Text style={type.figureSmall}> capacity</Text>
        </Text>
      </View>

      <Text style={styles.message}>{assessment.message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.sm },
  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  status: { fontSize: 11, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' },
  track: {
    height: 18,
    backgroundColor: colors.paper,
    borderRadius: radius.sm,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  trackGhost: { height: 10, backgroundColor: 'transparent' },
  tick: { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: colors.rule },
  fill: { position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: radius.sm },
  fillGhost: { backgroundColor: 'transparent', borderWidth: 1.5, borderStyle: 'dashed' },
  capacityLine: { position: 'absolute', top: -2, bottom: -2, width: 2, backgroundColor: colors.ink },
  legend: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: space.sm },
  message: { ...type.bodySoft, lineHeight: 20 },
});
