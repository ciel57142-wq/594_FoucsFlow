import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ranked } from '../domain/recommender';
import { colors, radius, space, type } from '../theme';
import { Button } from './primitives';

/**
 * "Why this?" — the score is a weighted sum, so this panel is just the terms of
 * that sum, largest first, with the raw signal beside each one. Nothing here is
 * generated text: every line is read straight off the ranking.
 */
export function WhyPanel({ ranked, onClose }: { ranked: Ranked | null; onClose: () => void }) {
  if (!ranked) return null;
  const total = ranked.score || 1;

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={type.sectionLabel}>Why this is near the top</Text>
        <Text style={styles.title}>{ranked.task.title}</Text>

        <View style={styles.scoreRow}>
          <Text style={type.figureLarge}>{ranked.score.toFixed(2)}</Text>
          <Text style={styles.scoreLabel}>ranking score</Text>
          {ranked.likelihood != null && (
            <>
              <Text style={[type.figureLarge, { marginLeft: space.xl }]}>{Math.round(ranked.likelihood * 100)}%</Text>
              <Text style={styles.scoreLabel}>chance you finish it today</Text>
            </>
          )}
        </View>

        <ScrollView style={styles.list} contentContainerStyle={{ gap: space.md, paddingBottom: space.lg }}>
          {ranked.contributions.map((c) => (
            <View key={c.key} style={styles.item}>
              <View style={styles.itemHead}>
                <Text style={styles.itemLabel}>{c.label}</Text>
                <Text style={type.figureSmall}>
                  {(c.contribution / total * 100).toFixed(0)}% of the score
                </Text>
              </View>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${Math.max(1, (c.contribution / total) * 100)}%` }]} />
              </View>
              <Text style={styles.detail}>{c.detail}</Text>
              <Text style={type.figureSmall}>
                signal {c.value.toFixed(2)} × weight {c.weight.toFixed(2)}
              </Text>
            </View>
          ))}

          {ranked.coldStart && (
            <Text style={styles.coldStart}>
              Still using the default rules. Once you have finished a dozen tasks, these weights start
              shifting toward how you actually work.
            </Text>
          )}
        </ScrollView>

        <Button title="Close" variant="secondary" onPress={onClose} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(22,33,31,0.35)' },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: space.lg,
    gap: space.md,
    maxHeight: '82%',
  },
  handle: { alignSelf: 'center', width: 36, height: 4, borderRadius: 2, backgroundColor: colors.rule },
  title: { ...type.body, fontSize: 18, fontWeight: '700' },
  scoreRow: { flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', gap: space.sm },
  scoreLabel: { ...type.caption, flexShrink: 1 },
  list: { marginTop: space.sm },
  item: { gap: 4 },
  itemHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  itemLabel: { ...type.body, fontWeight: '600', fontSize: 15 },
  barTrack: { height: 6, backgroundColor: colors.paper, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: colors.pine, borderRadius: 3 },
  detail: { ...type.bodySoft },
  coldStart: { ...type.bodySoft, backgroundColor: colors.mustardSoft, padding: space.md, borderRadius: radius.md },
});
