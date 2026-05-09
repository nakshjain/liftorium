# ADR 0005: Angular Auth Flow Design

## Status

Accepted

## Date

2026-05-10

## Context

The Angular frontend needs a secure-enough MVP authentication flow that works with the backend JWT module. It must support login, signup, refresh token handling, protected routes, API calls with bearer tokens, mobile-first UI, and a modular structure that can grow with the app.

## Decision

Use an Angular auth feature with:

- Lazy-loaded login and signup routes.
- `AuthService` as the single owner of auth state.
- Angular Signals for current user, access token, auth status, and authenticated state.
- Local storage for MVP access token persistence.
- Backend HTTP-only refresh token cookie for session renewal.
- Functional HTTP interceptor for bearer token attachment and `401` refresh retry.
- Functional route guards for authenticated and guest-only routes.
- Reusable auth form field component for consistent validation UI.

## Consequences

Auth state is simple to consume from components through Signals.

The interceptor centralizes API authorization behavior and avoids repeating token logic in feature services.

The route guards keep protected screens inaccessible without a valid session.

Local storage access tokens are convenient for MVP persistence, but increase the impact of XSS. Production hardening should revisit in-memory access tokens and Content Security Policy.

## Alternatives Considered

- Store both access and refresh tokens in local storage: simpler, but weaker than HTTP-only refresh cookies.
- Use a global state library: unnecessary for the current auth scope.
- Put auth logic directly in pages: faster initially, but harder to reuse and test.
