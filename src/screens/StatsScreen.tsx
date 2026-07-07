import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { getWeeklyStats, WeeklyStats } from "@/db/statsRepository";

/**
 * Section 2.3: descriptive statistics only in V1. The same completion_log
 * rows this screen reads from are the training input for Version 2's
 * prediction model -- captured from day one, displayed descriptively here.
 */
export default function StatsScreen() {
  const [stats, setStats] = useState<WeeklyStats | null>(null);

  useFocusEffect(
    useCallback(() => {
      const sevenDaysAgo = new Date(Date.now() - 7 * 86400 * 1000).toISOString();
      getWeeklyStats(sevenDaysAgo).then(setStats);
    }, [])
  );

  if (!stats) {
    return (
      <View style={styles.container}>
        <Text>Loading…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Weekly completion rate</Text>
        <Text style={styles.cardValue}>{Math.round(stats.completionRate * 100)}%</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Estimate accuracy</Text>
        <Text style={styles.cardValue}>{stats.estimateAccuracy.toFixed(2)}×</Text>
        <Text style={styles.cardHint}>1.00× = estimates matched actual time exactly</Text>
      </View>

      <Text style={styles.sectionHeader}>Consistently neglected tags</Text>
      <FlatList
        data={stats.neglectedTags}
        keyExtractor={(t) => t.tagName}
        renderItem={({ item }) => (
          <View style={styles.tagRow}>
            <Text>{item.tagName}</Text>
            <Text style={styles.cardHint}>{item.pendingCount} overdue</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.cardHint}>Nothing neglected. Nice.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, gap: 16 },
  card: { padding: 16, borderRadius: 12, backgroundColor: "#F5F4FA" },
  cardLabel: { fontSize: 13, color: "#666" },
  cardValue: { fontSize: 28, fontWeight: "700", marginTop: 4 },
  cardHint: { fontSize: 12, color: "#999", marginTop: 4 },
  sectionHeader: { fontSize: 15, fontWeight: "600", marginTop: 8 },
  tagRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: "#f0f0f0",
  },
});
