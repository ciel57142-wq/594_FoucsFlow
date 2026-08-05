# Software Configuration Management Assessment
## Repository: `ciel57142-wq/594_FoucsFlow`

**Assessment date:** 4 August 2026
**Reviewer role:** Senior Software Configuration Manager
**Method:** Full clone and history analysis (`git`), static inspection of all tracked files on all four branches, live execution of the declared test and typecheck gates.
**Evidence basis:** Only practices with artifacts present in the repository are recorded below. Claims made in repository documentation that are not substantiated by repository evidence are marked **[UNSUBSTANTIATED]** rather than credited.

**Verification limitation:** The GitHub REST API was rate-limited (HTTP 403) at time of assessment, so pull-request history, Actions run history, branch-protection rules, and GitHub Releases could not be read directly. Findings about those areas are inferred from Git evidence and are labelled as inferences where that matters.

---

# 1. Executive Assessment

FocusFlow is an unusually well-*documented* project sitting on an unusually weak *configuration control* foundation. That gap is the single most important finding in this report.

The engineering substance is real. The domain layer is 1,393 lines of pure, I/O-free TypeScript covered by 52 automated tests that execute in 9.2 seconds — **verified passing during this assessment**. The risk register names specific constants in specific files, and every one of those constants was checked and found to exist exactly as documented. The database schema is versioned through an explicit `PRAGMA user_version` migration list. The test plan specifies pass criteria as numbers rather than opinions. This is stronger discipline than most projects of this size exhibit.

The configuration management around that substance is not functioning.

Four findings are severe enough to state plainly:

1. **The default branch has no shared ancestry with any other branch.** Commit `acfa9b1` ("V2") on `master` is an orphan root commit — 61 files and 5,777 insertions with no parent. The Version 1 codebase on `main` and the Version 2 codebase on `master` are two unrelated histories in one repository. The evolution of the product from V1 to V2 is not recorded anywhere and cannot be recovered by any Git operation.

2. **The CI pipeline is structurally dead.** `.github/workflows/ci.yml` triggers only on `main`. The code it is written to verify lives on `master`. It has never had the opportunity to run against the V2 codebase, and cannot without editing.

3. **Both CI quality gates would fail if the pipeline did run.** `npm ci` requires a lockfile; `master` has none. `npm run typecheck` was executed during this assessment and produced **5 TypeScript errors** in `src/components/CapacityMeter.tsx` and `src/navigation.tsx`.

4. **No baseline exists.** The repository contains zero Git tags. `README.md` states that each version ends at a tag (`v1.0.0`, `v2.0.0`) and `RISKS.md` declares risk R3 "Closed at the v1.0.0 freeze." Neither tag exists. No commit in the repository is identifiable as any released version.

The pattern across all eleven assessed dimensions is consistent: **process is described accurately and in detail, and then not performed.** `README.md` §"Repository conventions" describes trunk-based development, short-lived `v<version>/<feature>` branches, and pull-request merges to `main`. The repository contains six commits, zero merge commits, zero branches matching that naming pattern, and two commits made through the GitHub web upload interface.

**Composite maturity score: 47 / 100 — Level 2, "Documented, Not Enforced."**

The remediation path is unusually short, because the hard part is already done. The documentation, test design, risk analysis and architectural separation that normally take months to establish are present and of good quality. What is missing is mechanical: a lockfile, a tag, a corrected workflow trigger, five type fixes, and a decision about which branch is the trunk. Section 4 sequences that work as eight commits. A focused day of work moves this repository from Level 2 to a credible Level 3.

---

# 2. Configuration Management Report

## 2.1 Version Control Maturity — **4 / 10**

**What exists:**

| Attribute | Observed |
|---|---|
| VCS / host | Git, GitHub |
| Total commits (all branches) | 6 |
| Branches | 4 (`master`, `main`, `dev`, `dev_test`) |
| Merge commits | 0 |
| Tags | 0 |
| Contributors | 1 (`ciel57142@gmail.com`, committing under two names: `Ciel` and `ciel57142-wq`) |
| Active period | 7 Jul 2026 – 4 Aug 2026 |

**Complete commit history:**

```
acfa9b1  2026-08-04  V2                     (master — ORPHAN, no parent)  61 files, +5777
a9a681c  2026-07-31  docs                   (main, dev_test)               1 file,  +249
7115fd5  2026-07-31  docs                   (main, dev_test)               1 file,   binary move
870ddf9  2026-07-26  Docs                   (main, dev_test)               2 files, +18148
163cac5  2026-07-07  Add files via upload   (main, dev, dev_test)          1 file,   binary
b9e8755  2026-07-07  First Commit           (root of main lineage)        18 files, +980
```

**Strengths (real, credit given):**
- `.gitignore` is genuinely well-constructed. It excludes `node_modules/`, `.expo/`, build output, `coverage/`, native `android/` and `ios/` directories, and — importantly — signing material: `*.jks`, `*.p8`, `*.p12`, `*.key`, `*.mobileprovision`. No secret or credential was found in any tracked file on any branch.
- No `console.*` calls anywhere in `src/` (0 occurrences). No `TODO`, `FIXME`, `HACK` or `XXX` markers. The working tree is clean.

**Deficiencies:**
- **Severed history.** `git merge-base origin/master origin/main` returns empty. `acfa9b1` has no parent. This is the defining defect of the repository's version control state.
- **Commit messages carry no information.** "V2", "docs", "Docs", "docs", "Add files via upload", "First Commit". None reference a requirement, a risk ID, an issue, or a change rationale. No convention (Conventional Commits or otherwise) is applied.
- **Commit granularity is unusable.** A single commit introduces the entire V2 product: 61 files, 5,777 insertions. There is no reviewable unit of change anywhere in the repository. Bisection, blame, and selective revert are all unavailable.
- **Two commits bypassed the local toolchain.** `163cac5` and `7115fd5` are GitHub web-UI uploads ("Add files via upload"), meaning no local build, typecheck or test ran before they entered history.
- **Binary artifacts committed without LFS.** `FocusFlow_App_Design.pptx` (174 KB) and `Prompt-01-Usage-Guide-GitHub-Copilot-and-VS-Code.pdf` (103 KB) on `main`. Not diffable, not mergeable, permanently in pack history.
- Author identity is inconsistent across commits (two display names for one email).

