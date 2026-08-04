# System test plan

Two gates. Version 1 must pass §S1–§S5 with defects recorded before any Version 2 work
starts; Version 2 re-runs all of them as regression and adds §S6–§S10.

Fixtures come from `src/domain/synthetic.ts`, which generates history from a fixed seed with
known habits, so "the expected answer" is a real number and not a judgement call. Settings →
Data → *Load the demo dataset* writes the same fixture into SQLite.

Automated coverage lives in `__tests__/` and runs with
`npx jest -c jest.domain.config.js` (52 tests). The scripted passes below are manual, on
device.

---

## Version 1 gate

### S1 — Task lifecycle (CRUD)
1. Create a task with title only → appears in the backlog with a 30-minute default estimate.
2. Edit every field: notes, project, two tags, priority, estimate, due date, planned day.
3. Complete it → moves to Done, records `actual_min` and `completed_at`.
4. Reopen → returns to open, completion fields cleared.
5. Delete → gone from every list, and from statistics.

**Pass:** all five states persist across an app restart.

### S2 — Projects and tags
Assign a project and two tags; filter the backlog by each; delete a project and confirm its
tasks survive with no project.

### S3 — Today view interactions
With five tasks planned: complete one, snooze one to tomorrow (deferral count increments by
one), reschedule one three days out, send one back to the backlog, quick-add one.

**Pass:** the committed-minutes total and task count update immediately after each action.

### S4 — Notifications on a physical device
Set a task due 40 minutes out with a 30-minute offset. Background the app.

**Pass:** the notification fires within a minute of the ten-minute mark; opening it writes a
`notification_engaged` event. Repeat with a reminder that would land inside quiet hours and
confirm it moves to the morning instead.

### S5 — Statistics against the seeded dataset
Load the demo dataset. Compare the Statistics screen against the fixture's known values:
completion rate, estimate ratio, busiest hours.

**Pass:** displayed values match the fixture within rounding.

### S5b — Offline behaviour
Enable airplane mode and repeat S1 and S3.

**Pass:** no error states, no spinners, identical behaviour. The app makes no network calls.

---

## Version 2 gate

All of §S1–§S5b re-run first, unchanged, with Version 2 selected.

### S6 — Recommendation correctness on known answers
Automated: `__tests__/recommender.test.ts`. On a seeded profile the optimal answer is known
by construction, so each case asserts an ordering rather than a snapshot.

- Overdue and high priority outranks distant and low priority.
- A task pushed four times outranks an identical task never pushed.
- With 30 minutes left in the day, a 20-minute task outranks a 240-minute one.
- At 10 AM, deep-work tasks outrank school tasks for a persona who does school work at 9 PM.
- Ordering is deterministic across repeated runs on identical input.

**Manual:** with the demo dataset loaded, confirm the on-device order matches what the same
fixture produces in the test run.

### S7 — Prediction calibration
Automated: `__tests__/logistic.test.ts`. Across 120 seeded days, bucket predictions in fifths
and compare each bucket's mean prediction to its observed completion rate.

**Pass:** weighted calibration error below 0.10, and no bucket with n ≥ 10 off by more than
0.20. Accuracy at least matches the majority-class baseline. Directional checks: a nearer
deadline raises the prediction, a heavier day lowers it.

**Manual:** the calibration table on the Statistics screen shows the same shape.

### S8 — Notification timing under varied usage
Automated: `__tests__/reminders.test.ts` against three personas (evening student, morning
worker, cold-start user).

**Pass:** the chosen hour is within two hours of the persona's true peak for that tag; it
never lands inside quiet hours; it always leaves at least the task's estimated duration
before the deadline; a cold-start profile falls back to the fixed offset and says so.

**Manual:** on device, confirm the reminder line in task detail names the hour and the reason.

### S9 — Explanation accuracy
Automated: contributions sum to the displayed score, and are sorted by contribution.

**Manual:** for three tasks, read the "Why this?" panel and verify each stated reason against
the underlying data — the due date shown matches the task, the deferral count matches the
row, the named hour matches the Statistics screen.

### S10 — Cold start and overfitting guards
1. Reset all data. Create three tasks.
   **Pass:** Version 2 shows the cold-start notice; likelihoods sit near the base rate;
   the "Why this?" panel says default rules are in use.
2. Load the demo dataset.
   **Pass:** the notice disappears, weights report as tuned, adaptive reminders engage.
3. Confirm no weight exceeds 0.45 or falls below 0.05 at any point.

---

## Recording results

For each gate, record per case: pass/fail, defect id, severity, and the build sha. The
Version 2 plan is larger by design — the system now has both deterministic and probabilistic
behaviour to verify, and the probabilistic half needs statistical assertions rather than
equality checks.
