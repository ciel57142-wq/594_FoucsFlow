import React, { useState } from "react";
import { View, TextInput, StyleSheet, Text, Pressable } from "react-native";
import { createTask } from "@/db/taskRepository";
import { Priority } from "@/types";

/**
 * Section 2.1: capture is optimized for two taps from the home screen --
 * title + Save is the minimum path. Notes/duration/priority/due date are
 * present but collapsed/optional so they never block a fast capture.
 */
export default function CaptureTaskScreen({ navigation }: any) {
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [estimatedMinutes, setEstimatedMinutes] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");

  const handleSave = async () => {
    if (!title.trim()) return;
    await createTask({
      title: title.trim(),
      notes: notes.trim() || undefined,
      estimatedDurationMinutes: estimatedMinutes ? Number(estimatedMinutes) : undefined,
      priority,
    });
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.titleInput}
        placeholder="What do you need to do?"
        value={title}
        onChangeText={setTitle}
        autoFocus
        returnKeyType="done"
        onSubmitEditing={handleSave}
      />

      {/* Optional fields -- never required for the two-tap path */}
      <TextInput
        style={styles.input}
        placeholder="Notes (optional)"
        value={notes}
        onChangeText={setNotes}
      />
      <TextInput
        style={styles.input}
        placeholder="Estimated minutes (optional)"
        value={estimatedMinutes}
        onChangeText={setEstimatedMinutes}
        keyboardType="number-pad"
      />

      <View style={styles.priorityRow}>
        {(["low", "medium", "high"] as Priority[]).map((p) => (
          <Pressable
            key={p}
            onPress={() => setPriority(p)}
            style={[styles.priorityPill, priority === p && styles.priorityPillActive]}
          >
            <Text style={priority === p ? styles.priorityTextActive : styles.priorityText}>
              {p}
            </Text>
          </Pressable>
        ))}
      </View>

      <Pressable style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, gap: 12 },
  titleInput: { fontSize: 20, borderBottomWidth: 1, borderColor: "#ccc", paddingVertical: 8 },
  input: { fontSize: 16, borderBottomWidth: 1, borderColor: "#eee", paddingVertical: 6 },
  priorityRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  priorityPill: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  priorityPillActive: { backgroundColor: "#1E1B2E", borderColor: "#1E1B2E" },
  priorityText: { color: "#333" },
  priorityTextActive: { color: "#fff" },
  saveButton: {
    marginTop: 20,
    backgroundColor: "#1E1B2E",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  saveButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
