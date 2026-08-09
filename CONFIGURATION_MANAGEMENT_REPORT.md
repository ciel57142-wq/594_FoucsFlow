# Configuration Management Report
## FocusFlow — CISC 594

**Report version:** 1.0
**Report date:** 9 August 2026
**Repository:** `ciel57142-wq/594_FoucsFlow`
**Branch inspected:** `master` (default branch)
**Commit inspected:** `d7e04c4`
**Maintained by:** Senior Software Configuration Manager (course role)

---

## About this report

This is a **living engineering artifact**. It is updated in place each time the repository is reviewed, and it records the repository as it **actually exists**, not as it is intended to exist.

Every claim below is classified:

| Label | Meaning |
|---|---|
| **IMPLEMENTED** | Verified present in the repository during this review |
| **PARTIALLY IMPLEMENTED** | Some supporting evidence exists, but the practice is incomplete or non-functional |
| **NOT IMPLEMENTED** | No repository evidence; recommended or planned only |

Statements made in repository documentation that repository evidence does not support are marked **[UNSUBSTANTIATED]** and are not credited as implemented.

### Note on predecessor documents

This report is the **single canonical CM report** for the project. No file named `CONFIGURATION_MANAGEMENT_REPORT.md` existed prior to this review. Two copies of an earlier assessment document were found and are **superseded** by this report:

| Path | Branch | Status |
|---|---|---|
| `CM_Assessment_594_FocusFlow.md` | `master` | Superseded — content preserved and reclassified here |
| `docs/CM_Assessment_594_FocusFlow (1).md` | `main` | Superseded — duplicate copy |

Accurate material from those documents has been preserved and carried forward. Their conclusions have been re-verified against the repository during this review rather than accepted on trust. See §17 Commit 1 for their removal.

### Verification method

Full clone; history analysis across all four remote branches; static inspection of every tracked file on `master`; and **live execution of the project's own declared quality gates** on commit `d7e04c4`. Where a finding rests on running a command, the command and its output are shown.

### Verification limitation

The GitHub REST API returned HTTP 403 (rate limit) during this review. **Pull-request history, GitHub Actions run history, branch-protection settings and GitHub Releases could not be read directly.** Findings in those areas are inferred from Git evidence and are labelled as inferences. This limitation should be lifted at the next review by using an authenticated API call.

---

# 1. Executive Assessment

FocusFlow is a well-documented and well-architected application sitting on a **non-functional configuration management foundation**. The gap between the two is the defining characteristic of this repository.

The engineering substance is genuine and was verified, not assumed:

- 52 automated unit tests across 7 suites, **executed during this review — all pass in 10.4 seconds**.
- A 1,393-line domain layer containing no React and no SQLite imports, which is why the entire intelligent layer is testable without a simulator.
- A risk register that cites specific constants in specific files. **Every constant cited was located and matched its documented value.**
- A database schema under explicit `PRAGMA user_version` migration control.
- A system test plan that states pass criteria as numbers (calibration error below 0.10) rather than as opinions.

The configuration management around that substance does not currently function. Four findings are severe:

**1. The default branch has no shared ancestry with any other branch.** Commit `acfa9b1` on `master` is an orphan root — 61 files, 5,777 insertions, no parent. `git merge-base master main` returns empty. The V1 codebase on `main` and the V2 codebase on `master` are two unrelated histories in one repository, and the development between them was never committed.

**2. The CI workflow is invisible to GitHub.** `ci.yml` is located at `FocusFlow/.github/workflows/ci.yml`. **GitHub only reads workflow definitions from `.github/workflows/` at the repository root, which does not exist here.** The workflow additionally triggers on `main` while the code lives on `master`. It has never run and, in its current location, cannot run.

**3. Both declared quality gates fail on the current commit.** `npm ci` cannot run — no lockfile is tracked. `npm run typecheck` was executed during this review and produced **5 errors**. `npm run lint` fails with `eslint: not found` — the script has been declared since the V2 commit and the tool was never installed.

**4. No baseline exists.** Zero Git tags. `README.md` states each version ends at a tag (`v1.0.0`, `v2.0.0`) and `RISKS.md` closes risk R3 "at the v1.0.0 freeze." **Neither tag has ever existed.** No commit is identifiable as any released version.

The pattern is consistent across every dimension: **process is described accurately and in detail, then not performed.** `README.md` describes trunk-based development with `v<version>/<feature>` branches merged by pull request. The repository contains 9 commits across two unrelated lineages, zero merge commits, zero branches matching that pattern, and six commits created through the GitHub web upload interface.

**Current maturity: 44 / 100 — Level 2, "Documented, Not Enforced."**

The remediation path is short because the difficult work is already done. What is missing is mechanical: a lockfile, a tag, a relocated workflow file, five type fixes, and a decision about which branch is the trunk. See §17.

---

# 2. Repository and Version Control Environment

**Status: PARTIALLY IMPLEMENTED**

| Attribute | Evidence |
|---|---|
| VCS | Git — **IMPLEMENTED** |
| Host | GitHub — **IMPLEMENTED** |
| Default branch | `master` — **IMPLEMENTED** |
| Commits on `master` | 3 |
| Commits across all branches | 9, in **two unrelated lineages** |
| Merge commits | 0 |
| Tags | 0 — **NOT IMPLEMENTED** |
| Contributors | 1 (`ciel57142@gmail.com`, under two display names: `Ciel`, `ciel57142-wq`) |
| Activity window | 7 July 2026 – 4 August 2026 |
| Build system | Node / npm / Expo only. No Dockerfile, no `requirements.txt`, no `pom.xml` |

### 2.1 Complete commit history

