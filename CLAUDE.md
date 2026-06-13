# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

**Backend (Java 21 / Spring Boot / Maven):**
```bash
cd backend
mvn spring-boot:run           # Dev server on port 4000
mvn clean package             # Build JAR
mvn test                      # Run tests
```

**Frontend (Angular / TypeScript):**
```bash
cd frontend
npm install
npm start                     # Dev server on port 4200
npm run build                 # Production build
npm test                      # Run tests (Vitest)
```

**Environment:** Copy `backend/.env.example` and set `MONGODB_URI`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, and `ASCEND_API_KEY`. Spring profile defaults to `development`.

## Architecture

Full-stack: Angular 21 frontend → Spring Boot 4 REST API → MongoDB.

**Backend** follows strict controller → service → repository layering under `com.liftorium`. Request flow: Spring Security JWT filter → controller → service → Spring Data MongoDB repository. All controllers inject `UserPrincipal` from the security context for the authenticated user. Centralized exception handling via `@RestControllerAdvice`. All responses use `{ "success": true/false, "data": {} }` or `{ "success": false, "error": { "code": "", "message": "" } }` envelopes.

**Frontend** uses Angular standalone components with lazy-loaded routes. `AuthService` (signals-based) manages auth state; `AuthInterceptor` injects `Authorization: Bearer` headers and auto-retries on 401 with token refresh. The refresh token is stored in an HTTP-only Strict-SameSite cookie set by Spring; the access token lives in memory/localStorage. `LiveWorkoutStore` (injectable signal service) tracks the active workout session client-side.

**Auth flow:** Login → access token (15m) + refresh token cookie (30d). On 401, interceptor calls `/api/v1/auth/refresh` transparently. Logout revokes the refresh token server-side.

**Exercise catalog:** Synced from the Ascend API (RapidAPI) via `ExerciseProviderService` and stored in MongoDB. Supports cursor-based pagination and prefix-search via `searchPrefixes` index.

**Workout data model:** `Workout` document embeds `WorkoutExercise[]`, which embeds `WorkoutSet[]`. No joins — all workout data is one MongoDB document per session.

## Code Standards

- **No `any` in TypeScript.** Strict mode is enabled.
- **Java 21 features preferred:** records for DTOs, constructor injection (no field injection), Lombok only for boilerplate.
- **Jakarta Validation** on all request DTOs — no manual null checks.
- **TailwindCSS only** on the frontend — no custom CSS or other styling libraries.
- **Dark theme by default;** UI is mobile-first, minimizing taps during workout logging.

## Documentation

After implementing a feature, update the relevant files under `/docs`:
- `/docs/api/` — endpoint contracts
- `/docs/architecture/` — structural changes
- `/docs/decisions/` — new ADRs when making significant tech choices
- `/docs/progress/progress-log.md` — what was done and what's next

## Commit Style

```
feat: add workout tracking module
fix: resolve JWT expiry edge case
refactor: extract exercise normalization util
```

Commit after each stable, self-contained feature.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
