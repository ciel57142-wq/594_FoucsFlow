# Contributing to FocusFlow

Thank you for contributing to FocusFlow. This document explains how to work
with the repository and what checks to run locally before opening a pull
request.

## Branching

- Use short-lived branches named like `feature/<short-description>`,
  `fix/<short-description>`, or `chore/<short-description>`.
- Branches should be merged to `master` only.
- Delete feature branches after merge.

## Local checklist

Before opening a pull request, run these commands from the repository root:

```bash
cd FocusFlow
npm ci
npm run lint
npm run typecheck
npx jest -c jest.domain.config.js --ci
cd ..
```

If your change touches notifications, test it on a physical device. Expo Go may
not schedule notifications correctly on Android 13+.

## Pull requests

Use `.github/pull_request_template.md` to document:

- what changed
- what requirement or risk is addressed
- the verification steps taken

A PR should not be merged until CI passes and at least one reviewer has
approved.
