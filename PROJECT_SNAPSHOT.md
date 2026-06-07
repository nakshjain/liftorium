# Gym Helper - Project Snapshot

This document consolidates the project's current direction, established technical decisions, documentation set, and planned delivery order.

## Product Vision

Gym Helper is a production-ready workout tracking application designed for fast, focused use during gym sessions.

The product should feel:

- Fast
- Minimal
- Modern
- Gym-focused
- Mobile-first
- Optimized for low-friction workout logging

## Current Project Stage

The project is currently in the planning and architecture phase.

The following foundational documents have been created:

- `README.md` - project introduction and repository guidance
- `AGENTS.md` - engineering, architecture, documentation, and AI workflow rules
- `docs/IMPLEMENTATION_PLAN.md` - planned implementation phases and priorities
- `docs/BACKEND_SCHEMA.md` - backend domain and persistence design
- `docs/UI-UX_BRIEF.md` - user experience and interface direction

Application implementation should follow these documents. A feature should not be marked complete until its code, tests, and supporting documentation are finished.

## MVP Scope and Priority

Features should be delivered in this order:

1. Authentication
2. Workout tracking
3. Exercise database
4. Workout history
5. Progress analytics
6. Personal record tracking

Advanced AI features are outside the initial MVP.

## Frontend Architecture

### Technology

- Latest stable Angular
- TypeScript with strict typing
- Tailwind CSS
- Standalone Angular components
- Angular Signals
- Lazy-loaded routes

### Principles

- Build mobile-first responsive interfaces.
- Use a dark theme by default.
- Minimize taps required during workout logging.
- Keep components small, focused, and reusable.
- Prefer composition over duplicated UI or logic.
- Use Signals for appropriate local and shared reactive state.
- Do not use `any`.
- Use Tailwind CSS for styling.

## Backend Architecture

### Technology

- Java 21
- Latest stable Spring Boot
- Maven
- MongoDB
- Spring Security
- JWT access and refresh tokens
- Lombok
- Jakarta Validation

### Structure

Backend code belongs under the `com.gymhelper` package and should use a scalable modular structure.

Each feature should follow clear responsibility boundaries:

- Controllers handle HTTP requests and responses.
- Services contain business logic.
- Repositories handle persistence.
- Request and response DTOs define API contracts.
- Validation is applied to every external request.
- Centralized exception handling produces consistent API errors.
- Spring Security protects authenticated routes.
- Configuration secrets and deployment-specific values use environment variable placeholders.

## Expected Core Domains

The MVP is expected to include these primary domains:

- Users and authentication
- Refresh tokens or refresh-token sessions
- Exercises
- Workout sessions
- Workout exercises
- Sets
- Workout history
- Progress measurements and analytics
- Personal records

The detailed persistence model and field definitions remain documented in `docs/BACKEND_SCHEMA.md`.

## Authentication Direction

Authentication is the first implementation priority.

The authentication system should include:

- User registration
- User login
- Password hashing
- Short-lived JWT access tokens
- Refresh-token rotation or revocation support
- Protected API routes
- Logout and refresh-token invalidation
- Validated request DTOs
- Consistent authentication error responses

## Workout Experience

Workout tracking should prioritize real-time gym use:

- Starting a workout should require minimal interaction.
- Adding exercises and sets should be quick.
- Previous values should be easy to reference.
- Weight and repetition entry should be thumb-friendly.
- Active workout state should survive normal navigation.
- Completing a workout should produce a clear summary.
- History should make previous sessions easy to inspect.

## Engineering Standards

- Use modular architecture.
- Keep files small and reusable.
- Avoid monolithic components and services.
- Prefer composition over duplication.
- Use strict typing throughout the application.
- Produce complete production-ready code rather than pseudocode.
- Keep naming consistent across frontend, backend, APIs, and documentation.
- Add tests according to feature risk and behavioral impact.

## Documentation Workflow

Every implemented feature must update the relevant project documentation.

Documentation belongs in:

```text
docs/
|-- architecture/
|-- api/
|-- prompts/
|-- workflows/
|-- progress/
`-- decisions/
```

For each feature:

1. Update general documentation.
2. Add architecture notes when design decisions need explanation.
3. Save important AI prompts in `docs/prompts`.
4. Document API contracts in `docs/api`.
5. Document development or user workflows in `docs/workflows`.
6. Update the progress log.

## AI-Assisted Development Workflow

Before coding:

1. Review `AGENTS.md`.
2. Read the relevant architecture and feature documents.
3. Briefly explain the implementation approach.
4. Confirm that the work follows the MVP priority order.

After coding:

1. Run relevant tests and quality checks.
2. List created and changed files.
3. Explain meaningful architecture decisions.
4. Update the required documentation.
5. Record progress.
6. Commit stable features with a meaningful conventional commit message.

## Git Conventions

Stable features should be committed in focused commits.

Example commit messages:

```text
feat: add workout tracking module
feat: implement JWT authentication
refactor: optimize exercise service
```

## Recommended Delivery Sequence

### Phase 1: Foundation

- Establish frontend and backend applications.
- Configure Angular, Tailwind CSS, Spring Boot, MongoDB, validation, and environment-based settings.
- Add shared error handling and API conventions.

### Phase 2: Authentication

- Implement registration, login, token refresh, logout, and protected routes.
- Add frontend authentication state, guards, interceptors, and mobile-first screens.

### Phase 3: Workout Tracking

- Implement workout session creation and completion.
- Add exercises and log sets.
- Preserve active workout state.
- Build the primary mobile workout interface.

### Phase 4: Exercise Database

- Add searchable exercise records.
- Support muscle groups and exercise metadata.
- Connect exercise selection to active workouts.

### Phase 5: History and Progress

- Display completed workouts.
- Show exercise performance over time.
- Add progress analytics and personal record tracking.

## Definition of Done

A feature is complete when:

- The behavior is fully implemented.
- Request and domain validation are present.
- Security requirements are applied.
- Relevant automated tests pass.
- Mobile behavior is verified where applicable.
- API and workflow documentation are updated.
- Progress is recorded.
- The code is ready for a focused commit.

## Source of Truth

This file is a consolidated project snapshot. Detailed requirements remain in their specialized documents:

- Engineering rules: `AGENTS.md`
- Implementation sequencing: `docs/IMPLEMENTATION_PLAN.md`
- Backend model: `docs/BACKEND_SCHEMA.md`
- Interface direction: `docs/UI-UX_BRIEF.md`

Update this snapshot when major scope, architecture, or delivery decisions change.