```
master lineage (orphaned — no parent on acfa9b1):
  d7e04c4  2026-08-04  ciel57142-wq  "Add files via upload"   0 files  ← EMPTY COMMIT
  bf273c4  2026-08-04  ciel57142-wq  "Add files via upload"   1 file,  +737
  acfa9b1  2026-08-04  Ciel          "V2"                    61 files, +5777  ← ORPHAN ROOT

main lineage (no connection to the above):
  df38341  2026-08-04  ciel57142-wq  "Add files via upload"   1 file,  +737
  cdeb5ef  2026-08-04  ciel57142-wq  "Add files via upload"   1 file,  +251
  a9a681c  2026-07-31  Ciel          "docs"                   1 file,  +249
  7115fd5  2026-07-31  Ciel          "docs"                   1 file
  870ddf9  2026-07-26  Ciel          "Docs"                   2 files, +18148
  163cac5  2026-07-07  ciel57142-wq  "Add files via upload"   1 file
  b9e8755  2026-07-07  Ciel          "First Commit"          18 files, +980
```

### 2.2 Commit practices — **NOT IMPLEMENTED**

- **No commit convention.** Messages are `V2`, `docs`, `Docs`, `docs`, `First Commit`, and `Add files via upload` × 4. None reference a requirement, risk, issue or rationale.
- **Six of nine commits were created through the GitHub web upload interface** (`Add files via upload`), meaning no local build, typecheck or test ran before those changes entered history.
- **The current tip of `master` (`d7e04c4`) is an empty commit** — zero files changed.
- **Commit granularity is unusable for review.** `acfa9b1` introduces the entire V2 product in one commit. Bisection, blame across the version boundary, and selective revert are all unavailable.
- Author identity is inconsistent (two display names for one email address).

### 2.3 Secrets management — **IMPLEMENTED**

`FocusFlow/.gitignore` is well constructed and this is a genuine strength. It excludes `node_modules/`, `.expo/`, `dist/`, `web-build/`, `coverage/`, the native `android/` and `ios/` directories, and — importantly — signing material: `*.jks`, `*.p8`, `*.p12`, `*.key`, `*.mobileprovision`.

**No secret, credential or key was found in any tracked file on any branch.** The application is fully offline with no network calls and no account system, so the exposure surface is limited to local data and signing keys.

---

# 3. Repository Structure

**Status: PARTIALLY IMPLEMENTED**

The application is nested one level down, under `FocusFlow/`, with only the superseded assessment document at the repository root.

```
594_FoucsFlow/
├── CM_Assessment_594_FocusFlow.md      ← superseded by this report
├── docs/
│   └── CONFIGURATION_MANAGEMENT_REPORT.md   ← this file
└── FocusFlow/
    ├── .github/
    │   ├── workflows/ci.yml            ← NOT READ BY GITHUB — wrong location
    │   └── pull_request_template.md
    ├── src/
    │   ├── domain/     (1,393 LOC — pure functions, no React, no SQLite)
    │   ├── db/         (736 LOC — schema.ts + 7 repositories)
    │   ├── services/   (404 LOC)
    │   ├── state/      (218 LOC)
    │   ├── components/ (696 LOC)
    │   └── screens/    (1,096 LOC)
    ├── __tests__/      (562 LOC — 52 tests, 7 suites)
    ├── README.md · CHANGELOG.md · RISKS.md · TESTPLAN.md
    ├── package.json · app.json · tsconfig.json
    ├── babel.config.js · jest.domain.config.js
    └── .gitignore
```

**Two structural defects:**

1. **`FocusFlow/.github/` is not read by GitHub.** Workflow definitions, PR templates and issue templates are only honoured at `<repo-root>/.github/`. There is no root-level `.github/` directory. This single misplacement disables both the CI workflow and the pull-request template.
2. **The requirements documentation is on a different branch from the code it specifies.** `docs/Product_Requirements_Document.md` exists only on `main`, which shares no ancestry with `master`.

The internal layering of `src/` is, by contrast, clean and deliberate. `src/domain` importing neither React nor SQLite is what makes the fast test gate possible.

---

# 4. Configuration Items

**Status: PARTIALLY IMPLEMENTED**

No CI register existed in the repository prior to this report. The following register is established here and should be maintained going forward.

| ID | Configuration item | Location | Control mechanism | Status |
|---|---|---|---|---|
| CI-01 | Application source (4,543 LOC) | `FocusFlow/src/**` | Git | IMPLEMENTED |
| CI-02 | Test source (562 LOC) | `FocusFlow/__tests__/**` | Git | IMPLEMENTED |
| CI-03 | **Database schema** | `src/db/schema.ts` | `MIGRATIONS[]` applied against `PRAGMA user_version`; `LATEST_VERSION` derived from the array | **IMPLEMENTED** |
| CI-04 | Build configuration | `package.json`, `app.json`, `tsconfig.json`, `babel.config.js`, `jest.domain.config.js` | Git | IMPLEMENTED |
| CI-05 | **Dependency closure** | `package.json` only | **None — no lockfile tracked** | **NOT IMPLEMENTED** |
| CI-06 | Product identity | `edu.cisc594.focusflow`; version `2.0.0` in **two** files | Manual synchronisation | PARTIALLY IMPLEMENTED |
| CI-07 | Platform floor | `app.json`: `minSdkVersion 26`, 3 Android permissions | Git; cross-referenced by RISKS R2 | IMPLEMENTED |
| CI-08 | **Model tuning constants** | See table below | Git; documented in RISKS R4 | **IMPLEMENTED** |
| CI-09 | Process documentation | `README`, `CHANGELOG`, `RISKS`, `TESTPLAN` | Git (on `master` only) | IMPLEMENTED |
| CI-10 | Requirements baseline | `docs/Product_Requirements_Document.md` | Git (**on `main` only**) | PARTIALLY IMPLEMENTED |
| CI-11 | Design assets | `FocusFlow_App_Design.pptx` (174 KB, `main`) | Git, no LFS | PARTIALLY IMPLEMENTED |
| CI-12 | Pipeline definition | `FocusFlow/.github/workflows/ci.yml` | Git, but **not readable by GitHub** | PARTIALLY IMPLEMENTED |

### 4.1 CI-08 — behaviour-defining constants, verified this review

