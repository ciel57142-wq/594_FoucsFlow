import { Priority, Task } from '../src/domain/types';

let counter = 0;

export function makeTask(overrides: Partial<Task> = {}): Task {
  counter += 1;
  const now = overrides.createdAt ?? Date.now();
  return {
    id: overrides.id ?? `task-${counter}`,
    title: `Task ${counter}`,
    notes: null,
    projectId: null,
    priority: 1 as Priority,
    estimateMin: 30,
    dueAt: null,
    scheduledFor: null,
    status: 'open',
    manualOrder: counter,
    deferralCount: 0,
    actualMin: null,
    completedAt: null,
    reminderOffsetMin: null,
    createdAt: now,
    updatedAt: now,
    tags: [],
    ...overrides,
  };
}
