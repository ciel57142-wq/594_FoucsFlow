import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { DateKey, Project, Settings, Tag, Task, DEFAULT_SETTINGS } from '../domain/types';
import { dateKey } from '../domain/time';
import { getDb, resetDatabase } from '../db';
import * as taskRepo from '../db/repos/taskRepo';
import { listProjects } from '../db/repos/projectRepo';
import { listTags } from '../db/repos/tagRepo';
import { loadSettings, saveSetting } from '../db/repos/settingsRepo';
import { logEvent } from '../db/repos/eventRepo';
import { Intelligence, IDLE_INTELLIGENCE, rebuildIntelligence } from '../services/intelligence';
import { requestPermissions, syncAllReminders } from '../services/notifications';
import { seedDemoData } from '../services/seed';

interface AppValue {
  ready: boolean;
  busy: boolean;
  settings: Settings;
  tasks: Task[];
  projects: Project[];
  tags: Tag[];
  intelligence: Intelligence;
  today: DateKey;
  /** Ticks every minute so time-of-day scoring stays live without re-querying. */
  now: number;

  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => Promise<void>;
  createTask: (input: taskRepo.TaskInput) => Promise<Task>;
  updateTask: (id: string, patch: Partial<taskRepo.TaskInput>) => Promise<void>;
  completeTask: (id: string, actualMin?: number | null) => Promise<void>;
  reopenTask: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  snoozeTask: (id: string, days?: number) => Promise<void>;
  scheduleTask: (id: string, day: DateKey | null) => Promise<void>;
  reorderTasks: (ids: string[]) => Promise<void>;
  refresh: () => Promise<void>;
  seed: () => Promise<void>;
  reset: () => Promise<void>;
}

const AppContext = createContext<AppValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [intelligence, setIntelligence] = useState<Intelligence>(IDLE_INTELLIGENCE);
  const [now, setNow] = useState(Date.now());
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const load = useCallback(async (nextSettings?: Settings) => {
    const current = nextSettings ?? (await loadSettings());
    const [allTasks, allProjects, allTags] = await Promise.all([
      taskRepo.listAllTasks(),
      listProjects(),
      listTags(),
    ]);
    setSettings(current);
    setTasks(allTasks);
    setProjects(allProjects);
    setTags(allTags);

    const next = await rebuildIntelligence(current);
    setIntelligence(next);
    // Reminders depend on both the version gate and the freshly built profile,
    // so they are re-synced on every reload rather than only when a task changes.
    void syncAllReminders(allTasks, current, next.profile).catch(() => undefined);
  }, []);

  useEffect(() => {
    (async () => {
      await getDb();
      await load();
      await logEvent('app_opened');
      void requestPermissions();
      setReady(true);
    })();
  }, [load]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60_000);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') setNow(Date.now());
    });
    return () => {
      clearInterval(timer);
      sub.remove();
    };
  }, []);

  const withRefresh = useCallback(
    async (action: () => Promise<void>) => {
      setBusy(true);
      try {
        await action();
        await load(settingsRef.current);
      } finally {
        setBusy(false);
      }
    },
    [load],
  );

  const value = useMemo<AppValue>(
    () => ({
      ready,
      busy,
      settings,
      tasks,
      projects,
      tags,
      intelligence,
      today: dateKey(now),
      now,

      updateSetting: async (key, val) => {
        await saveSetting(key, val);
        const next = { ...settingsRef.current, [key]: val };
        settingsRef.current = next;
        await load(next);
      },
      createTask: async (input) => {
        const task = await taskRepo.createTask(input);
        await load(settingsRef.current);
        return task;
      },
      updateTask: (id, patch) => withRefresh(() => taskRepo.updateTask(id, patch)),
      completeTask: (id, actualMin) => withRefresh(() => taskRepo.completeTask(id, actualMin)),
      reopenTask: (id) => withRefresh(() => taskRepo.reopenTask(id)),
      deleteTask: (id) => withRefresh(() => taskRepo.deleteTask(id)),
      snoozeTask: (id, days = 1) => withRefresh(() => taskRepo.snoozeTask(id, days)),
      scheduleTask: (id, day) => withRefresh(() => taskRepo.scheduleTask(id, day)),
      reorderTasks: (ids) => withRefresh(() => taskRepo.reorderTasks(ids)),
      refresh: () => load(settingsRef.current),
      seed: () =>
        withRefresh(async () => {
          await seedDemoData();
        }),
      reset: () => withRefresh(resetDatabase),
    }),
    [ready, busy, settings, tasks, projects, tags, intelligence, now, load, withRefresh],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
