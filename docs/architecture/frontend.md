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

## Implemented Auth Foundation

The frontend currently includes:

- Lazy-loaded `/auth/login` and `/auth/signup` routes.
- Protected `/app` route guarded by auth state.
- `AuthService` with Signals for user, access token, auth status, and authenticated state.
- Access token persistence through a focused token storage service.
- HTTP interceptor that attaches bearer tokens and attempts refresh on `401`.
- Refresh token handling through backend HTTP-only cookies with `withCredentials`.
- Reusable auth form field component with validation messages.
- Tailwind dark mobile-first auth screens.

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
