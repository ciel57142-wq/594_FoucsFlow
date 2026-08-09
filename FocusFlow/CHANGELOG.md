# Changelog

User-visible changes, newest first. Format follows Keep a Changelog; versions match the
project's two planned releases.

## [2.1.0] — CI, testing, and traceability hardening

### Added
- A hardened CI pipeline with commitlint range support for both push and pull_request events,
  npm audit checks, concurrency control, and coverage artifact publishing.
- Dependabot configuration for automated npm dependency updates.
- Traceability documentation, stable requirement IDs, and test coverage for schema migration,
  signals, and time utilities.
- Root `.gitignore` cleanup to remove committed log artifacts and keep the repository clean.

### Changed
- Updated repo release metadata and release-ready version bump to 2.1.0.

## [2.0.0] — Predictive scheduling layer

### Added
- Today is ordered by a recommendation score instead of manual position, with a "Start here"
  card naming the single next task.
- A completion likelihood on every planned task, from a logistic model trained on your own
  completion log.
- **Why this?** panel showing each signal's contribution to the score, its raw value and its
  weight, plus the plain-language reason behind it.
- Overcommitment warning: the day meter now also shows the plan at your real pace, and Today
  lists the tasks least likely to happen.
- Adaptive reminder timing — notifications move to the hours you historically finish tasks
  with those tags, instead of a fixed offset.
- Ranking weights tuned against your own history, with shrinkage toward the defaults.
- Statistics gained a model panel: training size, accuracy, and a calibration table.
- Explicit cold-start handling: default rules below 12 completions, predictions blended
  toward the base rate below 20 planned days, both stated in the interface.

### Changed
- The reminder offset control now reads as a fallback, used only while history is thin.

### Notes
- No schema migration was needed for any of the above. Migration 2 adds one cache table for
  the trained model; every input existed in Version 1.

## [1.0.0] — Deterministic task manager

### Added
- Task capture with title, notes, project, tags, priority, estimate and due date; two taps
  from the Today screen via the quick-add bar.
- Projects and free-form tags, with filtering across the backlog.
- Today view with manual ordering, complete, snooze, reschedule and quick edit.
- Running total of committed minutes against a configurable daily capacity.
- Completion history: every finished task records actual duration, original estimate and
  time of day.
- Descriptive statistics: weekly completion rate, estimate accuracy, busiest hours,
  neglected tags, current streak.
- Local notifications at a fixed offset before the due time, per task or per default, with
  quiet hours.
- Seeded demo dataset for demos and system testing.
- Fully offline: SQLite on device, no account, no network calls.
