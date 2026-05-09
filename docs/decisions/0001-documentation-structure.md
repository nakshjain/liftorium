# ADR 0001: Documentation Structure

## Status

Accepted

## Date

2026-05-10

## Context

Gym Helper is being developed with AI-assisted engineering workflows. The project needs documentation that supports fast MVP delivery while keeping architecture, API contracts, prompts, workflows, and progress visible.

## Decision

Maintain a structured `/docs` directory with dedicated sections for:

- Architecture
- API contracts
- AI and development workflows
- Prompt history
- Progress tracking
- Architecture decision records

## Consequences

This creates a consistent place for implementation context and reduces documentation drift during AI-assisted development.

The documentation must be maintained alongside feature work to remain useful.

## Alternatives Considered

- Keep all documentation in a single README: simpler initially, but harder to maintain as the app grows.
- Delay documentation until after implementation: faster short-term, but risks losing architecture decisions and prompt history.
