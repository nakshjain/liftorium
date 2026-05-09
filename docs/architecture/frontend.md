# Frontend Architecture

## Stack

- Angular latest
- TypeScript
- Standalone components
- Angular Signals
- TailwindCSS
- Lazy-loaded routes

## Design Goals

- Dark theme by default.
- Mobile-first layout.
- Minimal taps during workout logging.
- Fast perceived performance.
- Clear and calm UI for repeated gym use.

## Proposed Folder Structure

```text
frontend/src/app
  core/
    auth/
    guards/
    http/
    layout/
  shared/
    components/
    models/
    utils/
  features/
    auth/
    exercises/
    workouts/
    history/
    progress/
  app.routes.ts
  app.config.ts
```

## Routing

Routes should be lazy loaded by feature:

- `/auth/login`
- `/auth/register`
- `/workouts/active`
- `/workouts/new`
- `/history`
- `/exercises`
- `/progress`

Protected routes must use authentication guards.

## State Management

Use Angular Signals for:

- Auth session state.
- Active workout state.
- Small feature-level UI state.

Avoid global state libraries until app complexity justifies them.

## Component Guidelines

- Use standalone components only.
- Keep components small and focused.
- Extract repeated UI into shared components.
- Use TailwindCSS utility classes only.
- Avoid business logic in templates.

## Mobile Workout Logging Requirements

- Large tap targets.
- Fast set entry.
- Minimal navigation while a workout is active.
- Clear active workout status.
- Preserve in-progress workout state.
