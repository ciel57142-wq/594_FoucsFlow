# Branching and release workflow

This repository uses a simple, enforceable trunk-based workflow.

## Branches

- `master` is the trunk and the default development branch.
- `main` is retained as a read-only archive of the Version 1 lineage only.

## Working branches

Use short-lived branches named:

- `feature/<short-description>`
- `fix/<short-description>`
- `chore/<short-description>`

Do not keep long-lived feature branches alive. Branches are deleted after merge.

## Pull requests

All changes land through pull requests against `master`.
A PR must be reviewed and CI must pass before merge.

Use `.github/pull_request_template.md` to document:

- what changed
- what requirement or risk was addressed
- the verification steps taken

## CI and verification

The repository’s GitHub Actions workflow in `.github/workflows/ci.yml` runs on
pull requests and pushes to `master`.

It verifies:

- `npm run lint`
- `npm run typecheck`
- `npx jest -c jest.domain.config.js --ci`

## Releases

Releases are created from `master` only.
Tags are annotated and follow the form `vMAJOR.MINOR.PATCH`.

Do not create release tags from feature branches or `main`.

## History note: the V1/V2 split

The Version 2 codebase entered this repository on 4 August 2026 as commit
`acfa9b1`, an orphan root commit with no parent and no shared ancestry with the
Version 1 lineage on `main`.

The incremental development between `v1.0.0` and `v2.0.0` was not captured in
version control and cannot be reconstructed.

A merge with `--allow-unrelated-histories --strategy=ours` has since joined
the two lineages so that V1 history is reachable from the trunk and `merge-base`
resolves. That merge changed no file. It records the relationship that exists;
it does not recover work that was never committed.

The join commit is `818e8b7`.