| Constant | Value | Location | Cited by |
|---|---|---|---|
| `COLD_START_MIN_COMPLETIONS` | 12 | `src/domain/profile.ts:14` | RISKS R4 |
| `MODEL_MIN_SAMPLES` | 20 | `src/domain/logistic.ts:28` | RISKS R4 |
| `MIN_WEIGHT` | 0.05 | `src/domain/weights.ts:21` | RISKS R4 |
| `MAX_WEIGHT` | 0.45 | `src/domain/weights.ts:22` | RISKS R4 |
| L2 regularisation | 0.02 | `src/domain/logistic.ts:79` | RISKS R4 |
| Learning rate / epochs / seed | 0.15 / 60 / 42 | `src/domain/logistic.ts:79` | partially |
| Engagement decay half-life | 14 days | `src/domain/profile.ts` | README |

**Every constant cited in `RISKS.md` was located at the stated file and holds the stated value.** This is working configuration control over the parameters that define the product's behaviour, and it is the strongest CM practice in the repository.

### 4.2 CI-05 is the critical gap

Without a tracked `package-lock.json`, the dependency closure is not under configuration control. Ranges such as `"expo": "~52.0.28"` and `"@react-navigation/native": "^7.0.14"` resolve differently over time; two builds of the same commit are not guaranteed to be identical. Note that `main` **does** carry a lockfile (18,148 lines, added in `870ddf9`) — the branch holding the shipped product does not.

---

# 5. Branching Strategy

**Status: NOT IMPLEMENTED**

### 5.1 Actual topology

```
master     ● d7e04c4 ── ● bf273c4 ── ● acfa9b1     ← DEFAULT; acfa9b1 is an ORPHAN ROOT
           (no ancestral connection to anything below)

main       ● df38341 ── ● cdeb5ef ── ● a9a681c ── ● 7115fd5 ── ● 870ddf9 ── ● 163cac5 ── ● b9e8755
dev_test   ● a9a681c   (3 commits behind main)
dev        ● 163cac5   (5 commits behind main)
```

### 5.2 Findings

- **`git merge-base origin/master origin/main` returns empty.** Verified this review. The two lineages are unrelated.
- **Both `main` and `master` contain product code.** `main` holds V1 at repository root; `master` holds V2 under `FocusFlow/`. No document in the repository states which is authoritative, and the CI workflow, the README and the repository default-branch setting disagree with one another.
- **`dev` and `dev_test` are stale**, 5 and 3 commits behind `main` respectively, last touched 7 and 31 July, never merged, never deleted.
- **Zero merge commits exist.** Combined with linear single-parent chains, this indicates all changes were pushed directly. *(Inference — PR history could not be read via API. A squash-merge strategy would also leave no merge commits, but would not explain the orphaned `master`.)*
- **No branch protection is evident.** Direct pushes to the default branch, including an empty commit, indicate none is enforced.

### 5.3 The documented model — **[UNSUBSTANTIATED]**

`FocusFlow/README.md` states:

> *"Trunk-based, short-lived branches named `v<version>/<feature>` (e.g. `v2/recommendation-engine`), merged to `main` by pull request. `main` is always releasable; each version ends at a tag (`v1.0.0`, `v2.0.0`)."*

**No element of this is supported by repository evidence.** No branch matching `v*/*` has existed. No merge is recorded. No tag exists. `main` has not received product code since 7 July and does not contain the shipped application. This paragraph is the most damaging line in the repository, because it converts the project's documentation strength into a credibility liability.

---

# 6. Change Control Process

**Status: PARTIALLY IMPLEMENTED**

### 6.1 What exists — the artifact is good

`FocusFlow/.github/pull_request_template.md` is a genuinely well-designed change-control artifact. It requires the author to name the feature or risk addressed, and to confirm:

- `npx jest -c jest.domain.config.js` passes
- `npm run typecheck` passes
- Checked on a physical device (required for anything touching notifications)
- `CHANGELOG.md` updated if user-visible
- `RISKS.md` updated if this opens, mitigates or closes a risk

### 6.2 What does not exist

- **The template is in a location GitHub does not read** (`FocusFlow/.github/`, not repository root), so it does not load when a pull request is opened.
- **No pull request has been merged.** Zero merge commits repository-wide. *(Inference — see §Verification limitation.)*
- **No code review evidence** of any kind: no review comments, no approvals, no requested changes.
- **No issue tracker in use.** `TESTPLAN.md` requires defect IDs to be recorded; there is nowhere for them to live.
- **No CODEOWNERS**, so no review requirement can be enforced.
- **No branch protection**, so nothing prevents a direct push to the default branch — as `d7e04c4` (an empty commit) demonstrates.

---

# 7. Baseline Management

**Status: PARTIALLY IMPLEMENTED**

### 7.1 One functioning baseline mechanism — **IMPLEMENTED**

`src/db/schema.ts` defines an ordered `MIGRATIONS[]` array applied against SQLite's `PRAGMA user_version`, with `LATEST_VERSION` derived from the array's final element.

- Migration 1 creates eight tables: `projects`, `tags`, `tasks`, `task_tags`, `events`, `day_plans`, `settings`, `scheduled_notifications`.
- Migration 2 creates `model_state` and adds no columns.

Any device can be identified as being at a known schema baseline and advanced deterministically. **This is a correct and enforced baseline**, and it is the technical basis for the closure of risk R3.

### 7.2 Every other baseline is nominal — **NOT IMPLEMENTED**

| Intended baseline | Declared in | Anchored to a commit? |
|---|---|---|
| v1.0.0 release | `CHANGELOG.md`, `README.md` | **No — no tag** |
| v2.0.0 release | `CHANGELOG.md`, `README.md`, `package.json`, `app.json` | **No — no tag** |
| V1 quality gate (S1–S5 pass) | `TESTPLAN.md` | **No — no recorded results** |
| V2 quality gate (S1–S10 pass) | `TESTPLAN.md` | **No — no recorded results** |
| "v1.0.0 freeze" (basis of R3 closure) | `RISKS.md` R3 | **No — no freeze artifact** |
| Schema baseline | `src/db/schema.ts` | **Yes — `user_version` 1, 2** |

### 7.3 Consequences

- **No release is reproducible.** No commit is identifiable as v1.0.0 or v2.0.0, and even if one were, the absence of a tracked lockfile means the dependency closure could not be reconstructed.
- **R3's closure is unsubstantiated.** The technical argument is sound and verifiable in `schema.ts`, but the freeze event it is predicated on left no artifact.
- **No rollback point exists.** With no tag and a severed history, there is no commit to return to if V2 proves defective.

