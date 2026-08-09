# FocusFlow Product Requirements Document

## Cover Page

- Project Name: FocusFlow
- Student(s): To Be Completed
- Course: CISC 594
- Semester: Summer 2026
- Repository URL: https://github.com/ciel57142-wq/594_FoucsFlow.git
- Current Branch: main
- Current Commit SHA: 7115fd5596c05028630f452e6b1b791bd4f05bf3
- Current Release Version: 1.0.0
- Document Version: 0.1.0
- Last Updated: 2026-07-31

---

## Revision History

| Version | Date | Git Commit | Description | Author |
|---|---|---|---|---|
| 0.1.0 | 2026-07-31 | 7115fd5596c05028630f452e6b1b791bd4f05bf3 | Initial PRD draft based on the current FocusFlow V1 implementation and repository structure | GitHub Copilot |

---

## Table of Contents

1. [Product Vision](#1-product-vision)
2. [Product Scope](#2-product-scope)
3. [Software Capabilities](#3-software-capabilities)
   - [3.1 Level-1 Capabilities](#31-level-1-capabilities)
   - [3.2 Level-2 Capabilities](#32-level-2-capabilities)
4. [Undesirable Events](#4-undesirable-events)
5. [Risk Analysis](#5-risk-analysis)
6. [Risk Prioritization](#6-risk-prioritization)
7. [Risk Mitigation](#7-risk-mitigation)

---

# 1. Product Vision

## Problem Statement

People often struggle to capture tasks quickly, plan the day around a realistic workload, and learn from past completion behavior. FocusFlow addresses this by providing a lightweight mobile task manager that supports fast capture, daily planning, completion tracking, and basic progress insights.

## Intended Users

- Students managing classes, projects, and recurring responsibilities
- Professionals balancing work items and personal commitments
- Anyone who wants a simple, low-friction planning tool on a mobile device

## Stakeholders

- End users of the mobile app
- Course instructor and project reviewers
- Repository maintainers and future contributors
- The development team implementing Version 1 and Version 2 features

## Product Goals

- Make task capture feel effortless and fast
- Help users focus on the most relevant tasks for the day
- Provide lightweight feedback about completion behavior and workload balance
- Create a data foundation that enables predictive scheduling in a future release

## Major Features

- Two-tap task capture with optional notes and duration estimates
- Today view for pending tasks with manual ordering in Version 1
- Completion tracking and basic weekly statistics
- Local reminders for due tasks
- Local persistence using SQLite so the app remains usable offline

## Planned Software Versions

- Version 1.0.0: Deterministic task manager with capture, planning, completion history, and fixed-offset reminders
- Version 2.0.0: Predictive scheduling layer with recommendation scoring, adaptive reminders, and explanation-based suggestions

---

# 2. Product Scope

## Included Functionality

- Create tasks with a required title and optional notes, duration estimate, priority, and due date
- View tasks scheduled for today or overdue
- Complete or snooze tasks
- Reorder tasks manually in the Today view
- Review weekly completion rate, estimate accuracy, and neglected tags
- Schedule local reminders for tasks with due dates
- Store data locally on the device using SQLite

## Excluded Functionality

- Cloud sync or multi-device synchronization
- Collaborative task sharing
- Advanced predictive scheduling in Version 1
- AI-generated explanations or recommendation rationale in Version 1
- Cross-platform desktop/web clients

## Future Enhancements

- Adaptive reminder timing based on historical user behavior
- Recommendation engine for next-best task selection
- Overcommitment warnings and dynamic scheduling suggestions
- Improved task analytics and trend visualization
- Optional export/import of task data

---

# 3. Software Capabilities

Each capability is assigned a stable requirement ID. Functional requirements are FR-1 through FR-7, with sub-capabilities as FR-1.1, FR-1.2, etc. The schema evolution capability is a nonfunctional requirement.

## 3.1 Level-1 Capabilities

1. FR-1 Capture Tasks
2. FR-2 Organize Task Work
3. FR-3 Plan Today
4. FR-4 Complete Tasks
5. FR-5 Monitor Progress
6. FR-6 Schedule Reminders
7. FR-7 Preserve Task Data

## 3.2 Level-2 Capabilities

### FR-1 Capture Tasks

FR-1.1 Create Task

FR-1.2 Add Task Metadata

### FR-2 Organize Task Work

FR-2.1 Assign Priority

FR-2.2 Link Task to Project or Tags

### FR-3 Plan Today

FR-3.1 View Due Tasks

FR-3.2 Reorder Tasks

### FR-4 Complete Tasks

FR-4.1 Mark Task Completed

FR-4.2 Record Actual Duration

### FR-5 Monitor Progress

FR-5.1 Review Weekly Statistics

FR-5.2 Identify Neglected Tags

### FR-6 Schedule Reminders

FR-6.1 Create Reminder Rule

FR-6.2 Cancel Reminder

### FR-7 Preserve Task Data

FR-7.1 Persist Data Locally

NFR-1 Support Schema Evolution

---

# 4. Undesirable Events

| UE ID | Level-2 Capability | Undesirable Event |
|---|---|---|
| UE-1.1-01 | Create Task | A blank or duplicate task is created because the fast-capture path is too permissive |
| UE-1.2-01 | Add Task Metadata | Notes, duration, or priority are entered incorrectly and become hard to correct |
| UE-2.1-01 | Assign Priority | A task is assigned the wrong priority and appears in the wrong order |
| UE-2.2-01 | Link Task to Project or Tags | A task is linked to the wrong project or tag, reducing organization quality |
| UE-3.1-01 | View Due Tasks | Overdue or due-today tasks are not visible, causing missed planning actions |
| UE-3.2-01 | Reorder Tasks | An accidental reorder disrupts the intended daily plan |
| UE-4.1-01 | Mark Task Completed | A task is marked complete without recording the completion outcome properly |
| UE-4.2-01 | Record Actual Duration | Actual duration is recorded inaccurately, which weakens estimate accuracy metrics |
| UE-5.1-01 | Review Weekly Statistics | Weekly stats are calculated incorrectly and misrepresent the user’s progress |
| UE-5.2-01 | Identify Neglected Tags | Neglected tags are missed, so the user does not receive useful feedback |
| UE-6.1-01 | Create Reminder Rule | A reminder is scheduled at the wrong time and does not help the user |
| UE-6.2-01 | Cancel Reminder | A reminder cannot be canceled and continues to interrupt the user |
| UE-7.1-01 | Persist Data Locally | Local database failure causes loss of task data or app instability |
| UE-7.2-01 | Support Schema Evolution | A schema change breaks existing records or prevents the app from opening correctly |

---

# 5. Risk Analysis

| UE ID | Risk Statement | Likelihood | Impact | Risk Score |
|---|---|---:|---:|---:|
| UE-1.1-01 | An invalid or duplicate task entry could clutter the task list and reduce user trust in the capture flow | 3 | 3 | 9 |
| UE-1.2-01 | Incorrect metadata could cause poor planning decisions and reduce the usefulness of task records | 3 | 3 | 9 |
| UE-2.1-01 | Misclassified priority could cause important work to be buried beneath lower-value tasks | 3 | 4 | 12 |
| UE-2.2-01 | Incorrect project or tag assignments could make task organization unreliable | 2 | 3 | 6 |
| UE-3.1-01 | Missing or hidden due tasks could cause the user to overlook commitments and fall behind | 3 | 4 | 12 |
| UE-3.2-01 | Accidental reorder could disrupt a carefully planned day and increase cognitive load | 2 | 3 | 6 |
| UE-4.1-01 | Incomplete completion tracking could undermine the history needed for future planning | 2 | 4 | 8 |
| UE-4.2-01 | Inaccurate time tracking could distort estimate accuracy and reduce trust in feedback | 4 | 3 | 12 |
| UE-5.1-01 | Incorrect statistics could mislead the user about progress and undermine adoption | 2 | 3 | 6 |
| UE-5.2-01 | Missing neglected-tag feedback could leave the user unaware of recurring planning problems | 3 | 2 | 6 |
| UE-6.1-01 | A poorly timed reminder could cause missed deadlines or user annoyance | 3 | 4 | 12 |
| UE-6.2-01 | An uncancelable reminder could repeatedly interrupt the user and reduce app satisfaction | 2 | 3 | 6 |
| UE-7.1-01 | Loss of local data could erase the user’s task history and disrupt daily planning | 2 | 5 | 10 |
| UE-7.2-01 | A schema migration issue could make the app unusable until the problem is resolved | 2 | 4 | 8 |

---

# 6. Risk Prioritization

| Priority | UE ID | Risk Score |
|---|---|---:|
| 1 | UE-2.1-01 | 12 |
| 2 | UE-3.1-01 | 12 |
| 3 | UE-4.2-01 | 12 |
| 4 | UE-6.1-01 | 12 |
| 5 | UE-7.1-01 | 10 |
| 6 | UE-1.1-01 | 9 |
| 7 | UE-1.2-01 | 9 |
| 8 | UE-4.1-01 | 8 |
| 9 | UE-7.2-01 | 8 |
| 10 | UE-2.2-01 | 6 |
| 11 | UE-3.2-01 | 6 |
| 12 | UE-5.1-01 | 6 |
| 13 | UE-5.2-01 | 6 |
| 14 | UE-6.2-01 | 6 |

---

# 7. Risk Mitigation

| UE ID | Risk Mitigation Strategy | Mitigation Classification |
|---|---|---|
| UE-1.1-01 | Require a non-empty title before saving and guard against duplicate creation with validation checks | Pure Software |
| UE-1.2-01 | Keep metadata fields optional and make editing straightforward from the task list | Pure Software |
| UE-2.1-01 | Use a small set of explicit priority options and show priority clearly in the Today view | Pure Software |
| UE-2.2-01 | Validate project and tag selections and keep associations simple and visible | Pure Software |
| UE-3.1-01 | Ensure due tasks are included in the Today query and surface overdue status clearly | Pure Software |
| UE-3.2-01 | Require explicit reorder actions and avoid accidental changes from unrelated interactions | Pure Software |
| UE-4.1-01 | Make completion actions atomic and persist completion status and completion log together | Pure Software |
| UE-4.2-01 | Encourage explicit actual-duration input and preserve the estimate-vs-actual data model | Pure Software |
| UE-5.1-01 | Validate query results against the underlying data model and test stats calculations | Pure Software |
| UE-5.2-01 | Surface neglected-tag insights in the stats screen using explicit, tested queries | Pure Software |
| UE-6.1-01 | Use time-based reminder scheduling with a visible due-time calculation and test edge cases | Pure Software |
| UE-6.2-01 | Support explicit cancellation and provide a clear reminder state in the UI | Pure Software |
| UE-7.1-01 | Use transactional database operations, backup-friendly persistence, and graceful error handling | Pure Software |
| UE-7.2-01 | Version the schema and preserve migration-safe column additions for future releases | Pure Software |
