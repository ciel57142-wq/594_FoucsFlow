export type UUID = string;

/** 0 = none, 1 = low, 2 = medium, 3 = high. */
export type Priority = 0 | 1 | 2 | 3;

export type TaskStatus = 'open' | 'done';

/** Local calendar date, 'YYYY-MM-DD'. */
export type DateKey = string;

export interface Project {
  id: UUID;
  name: string;
  color: string;
  archived: boolean;
  createdAt: number;
}

export interface Tag {
  id: UUID;
  name: string;
}

export interface Task {
  id: UUID;
  title: string;
  notes: string | null;
  projectId: UUID | null;
  priority: Priority;
  /** Minutes the user expects the task to take. */
  estimateMin: number;
  /** Epoch ms, or null for "no due date". */
  dueAt: number | null;
  /** The day the user has pulled this task onto, or null if it lives in the backlog. */
  scheduledFor: DateKey | null;
  status: TaskStatus;
  /** Position in the manual Today ordering (Version 1 behaviour). */
  manualOrder: number;
  /** How many times the task has been snoozed or pushed to another day. */
  deferralCount: number;
  /** Minutes the task actually took, recorded at completion. */
  actualMin: number | null;
  completedAt: number | null;
  createdAt: number;
  updatedAt: number;
  tags: string[];
  reminderOffsetMin: number | null;
}

/** Row written to the event log every time the user acts on a task. */
export type EventType =
  | 'created'
  | 'scheduled'
  | 'completed'
  | 'reopened'
  | 'snoozed'
  | 'rescheduled'
  | 'edited'
  | 'deleted'
  | 'notification_fired'
  | 'notification_engaged'
  | 'app_opened';

export interface TaskEvent {
  id: number;
  taskId: UUID | null;
  type: EventType;
  payload: Record<string, unknown> | null;
  createdAt: number;
}

/** One finished task, flattened for the learning layer. */
export interface CompletionRecord {
  taskId: UUID;
  tags: string[];
  projectId: UUID | null;
  estimateMin: number;
  actualMin: number | null;
  completedAt: number;
  deferralCount: number;
  dueAt: number | null;
}

/**
 * One past day where a task was on the plan. This is the labelled data the
 * Version 2 model trains on: was the task on today's list actually finished
 * that day?
 */
export interface DayAttempt {
  taskId: UUID;
  scheduledFor: DateKey;
  /** The moment we pretend to be standing at when re-deriving signals (09:00 local). */
  evaluatedAt: number;
  tags: string[];
  priority: Priority;
  estimateMin: number;
  dueAt: number | null;
  deferralCount: number;
  /** Total estimated minutes on that day's plan, used for the load signal. */
  dayLoadMin: number;
  completed: boolean;
}

export interface Settings {
  /** Version gate: 1 = deterministic manager, 2 = predictive layer on. */
  appVersion: 1 | 2;
  /** Minutes of focused work the user expects to have on a normal day. */
  dailyCapacityMin: number;
  /** Version 1 reminder offset, in minutes before the due time. */
  defaultReminderOffsetMin: number;
  quietStartHour: number;
  quietEndHour: number;
  notificationsEnabled: boolean;
  /** Optional stretch goal, off by default. */
  weeklySummaryEnabled: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  appVersion: 1,
  dailyCapacityMin: 240,
  defaultReminderOffsetMin: 30,
  quietStartHour: 22,
  quietEndHour: 7,
  notificationsEnabled: true,
  weeklySummaryEnabled: false,
};