---

# 8. Testing and Quality Gates

**Status: PARTIALLY IMPLEMENTED — the strongest verified area of the repository**

### 8.1 Automated testing — **IMPLEMENTED**

Executed during this review against commit `d7e04c4`:

```
$ npx jest -c jest.domain.config.js --ci

PASS __tests__/reminders.test.ts
PASS __tests__/recommender.test.ts
PASS __tests__/logistic.test.ts
PASS __tests__/profile.test.ts
PASS __tests__/stats.test.ts
PASS __tests__/planning.test.ts
PASS __tests__/weights.test.ts

Test Suites: 7 passed, 7 total
Tests:      52 passed, 52 total
Time:       10.411 s
```

The counts claimed in `README.md` and `TESTPLAN.md` (52 tests) are **accurate**.

**Notable strengths:**

- **Deterministic fixtures.** `src/domain/synthetic.ts` generates history from a fixed seed with known habits, so expected values are computed rather than snapshotted. The same fixture is loadable into the running app (Settings → Data → *Load the demo dataset*), so manual and automated testing exercise identical data.
- **Statistical assertions where appropriate.** `logistic.test.ts` buckets predictions into fifths across 120 seeded days and asserts weighted calibration error below 0.10 with no bucket (n ≥ 10) off by more than 0.20 — the correct way to test a probabilistic component.
- **Testability is architectural.** `src/domain` contains no React and no SQLite imports, which is why the whole intelligent layer runs in ten seconds with no simulator.

### 8.2 Coverage gap — **NOT IMPLEMENTED**

| Layer | LOC | Automated tests |
|---|---:|---|
| `src/domain` | 1,393 | **52 tests** |
| `src/screens` | 1,096 | none |
| `src/db` (+ 7 repositories) | 736 | none |
| `src/components` | 696 | none |
| `src/services` | 404 | none |
| `src/state` | 218 | none |
| **Untested** | **3,150 (69%)** | **0** |

Every persistence path, every migration, every notification side effect and every screen is verified only by manual execution.

### 8.3 System test plan — **IMPLEMENTED as a document, NOT IMPLEMENTED as a practice**

`FocusFlow/TESTPLAN.md` is a real test plan: ten scripted system tests (S1–S5b, S6–S10) with explicit pass criteria, two defined gates, and an instruction to record pass/fail, defect ID, severity and build SHA per case.

**No test results are recorded anywhere in the repository.** Neither quality gate is evidenced.

### 8.4 Other gates

| Gate | Declared | Status this review |
|---|---|---|
| `npm run typecheck` | `package.json` | **FAILS — 5 errors** (4 × TS2769 `CapacityMeter.tsx`, 1 × TS2322 `navigation.tsx:61`) |
| `npm run lint` | `package.json` | **FAILS — `eslint: not found`.** No eslint dependency, no eslint config file |
| `npm test` (jest-expo preset) | `package.json` | Configured; **no component test file exists** |
| Coverage thresholds | — | **NOT IMPLEMENTED** |
| End-to-end tests | — | **NOT IMPLEMENTED** |

---

# 9. CI/CD and Automation

**Status: PARTIALLY IMPLEMENTED — defined but non-functional**

### 9.1 The complete pipeline

`FocusFlow/.github/workflows/ci.yml`:

```yaml
name: CI
on:
  pull_request:
    branches: [main]
  push:
    branches: [main]
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - name: Typecheck
        run: npm run typecheck
      - name: Domain unit tests
        run: npx jest -c jest.domain.config.js --ci
```

**The design is sound** — pinned action major versions, pinned Node 20, dependency caching, and a deliberately fast domain-only test config chosen so the gate stays under ten seconds.

### 9.2 Four independent defects, each sufficient to prevent execution

| # | Defect | Evidence | Effect |
|---|---|---|---|
| 1 | **Workflow is in a location GitHub does not read** | File is at `FocusFlow/.github/workflows/`; no root-level `.github/` exists | GitHub never registers the workflow |
| 2 | Trigger targets the wrong branch | `branches: [main]`; the code is on `master` | Would not fire for V2 even if relocated |
| 3 | No working-directory set | Project is nested under `FocusFlow/` | Steps would run in the wrong directory |
| 4 | `npm ci` cannot run | No tracked `package-lock.json` | Job fails before any gate |

Even with all four corrected, the `typecheck` step would fail on the 5 errors recorded in §8.4.

### 9.3 Absent entirely — **NOT IMPLEMENTED**

- **No CD of any kind.** No build, packaging, signing, distribution or deployment. **The repository produces no distributable artifact.**
- No lint step; no coverage collection; no test-result publication.
- No dependency scanning, no secret scanning, no `dependabot.yml`, no CodeQL.
- No status badge in `README.md`, so a reader receives no signal that the pipeline is inoperative.
- No EAS build configuration (`eas.json` absent).

---

# 10. Release and Version Management

**Status: PARTIALLY IMPLEMENTED**

### 10.1 What exists — **IMPLEMENTED**

- **`FocusFlow/CHANGELOG.md`** in Keep a Changelog format, documenting `[2.0.0] — Predictive scheduling layer` and `[1.0.0] — Deterministic task manager`, written from the user's perspective and grouped Added / Changed / Notes. This is a competent changelog.
- **Version identifiers are internally consistent**: `package.json` `2.0.0` and `app.json` `2.0.0` agree.
- **Product identity is fixed**: `edu.cisc594.focusflow` for both the Android package and the iOS bundle identifier.

### 10.2 What does not exist — **NOT IMPLEMENTED**

- **No tags.** `git tag` returns nothing. The two releases described in `CHANGELOG.md` are not anchored to any commit and cannot be checked out.
- **No GitHub Releases.** *(Inference — Releases could not be read via API, but with no tags, no release object can be attached to one.)*
- **No release artifacts and no build configuration.**
- **No release procedure.** Nothing documents how a version is cut, who approves it, or what must be true before the version number changes.
- **Version number has two sources of truth** — `package.json` and `app.json` must be updated by hand in lockstep. They agree today; nothing enforces that they continue to.
- **The V1 release is unrecoverable as described.** The nearest artifact is `main@a9a681c`, which is unlabelled and is not an ancestor of the shipped product.

