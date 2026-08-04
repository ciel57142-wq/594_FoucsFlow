# Risks

Status values: **Open**, **Mitigated**, **Closed**. Each risk names where in the code the
mitigation lives, so a reviewer can check the claim.

## R1 — Scope creep (general) — *Mitigated*

Task apps invite endless feature ideas. The version plan is the contract: anything new goes
to the backlog rather than into an in-flight version.

- Mitigation: `CHANGELOG.md` is written per version and reviewed before the version tag.
- Watch for: pull requests that touch both `v1/*` and `v2/*` feature areas.

## R2 — Mobile platform variance (general) — *Mitigated*

Notification delivery and SQLite behaviour differ across Android versions, and exact-alarm
permissions changed in Android 12+.

- Mitigation: `minSdkVersion` pinned to 26 in `app.json`; a single notification channel is
  created explicitly in `services/notifications.ts`; every scheduled reminder is mirrored in
  the `scheduled_notifications` table so the app's view of what is pending never depends on
  the OS.
- Mitigation: quiet hours are enforced in `domain/reminders.ts`, not by the OS.
- Testing: `TESTPLAN.md` §S4 runs on one physical device plus one emulator.
- Residual: Expo Go cannot schedule notifications on Android 13+; system tests use a
  development build.

## R3 — Data model lock-in (Version 1 specific) — *Closed at the v1.0.0 freeze*

If Version 1's schema omitted a signal Version 2 needed, Version 2 would have required a
migration against live user data.

- Mitigation: migration 1 writes `tasks.actual_min`, `tasks.completed_at`,
  `tasks.deferral_count`, the `events` log, and the `day_plans` snapshot table — all five
  inputs the Version 2 model consumes — even though Version 1 only displays them
  descriptively.
- Verification: `db/schema.ts` migration 2 adds one cache table and no columns. Version 2
  shipped without a data migration, which is what closes this risk.

## R4 — Cold start and overfitting (Version 2 specific) — *Mitigated*

Recommendations are poor for new users and a few good days can look like a pattern.

- Mitigation: `COLD_START_MIN_COMPLETIONS = 12` in `domain/profile.ts`. Below it the profile
  reports `coldStart`, hour weights stay flat at 0.5, and estimates are not corrected.
- Mitigation: `MODEL_MIN_SAMPLES = 20` in `domain/logistic.ts`. Below it predictions are
  blended toward the base rate in proportion to how much data exists.
- Mitigation: weight tuning in `domain/weights.ts` shrinks correlations by `n / (n + 20)`,
  caps any single weight at 0.45 and floors it at 0.05, so no signal can take over.
- Mitigation: per-tag estimate ratios shrink toward the global ratio by `n / (n + 5)`.
- Mitigation: L2 regularisation (`l2 = 0.02`) on the logistic fit.
- Tests: `__tests__/logistic.test.ts` asserts the base-rate fallback on a four-day history;
  `__tests__/weights.test.ts` asserts the bounds hold on 90 days.
- Residual: calibration is measured on the training set. A held-out split is backlog work.

## R5 — Explanations drifting from the ranking (Version 2 specific) — *Mitigated*

An explanation feature that is written separately from the scoring will eventually lie.

- Mitigation: the score in `domain/recommender.ts` is the sum of the same `Contribution`
  objects the panel renders — there is no second code path to drift.
- Test: `__tests__/recommender.test.ts` asserts the contributions sum to the score exactly.

## R6 — Notification fatigue from adaptive timing (Version 2 specific) — *Open*

Moving reminders toward high-engagement hours could cluster several reminders into the same
window.

- Current state: each task is scheduled independently; quiet hours and a minimum runway
  before the deadline are enforced, but there is no per-day cap.
- Planned: a spacing rule in `domain/reminders.ts` and a daily maximum in Settings.