## 2.2 Branching Maturity — **2 / 10**

**Observed branch topology:**

```
master     ● acfa9b1 "V2"                    ← DEFAULT BRANCH, orphan root, no ancestors
           (no connection to anything below)

main       ● a9a681c ── ● 7115fd5 ── ● 870ddf9 ── ● 163cac5 ── ● b9e8755
dev_test   ● a9a681c   (identical to main, same SHA — exact duplicate)
dev                                          ● 163cac5 ── ● b9e8755   (3 commits behind main)
```

**Findings:**
- **The default branch is orphaned.** `origin/HEAD → origin/master`. Anyone cloning this repository receives V2 with no history and no access to V1's lineage.
- **`main` and `master` both exist and both hold product code.** `main` holds the V1 codebase at repository root. `master` holds the V2 codebase nested under a `FocusFlow/` subdirectory. There is no document in the repository explaining which branch is authoritative, and the CI workflow and the README disagree with the repository's own default-branch setting.
- **`dev_test` is a byte-identical duplicate of `main`** (both at `a9a681c`). It contributes nothing and adds ambiguity.
- **`dev` is stale** — 3 commits behind `main`, last touched 7 July, never merged, never deleted.
- **Zero merge commits exist in the repository.** Combined with the linear single-parent chains, this indicates all changes were pushed directly to branches; no pull request has been merged. *(Inference — PR history could not be read via API. A squash-merge strategy would also produce no merge commits, but squash merges to `main` would still leave `master` unexplained.)*
- **The documented branching model is not practised. [UNSUBSTANTIATED]** `README.md` states: *"Trunk-based, short-lived branches named `v<version>/<feature>` (e.g. `v2/recommendation-engine`), merged to `main` by pull request. `main` is always releasable."* No branch matching `v*/*` has ever existed. `main` has not received a commit since 31 July and does not contain the shipped product. No merge is recorded.
- No branch protection could be verified; the presence of direct pushes to the default branch indicates none is enforced on `master`.

**Credit where due:** `.github/pull_request_template.md` exists and is a genuinely good template — it requires the author to name the feature or risk addressed, confirm the domain test run, confirm typecheck, confirm physical-device testing for notification changes, and update `CHANGELOG.md` and `RISKS.md`. The template is well-designed. There is no evidence it has ever been used.

## 2.3 Release Management — **3 / 10**

**What exists:**
- `CHANGELOG.md`, in Keep a Changelog format, documenting two releases: `[2.0.0] — Predictive scheduling layer` and `[1.0.0] — Deterministic task manager`. Entries are written from the user's perspective, grouped Added / Changed / Notes. This is a competent changelog.
- Version identifiers are internally consistent: `package.json` `"version": "2.0.0"` and `app.json` `"version": "2.0.0"` agree.
- Product identity is fixed and consistent: `edu.cisc594.focusflow` for both Android package and iOS bundle identifier.
- Android `minSdkVersion: 26` is pinned in `app.json` — a deliberate, documented platform floor (cross-referenced in RISKS.md R2).

**What does not exist:**
- **No tags.** `git tag` returns nothing. The two releases described in `CHANGELOG.md` are not anchored to any commit. There is no way to check out v1.0.0 or v2.0.0.
- **No release artifacts.** No EAS build configuration (`eas.json` absent), no build job, no APK/AAB produced, no artifact upload step. The repository produces no distributable output.
- **No release procedure document.** Nothing describes how a version is cut, who approves it, or what must be true before a version number changes.
- **Version number has two sources of truth.** `package.json` and `app.json` both carry `2.0.0` and must be updated by hand in lockstep. They currently agree; nothing enforces that they continue to.
- **The V1 release is unrecoverable as described.** `CHANGELOG.md` describes 1.0.0 as a complete deterministic task manager. The nearest artifact is `main` at `a9a681c`, which is unlabelled, is not referenced by the changelog, and is not the ancestor of the V2 code.

## 2.4 CI/CD — **3 / 15**

**The entire pipeline, verbatim** (`FocusFlow/.github/workflows/ci.yml`):

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

**The design is sound.** Pinned action major versions, pinned Node 20, dependency caching, a fast domain-only test config chosen deliberately so the gate stays under ten seconds. The intent is correct.

**Three independent defects each prevent it from working:**

| # | Defect | Evidence | Effect |
|---|---|---|---|
| 1 | Trigger targets the wrong branch | `branches: [main]`; the workflow file and the code it tests exist only on `master` | Workflow never fires for the V2 codebase |
| 2 | `npm ci` cannot run | No `package-lock.json` on `master` (confirmed by directory listing) | Job fails at step 3, before any gate |
| 3 | `npm run typecheck` fails | Executed during this assessment against a resolved dependency tree: **5 errors** | Gate fails |

**Typecheck failures reproduced during assessment:**

```
src/components/CapacityMeter.tsx  TS2769 ×4  — `width`/`left` typed string, not DimensionValue
src/navigation.tsx(61,11)         TS2322 ×1  — TextStyle not assignable to narrowed StyleProp
```