---

# 11. Dependency and Environment Management

**Status: PARTIALLY IMPLEMENTED**

| Aspect | Status | Evidence |
|---|---|---|
| Declared dependencies | IMPLEMENTED | `package.json`: 13 runtime, 7 dev |
| **Lockfile** | **NOT IMPLEMENTED** | **No `package-lock.json` tracked on `master`** |
| Runtime version pinning | PARTIALLY IMPLEMENTED | Node 20 pinned in `ci.yml` only; no `.nvmrc`, no `engines` field |
| Platform floor | IMPLEMENTED | `minSdkVersion 26` in `app.json`, cross-referenced by RISKS R2 |
| Environment/config templates | NOT IMPLEMENTED | None present — the app is fully offline with no network configuration, so this is largely non-applicable |
| Secrets handling | IMPLEMENTED | `.gitignore` excludes all signing material; no secrets found |
| Automated dependency updates | NOT IMPLEMENTED | No `dependabot.yml` |
| Vulnerability scanning | NOT IMPLEMENTED | No CodeQL, no `npm audit` gate |

Expo SDK and React Native are pinned with tilde ranges (`~52.0.28`, `0.76.6`), which is appropriate for the Expo ecosystem — but without a lockfile the transitive closure is still unpinned.

---

# 12. Traceability and Audit Trail

**Status: PARTIALLY IMPLEMENTED**

### 12.1 Chains that exist and were verified end to end — **IMPLEMENTED**

| Chain | Verification |
|---|---|
| RISKS R4 → `COLD_START_MIN_COMPLETIONS = 12` (`profile.ts:14`) → `logistic.test.ts`, `weights.test.ts` → TESTPLAN §S10 | **Every link checked; all hold** |
| RISKS R5 → `domain/recommender.ts` single code path → `recommender.test.ts` asserts contributions sum exactly to the score → TESTPLAN §S9 | **Verified** |
| RISKS R2 → `app.json minSdkVersion 26` + `services/notifications.ts` channel creation → TESTPLAN §S4 | **Verified** |
| TESTPLAN §S6–S10 → each names the specific test file automating it | **Verified** |

Risk-to-code-to-test traceability at this quality is above the standard typical for a project of this size and should be preserved through any remediation.

### 12.2 Chains that are broken — **NOT IMPLEMENTED**

**Three competing requirement ID schemes are in use, and one resolves to nothing:**

| Where | Scheme | Status |
|---|---|---|
| PRD §3.2 (on `main`) | 1.1 – 7.2, capability-based | Real |
| `main`'s `README.md` | "(2.1)(2.2)(2.3)" | From `FocusFlow_Proposal_594.docx`, **which is not in the repository** |
| PR template (on `master`) | "2.5 Predictive scheduling" | **§2 of the PRD is *Product Scope*. There is no §2.5.** |

Additionally:

- **No requirement identifier of any scheme appears anywhere in `master:FocusFlow/src/`.**
- **No commit references a requirement, risk or issue ID.**
- **No test execution record exists**, despite `TESTPLAN.md` requiring a build SHA per case.
- **No review trail exists** — no merged PR, no comment, no approval.
- **The requirements baseline and the implementation are on branches with no common ancestor**, so they cannot even be diffed against one another.

---

# 13. Configuration Management Risks

**Status: PARTIALLY IMPLEMENTED**

### 13.1 The project's own register — **IMPLEMENTED, and good**

`FocusFlow/RISKS.md` is a genuine, well-formed risk register: six risks, each with a status, a stated mitigation, the file the mitigation lives in, the test that proves it, and a named residual.

| ID | Risk | Status | Mitigation verified this review? |
|---|---|---|---|
| R1 | Scope creep | Mitigated | Process-only; not verifiable in code |
| R2 | Mobile platform variance | Mitigated | **Yes** — `minSdkVersion 26`, `scheduled_notifications` table, quiet hours in `domain/reminders.ts` |
| R3 | Data model lock-in | Closed | **Partially** — the technical claim holds; the "v1.0.0 freeze" it rests on left no artifact |
| R4 | Cold start / overfitting | Mitigated | **Yes** — all five named constants located and matched |
| R5 | Explanation drift | Mitigated | **Yes** — single code path confirmed; test asserts exact sum |
| R6 | Notification fatigue | **Open** | Correctly open; no per-day cap exists |

Residuals are stated rather than hidden — R4 openly concedes that calibration is measured on the training set.

### 13.2 Deficiencies — **NOT IMPLEMENTED**

- **No probability, impact, owner, review date or target date** on any risk. R6 is open indefinitely with no commitment attached.
- **Two divergent registers exist on unrelated branches**: `RISKS.md` on `master` and PRD §§4–7 on `main`. Neither references the other; they cannot be reconciled by merge.
- **Configuration-management risks are entirely absent from the register.** None of the following is tracked anywhere:

| Unregistered CM risk | Exposure |
|---|---|
| Bus factor of 1 | Single contributor; no second reviewer possible |
| No lockfile | Builds are not reproducible |
| CI not readable by GitHub | No automated verification of any change |
| Orphaned default branch | V1→V2 evolution permanently lost |
| No tag or release artifact | No rollback point exists |
| No LICENSE | Work is all-rights-reserved by default; no third party may legally reuse it |

These are currently the risks most likely to cause actual loss.

---

# 14. Technical Debt

**Status: NOT IMPLEMENTED as a tracked practice** — no debt register exists in the repository. The following inventory is established here.

