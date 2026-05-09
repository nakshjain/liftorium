# AI-Assisted Engineering Workflow

Gym Helper is intentionally built with AI-assisted engineering workflows. This document defines how AI agents should contribute.

## Before Coding

The AI agent should:

- Inspect the current repository state.
- Read relevant files before making assumptions.
- Explain the implementation approach briefly.
- Identify documentation updates required by the change.

## During Coding

The AI agent should:

- Follow existing project patterns.
- Keep files small and modular.
- Use strict TypeScript.
- Avoid `any`.
- Prefer production-ready code over placeholders.
- Keep changes scoped to the requested feature.

## After Coding

The AI agent should:

- List created or modified files.
- Explain architecture decisions.
- Update docs in `/docs`.
- Add a progress entry.
- Mention next recommended steps.
- Run available tests or explain why they were not run.

## Prompt Capture

Important prompts should be saved in `/docs/prompts`.

Capture prompts when they:

- Define a feature scope.
- Establish architecture direction.
- Ask for implementation of a core module.
- Produce reusable review or testing guidance.

## Review Expectations

When reviewing code, prioritize:

- Bugs and behavioral regressions.
- Security risks.
- Missing validation.
- Type safety issues.
- Missing tests.
- Documentation drift.
