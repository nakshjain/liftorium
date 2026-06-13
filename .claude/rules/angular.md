---
description: Angular frontend architecture, state management, and coding conventions
globs: ["frontend/**/*.ts", "frontend/**/*.html"]
---

# Angular Conventions

## Architecture

* Use standalone components only.
* Organize features using lazy-loaded routes.
* Follow feature-based folder organization.
* Reuse existing components and services before creating new ones.
* Keep business logic out of templates.

## State Management

* Prefer Angular Signals for application state.
* Use `signal()` and `computed()` for synchronous state.
* Use RxJS only for asynchronous streams:

    * HTTP requests
    * event streams
    * debouncing
    * timers
* Use injectable signal stores for complex client-side state.

Examples:

* `LiveWorkoutStore`
* `WorkoutSessionStore`

## Dependency Injection

* Use `inject()` for dependency injection.
* Avoid constructor injection unless required by framework limitations.

## TypeScript

* Strict mode enabled.
* Never use `any`.
* Prefer explicit types.
* Shared and reusable models belong in feature-specific `*.models.ts` files.
* Services use `.service.ts`.
* Stores use `.store.ts`.

## Authentication

* `AuthService` is signal-based.
* Store access tokens in memory/localStorage.
* Store refresh tokens in HTTP-only cookies.
* `AuthInterceptor` handles:

    * token injection
    * automatic token refresh
    * retry after successful refresh
* Protect authenticated routes using `AuthGuard`.

## Data Access

* Components should access APIs through services only.
* Avoid direct HTTP calls from components.
* Encapsulate API communication within feature services.
* Fire-and-forget subscriptions (e.g., `WorkoutService.save()`) use error-only handlers — this is intentional; do not add success handlers.

## Subscriptions

* Prefer signals where possible.
* Use `takeUntilDestroyed()` for RxJS subscription cleanup.

## Persistence

* Persist client state to localStorage when appropriate.
* Restore persisted state on application startup.

## File Organization

```text
core/
  services/
  guards/
  interceptors/

features/
  <feature>/
    components/
    services/
    stores/
    models/

shared/
  components/
```

* `core/` contains singleton services, guards, interceptors, and shared infrastructure.
* `features/` contains feature-specific components, routes, services, stores, and models.
* `shared/` contains reusable UI components.

## Components

* Keep components focused on presentation and user interaction.
* Move complex business logic into services or stores.
* Use inline templates/styles only for very small components.
* Prefer separate files for larger components.
