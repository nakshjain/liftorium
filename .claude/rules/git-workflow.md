---
description: Git workflow, branching strategy, and commit conventions
globs: ["**"]
alwaysApply: true
---

# Git Workflow

## Branch Strategy

* Protected branch: `master`
* Never commit directly to `master`.
* Never push directly to `master`.
* Never delete `master`.
* All work must be performed in feature or fix branches.

Branch naming:

* Features: `feat/<feature-name>`
* Bug fixes: `fix/<bug-description>`
* Refactors: `refactor/<description>`
* Chores: `chore/<description>`

## Pull Request Workflow

* Default PR target branch is `master`.
* Before creating or updating a PR:

    * Pull the latest changes from `master`.
    * Synchronize the current branch with `master`.
    * Resolve conflicts locally.
    * Verify the project still builds successfully.
* Raise a PR only after synchronization is complete.

## Commit Messages

Use Conventional Commits:

```text
feat: add workout tracking module
fix: resolve JWT expiry edge case
refactor: extract exercise normalization util
chore: update dependencies
docs: add API endpoint documentation
```

## Commit Guidelines

* Create small, focused commits.
* Commit only related changes together.
* Do not bundle unrelated work in a single commit.
* Commit after each stable, self-contained feature or fix.

## Safety Rules

* Never force push.
* Never rewrite shared branch history.
* Never merge a PR without explicit approval.
* Never push changes without explicit approval.
* Show a summary of changes before proposing a commit or PR.