| ID | Item | Evidence | Severity |
|---|---|---|---|
| D1 | No tracked `package-lock.json` | `git ls-files` returns nothing | **Critical** |
| D2 | CI workflow in a location GitHub does not read | `FocusFlow/.github/`, no root `.github/` | **Critical** |
| D3 | Orphaned V2 history | `acfa9b1` has no parent | **Critical — permanent** |
| D4 | No tags / no baseline | `git tag` empty | **High** |
| D5 | 5 TypeScript errors | `CapacityMeter.tsx` ×4, `navigation.tsx` ×1 | **High** |
| D6 | `lint` script declared but unrunnable | `eslint: not found`; no eslint dep, no config | **Medium** |
| D7 | 3,150 LOC with zero automated tests | §8.2 | **Medium** |
| D8 | `any` at the React Navigation boundary | `TaskEditScreen.tsx:14`, `:55`; `TodayScreen.tsx:15`; `TasksScreen.tsx:14`; `taskRepo.ts:153` | **Medium** |
| D9 | Stale/duplicate branches | `dev` (−5), `dev_test` (−3) | **Low** |
| D10 | Version duplicated in two manifests | `package.json` + `app.json` | **Low** |
| D11 | Binary docs in Git without LFS | 277 KB `.pptx` + `.pdf` on `main` | **Low** |
| D12 | Calibration measured on training set | Self-declared, RISKS R4 residual | **Low — already tracked** |
| D13 | Empty commit on the default branch tip | `d7e04c4`, 0 files changed | **Low** |
| D14 | Duplicate CM assessment copies across branches | Root of `master`; `docs/…(1).md` on `main` | **Low** |

### 14.1 Debt-avoidance practices actually in place — **IMPLEMENTED**

- Zero `TODO` / `FIXME` / `HACK` / `XXX` markers across 5,105 lines.
- Zero `console.*` statements in `src/`.
- Zero `@ts-ignore` / `@ts-expect-error` suppressions.
- `strict: true` in `tsconfig.json`.
- Clean domain/infrastructure separation, enforced by the domain layer's import discipline.
- Repository pattern: 7 focused repositories rather than one monolith.

**The debt here is process and toolchain debt, not code rot.** The source is clean; the machinery around it is not connected.

---

# 15. Current Repository Maturity Assessment

Verified against repository evidence, not against statements in prior documentation.

| Area | Status | Evidence | Recommended improvement |
|---|---|---|---|
| **Version Control** | PARTIALLY IMPLEMENTED | Git + GitHub; strong `.gitignore` with signing material excluded. But 9 commits in 2 unrelated lineages, 6 web uploads, 1 empty commit, no message convention | Adopt Conventional Commits enforced by CI; join the severed lineages; stop using web upload |
| **Branching** | NOT IMPLEMENTED | 4 branches; 0 merge commits; orphaned default branch; `dev`/`dev_test` stale; documented `v<version>/<feature>` model never practised | Declare one trunk; protect it; delete stale branches; ship every change by PR |
| **Change Control** | PARTIALLY IMPLEMENTED | Good PR template exists — but in a location GitHub does not read, and never used. No reviews, no CODEOWNERS, no issue tracker | Relocate `.github/` to repository root; enable branch protection; require review |
| **Configuration Items** | PARTIALLY IMPLEMENTED | Schema migrations and model constants under genuine control; **no lockfile**; version duplicated across two manifests | Commit the lockfile; single-source the version; maintain the §4 register |
| **Baselines** | PARTIALLY IMPLEMENTED | `PRAGMA user_version` migrations are a real, enforced baseline. **Zero tags**; no gate evidence; R3 closure unsubstantiated | Tag `v2.0.0`; record S1–S10 results; perform a reproduction drill |
| **Testing** | PARTIALLY IMPLEMENTED | **52 tests verified passing**; deterministic fixtures; strong TESTPLAN — but 69% of source untested, no coverage gate, no recorded results, typecheck and lint both failing | Fix the 5 type errors; install eslint; test `db` first; record S1–S10 results |
| **CI/CD** | PARTIALLY IMPLEMENTED | Well-designed workflow that **has never run** — wrong directory, wrong branch, no working-directory, `npm ci` impossible. No CD at all | Relocate to root `.github/`; retarget `master`; add working-directory; add lint, coverage and build jobs |
| **Release Management** | PARTIALLY IMPLEMENTED | Competent `CHANGELOG.md`; consistent version strings. Zero tags, zero Releases, zero artifacts, no procedure | Tag both versions; write `RELEASING.md`; add `eas.json` and a release workflow |
| **Documentation** | IMPLEMENTED | README, CHANGELOG, RISKS, TESTPLAN, PR template, PRD — all substantive; code comments record decisions. Deducted for the unsubstantiated conventions paragraph, PRD on the wrong branch, and no LICENSE | Correct README §Repository conventions; relocate the PRD; add LICENSE/CONTRIBUTING/CODEOWNERS/SECURITY |
| **Traceability** | PARTIALLY IMPLEMENTED | Risk→code→test verified end to end. Requirements→code entirely broken; 3 competing ID schemes; PR template cites a nonexistent §2.5 | Declare PRD §3.2 the sole authority; build a traceability matrix; put requirement IDs in commits |
| **Risk Management** | IMPLEMENTED | Auditable 6-risk register with mitigation locations and named residuals; every cited constant verified | Add probability/impact/owner/review date; merge the two registers; register the CM risks in §13.2 |

### 15.1 Composite score

| Dimension | Weight | Score | Weighted |
|---|---:|---:|---:|
| Version control | 10 | 4/10 | 4.0 |
| Branching | 10 | 2/10 | 2.0 |
| Release management | 10 | 3/10 | 3.0 |
| CI/CD | 14 | 2.8/14 | 2.8 |
| Testing | 14 | 7.5/14 | 7.5 |
| Documentation | 14 | 10.3/14 | 10.3 |
| Configuration items | 8 | 4/8 | 4.0 |
| Baselines | 7 | 2/7 | 2.0 |
| Traceability | 5 | 3/5 | 3.0 |
| Risk management | 4 | 3.2/4 | 3.2 |
| Technical debt | 4 | 2.4/4 | 2.4 |
| **Total** | **100** | | **44.2** |

> ### **44 / 100 — Level 2: Documented, Not Enforced**

| Level | Range | Description | |
|---|---|---|---|
| 1 — Ad hoc | 0–29 | No process, no documentation | |
| **2 — Documented, not enforced** | **30–54** | **Process described accurately; not mechanically enforced** | **← current** |
| 3 — Repeatable | 55–74 | Process enforced by tooling; releases reproducible | next target |
| 4 — Managed | 75–89 | Measured, gated, traceable end to end | |
| 5 — Optimising | 90–100 | Continuously improved, fully automated | |

