# Reusable AI Prompts

## Feature Implementation Prompt

```text
Implement [feature name] for Gym Helper.

Follow the project architecture rules:
- Angular standalone components and Signals on the frontend.
- Angular components must use `component-name/component-name.ts`, `component-name/component-name.html`, and `component-name/component-name.scss`.
- No inline Angular templates or inline component styles.
- Keep templates presentation-focused; move computed labels, formatting, and state transformations into TypeScript, services, or stores.
- Node.js, Express, MongoDB, JWT auth, and TypeScript on the backend.
- Controller/service/repository structure.
- Strict typing with no any.
- Update documentation in /docs.

Before coding, briefly explain the implementation approach.
After coding, list created or modified files, architecture decisions, verification results, and next recommended steps.
```

## Code Review Prompt

```text
Review the current changes for bugs, regressions, security issues, missing validation, type safety problems, and missing tests.

Prioritize findings by severity and include file and line references.
Keep summaries brief and focus on actionable issues.
```

## API Documentation Prompt

```text
Update the API documentation for [feature/module].

Include:
- Endpoint paths and methods.
- Authentication requirements.
- Request bodies.
- Response bodies.
- Error cases.
- Notes about validation and ownership rules.
```

## Test Planning Prompt

```text
Create a focused test plan for [feature/module].

Cover:
- Unit tests.
- Integration tests.
- Critical user flows.
- Security and ownership cases.
- Edge cases and validation failures.
```

## Angular Component Refactor Prompt

```text
Refactor Angular components to the Gym Helper component file standard.

Required structure:
- component-name/component-name.ts
- component-name/component-name.html
- component-name/component-name.scss

Rules:
- Preserve standalone components, Signals state, Tailwind styling, and lazy loading.
- Do not use inline templates or inline component styles.
- Keep templates presentation-focused.
- Keep reusable logic in TypeScript files, services, or stores.
- Use SCSS files even when they are empty.
- Run frontend build and tests after refactoring.
```
