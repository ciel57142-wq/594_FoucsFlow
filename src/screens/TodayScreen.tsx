import React, { useCallback, useState } from "react";
import { View, Text, FlatList, StyleSheet, Pressable } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { getTodayTasks, completeTask, snoozeTask } from "@/db/taskRepository";
import { Task } from "@/types";

/**
 * Section 2.2: the Today view. Manual ordering only in V1 -- V2 replaces
 * the plain `order` sort with a suggested order plus a "Why this?" panel,
 * without changing this screen's data contract (still just an ordered
 * Task[]), so the swap is additive rather than a rewrite.
 */
export default function TodayScreen({ navigation }: any) {
  const [tasks, setTasks] = useState<Task[]>([]);

  const load = useCallback(async () => {
    const todayIso = new Date().toISOString().slice(0, 10);
    setTasks(await getTodayTasks(todayIso));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const totalCommittedMinutes = tasks.reduce(
    (sum, t) => sum + (t.estimatedDurationMinutes ?? 0),
    0
  );

  const handleComplete = async (task: Task) => {
    await completeTask(task.id, task.estimatedDurationMinutes ?? 0);
    load();
  };

  const handleSnooze = async (task: Task) => {
    await snoozeTask(task.id);
    load();
  };

  return (
    <View style={styles.container}>
      <View style={styles.summaryBar}>
        <Text style={styles.summaryText}>
          {tasks.length} tasks · {totalCommittedMinutes} min committed today
        </Text>
        {totalCommittedMinutes > 6 * 60 && (
          <Text style={styles.warning}>You may be overcommitted</Text>
        )}
      </View>

      <FlatList
        data={tasks}
        keyExtractor={(t) => String(t.id)}
        renderItem={({ item }) => (
          <View style={styles.taskRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.taskTitle}>{item.title}</Text>
              {item.estimatedDurationMinutes != null && (
                <Text style={styles.taskMeta}>{item.estimatedDurationMinutes} min</Text>
              )}
            </View>
            <Pressable onPress={() => handleSnooze(item)} style={styles.actionBtn}>
              <Text>Snooze</Text>
            </Pressable>
            <Pressable onPress={() => handleComplete(item)} style={styles.actionBtn}>
              <Text>Done</Text>
            </Pressable>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Nothing scheduled. Capture a task.</Text>}
      />

      <Pressable style={styles.fab} onPress={() => navigation.navigate("Capture")}>
        <Text style={styles.fabText}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  summaryBar: { padding: 16, borderBottomWidth: 1, borderColor: "#eee" },
  summaryText: { fontSize: 14, color: "#555" },
  warning: { fontSize: 13, color: "#B3261E", marginTop: 4 },
  taskRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderColor: "#f0f0f0",
    gap: 8,
  },
  taskTitle: { fontSize: 16 },
  taskMeta: { fontSize: 12, color: "#888", marginTop: 2 },
  actionBtn: { paddingHorizontal: 10, paddingVertical: 6 },
  empty: { textAlign: "center", marginTop: 40, color: "#999" },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#1E1B2E",
    alignItems: "center",
    justifyContent: "center",
  },
  fabText: { color: "#fff", fontSize: 28, lineHeight: 30 },
});
