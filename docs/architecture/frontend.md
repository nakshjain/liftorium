# Frontend Architecture

## Stack

- Angular latest
- TypeScript
- Standalone components
- Angular Signals
- TailwindCSS
- Lazy-loaded routesk
- SCSS-based component styling

## Design Goals

- Dark theme by default.
- Mobile-first layout.
- Minimal taps during workout logging.
- Fast perceived performance.
- Clear and calm UI for repeated gym use.
- Maintain scalable component organization.

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
      login-page/
        login-page.ts
        login-page.html
        login-page.scss
    exercises/
    workouts/
    history/
    progress/
  app/
    app.ts
    app.html
    app.scss
  app.routes.ts
  app.config.ts
```

## Routing

Routes should be lazy loaded by feature:

- `/auth/login`
- `/auth/register`
- `/app/workout`
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
- Keep templates presentation-focused.
- Move computation and state transformations into services or component logic.

## Mobile Workout Logging Requirements

- Large tap targets.
- Fast set entry.
- Minimal navigation while a workout is active.
- Clear active workout status.
- Preserve in-progress workout state.

## Implemented Live Workout UI

The frontend now includes a protected lazy-loaded `/app/workout` route for live workout logging.

- `LiveWorkoutStore` owns active workout state with Angular Signals.
- The UI starts a workout, adds catalog exercises, adds/removes sets, edits reps and weight with thumb-friendly controls, marks sets complete, runs a rest timer, and finishes the session.
- Previous workout set targets are shown inline per set to reduce context switching during training.
- Sticky bottom controls keep rest and finish actions available while scrolling through exercises.
- Seeded local exercise/history data mirrors backend workout and exercise DTO concepts so API integration can replace the local source without reshaping the UI.

## Component File Structure

All Angular components must follow separate file organization. Component folders live at the same feature/shared level where the component belongs.

### Required Structure

```text
example-component/
  example-component.ts
  example-component.html
  example-component.scss
```

### Implemented Examples

```text
features/auth/login-page/
  login-page.ts
  login-page.html
  login-page.scss

features/workouts/live-workout-page/
  live-workout-page.ts
  live-workout-page.html
  live-workout-page.scss

shared/forms/auth-form-field/
  auth-form-field.ts
  auth-form-field.html
  auth-form-field.scss
```

### Rules

- Do not use inline templates.
- Do not use inline component styles.
- Keep component logic, computed labels, formatting helpers, and state transformations inside `.ts` files, services, or stores.
- Keep `.html` files presentation-focused with bindings, structural control flow, and event wiring only.
- Keep component-specific styles inside `.scss` files, even when a component currently uses Tailwind utilities only.
- Preserve standalone component imports and lazy-loaded route boundaries.

### Benefits

This structure improves:

- maintainability
- readability
- separation of concerns
- reusable UI development
- scalable frontend architecture
- cleaner git diffs
- AI-assisted refactoring workflows

This project intentionally avoids inline Angular templates and inline styles to maintain production-grade frontend standards.

### Maintainability Rationale

Separate component files reduce merge conflicts, make template-only and logic-only diffs easier to review, and allow larger mobile workflows to stay readable as they grow. Empty SCSS files are kept intentionally so future component-specific styling has a predictable home without changing the component contract.
