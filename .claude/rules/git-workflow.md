---
description: Git commit style and branching conventions
globs: ["**"]
alwaysApply: true
---

# Git Workflow

## Commit Messages
Use conventional commits:
```
feat: add workout tracking module
fix: resolve JWT expiry edge case
refactor: extract exercise normalization util
chore: update dependencies
docs: add API endpoint documentation
```

## Branching
- Main branch: `master`
- Feature branches: `feat/feature-name`
- Fix branches: `fix/bug-description`

## When to Commit
- After each stable, self-contained feature or fix.
- Don't bundle unrelated changes in one commit.