# Releasing FocusFlow

This document describes the release process for the FocusFlow repository.

## Preconditions

Before creating a release, verify all of the following:

- The current `master` branch is up to date and the release commit is on `master`.
- `FocusFlow/.github/pull_request_template.md` has been used for the PR.
- The working tree is clean and all changes are committed.
- The project is built from the nested `FocusFlow/` directory.
- `FocusFlow/TESTPLAN.md` sections S1 through S10 have been executed and recorded.
- `FocusFlow/CHANGELOG.md` includes the new release notes for the intended version.
- `FocusFlow/RISKS.md` has been reviewed for any affected risks.

## Local verification

From the repository root:

```bash
cd FocusFlow
npm ci
npm run lint
npm run typecheck
npx jest -c jest.domain.config.js --ci
cd ..
```

If any step fails, do not create the release.

## Version bump

Update the following files before tagging:

- `FocusFlow/package.json` — bump the `version` field.
- `FocusFlow/package-lock.json` — regenerate with `npm install` if dependencies changed.
- `FocusFlow/CHANGELOG.md` — add the release notes under the new version heading.

## Tagging

Tags are created from the `master` branch only.

Use annotated tags with the release name and a short description.

Example:

```bash
git checkout master
git pull origin master
git tag -a v2.0.0 -m "Version 2.0.0 — predictive scheduling layer

Ranking, completion prediction, adaptive reminders and the Why this? panel, per CHANGELOG.md [2.0.0]. Domain suite: 52 tests. Schema: user_version 2."
git push origin v2.0.0
```

If a historical baseline tag is required, create it explicitly with an honest message.
For example:

```bash
git tag -a v1.0.0 -m "Version 1.0.0 — deterministic task manager (reconstructed)

NOTE: this tag marks the nearest surviving V1 artifact on the main lineage. It is NOT an ancestor of the shipped V2 code — the V2 codebase entered the repository as an orphan root commit — and it predates the CHANGELOG.md [1.0.0] description. Applied retrospectively so that a V1 baseline exists at all."
git push origin v1.0.0
```

## Release notes

The release notes should be taken from the matching section in `FocusFlow/CHANGELOG.md`.

## Sign-off

A release is approved when both the author and a reviewer confirm:

- CI is green on `master`.
- `TESTPLAN.md` checks were completed.
- `CHANGELOG.md`, `RISKS.md`, and `FocusFlow/package.json` are updated.

## Rollback

To roll back a release:

```bash
git checkout <previous-tag>
```

If the release commit itself must be undone on `master`:

```bash
git checkout master
git revert <release-commit>
git push origin master
```