**Reading the score:** the distribution matters more than the total. Documentation scores 74% of its available weight and Risk Management 80%, while Branching scores 20% and Baselines 29%. That spread is diagnostic — this is not immature engineering, it is an **unmanaged repository**. The score is also artificially depressed by four mechanical defects (D1, D2, D4, D5) that together cost roughly 18 points and are all fixable in a day.

---

# 16. Missing or Partially Implemented CM Artifacts

### 16.1 Blocking — reproducibility and pipeline

| Artifact | Consequence of absence |
|---|---|
| `FocusFlow/package-lock.json` (tracked) | `npm ci` fails; builds not reproducible; CI cannot run |
| Root-level `.github/workflows/` | GitHub never registers the workflow or the PR template |
| Git tags `v1.0.0`, `v2.0.0` | No release is identifiable, checkoutable or rollback-able |
| Corrected CI trigger and working-directory | Pipeline cannot verify the product code |
| Trunk declaration (`master` vs `main`) | Documentation, CI config and repository default all disagree |

### 16.2 Governance and legal

| Artifact | Consequence |
|---|---|
| `LICENSE` | Work is all-rights-reserved by default; no third party may legally use, fork or evaluate it |
| `CONTRIBUTING.md` | Branch and commit expectations exist only as a README paragraph |
| `CODEOWNERS` | No review requirement can be enforced |
| `SECURITY.md` | No disclosure path |
| `.github/ISSUE_TEMPLATE/` | No defect intake — and `TESTPLAN.md` requires defect IDs that have nowhere to live |

### 16.3 Quality gates

| Artifact | Consequence |
|---|---|
| `eslint.config.js` + the `eslint` dependency | The declared `lint` script cannot run |
| Coverage thresholds and a `--coverage` CI step | Coverage unmeasured; can regress silently |
| Lint and coverage steps in `ci.yml` | Neither is gated |
| `.nvmrc` / `engines` | Node 20 pinned in CI only, not for contributors |
| `.prettierrc`, `.editorconfig` | No enforced formatting |

### 16.4 CM records

| Artifact | Consequence |
|---|---|
| `docs/test-results/` | `TESTPLAN.md` mandates recording pass/fail, defect ID, severity, build SHA — nothing recorded, so neither quality gate is evidenced |
| Defect log or GitHub Issues | `TESTPLAN.md`'s defect-ID field is unusable |
| `docs/TRACEABILITY.md` | No mapping from PRD capabilities to modules to tests |
| `docs/RELEASING.md` | No defined cut, approval or sign-off process |
| `docs/BRANCHING.md` | The real branching model, and the V1/V2 history split, are undocumented |
| Architecture decision records | Key decisions are prose, not dated numbered records |
| Consolidated risk register | Two divergent registers on unrelated branches |

### 16.5 Build and delivery

| Artifact | Consequence |
|---|---|
| `eas.json` | No distributable artifact can be produced |
| Build/artifact job | Nothing verifies the app actually builds — only that it typechecks |
| `dependabot.yml`, CodeQL | No dependency-update or vulnerability signal |
| CI status badge | A reader cannot see that the pipeline is inoperative |

---

# 17. Recommended Next Improvements

Prioritised. Each states what changes, why it matters, and which artifact is affected. **No change to application behaviour is recommended in the High Priority tier.**

## High Priority

| # | Recommendation | Why it matters | Artifact affected |
|---|---|---|---|
| H1 | **Relocate `.github/` to the repository root** | GitHub does not read `FocusFlow/.github/`. This single defect disables both the CI workflow and the PR template. Nothing else in CI can work until it is fixed | `FocusFlow/.github/**` → `.github/**` |
| H2 | **Commit `package-lock.json`** | `npm ci` fails without it, and no two builds of the same commit are guaranteed identical (CI-05) | `FocusFlow/package-lock.json` |
| H3 | **Retarget the CI trigger to `master` and set `working-directory: FocusFlow`** | The workflow targets a branch that does not contain the product, in a directory it does not run in | `.github/workflows/ci.yml` |
| H4 | **Fix the 5 TypeScript errors** | `npm run typecheck` is a declared quality gate and it fails. All 5 are presentation-layer typing; the domain layer is clean | `src/components/CapacityMeter.tsx`, `src/navigation.tsx` |
| H5 | **Install and configure ESLint** | The `lint` script has been declared since the V2 commit and has never been able to run | `package.json`, new `eslint.config.js` |
| H6 | **Tag `v2.0.0`** | `CHANGELOG.md` and `README.md` both describe tagged releases that do not exist. Without a tag there is no baseline and no rollback point | Git tags; GitHub Releases |
| H7 | **Declare and protect a single trunk** | `main` and `master` both hold product code; the README, the CI config and the repository default disagree | Repository settings; new `docs/BRANCHING.md` |
| H8 | **Correct `README.md` §Repository conventions** | It describes a workflow the repository has never practised. Until it is true or removed, it misleads every reader | `FocusFlow/README.md` |

## Medium Priority

| # | Recommendation | Why it matters | Artifact affected |
|---|---|---|---|
| M1 | Add `LICENSE`, `CONTRIBUTING.md`, `CODEOWNERS`, `SECURITY.md`, issue templates | The project is legally unlicensed; review cannot be enforced; defect IDs have nowhere to live | Repository root, `.github/` |
| M2 | Relocate the PRD to the trunk and build `docs/TRACEABILITY.md` | Requirements are on a branch with no ancestral relationship to the code they specify | `docs/Product_Requirements_Document.md`, new matrix |
| M3 | Correct the PR template's `2.5` reference and declare PRD §3.2 the sole ID authority | The cited requirement ID resolves to nothing; three schemes compete | `.github/pull_request_template.md` |
| M4 | Add probability, impact, owner and review date to `RISKS.md`; merge the two registers; add the CM risks from §13.2 | The risks most likely to cause loss are currently untracked | `FocusFlow/RISKS.md` |
| M5 | Test `src/db` first — migrations and repositories | 736 LOC with no tests, where a defect corrupts user data irreversibly. Also substantiates the R3 closure | new `__tests__/db/**` |
| M6 | Record `TESTPLAN.md` S1–S10 results against a tagged build | The plan has always mandated this; nothing has been recorded, so neither gate is evidenced | new `docs/test-results/` |
| M7 | Delete `dev` and `dev_test` | Stale and duplicate branches add ambiguity and no value | Remote branches |
| M8 | Single-source the version number | Two manifests must be hand-synced; they agree today, nothing enforces it tomorrow | `package.json`, `app.json` → `app.config.js` |
| M9 | Adopt Conventional Commits enforced by CI | An unenforced convention is not a practice | new `commitlint.config.js`, `ci.yml` |

