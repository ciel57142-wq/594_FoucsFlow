/**
 * Core domain types for FocusFlow.
 *
 * Per the proposal's Risk 5.1 ("Data model lock-in"), the V1 schema already
 * captures the fields V2's prediction/recommendation layer will need
 * (actual completion timestamps, deferral count, tag-level accuracy inputs)
 * even though V1 only *displays* this data descriptively.
 */

export type Priority = "low" | "medium" | "high";

export type TaskStatus = "pending" | "completed" | "snoozed";

export interface Project {
  id: number;
  name: string;
  createdAt: string; // ISO timestamp
}

export interface Tag {
  id: number;
  name: string; // e.g. "school", "errands", "deep work"
}

export interface Task {
  id: number;
  title: string;
  notes: string | null;
  estimatedDurationMinutes: number | null;
  priority: Priority;
  dueDate: string | null; // ISO date
  projectId: number | null;
  status: TaskStatus;
  createdAt: string; // ISO timestamp
  scheduledOrder: number | null; // manual ordering in the V1 Today view

  // --- Completion / event-log fields (populated on completion) ---
  completedAt: string | null; // ISO timestamp
  actualDurationMinutes: number | null;

  // --- V2 inputs, captured from day one, unused by V1 UI ---
  deferralCount: number; // times snoozed/rescheduled
}

export interface TaskTag {
  taskId: number;
  tagId: number;
}

/**
 * One row per completed task. Redundant with the completion fields on
 * `Task`, but kept as an explicit append-only event log so historical
 * records survive edits to the task itself -- this is the training input
 * for Version 2's recommendation and prediction models.
 */
export interface CompletionLogEntry {
  id: number;
  taskId: number;
  estimatedDurationMinutes: number | null;
  actualDurationMinutes: number;
  completedAt: string; // ISO timestamp
  timeOfDay: string; // "HH:mm", denormalized for fast stats queries
  tagIds: number[];
}

export interface NotificationRule {
  id: number;
  taskId: number | null; // null => project-level default
  projectId: number | null;
  offsetMinutesBeforeDue: number; // fixed offset in V1
  enabled: boolean;
}

export interface DailyStats {
  date: string; // ISO date
  totalEstimatedMinutes: number;
  tasksScheduled: number;
  tasksCompleted: number;
}
