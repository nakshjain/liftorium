# Progress Log

Use this file for short, dated progress entries.

## Template

```md
## YYYY-MM-DD - Title

### Completed

- Item completed.

### Verification

- Command or manual check performed.

### Notes

- Important context or follow-up.
```

## 2026-05-10 - Documentation Scaffold

### Completed

- Created the initial `/docs` folder structure.
- Added starter templates for architecture, API, workflows, prompts, progress, and decisions.
- Added reusable AI workflow and prompt documentation.

### Verification

- Verified documentation files were created locally.

### Notes

- Documentation should be updated alongside each implementation feature.

## 2026-05-10 - JWT Auth Backend Module

### Completed

- Added Express/TypeScript backend foundation.
- Implemented registration, login, refresh, current user, and logout endpoints.
- Added MongoDB user and refresh token persistence.
- Added JWT access tokens with HTTP-only refresh token cookies.
- Added centralized validation and error handling.

### Verification

- Ran `npm run typecheck` in `backend`.
- Ran `npm run build` in `backend`.

### Notes

- Frontend auth pages and route guards remain pending.
- Auth endpoint rate limiting and integration tests should be added before production launch.

## 2026-05-10 - GitHub README

### Completed

- Replaced the root README placeholder with a professional GitHub project README.
- Added overview, architecture, AI workflow, tech stack, setup instructions, screenshot placeholders, roadmap, documentation structure, and scalability notes.

### Verification

- Reviewed repository scripts and documentation paths before writing setup instructions.

### Notes

- Screenshot placeholders should be replaced after frontend UI screens are implemented.

## 2026-05-10 - Exercise Database Backend Module

### Completed

- Implemented modular Exercise Database backend module.
- Added create, get by ID, list, update, and delete endpoints.
- Added pagination, name search, and filters for muscle group, equipment, and category.
- Added Zod validation for request bodies, query parameters, and route parameters.
- Added Mongoose schema with text, field, and compound indexes for catalog browsing.
- Added DTO mapping and typed paginated responses.

### Verification

- Ran `npm run typecheck` in `backend`.
- Ran `npm run build` in `backend`.

### Notes

- Exercise reads are public; mutations require authentication.
- Seed data and frontend exercise UI remain pending.

## 2026-05-10 - Workout Session Backend Module

### Completed

- Implemented modular Workout Session backend module.
- Added start workout, get active workout, get workout by ID, workout history, add exercise, add set, remove set, and finish workout endpoints.
- Added tracking for reps, weight, rest time, duration, RPE, warmup sets, dropset-ready set types, tempo, and notes.
- Added user-owned workout schema with embedded exercises and sets referencing catalog exercises.
- Added validation, error handling, DTO mapping, and history pagination.

### Verification

- Ran `npm run typecheck` in `backend`.
- Ran `npm run build` in `backend`.

### Notes

- Frontend workout logging UI remains pending.
- Integration tests should cover active workout rules, ownership, and set mutations.

## 2026-05-10 - Angular Authentication Flow

### Completed

- Implemented Angular login and signup pages.
- Added Signals-based auth state service.
- Added access token persistence, refresh token handling, route guards, and HTTP interceptor.
- Added reusable auth form field component with validation messages.
- Added TailwindCSS configuration and mobile-first dark auth UI.
- Added protected app placeholder screen and logout flow.

### Verification

- Ran `npm run build` in `frontend`.
- Ran `npm test -- --watch=false` in `frontend`.

### Notes

- Build and tests required elevated filesystem permissions because sandboxed Angular resolution could not read the real project path.
- Tailwind is configured through a plain CSS global stylesheet.

## 2026-05-10 - Live Workout Logging UI

### Completed

- Added protected lazy-loaded `/app/workout` route.
- Implemented Signals-based live workout state for starting, adding exercises, adding/removing sets, editing weight/reps, completing sets, rest timing, and finishing workouts.
- Added mobile-first Tailwind UI with previous-set comparison, large tap targets, and sticky bottom controls.
- Added a dashboard entry point for starting workout logging.
- Updated frontend architecture, workout API mapping, prompt log, progress, and ADR documentation.

### Verification

- Ran `npm run build` in `frontend`.
- Ran `npm test -- --watch=false` in `frontend`.

### Notes

- Build and tests required elevated filesystem permissions because sandboxed Angular resolution could not read the real project path.
- The UI currently uses local seeded exercise/history data and is ready to be connected to the existing workout and exercise APIs.

## 2026-05-10 - Angular Component File Structure Refactor

### Completed

