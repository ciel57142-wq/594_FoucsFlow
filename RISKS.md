# Risk Register

Tracks the risks identified in the project proposal (§5.1), with status
updates. Reference the relevant risk in PR descriptions when a change
addresses one.

| Risk | Type | Mitigation | Status |
|---|---|---|---|
| Scope creep | General | Version plan is the contract; new ideas go to a backlog, not added mid-version | Open |
| Mobile platform variance (notifications/SQLite across Android versions) | General | Target a single minimum API level (24); test on one physical device + one emulator | Open |
| Data model lock-in | V1-specific | V1 schema (`src/db/database.ts`) already includes `actual_duration_minutes`, `deferral_count`, `completion_log.time_of_day` so V2 doesn't require a migration | Mitigated in skeleton — verify against real V2 feature list before V1 freeze |
| Cold-start and overfitting | V2-specific | Explicit fallback to default rules below N completed tasks; regularized scoring instead of aggressive personalization | Not started (V2 work) |

## Notes

- The `completion_log` table is append-only by convention (no UPDATE
  statements target it in the repository layer) so it stays a reliable
  training set for V2 even as `tasks` rows are edited or deleted.
- Review this file before tagging `v1.0.0` to confirm the schema still
  covers everything Version 2 needs.
