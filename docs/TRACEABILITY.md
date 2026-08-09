# Traceability Matrix

This document maps each stable requirement ID from `docs/Product_Requirements_Document.md` to the source specification, associated test coverage, and related risk item.

| Requirement ID | Description | Source | Test Coverage | Risk | Notes |
|---|---|---|---|---|---|
| FR-1 | Capture Tasks | docs/Product_Requirements_Document.md#31-level-1-capabilities | FocusFlow/__tests__/recommender.test.ts, FocusFlow/__tests__/planning.test.ts | R1 | task creation and behavior are validated in task lifecycle and recommendation tests |
| FR-1.1 | Create Task | docs/Product_Requirements_Document.md#31-level-1-capabilities | FocusFlow/__tests__/planning.test.ts | R1 | create-task flow inferred from planning assessments and task lifecycle requirements |
| FR-1.2 | Add Task Metadata | docs/Product_Requirements_Document.md#31-level-1-capabilities | FocusFlow/__tests__/planning.test.ts, FocusFlow/__tests__/profile.test.ts | R1 | metadata affects planning and profile computations |
| FR-2 | Organize Task Work | docs/Product_Requirements_Document.md#32-level-2-capabilities | FocusFlow/__tests__/planning.test.ts, FocusFlow/__tests__/recommender.test.ts | R1 | priority and tags used in recommendations and planning logic |
| FR-2.1 | Assign Priority | docs/Product_Requirements_Document.md#32-level-2-capabilities | FocusFlow/__tests__/recommender.test.ts | R2 | priority ranking assertions verify task ordering |
| FR-2.2 | Link Task to Project or Tags | docs/Product_Requirements_Document.md#32-level-2-capabilities | FocusFlow/__tests__/profile.test.ts, FocusFlow/__tests__/recommender.test.ts, FocusFlow/__tests__/reminders.test.ts | R2 | tags drive profile and reminder logic; project associations are stored in data models |
| FR-3 | Plan Today | docs/Product_Requirements_Document.md#32-level-2-capabilities | FocusFlow/__tests__/planning.test.ts, FocusFlow/__tests__/recommender.test.ts | R1 | planning and recommendation tests validate today's sorting and expected execution |
| FR-3.1 | View Due Tasks | docs/Product_Requirements_Document.md#32-level-2-capabilities | FocusFlow/__tests__/recommender.test.ts, FocusFlow/__tests__/reminders.test.ts | R3 | due-date handling appears in ranking and reminder scheduling |
| FR-3.2 | Reorder Tasks | docs/Product_Requirements_Document.md#32-level-2-capabilities | FocusFlow/__tests__/recommender.test.ts | R3 | manual order tests preserve explicit task ordering |
| FR-4 | Complete Tasks | docs/Product_Requirements_Document.md#32-level-2-capabilities | FocusFlow/__tests__/profile.test.ts, FocusFlow/__tests__/planning.test.ts | R4 | completion and estimate history feed profile and planning outcomes |
| FR-4.1 | Mark Task Completed | docs/Product_Requirements_Document.md#32-level-2-capabilities | FocusFlow/__tests__/profile.test.ts | R4 | completion records drive profile and history analysis |
| FR-4.2 | Record Actual Duration | docs/Product_Requirements_Document.md#32-level-2-capabilities | FocusFlow/__tests__/stats.test.ts, FocusFlow/__tests__/profile.test.ts | R4 | actual duration impacts weekly statistics and estimate adjustment |
| FR-5 | Monitor Progress | docs/Product_Requirements_Document.md#32-level-2-capabilities | FocusFlow/__tests__/stats.test.ts, FocusFlow/__tests__/logistic.test.ts | R5 | statistics and logistic calibration validate progress monitoring
| FR-5.1 | Review Weekly Statistics | docs/Product_Requirements_Document.md#32-level-2-capabilities | FocusFlow/__tests__/stats.test.ts, FocusFlow/__tests__/logistic.test.ts, FocusFlow/__tests__/planning.test.ts | R5 | weekly stats and calibration are covered by stats and logistic tests |
| FR-5.2 | Identify Neglected Tags | docs/Product_Requirements_Document.md#32-level-2-capabilities | FocusFlow/__tests__/profile.test.ts, FocusFlow/__tests__/recommender.test.ts | R5 | neglected tags appear in profile and recommendation reasoning |
| FR-6 | Schedule Reminders | docs/Product_Requirements_Document.md#32-level-2-capabilities | FocusFlow/__tests__/reminders.test.ts | R2 | reminder scheduling logic is covered by static and adaptive reminder tests |
| FR-6.1 | Create Reminder Rule | docs/Product_Requirements_Document.md#32-level-2-capabilities | FocusFlow/__tests__/reminders.test.ts | R2 | fixed and adaptive reminder scheduling assertions validate rule creation |
| FR-6.2 | Cancel Reminder | docs/Product_Requirements_Document.md#32-level-2-capabilities | FocusFlow/__tests__/reminders.test.ts | R2 | reminder cancellation is implied in disabled notifications and done tasks |
| FR-7 | Preserve Task Data | docs/Product_Requirements_Document.md#32-level-2-capabilities | FocusFlow/__tests__/logistic.test.ts | R3 | schema and persistence assumptions are validated by migration-aware logic tests |
| FR-7.1 | Persist Data Locally | docs/Product_Requirements_Document.md#32-level-2-capabilities | FocusFlow/__tests__/logistic.test.ts | R3 | database schema migrations underpin local persistence |
| NFR-1 | Support Schema Evolution | docs/Product_Requirements_Document.md#32-level-2-capabilities | FocusFlow/__tests__/logistic.test.ts, FocusFlow/__tests__/profile.test.ts | R3 | migration definitions and profile compatibility are tested indirectly |
