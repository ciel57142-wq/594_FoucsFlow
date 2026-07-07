# FocusFlow

Mobile task manager with predictive scheduling — Android first, built with
React Native (Expo) and a local SQLite database. See
`FocusFlow_Proposal_594.docx` (CISC 594 project proposal) for the full
spec this skeleton implements against.

## Stack

- Expo SDK 51 / React Native 0.74, TypeScript
- `expo-sqlite` for local persistence
- `expo-notifications` for local reminders
- `@react-navigation` (bottom tabs + native stack)

## Structure

```
FocusFlow/
├── App.tsx                       # Entry point: opens DB, requests notif permissions
├── src/
│   ├── types/index.ts            # Task, Project, Tag, CompletionLogEntry, etc.
│   ├── db/
│   │   ├── database.ts           # SQLite connection + schema (V1 + V2-ready columns)
│   │   ├── taskRepository.ts     # CRUD, Today-view query, complete/snooze/reorder
│   │   └── statsRepository.ts    # Weekly completion rate, estimate accuracy, neglected tags
│   ├── notifications/
│   │   └── scheduler.ts          # Fixed-offset local reminders (V1)
│   ├── navigation/
│   │   └── RootNavigator.tsx     # Tabs: Today (+ Capture) / Stats
│   └── screens/
│       ├── CaptureTaskScreen.tsx # Two-tap task capture (2.1)
│       ├── TodayScreen.tsx       # Daily planning view (2.2)
│       └── StatsScreen.tsx       # Completion history & stats (2.3)
├── CHANGELOG.md                  # Per-version user-visible changes (§5.2)
├── RISKS.md                      # Risk register from proposal §5.1
├── app.json / package.json / tsconfig.json / babel.config.js
└── .gitignore
```

## How this maps to the proposal

| Proposal section | Where it lives |
|---|---|
| 2.1 Task Capture and Organization | `CaptureTaskScreen.tsx`, `taskRepository.createTask` |
| 2.2 Daily Planning View | `TodayScreen.tsx`, `taskRepository.getTodayTasks/reorderTask` |
| 2.3 Completion History and Statistics | `StatsScreen.tsx`, `statsRepository.ts`, `completion_log` table |
| 2.4 Reminders and Notifications | `notifications/scheduler.ts` (fixed offset in V1) |
| 2.5 Predictive Scheduling (V2) | Not implemented yet — see seams noted below |
| 5.1 Data model lock-in mitigation | `database.ts` schema already has `actual_duration_minutes`, `deferral_count`, `completion_log.time_of_day` |
| 5.2 Version control | `CHANGELOG.md`, `RISKS.md`; see workflow notes below |

### Where Version 2 plugs in

This skeleton intentionally leaves seams rather than stubbing out V2
logic that doesn't exist yet:

- `scheduleFixedOffsetReminder` in `scheduler.ts` takes an explicit
  `offsetMinutesBeforeDue` — V2 replaces the caller's constant with a
  per-task computed value, no signature change needed.
- `getTodayTasks` returns a plain ordered `Task[]` — V2's recommendation
  engine can replace the `ORDER BY` with a scored ranking without
  changing what `TodayScreen` consumes.
- `completion_log` is already populated by `completeTask` — this is the
  full training set V2's logistic scoring needs from day one.

## Getting started

```bash
npm install
npx expo start --android
```

Requires an Android emulator or physical device with Expo Go / a dev
build. `minSdkVersion` is pinned to 24 per the proposal's platform-variance
mitigation (§5.1).

## Version control workflow (§5.2)

- Trunk-based; `main` is always releasable.
- Feature branches named `v1/<feature>` or `v2/<feature>` (e.g.
  `v2/recommendation-engine`).
- PRs reference the proposal section or risk addressed and include a test
  note; lint + unit tests must pass before merge.
- Each version ends with a tagged release (`v1.0.0`, `v2.0.0`).

## Checking this in

```bash
cd FocusFlow
git init
git add .
git commit -m "Initial FocusFlow skeleton (V1 scaffold)"
```