- Refactored every Angular component into a dedicated folder containing `.ts`, `.html`, and `.scss` files.
- Removed all inline templates and inline component styles.
- Preserved standalone components, lazy route loading, Signals-based state, and Tailwind utility styling.
- Moved small presentation labels and workout summary formatting out of templates into component computed state/helpers.
- Updated frontend architecture and reusable prompt documentation with the component structure standard and maintainability rationale.

### Verification

- Ran `npm run build` in `frontend`.
- Ran `npm test -- --watch=false` in `frontend`.

### Notes

- Build and tests required elevated filesystem permissions because sandboxed Angular resolution could not read the real project path.

## 2026-05-10 - MongoDB Configuration Clarification

### Completed

- Restored `spring.data.mongodb.uri` to the `MONGODB_URI` environment placeholder with a local development fallback.
- Added local secret import paths for backend runtime configuration.
- Documented local and production MongoDB configuration expectations.

### Verification

- Inspected Spring Boot resource configuration, packaged `target/classes/application.properties`, and IDE run configuration for MongoDB overrides.
- Could not run Maven verification because `mvn` is not installed or not available on PATH.

### Notes

- A runtime connection to `localhost:27017` means the app did not receive `MONGODB_URI` and fell back to the local MongoDB default/fallback.
- Keep real Atlas credentials in local-only secret files or the runtime environment, not in committed config files.

## 2026-05-10 - Auth Form Submit State Fix

### Completed

- Fixed login and signup submit button disabled state by deriving it from a signal-backed form status.
- Replaced direct `form.invalid` reads inside `computed` with `toSignal(form.statusChanges)`, ensuring Angular form validity changes trigger recomputation.

### Verification

- Ran `npm run build` in `frontend`.

### Notes

- Initial sandboxed build failed due Windows path-read restrictions; reran with approved filesystem access and the build completed successfully.

## 2026-05-10 - Spring Boot Backend Migration

### Completed

- Migrated the backend from Express/TypeScript to Spring Boot 4.0.6 with Java 21 and Maven.
- Recreated auth, exercise, and workout modules with controller/service/repository layering.
- Added Spring Security JWT authentication, refresh-token cookie support, BCrypt password hashing, and role-ready user principals.
- Added MongoDB entities, repositories, DTO validation, centralized exception handling, and environment-placeholder configuration.
- Removed obsolete Node backend files, dependencies, compiled output, and TypeScript config.
- Updated architecture, security, deployment, workflow, prompt, progress, and decision documentation.

### Verification

- Could not run `mvn clean package` because Maven is not installed on the local machine.

### Notes

- API paths and response envelopes were preserved wherever possible.
- Frontend API compatibility is expected for existing auth, exercise, and workout contracts.

## 2026-05-10 - Local MongoDB Runtime Fix

### Completed

- Restored the backend MongoDB configuration to use the `MONGODB_URI` environment variable with a local fallback.
- Added an initial local environment template, later replaced by `backend/application-secrets.properties.example`.
- Added repository ignore rules for local environment files and generated output.
- Documented the meaning of `localhost:27017` connection failures.

### Verification

- Inspected backend configuration and documentation paths.
- Did not run Maven because Maven is not available on PATH in this environment.

### Notes

- Start an installed local MongoDB service before starting the backend when using the default local MongoDB URI.
- Use `MONGODB_URI` in a local secret file or process environment to point the backend at Atlas instead.

## 2026-05-10 - Remove Docker From Local Startup

### Completed

- Removed the root Docker Compose file from the local development setup.
- Updated local run documentation to prefer IntelliJ's play button on `GymHelperApplication`.
- Kept `application-secrets.properties` as the local-only configuration file.

### Verification

- Searched documentation for Docker startup references and replaced them with IntelliJ/local MongoDB guidance.

### Notes

- Docker can be reintroduced later when the project needs a repeatable containerized local stack.

## 2026-05-10 - Local Secrets Properties Setup

### Completed

- Replaced local `.env` imports with `application-secrets.properties` imports.
- Added `backend/application-secrets.properties.example` as the local template.
- Ignored real `application-secrets.properties` files in Git.
- Updated local development and deployment documentation.

### Verification

- Inspected Spring Boot config import paths and documentation references.

### Notes

- Keep `backend/application-secrets.properties` local-only.
- Do not use `pass.env`; Spring imports `application-secrets.properties` now.

## 2026-05-10 - IntelliJ MongoDB Secrets Fix

### Completed

- Switched the secrets template to direct Spring property names for clearer IntelliJ local runs.
- Migrated the local MongoDB URI into `backend/application-secrets.properties`.
- Verified the local secrets file contains `spring.data.mongodb.uri` and points to an Atlas-style URI.

### Verification

- Checked local secrets property keys without printing secret values.
- Confirmed no active Docker startup instructions remain in README or workflow docs.

### Notes

- Restart the IntelliJ run configuration after changing `application-secrets.properties`.
