---
description: Frontend Angular/TypeScript coding conventions and patterns
globs: ["frontend/**/*.ts", "frontend/**/*.html"]
---

# Frontend Conventions

## Angular Style
- Standalone components only — no NgModules.
- Lazy-loaded routes per feature area.
- Signal-based state management using Angular signals (`signal()`, `computed()`).
- Use `inject()` function for DI, not constructor parameters.
- RxJS only for async streams (HTTP, event debouncing). Prefer signals for synchronous state.

## TypeScript
- Strict mode enabled. Never use `any`.
- Interfaces/types for all models in dedicated `*.models.ts` files per feature.
- Services suffixed with `.service.ts`, stores with `.store.ts`.

## Auth
- `AuthService` is signals-based. Access token in memory/localStorage, refresh token in HTTP-only cookie.
- `AuthInterceptor` handles token injection and transparent 401 refresh.
- Guards use `AuthGuard` for protected routes.

## State Stores
- Injectable signal services (e.g., `LiveWorkoutStore`) for complex client-side state.
- Persist to localStorage where appropriate; restore on page reload.
- Use `takeUntilDestroyed()` for subscription cleanup.

## File Organization
- `core/` — singleton services, guards, interceptors, API models.
- `features/` — feature modules with their own routes, components, services, models.
- `shared/` — reusable UI components.
- Components use single-file format: template + styles inline or colocated `.ts` file.