All five are in the presentation layer. `src/domain` typechecks clean. *(Note: because no lockfile exists, this run used freshly resolved dependency versions — the inability to reproduce the author's exact dependency tree is itself finding #2 above.)*

**Absent entirely:**
- No CD of any kind. No build, no packaging, no signing, no distribution, no deployment.
- No lint step (and no linter installed — see §2.11).
- No coverage collection or reporting.
- No dependency or secret scanning; no Dependabot configuration.
- No status badge in `README.md`; a reader has no signal that the build is broken.
- No required-checks configuration verifiable.

## 2.5 Testing — **8 / 15**

**Executed during this assessment:**

```
$ npx jest -c jest.domain.config.js --ci

PASS __tests__/reminders.test.ts (5.769 s)
PASS __tests__/recommender.test.ts
PASS __tests__/logistic.test.ts
PASS __tests__/profile.test.ts
PASS __tests__/stats.test.ts
PASS __tests__/planning.test.ts
PASS __tests__/weights.test.ts

Test Suites: 7 passed, 7 total
Tests:      52 passed, 52 total
Time:       9.189 s
```

The counts claimed in `README.md` and `TESTPLAN.md` (52 tests, ~5s) are **accurate**. This is the strongest verified area of the repository.

**Notable strengths:**
- **Deterministic fixtures.** `src/domain/synthetic.ts` generates history from a fixed seed with known habits, so expected values are computed rather than snapshotted. The same fixture is loadable into the running app via Settings → Data → *Load the demo dataset*, meaning manual and automated testing exercise identical data. This is a well-designed approach.
- **Statistical assertions where appropriate.** `logistic.test.ts` buckets predictions into fifths across 120 seeded days and asserts weighted calibration error below 0.10 with no bucket (n ≥ 10) off by more than 0.20. Testing a probabilistic component with a calibration criterion rather than an equality check is correct practice.
- **Testability is architectural, not incidental.** `src/domain` contains no React and no SQLite imports. That is why the intelligent layer can be fully exercised in 9 seconds with no simulator.
- **`TESTPLAN.md` is a real test plan.** Ten scripted system tests (S1–S5b, S6–S10) with explicit pass criteria, two defined gates (V1 must pass S1–S5 before V2 work begins; V2 re-runs all as regression), and an explicit instruction to record pass/fail, defect ID, severity and build SHA per case.

**Coverage gap, quantified:**

| Layer | LOC | Automated tests |
|---|---:|---|
| `src/domain` | 1,393 | **52 tests** |
| `src/screens` | 1,096 | none |
| `src/db` (+ 7 repos) | 736 | none |
| `src/components` | 696 | none |
| `src/services` | 404 | none |
| `src/state` | 218 | none |
| **Untested total** | **3,150** | **0** |

**Deficiencies:**
- **69% of the source has no automated test.** Every persistence path, every migration, every notification-scheduling side effect, and every screen is verified only by manual execution.
- **No test results are recorded anywhere.** `TESTPLAN.md` mandates recording pass/fail, defect ID, severity and build SHA for each case. No results file, defect log, or execution record exists in any branch. The V1 quality gate is therefore documented but unevidenced.
- **No coverage measurement.** `coverage/` is gitignored; no `--coverage` flag, no thresholds, no reporting.
- `jest-expo` is configured as the default preset for component tests, but no component test file exists.
- No end-to-end automation (no Detox, Maestro, or equivalent) despite S1–S5b being pure UI flows that are automatable.
- Notification behaviour — the highest-risk area per R2 and R6 — is verified only on a physical device, by hand, with no recorded evidence.

## 2.6 Documentation — **11 / 15**

This is the repository's strongest dimension by a wide margin.

**Present and substantive:**

| Artifact | Branch | Assessment |
|---|---|---|
| `README.md` | master | Excellent. Run instructions, an accurate ASCII architecture diagram, a V1-vs-V2 comparison table, a seven-step walkthrough of the learning pipeline, explicit cold-start behaviour, and an honest note that notifications do not fire in Expo Go on Android 13+. |
| `CHANGELOG.md` | master | Keep a Changelog format, two versions, user-visible framing. |
| `RISKS.md` | master | Six risks with status, mitigation locations, cited tests, named residuals. See §2.10. |
| `TESTPLAN.md` | master | Ten system tests with numeric pass criteria. See §2.5. |
| `.github/pull_request_template.md` | master | Five-item checklist tying every PR to tests, typecheck, device verification, changelog and risk register. |
| `docs/Product_Requirements_Document.md` | **main only** | 249 lines: vision, scope, 7 Level-1 and 14 Level-2 capabilities, undesirable events, risk analysis, prioritisation, mitigation. |
| `FocusFlow_App_Design.pptx` | **main only** | Design deck (binary). |

**Code-level documentation is purposeful, not decorative.** `jest.domain.config.js` opens by explaining *why* two Jest configurations exist and which one CI runs. `src/db/schema.ts` explains that the V2 input columns were deliberately written in migration 1 so that enabling prediction requires no migration. These comments record decisions, which is the useful kind.

**Deficiencies:**
- **Documentation describes a process the repository does not follow. [UNSUBSTANTIATED]** The `README.md` "Repository conventions" section is contradicted by every piece of repository evidence (§2.2). A reviewer reading only the documentation would form a materially false impression of how this project is managed. This is the most damaging documentation defect present, because it converts a strength into a credibility liability.
- **The PRD is on the wrong branch.** `docs/Product_Requirements_Document.md` exists only on `main`. The code it specifies is on `master`. A developer working on the product cannot see the requirements without switching branches to an unrelated history.
- **A referenced document does not exist.** `main`'s `README.md` cites `FocusFlow_Proposal_594.docx` as "the full spec this skeleton implements against." That file is not present on any branch.
- **`main`'s README is stale and contradicts `master`.** It documents Expo SDK 51 / React Native 0.74; `master`'s `package.json` pins Expo ~52.0.28 / React Native 0.76.6.
- **Missing governance files:** no `LICENSE` (the work is legally unlicensed — all rights reserved by default, blocking any reuse), no `CONTRIBUTING.md`, no `CODEOWNERS`, no `SECURITY.md`, no issue templates.
- No architecture decision records. Significant decisions (pure-domain layering, reload-on-write state, single-provider context, no-migration V2) are explained in prose but not captured as dated, numbered decisions.

## 2.7 Configuration Items — **4 / 8**

**CIs identified, and their actual control status:**

| # | Configuration item | Location | Controlled? |
|---|---|---|---|
| CI-01 | Application source | `FocusFlow/src/**` (4,543 LOC TS/TSX) | Yes — versioned |
| CI-02 | Test source | `FocusFlow/__tests__/**` (562 LOC) | Yes — versioned |
| CI-03 | **Database schema** | `src/db/schema.ts` — `MIGRATIONS[]` under `PRAGMA user_version`, `LATEST_VERSION` derived from the array | **Yes — strongest CI in the repository** |
| CI-04 | Build configuration | `package.json`, `app.json`, `tsconfig.json`, `babel.config.js`, `jest.domain.config.js` | Yes — versioned |
| CI-05 | **Dependency closure** | `package.json` only | **NO — no lockfile on `master`** |
| CI-06 | Product identity | `edu.cisc594.focusflow`; version `2.0.0` in **two** files | Partial — dual source of truth |
| CI-07 | Platform floor | `minSdkVersion: 26`, permissions list in `app.json` | Yes — versioned, cross-referenced in R2 |
| CI-08 | **Model tuning constants** | See table below | Yes — versioned and documented |
| CI-09 | Process documentation | `README`, `CHANGELOG`, `RISKS`, `TESTPLAN` | Yes — but on `master` only |
| CI-10 | Requirements baseline | `docs/Product_Requirements_Document.md` | Partial — on `main` only, severed from code |
| CI-11 | Design binaries | `.pptx`, `.pdf` on `main` | Weak — binary, no LFS, not diffable |
| CI-12 | CI pipeline definition | `.github/workflows/ci.yml` | Versioned, but non-functional (§2.4) |

**CI-08 — behaviour-defining constants, verified in source during this assessment:**

| Constant | Value | Location | Documented in |
|---|---|---|---|
| `COLD_START_MIN_COMPLETIONS` | 12 | `domain/profile.ts:14` | RISKS R4 |
| `MODEL_MIN_SAMPLES` | 20 | `domain/logistic.ts:28` | RISKS R4 |
| `MIN_WEIGHT` | 0.05 | `domain/weights.ts:21` | RISKS R4 |
| `MAX_WEIGHT` | 0.45 | `domain/weights.ts:22` | RISKS R4 |
| L2 regularisation | 0.02 | `domain/logistic.ts:79` | RISKS R4 |
| Learning rate / epochs / seed | 0.15 / 60 / 42 | `domain/logistic.ts:79` | partially |
| Engagement decay half-life | 14 days | `domain/profile.ts` | README |

Every constant cited in `RISKS.md` was located at the stated file and found to hold the stated value. **This is verified, working configuration control over the parameters that define the product's behaviour** — genuinely good practice, and rarer than it should be.

**The critical gap is CI-05.** Without `package-lock.json`, the dependency closure is not a configuration item at all. Ranges such as `"expo": "~52.0.28"` and `"@react-navigation/native": "^7.0.14"` resolve differently over time. Two builds of the same commit can differ. `main` has a lockfile (18,148 lines, added in `870ddf9`); `master` — the branch that actually holds the shipped product — does not.

## 2.8 Baselines — **2 / 7**

**One functioning baseline mechanism exists, and it is in code, not in Git.**

`src/db/schema.ts` defines an ordered `MIGRATIONS[]` array applied against SQLite's `PRAGMA user_version`, with `LATEST_VERSION` derived from the array's last element. Migration 1 establishes eight tables (`projects`, `tags`, `tasks`, `task_tags`, `events`, `day_plans`, `settings`, `scheduled_notifications`); migration 2 adds `model_state` and no columns. Any device can be identified as being at a known schema baseline and advanced deterministically. **This is a correct, enforced baseline.**

**Every other baseline is nominal:**

| Intended baseline | Declared in | Anchored to a commit? |
|---|---|---|
| v1.0.0 release | `CHANGELOG.md`, `README.md` | **No — no tag** |
| v2.0.0 release | `CHANGELOG.md`, `README.md`, `package.json`, `app.json` | **No — no tag** |
| V1 quality gate (S1–S5 pass) | `TESTPLAN.md` | **No — no recorded results** |
| V2 quality gate (S1–S10 pass) | `TESTPLAN.md` | **No — no recorded results** |
| "v1.0.0 freeze" (closes risk R3) | `RISKS.md` R3 | **No — no freeze artifact exists** |
| Schema baseline | `src/db/schema.ts` | **Yes — `user_version` 1, 2** |

**Consequences:**
- **No release is reproducible.** No commit is identifiable as v1.0.0 or v2.0.0. Even if one were, the absence of a lockfile means the dependency closure could not be reconstructed.
- **R3's closure is unsubstantiated.** `RISKS.md` states R3 is "Closed at the v1.0.0 freeze." The technical argument for closure is sound and verifiable in `schema.ts` — but the freeze event that the closure is predicated on left no artifact.
- **No rollback point exists.** With no tag and a severed history, there is no commit to return to if V2 proves defective.
- `TESTPLAN.md` asks testers to record a build SHA per case — the correct instinct, undermined by there being no build and no results record.

## 2.9 Traceability — **3 / 5**

**Chains that exist and were verified end to end:**

`RISKS.md` R4 → `COLD_START_MIN_COMPLETIONS = 12` at `profile.ts:14` → asserted by `__tests__/logistic.test.ts`, `__tests__/weights.test.ts` → covered by `TESTPLAN.md` §S10. **Every link checked; every link holds.**

`RISKS.md` R5 → `domain/recommender.ts` (score is the sum of the same `Contribution` objects the UI renders) → `__tests__/recommender.test.ts` asserts contributions sum exactly to the score → `TESTPLAN.md` §S9. **Verified.**

`TESTPLAN.md` §S6–S10 → each names the specific test file that automates it. **Verified.**

`RISKS.md` R2 → `app.json` `minSdkVersion: 26` and `services/notifications.ts` channel creation → `TESTPLAN.md` §S4. **Verified.**

Risk-to-code-to-test traceability at this quality is above the standard typical for a project of this size and should be preserved through any remediation.

**Chains that are broken:**

- **Requirements → code has no path, and three incompatible numbering schemes are in play.** The PRD (`main`) numbers capabilities 1.1–7.2 under §3.2. `main`'s README maps screens to "(2.1)", "(2.2)", "(2.3)" — the *proposal's* numbering, from a document not in the repository. `.github/pull_request_template.md` (`master`) instructs authors to cite `e.g. "2.5 Predictive scheduling"` — **§2 of the PRD is "Product Scope"; there is no §2.5, and no "Predictive scheduling" requirement identifier resolves anywhere in the repository.** No requirement identifier of any scheme appears in any file under `master:FocusFlow/src/`.
- **Commit → requirement / risk / issue: zero coverage.** No commit message references any identifier. No issue tracker is in use.
- **Test execution → build: no record.** `TESTPLAN.md` requires a build SHA per case; none exists.
- **Change → review: no record.** No merged PR, no review comment, no approval anywhere in Git history.
- **Requirements are on a different branch from the code**, and the two branches share no ancestor — so the requirements baseline and the implementation cannot even be diffed against one another.

## 2.10 Risk Management — **4 / 5**

`RISKS.md` is a genuine, well-formed risk register and the second-strongest artifact in the repository. Six risks, each with a status (Open / Mitigated / Closed), a stated mitigation, the file the mitigation lives in, the test that proves it, and — importantly — a named residual.

| ID | Risk | Status | Mitigation verified in source? |
|---|---|---|---|
| R1 | Scope creep | Mitigated | Process-only; not verifiable in code |
| R2 | Mobile platform variance | Mitigated | **Yes** — `minSdkVersion: 26` in `app.json`; `scheduled_notifications` table in `schema.ts`; quiet hours in `domain/reminders.ts` |
| R3 | Data model lock-in | Closed | **Partially** — the technical claim holds (migration 2 adds one table, no columns), but the "v1.0.0 freeze" it is closed against left no artifact |
| R4 | Cold start / overfitting | Mitigated | **Yes** — all five named constants located and matched |
| R5 | Explanation drift | Mitigated | **Yes** — single code path confirmed; test asserts exact sum |
| R6 | Notification fatigue | **Open** | Correctly open; no per-day cap exists |

**Strengths:** Residual risks are stated rather than hidden — R4 openly concedes that calibration is measured on the training set and that a held-out split is backlog work. R6 is left open with the current state described honestly. Mitigations point to checkable locations, which is what makes the register auditable rather than decorative.

**Deficiencies:**
- **No probability × impact scoring, no severity ranking, no owner, no review date, no target date.** R6 is open indefinitely with no commitment attached.
- **Two divergent risk registers exist on two unrelated branches.** `RISKS.md` on `master` (six technical risks) and PRD §§4–7 on `main` (undesirable events, risk analysis, prioritisation, mitigation). Neither references the other; they cannot be reconciled by merge.
- **Configuration and process risks are entirely absent from the register.** Not recorded anywhere: bus factor of 1; no lockfile; non-functional CI; orphaned default branch; no recoverable release point; no license. These are the risks currently most likely to cause loss, and none of them is tracked.

## 2.11 Technical Debt — **3 / 5**

**Debt inventory, ordered by severity, all items evidenced:**

| # | Item | Evidence | Severity |
|---|---|---|---|
| D1 | No `package-lock.json` on `master` | Directory listing | **Critical** — breaks CI and all reproducibility |
| D2 | CI triggers on `main`, code is on `master` | `ci.yml` line 4–7 | **Critical** — pipeline never runs |
| D3 | Orphaned V2 history | `acfa9b1` has no parent | **Critical** — permanent, unrecoverable |
| D4 | No tags / no baseline | `git tag` empty | **High** |
| D5 | 5 TypeScript errors | Reproduced: `CapacityMeter.tsx` ×4, `navigation.tsx` ×1 | **High** — declared gate fails |
| D6 | `lint` script declared but unrunnable | `package.json` declares `eslint . --ext .ts,.tsx`; **eslint is not in `devDependencies` and no eslint config file exists** | **Medium** |
| D7 | 3,150 LOC with zero automated tests | §2.5 table | **Medium** |
| D8 | `any` at the React Navigation boundary | `TaskEditScreen.tsx:14` (`route: any; navigation: any`), `:55` (`as any`); `TodayScreen.tsx:15`; `TasksScreen.tsx:14`; `taskRepo.ts:153` (`as any[]`) | **Medium** — defeats `strict: true` at the boundary |
| D9 | Branch clutter | `dev_test` identical to `main`; `dev` 3 commits stale | **Low** |
| D10 | Version duplicated in two manifests | `package.json` + `app.json` | **Low** |
| D11 | Binary docs in Git without LFS | 277 KB across `.pptx` + `.pdf` | **Low** |
| D12 | Calibration on training data | Self-declared in RISKS R4 residual | **Low** — already tracked |

**Debt-avoidance practices actually in place (credit given):**
- Zero `TODO` / `FIXME` / `HACK` / `XXX` markers across 5,105 lines.
- Zero `console.*` statements in `src/`.
- Zero `@ts-ignore` / `@ts-expect-error` suppressions.
- `strict: true` in `tsconfig.json`.
- Clean domain / infrastructure separation, enforced by the domain layer importing neither React nor SQLite.
- Repository-layer pattern: 7 focused repositories under `db/repos/` rather than one monolith.

The debt here is **not code rot — it is process and toolchain debt.** The source is clean; the machinery around it is not connected.

---

# 3. Missing Artifacts

Grouped by consequence. **Bold** items block a functioning pipeline or a reproducible release.

### 3.1 Blocking — reproducibility and pipeline

| Artifact | Consequence of absence |
|---|---|
| **`FocusFlow/package-lock.json`** | `npm ci` fails; no two builds are guaranteed identical; CI cannot run at all |
| **Git tags `v1.0.0`, `v2.0.0`** | No release is identifiable, checkoutable, or rollback-able |
| **Corrected CI trigger** | The workflow has never executed against the product code |
| **A stated trunk decision** (`main` vs `master`) | Documentation, CI config and repository default all disagree |

### 3.2 Governance and legal

| Artifact | Consequence |
|---|---|
| **`LICENSE`** | Work is all-rights-reserved by default; no third party may legally use, fork or evaluate it |
| `CONTRIBUTING.md` | Branch naming, commit format and PR expectations exist only in a README paragraph |
| `CODEOWNERS` | No review requirement can be enforced |
| `SECURITY.md` | No disclosure path |
| `.github/ISSUE_TEMPLATE/` | No structured defect intake — and `TESTPLAN.md` requires defect IDs that have nowhere to live |

### 3.3 Quality gates

| Artifact | Consequence |
|---|---|
| `.eslintrc` / `eslint.config.js` + the `eslint` dependency | The declared `lint` script cannot run |
| `.prettierrc` | No enforced formatting |
| Coverage thresholds + `--coverage` in CI | Coverage is unmeasured and can regress silently |
| Lint and coverage steps in `ci.yml` | Neither is gated |
| `.nvmrc` / `engines` in `package.json` | Node 20 pinned in CI only, not for contributors |
| `.editorconfig` | No cross-editor consistency |

### 3.4 Configuration management records

| Artifact | Consequence |
|---|---|
| **Test execution records** (`docs/test-results/`) | `TESTPLAN.md` mandates recording pass/fail, defect ID, severity, build SHA — no record exists, so neither quality gate is evidenced |
| **Defect log** | No defect has a home; `TESTPLAN.md`'s defect-ID field is unusable |
| Requirements traceability matrix | No mapping from PRD capabilities to modules to tests |
| Release procedure (`docs/RELEASING.md`) | No defined cut, approval or sign-off process |
| Configuration Item register | The CI list in §2.7 exists only in this report |
| Architecture decision records | Key decisions are prose, not dated numbered records |
| Consolidated risk register | Two divergent registers on two unrelated branches |

### 3.5 Build and delivery

| Artifact | Consequence |
|---|---|
| `eas.json` (or equivalent build config) | No distributable artifact can be produced |
| Build/artifact job in CI | Nothing verifies the app actually builds — only that it typechecks and its domain tests pass |
| `dependabot.yml` | No dependency-update or vulnerability signal |
| CI status badge in `README.md` | A reader cannot see that the build is broken |
| Signing key management procedure | `.gitignore` correctly excludes keys; nothing documents where they live |

### 3.6 Repository hygiene

| Artifact | Consequence |
|---|---|
| Deletion of `dev_test` | Duplicate of `main`, adds only ambiguity |
| Deletion or rebase of `dev` | 3 commits stale, permanently |
| `FocusFlow_Proposal_594.docx` | Referenced by `main`'s README; not present in the repository |
| Git LFS configuration | 277 KB of binaries in pack history without it |

---

# 4. Recommended Next Commits

Sequenced. Each is a single reviewable commit with a stated verification step. Steps 1–4 are the critical path and are achievable in one working session.

---

### Commit 1 — Decide and declare the trunk

```
chore(cm): declare master as trunk and record the v1/v2 history split

The V2 codebase was introduced as an orphan commit on master with no
ancestry to the V1 lineage on main. That history cannot be recovered.
This commit records the split rather than pretending it did not occur,
and names master as the single trunk going forward.

- Add docs/BRANCHING.md documenting the actual model
- Correct README "Repository conventions" to describe what is practised
- Note that main holds the V1 lineage and is retained read-only for reference
```

*Also do, outside Git:* set the GitHub default branch explicitly, and enable branch protection on the trunk (require the CI check, require one approving review, forbid force-push).

**Why first:** every subsequent decision depends on knowing which branch is authoritative.

**Verify:** `git branch -a` and the README now agree with the GitHub default-branch setting.

---

### Commit 2 — Restore dependency reproducibility

```
build(deps): commit package-lock.json to pin the dependency closure

npm ci requires a lockfile and the CI job fails without one. More
importantly, without it no two builds of the same commit are guaranteed
to resolve identical dependencies (CM-05).
```

Run `npm install` on a clean checkout, then commit the resulting `FocusFlow/package-lock.json` (~18k lines, matching the precedent already set on `main` in `870ddf9`).

**Verify:** `rm -rf node_modules && npm ci` completes successfully.

---

### Commit 3 — Make the pipeline actually run

```
ci: correct workflow trigger to the trunk branch and add working-directory

The workflow triggered on `main` while the code it verifies lives on
`master`, so it has never executed against the V2 codebase. Also sets
the working directory, since the project is nested under FocusFlow/.
```

Change `branches: [main]` → `branches: [master]` in both `on.push` and `on.pull_request`, and add:

```yaml
defaults:
  run:
    working-directory: FocusFlow
```

**Verify:** push and confirm a run appears in the Actions tab. It will fail at the typecheck step — that is the correct next signal, and Commit 4 fixes it.

---

### Commit 4 — Make the typecheck gate pass

```
fix(ui): correct DimensionValue typing in CapacityMeter and navigation

Five TS errors were blocking `npm run typecheck`, the CI quality gate:
- CapacityMeter.tsx: percentage `width`/`left` typed as string (TS2769 ×4)
- navigation.tsx:61: TextStyle not assignable to narrowed StyleProp (TS2322)

No behavioural change; the domain layer was already clean.
```

Type the percentage values as `` `${number}%` `` (or `DimensionValue`) rather than `string`.

**Verify:** `npm run typecheck` exits 0. The CI run from Commit 3 turns green.

---

### Commit 5 — Establish the first real baseline

```
chore(release): tag v2.0.0

CHANGELOG.md has described 2.0.0 since the V2 commit, but no tag anchored
it to a commit and no release was checkoutable or rollback-able.
```

```bash
git tag -a v2.0.0 -m "Version 2.0.0 — predictive scheduling layer" && git push origin v2.0.0
```

Then add a CI badge to `README.md` in the same commit.

**Also do:** create a GitHub Release from the tag with the `CHANGELOG.md` 2.0.0 body.

**Note on v1.0.0:** it can be tagged on `main` at `a9a681c` as an approximation, but that commit is not the ancestor of the shipped product and predates the changelog's V1 description. If tagged, the tag message must say so. Do not backdate a claim the history does not support.

**Verify:** `git tag` returns `v2.0.0`; `git checkout v2.0.0` yields a buildable tree.

---

### Commit 6 — Restore the lint gate and remove the `any` boundary

```
chore(lint): install eslint, add config, and wire it into CI

package.json has declared a `lint` script since the V2 commit, but eslint
was never a dependency and no config file existed, so the script could
never run.
```

Add `eslint`, `@typescript-eslint/*` and `eslint-plugin-react-hooks` to `devDependencies`; add `eslint.config.js`; add a `- run: npm run lint` step to `ci.yml`. In the same commit, replace `route: any; navigation: any` in `TaskEditScreen.tsx`, `TodayScreen.tsx` and `TasksScreen.tsx` with generated React Navigation prop types, and remove the `as any[]` cast at `taskRepo.ts:153`.

**Verify:** `npm run lint` exits 0; `npm run typecheck` still exits 0; 52 tests still pass.

---

### Commit 7 — Close the requirements traceability gap

```
docs(traceability): relocate the PRD to the trunk and add a traceability matrix

The PRD lived only on main, severed from the code it specifies. The PR
template also instructed authors to cite requirement IDs ("2.5 Predictive
scheduling") that resolve against no document in the repository.
```

- Copy `docs/Product_Requirements_Document.md` from `main` onto the trunk.
- Add `docs/TRACEABILITY.md`: PRD capability ID → source module → test file → `TESTPLAN.md` section, using the PRD's own §3.2 numbering (1.1–7.2) as the single authority.
- Correct `.github/pull_request_template.md` to cite a real ID (e.g. `3.2 Reorder Tasks`) instead of `2.5`.
- Merge PRD §§4–7 risk content into `RISKS.md` so one register exists.

**Verify:** every ID cited in the PR template and `TRACEABILITY.md` resolves to a heading in the PRD.

---

### Commit 8 — Start recording evidence

```
docs(qa): add test-results records and a defect log

TESTPLAN.md requires recording pass/fail, defect id, severity and build sha
per case. Nothing recorded any of it, so neither quality gate is evidenced.
```

Add `docs/test-results/2026-08-DD-v2.0.0.md` with one row per `TESTPLAN.md` case (S1–S10) carrying result, defect ID, severity, device, and the tag/SHA under test. Add `docs/DEFECTS.md`, or enable GitHub Issues and add issue templates — either is acceptable, but the defect IDs `TESTPLAN.md` demands must resolve somewhere.

**Verify:** every `TESTPLAN.md` case has a corresponding row referencing `v2.0.0`.

---

### Then, and only then — repository hygiene

Once the above are merged: `git push origin --delete dev_test` (byte-identical duplicate of `main`) and `git push origin --delete dev` (3 commits stale). Add `LICENSE`, `CONTRIBUTING.md`, `.nvmrc`, `.editorconfig` and `dependabot.yml` as one housekeeping commit.

---

# 5. Repository Maturity Score

## 5.1 Scoring

| # | Dimension | Score | Weight | Basis |
|---|---|---:|---:|---|
| 1 | Version control | 4 | 10 | Git + strong `.gitignore`; but 6 commits, uninformative messages, 5,777-line single commit, orphan history, 2 web uploads |
| 2 | Branching | 2 | 10 | 4 branches, 0 merges, 0 PRs merged, documented model never practised, default branch orphaned, 1 duplicate + 1 stale branch |
| 3 | Release management | 3 | 10 | Good CHANGELOG, consistent version strings; zero tags, zero releases, zero build artifacts |
| 4 | CI/CD | 3 | 15 | Well-designed workflow; wired to wrong branch, fails at `npm ci`, fails at typecheck, no CD |
| 5 | Testing | 8 | 15 | **52/52 passing, verified**; deterministic fixtures; strong TESTPLAN — but 69% of source untested, no coverage gate, no recorded results |
| 6 | Documentation | 11 | 15 | Genuinely strong across 6 artifacts; deducted for doc/reality divergence, PRD on wrong branch, no LICENSE |
| 7 | Configuration items | 4 | 8 | Schema migrations and tuning constants well controlled; **no lockfile**, dual version source, uncontrolled binaries |
| 8 | Baselines | 2 | 7 | Schema `user_version` is a real baseline; nothing else is anchored — no tags, no gate evidence |
| 9 | Traceability | 3 | 5 | Risk→code→test verified end to end; requirements→code entirely broken with 3 conflicting ID schemes |
| 10 | Risk management | 4 | 5 | Auditable 6-risk register with named residuals; no scoring/owners/dates, two divergent registers, no process risks |
| 11 | Technical debt | 3 | 5 | Clean source (0 TODO/console/ts-ignore); but 12 evidenced debt items, 3 critical, none tracked |
| | **Total** | **47** | **100** | |

## 5.2 Rating

> ## **47 / 100 — Level 2: Documented, Not Enforced**

| Level | Range | Description | |
|---|---|---|---|
| 1 — Ad hoc | 0–29 | No process, no documentation | |
| **2 — Documented, not enforced** | **30–54** | **Process described accurately; not mechanically enforced** | **← current** |
| 3 — Repeatable | 55–74 | Process enforced by tooling; releases reproducible | target |
| 4 — Managed | 75–89 | Measured, gated, traceable end to end | |
| 5 — Optimising | 90–100 | Continuously improved, fully automated | |

## 5.3 Reading the score

The distribution matters more than the total. Documentation scores 73% of its available weight; Testing scores 53%. **Branching scores 20% and Baselines score 29%.** That spread is diagnostic: this is not an immature *engineer*, it is an **unmanaged repository**. Someone who writes a calibration criterion of "weighted error below 0.10, no bucket with n ≥ 10 off by more than 0.20" understands rigour. That rigour simply was never applied to the repository itself.

The score is also **artificially depressed by four mechanical defects** — no lockfile, wrong CI trigger, five type errors, no tags. Those four cost roughly 18 points across dimensions 3, 4, 7 and 8, and all four are fixable in a day. Commits 1–5 in §4 alone move this repository to approximately **62/100 (Level 3)** with no new features written.

Three findings will remain permanently visible regardless of remediation: the orphaned V2 history cannot be repaired, `main`'s severed V1 lineage cannot be reattached, and the six-commit history cannot be given retroactive granularity. These are worth stating openly in `docs/BRANCHING.md` rather than leaving a reader to discover them.

---

# 6. Roadmap Toward Industry Best Practices

Four phases. Each has an entry state, concrete deliverables, and a measurable exit criterion.

---

## Phase 1 — Restore Control *(≈1 day → Level 3, ~62/100)*

**Entry:** No functioning pipeline, no reproducible build, no baseline.

Execute Commits 1–5 from §4.

**Deliverables:** trunk declared and protected · `package-lock.json` committed · CI triggering on the trunk with a working directory · typecheck passing · `v2.0.0` tagged and released · CI badge in README.

**Exit criteria — all must hold:**
- A green CI run exists in the Actions tab against the trunk.
- `git checkout v2.0.0 && npm ci && npm run typecheck && npx jest -c jest.domain.config.js` succeeds from a clean clone.
- Branch protection blocks direct pushes to the trunk.

**This phase is the whole game.** Nothing after it is worth much until a reproducible, verified build exists.

---

## Phase 2 — Enforce the Documented Process *(≈1 week → ~72/100)*

**Entry:** Pipeline green, baseline tagged.

Execute Commits 6–8. Then:
- Add lint and `--coverage` steps to CI; set an initial coverage threshold at the current measured domain figure and ratchet it upward, never downward.
- Add `LICENSE`, `CONTRIBUTING.md`, `CODEOWNERS`, `.nvmrc`, `.editorconfig`, issue templates.
- Delete `dev_test` and `dev`.
- Adopt Conventional Commits and enforce with `commitlint` in CI.
- **Actually use the PR template for the next change.** The template is already good; it has simply never been exercised.

**Exit criteria:**
- The next feature ships through a branch → PR → review → merge → CHANGELOG-updated cycle, and the merge commit proves it.
- `npm run lint`, `npm run typecheck` and the test suite are all required checks.
- Every `TESTPLAN.md` case has a recorded result against a tagged build.
- Zero `any` at the navigation boundary.

---

## Phase 3 — Extend Verification and Automate Delivery *(≈2–4 weeks → ~82/100, Level 4)*

**Entry:** Process enforced, evidence recorded.

**Close the 3,150-LOC test gap, in risk order:**
1. `src/db` (736 LOC) — migration tests asserting `user_version` transitions and idempotency; repository tests against an in-memory SQLite instance. Migrations are the highest-consequence untested code: a defect here corrupts user data irreversibly.
2. `src/services/notifications.ts` — this is the subject of two open/mitigated risks (R2, R6) and is currently verified only by hand on a physical device.
3. `src/state` and `src/components` — component tests using the already-configured `jest-expo` preset.
4. E2E automation (Maestro or Detox) for `TESTPLAN.md` §S1–S3 and §S5b, which are deterministic UI flows and fully automatable.

**Automate delivery:**
- Add `eas.json`; add a build job producing a signed Android artifact.
- Tag-triggered release workflow: on `v*` tag → build → attach artifact to the GitHub Release → generate release notes from `CHANGELOG.md`.
- Add `dependabot.yml` and a vulnerability-scanning step.

**Close R6** — implement the per-day reminder cap and spacing rule already planned in `RISKS.md`, with a test, and move the risk to Mitigated. This exercises the whole chain: risk → issue → branch → PR → test → changelog → tag.

**Exit criteria:** pushing a `v*` tag produces a downloadable signed artifact with no manual step · every `RISKS.md` mitigation has a named automated test · coverage measured on all layers · every PRD capability maps to a module and a test in `TRACEABILITY.md`.

---

## Phase 4 — Manage and Improve *(ongoing → 90+, Level 5)*

- **Automate version consistency.** Single-source the version (`package.json` → `app.json` via `expo-constants` or a prebuild script) so the two manifests cannot drift.
- **Automate the changelog** from Conventional Commits; keep human editing for the user-visible framing that makes the current changelog good.
- **Put the risk register under review cadence** — add owner, probability, impact and next-review-date columns; review at each version boundary. Add the process risks currently missing entirely: bus factor, dependency currency, release recoverability.
- **Adopt ADRs.** Record the decisions the README currently explains in prose — pure-domain layering, reload-on-write state, the no-migration V2 design — as dated, numbered, immutable records.
- **Close the R4 residual.** Replace training-set calibration with a held-out temporal split, already identified in `RISKS.md` as backlog work.
- **Track DORA-style metrics** once merges exist to measure: lead time, change failure rate, mean time to restore.
- **Retain Git LFS** for design binaries going forward.

---

## Summary trajectory

| Phase | Effort | Score | Level |
|---|---|---:|---|
| Current | — | **47** | 2 — Documented, not enforced |
| 1 — Restore control | ~1 day | ~62 | 3 — Repeatable |
| 2 — Enforce process | ~1 week | ~72 | 3 — Repeatable (upper) |
| 3 — Extend verification, automate delivery | 2–4 weeks | ~82 | 4 — Managed |
| 4 — Manage and improve | ongoing | 90+ | 5 — Optimising |

**The closing observation is the same as the opening one.** This repository already contains the artifacts that are normally hardest to produce: an honest risk register with checkable mitigations, a test plan with numeric pass criteria, deterministic fixtures, a clean architectural boundary that makes the important logic testable in nine seconds, and a README that explains the system accurately. What it lacks is the mechanical enforcement that makes those artifacts binding — a lockfile, a tag, a correct trigger, a protected branch, a merge commit.

The unusual thing about this assessment is that the recommendation is not "write better documentation" or "adopt a process." The process is already written down and it is a good one. The recommendation is: **make the repository do what its own documentation already says it does.**

---

*Prepared from a full clone at `acfa9b1` (master), `a9a681c` (main/dev_test), `163cac5` (dev). All quality gates cited were executed during assessment. GitHub REST API was rate-limited; PR, Actions-run, Releases and branch-protection history could not be read directly and are inferred from Git evidence where noted.*