## Future Improvements

| # | Recommendation | Why it matters |
|---|---|---|
| F1 | Extend automated testing to `services`, `state`, `components`, `screens` (3,150 LOC) | Closes the largest verification gap; notifications carry two live risks |
| F2 | End-to-end automation for TESTPLAN §S1–S3, §S5b | These are deterministic UI flows and fully automatable |
| F3 | Coverage thresholds, ratcheting upward only | Prevents silent regression |
| F4 | `eas.json` + tag-triggered build and release workflow | The repository currently produces no distributable artifact |
| F5 | Dependabot and CodeQL | No dependency-currency or vulnerability signal today |
| F6 | Architecture decision records | Four significant decisions exist as README prose only |
| F7 | Git LFS for design binaries | 277 KB of undiffable content in pack history |
| F8 | Close R6 (per-day reminder cap and spacing rule) | The one Open risk; `RISKS.md` already specifies the fix |
| F9 | Resolve the R4 residual with a held-out calibration split | Already identified as backlog work in the register |
| F10 | A documentation-drift check in CI | The failure mode that cost this repository the most points was documentation describing a process nobody performed. Automate against its recurrence |

---

# 18. Recommended Next Commits

Small and logical, in dependency order. Commits 1–6 are the critical path and are achievable in a single working session.

**Commit 1**
```
docs: add living CM report and remove superseded assessment copies
```
Adds `docs/CONFIGURATION_MANAGEMENT_REPORT.md` (this file). Deletes `CM_Assessment_594_FocusFlow.md` from the root of `master` and `docs/CM_Assessment_594_FocusFlow (1).md` from `main`, so exactly one CM report exists.

**Commit 2**
```
ci: relocate .github to repository root so GitHub reads the workflow
```
Moves `FocusFlow/.github/workflows/ci.yml` → `.github/workflows/ci.yml` and `FocusFlow/.github/pull_request_template.md` → `.github/pull_request_template.md`. *Addresses H1 — nothing else in CI can work first.*

**Commit 3**
```
build(deps): commit package-lock.json to pin the dependency closure
```
*Addresses H2 and CI-05. Verify with `rm -rf node_modules && npm ci`.*

**Commit 4**
```
ci: target the trunk branch and set the project working directory
```
`branches: [main]` → `[master]` on both triggers; add `defaults.run.working-directory: FocusFlow`. *Addresses H3.*

**Commit 5**
```
fix(ui): correct DimensionValue and header style typing
```
Resolves the 4 × TS2769 in `CapacityMeter.tsx` and the TS2322 at `navigation.tsx:61`, so `npm run typecheck` passes. Type-only; no behavioural change. *Addresses H4.*

**Commit 6**
```
chore(lint): add eslint dependency and flat config, wire into CI
```
*Addresses H5. The `lint` script becomes runnable for the first time.*

**Commit 7**
```
chore(release): tag v2.0.0 and add release documentation
```
Signed annotated tag on the trunk; adds `docs/RELEASING.md`; creates the GitHub Release from the `CHANGELOG.md` 2.0.0 body. *Addresses H6.*

**Commit 8**
```
docs: declare the trunk, document the branching model and correct README conventions
```
Adds `docs/BRANCHING.md` — including an honest note that the V1→V2 development history was never committed and cannot be recovered — and rewrites `README.md` §Repository conventions to describe what is actually enforced. *Addresses H7 and H8.*

**Commit 9**
```
docs: add LICENSE, CONTRIBUTING, CODEOWNERS, SECURITY and issue templates
```
*Addresses M1.*

**Commit 10**
```
docs: relocate PRD to trunk and add requirements traceability matrix
```
Also corrects the PR template's nonexistent `2.5` reference. *Addresses M2 and M3.*

**Commit 11**
```
test: add migration and repository tests for src/db
```
Migration tests asserting `PRAGMA user_version` transitions and that migration 2 adds no columns — the assertion that substantiates the R3 closure. *Addresses M5.*

**Commit 12**
```
docs(risk): consolidate risk registers and add CM risk entries
```
*Addresses M4.*

---

# 19. Document Revision History

| Version | Date | Reviewed commit | Summary of changes |
|---|---|---|---|
| 1.0 | 2026-08-09 | `d7e04c4` | Initial living CM report. Consolidates and supersedes the 4 August 2026 assessment documents found at `CM_Assessment_594_FocusFlow.md` (`master`) and `docs/CM_Assessment_594_FocusFlow (1).md` (`main`). All prior claims re-verified against the repository. **New findings this review:** `.github/` is located inside `FocusFlow/` where GitHub does not read it, so the CI workflow has never been registered; the tip of `master` (`d7e04c4`) is an empty commit; four additional web-upload commits were added on 4 August. **Corrected:** the prior assessment's dimension weights summed to 105 while being presented as a 100-point scale — the rubric is rebased here, moving the composite from 47/105 to **44/100**. **Re-verified this review:** 52 tests pass (10.4 s); `npm run typecheck` fails with 5 errors; `npm run lint` fails with `eslint: not found`; no tags; no tracked lockfile; `git merge-base master main` empty. |

---

*Prepared by inspection of commit `d7e04c4` on branch `master`. All quality gates cited were executed during this review. GitHub REST API was rate-limited (HTTP 403); pull-request, Actions-run, Releases and branch-protection history could not be read directly and are inferred from Git evidence where noted.*
