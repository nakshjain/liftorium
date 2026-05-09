# Reusable AI Prompts

## Feature Implementation Prompt

```text
Implement [feature name] for Gym Helper.

Follow the project architecture rules:
- Angular standalone components and Signals on the frontend.
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
