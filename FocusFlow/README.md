# FocusFlow

A mobile task manager with predictive scheduling. Single user, offline, Android-first.
React Native (Expo) with a local SQLite database.

Built to the CISC 594 project proposal: Version 1 is a deterministic task manager that
produces a clean event log; Version 2 layers ranking, prediction and adaptive reminders on
top of that log without changing the schema.

## Running it

```bash
npm install
npx expo start          # then press 'a' for Android, or scan the QR code
```

Notifications need a development build or a physical device — they do not fire in Expo Go
on Android 13+. Everything else works in Expo Go.

```bash
npx jest -c jest.domain.config.js   # 52 unit tests, no native runtime, ~5s
npm run typecheck
```

**To see Version 2 do anything interesting on a fresh install**, open Settings → Data →
*Load the demo dataset*. That writes 60 days of seeded history with known habits (the same
fixture the tests use), then switch Settings → Version to *Version 2*.

## What the two versions actually do

The version gate is a single setting read in three places. Nothing is stubbed: Version 1 is
a complete product, Version 2 changes decisions.

| | Version 1 | Version 2 |
|---|---|---|
| Today's order | the order you dragged (`manualOrder`) | weighted score over five signals |
| Per task | title, estimate, due | plus completion likelihood and a "Why this?" panel |
| The day | committed minutes vs capacity | plus estimate correction and expected completions |
| Reminders | fixed offset before due | the hour you historically finish tasks with those tags |
| Statistics | descriptive | plus model accuracy and a calibration table |

## Architecture

```
App.tsx  →  navigation.tsx  →  screens/
                                  ↕
                            state/AppContext.tsx        one provider, reload-on-write
                                  ↕
        services/          intelligence · notifications · seed · summary
                                  ↕
        domain/            pure functions, no I/O, no React — this is what the tests cover
                                  ↕
        db/                expo-sqlite + repositories
```

`src/domain` is deliberately free of React and SQLite. Every scoring, prediction, timing and
statistics decision lives there as a pure function over plain data, which is why the test
suite can run the whole intelligent layer against seeded histories in a few seconds without a
simulator.

### The learning pipeline

1. **`day_plans`** records "this task was on the plan for this day" the moment it is planned.
   **`tasks.completed_at` / `actual_min`** record what happened. Both are written by Version 1.
2. **`domain/profile.ts`** turns the completion log into a `HistoryProfile`: hour-of-day
   engagement per tag, estimate bias per tag, base completion rate, neglected tags. Old
   completions decay on a 14-day half-life.
3. **`domain/signals.ts`** turns a task plus that profile into five numbers in 0–1: `due`,
   `timeOfDay`, `priority`, `deferral`, `effort`.
4. **`domain/weights.ts`** correlates each signal against past outcomes and nudges the default
   weights toward the ones that predict *this* user, shrinking toward the defaults on small
   samples.
5. **`domain/recommender.ts`** ranks by the weighted sum. Because the score is a sum, the
   "Why this?" panel is just its terms, sorted — no separate explanation logic to drift.
6. **`domain/logistic.ts`** fits a six-feature logistic regression by regularised SGD on the
   same labelled attempts and returns the completion likelihood shown on each row.
7. **`domain/reminders.ts`** picks the notification time: fixed offset on V1, best engagement
   hour inside the window before the deadline on V2.

Cold start is explicit everywhere: under 12 completed tasks the profile reports
`coldStart`, the weights stay at their defaults, and predictions are blended toward the base
rate until 20 planned days exist. The UI says so rather than showing confident numbers built
on four days of data.

## Design

The visual language is a day ledger: pine and paper, hairline rules, and every number set in
a monospace face because numbers here are entries, not prose. The one loud element is the
capacity meter on Today — a ruler ticked every 30 minutes with a hard capacity line, plus a
dashed second bar in Version 2 showing the same plan at the pace you actually work.

## Repository conventions

- `master` is the trunk branch and the default development branch.
- Changes land through pull requests using `.github/pull_request_template.md`.
- CI must pass before merging to `master`.
- CI verifies `npm run lint`, `npm run typecheck`, and the domain test suite.
- Releases are annotated tags `vMAJOR.MINOR.PATCH` cut from `master` only.
- `main` holds the Version 1 lineage and is retained read-only.

See `../docs/BRANCHING.md`, `../CHANGELOG.md`, `../RISKS.md`, and `../TESTPLAN.md`.
