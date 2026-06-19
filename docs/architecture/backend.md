# Backend Architecture

> Covers the Spring Boot application structure, layering rules, and all implemented components.
> For the class-level diagram and request lifecycle sequence see [backend-components.md](./backend-components.md).
> For security and JWT detail see [security.md](./security.md).

---

## Stack

| Technology | Version / Notes |
|---|---|
| Java | 21 |
| Spring Boot | 4.0.6 |
| Build tool | Maven |
| Database driver | Spring Data MongoDB |
| Security | Spring Security 6, stateless JWT |
| JWT library | JJWT 0.12.6 |
| Email | Resend API via Spring `RestClient` |
| Utilities | Lombok, Jakarta Validation |

---

## Entry Point

`LiftoriumApplication` — standard `@SpringBootApplication`. No custom startup logic except `ExerciseSyncRunner` (see [Startup](#startup)).

---

## Layering Rules

```
Controller      HTTP routing, @Valid request binding, response shaping only
    │
Service         All business logic, orchestration, AppException throwing
    │
Repository      MongoDB access via Spring Data only
    │
MongoDB
```

No layer is skipped. Controllers never call repositories. Services never build HTTP responses. Repositories contain no business logic.

---

## Package Structure

All production code lives under `com.liftorium`. Fourteen sub-packages:

| Package | Responsibility |
|---|---|
| `config` | `AppProperties`, `SecurityConfig`, `JwtKeyConfig`, `CorsConfig` |
| `controller` | 10 REST controllers — all routes under `/api/v1` |
| `dto` | Request/response records, `ApiResponse<T>` envelope |
| `service` | 15 services — all business logic |
| `repository` | 12 Spring Data MongoDB repositories |
| `entity` | 20 document models, embedded types, enums |
| `entity/progress` | `ExerciseProgress`, `ExerciseProgressHistory`, `PrEvent`, `PrType` |
| `security` | `JwtAuthenticationFilter`, `UserPrincipal`, `CustomUserDetailsService`, `RestAuthenticationEntryPoint` |
| `exception` | `AppException`, `GlobalExceptionHandler` |
| `util` | `DurationParser` |
| `validation` | `@StrongPassword` custom constraint |
| `startup` | `ExerciseSyncRunner` |
| `provider` | `WgerExerciseProvider` |
| `cache` | `CatalogVersionCache` |

---

## Configuration

### AppProperties

`@ConfigurationProperties(prefix = "app")` record that centralises all application configuration. Nested groups:

| Group | Properties |
|---|---|
| `jwt` | `accessSecret`, `refreshSecret`, `accessTokenTtl`, `refreshTokenTtl`, `refreshTokenCookieName`, `refreshTokenCookiePath` |
| `email` | `resendApiKey`, `from` |
| `otp` | `expiryMinutes`, `maxAttemptsPerWindow`, `rateLimitWindowMinutes` |
| `security` | `bcryptStrength` |
| `cors` | `allowedOrigins` |
| `exercises` | `syncOnStartup` |

All secrets are injected from environment variables. No secret value is committed to source control. See [deployment.md](./deployment.md) for the full environment variable reference.

### Spring Profiles

| Profile | Purpose |
|---|---|
| `development` (default) | Local development — verbose logging, local MongoDB URI |
| `production` | Environment-variable-driven secrets, reduced logging, MongoDB auto-index disabled |

### JwtKeyConfig

Two `@Bean SecretKey` instances — `accessTokenSigningKey` and `refreshTokenSigningKey` — derived from their respective secrets at startup. Separate keys ensure that a refresh token cannot be accepted as an access token by any code path that only holds one key reference.

---

## Controllers

Ten REST controllers. All routes are prefixed `/api/v1`.

| Controller | Path | Auth | Key operations |
|---|---|---|---|
| `AuthController` | `/auth` | Mixed | register/initiate, register/verify, register, login, refresh, me, forgot-password, forgot-password/reset, logout |
| `WorkoutController` | `/workouts` | JWT | paginated list, create, get, update, delete, finish |
| `ExerciseController` | `/exercises` | Public (read) | paginated+filtered list, get by id |
| `WorkoutPlanController` | `/workout-plans` | JWT | full CRUD |
| `ProgressController` | `/progress` | JWT | exercise progress list, detail, PR events |
| `HistoryInsightsController` | `/history` | JWT | workout history list, insights |
| `UserSettingsController` | `/settings` | JWT | get, patch |
| `SyncController` | `/sync` | JWT | bulk workout sync (`POST /sync/workouts`) |
| `AdminExerciseController` | `/admin/exercises` | JWT | create, update |
| `HealthController` | `/health` | Public | health check |

All responses use `ApiResponse<T>`:

```json
{ "success": true,  "data": { ... } }
{ "success": false, "error": { "code": "...", "message": "..." } }
```

### AuthController — session cookie management

`AuthController` is the only controller that writes cookies. It calls the private `sendSession()` helper after every successful auth response (login, register, verify, refresh, reset-password). The refresh token cookie is set as:

```
Set-Cookie: liftorium_refresh_token=<JWT>; HttpOnly; SameSite=Strict; Path=/api/v1/auth
```

`Secure` is added when the active profile is `production`. On logout, `Max-Age=0` clears the cookie.

---

## Services

Fifteen services. Grouped by domain:

### Authentication

**`AuthService`** — the central auth orchestrator. Depends on `UserRepository`, `RefreshTokenRepository`, `PendingRegistrationRepository`, `PasswordResetRequestRepository`, `UserSettingsRepository`, `JwtService`, `OtpService`, `EmailService`.

Key methods:

| Method | Description |
|---|---|
| `initiateRegistration()` | Rate-limit check, OTP generation, `PendingRegistration` upsert, email dispatch |
| `verifyRegistration()` | OTP verification, `User` + `UserSettings` creation, session issuance |
| `register()` | Direct registration without OTP (backward-compatible path) |
| `login()` | BCrypt password verification, session issuance |
| `refresh()` | Refresh token verification, hash lookup, rotation, new session issuance |
| `initiateForgotPassword()` | Enumeration-safe OTP flow for password reset |
| `resetPassword()` | OTP verification, password hash update, session issuance |
| `logout()` | Refresh token revocation |
| `createSession()` (private) | Issues both JWTs, persists refresh token hash, returns `AuthSession` |
| `hashRefreshToken()` (private) | HMAC-SHA256 keyed with `JWT_REFRESH_SECRET` |

**`JwtService`** — signs and verifies access and refresh tokens using separate `SecretKey` beans. Exposes `signAccessToken()`, `signRefreshToken()`, `verifyAccessToken()`, `verifyRefreshToken()`, `getAccessTokenEmail()`, `getRefreshTokenTtl()`. TTL values are parsed by `DurationParser`.

**`OtpService`** — generates 6-digit codes with `SecureRandom`, hashes with BCrypt, verifies with `BCrypt.matches()`.

**`EmailService`** — sends OTP and password-reset emails via `POST https://api.resend.com/emails` using Spring `RestClient`. Uses private record types `ResendEmailRequest` and `ResendEmailResponse`. Throws `AppException(EMAIL_SEND_FAILED, 500)` on Resend API failure.

### Exercise Catalog

**`ExerciseService`** — catalog reads and admin writes. Delegates filtered/paginated queries to `ExerciseQueryRepository` (custom `MongoTemplate`-based implementation). Exposes `getExercises()`, `getExercise()`, `createExercise()`, `updateExercise()`.

**`CatalogVersionService`** — exposes `getCurrentVersion()` and `bumpVersion()`. Version state is kept in `CatalogVersionCache` (in-memory) backed by a document in the `exercises` collection. The Angular frontend compares the cached catalog version against the backend version to decide whether a re-download is needed.

**`ExerciseSyncService`** — optional startup sync. Fetches exercises from `WgerExerciseProvider` and upserts into the `exercises` collection. Only runs when `EXERCISE_SYNC_ON_STARTUP=true`.

### Workout

**`WorkoutService`** — CRUD for workout documents. `finishWorkout()` transitions the workout to completed status and immediately calls `ProgressEvaluationService.evaluate(workout)` synchronously before returning. All set additions are validated by `WorkoutSetValidator` against the exercise's `TrackingType`.

**`WorkoutPlanService`** — full CRUD for `WorkoutPlan` documents. No business logic beyond ownership checks.

**`WorkoutStatsService`** — aggregates volume and frequency from the `workouts` collection for the history insights endpoint.

**`WorkoutSyncService`** — handles bulk upload of guest workouts after login. `syncWorkouts()` accepts a list of guest-format workouts, converts each via `convertGuestWorkout()`, and delegates to `WorkoutService` for persistence. Also calls `ProgressService` to ensure sync'd workouts are evaluated.

### Progress

**`ProgressEvaluationService`** — the PR detection engine. Called once per finished workout from `WorkoutService.finish()`. Never called during live set entry.

Two phases:

**Phase 1 — Session reduction.** All sets for each exercise are collapsed into a single `SessionRecord` (private inner record). Fields computed depend on `TrackingType`:

| TrackingType | Session fields computed |
|---|---|
| `WEIGHT_REPS` | `maxWeight`, `bestRepReps/Weight`, `bestE1rm/Weight/Reps` (Epley formula) |
| `REPS_ONLY` | `bestRepReps/Weight` |
| `DURATION` | `longestDuration` |
| `CARDIO` | `longestDuration`, `longestDistance` |

**Phase 2 — Historical comparison.** The `SessionRecord` is compared once against the stored `ExerciseProgress`. At most one `PrEvent` is emitted per PR type per exercise per workout. Supported PR types: `WEIGHT`, `REPS`, `ESTIMATED_ONE_REP_MAX`, `DURATION`, `DISTANCE`.

One `ExerciseProgressHistory` snapshot is always written for every exercise in every finished workout, regardless of whether a PR occurred.

`firstWeightPr` and `firstEstimatedOneRepMax` on `ExerciseProgress` are set exactly once — on the first PR of that type — and never overwritten, enabling "Started: 20 kg → Now: 80 kg" comparisons.

**`ProgressService`** — read-only service for the progress API endpoints. Exposes `getExerciseProgress()`, `getExerciseProgressDetail()`, `getPrEvents()`.

**`HistoryInsightsService`** — provides completed workout history lists and aggregated insights (volume, frequency) by combining `WorkoutRepository` and `ExerciseProgressRepository` queries.

### Settings

**`UserSettingsService`** — `getSettings()` uses `getOrCreate` semantics as a safety net for accounts that predate the `user_settings` collection. `updateSettings()` applies partial updates. Default settings are created at registration by `AuthService`, not by this service.

---

## Repositories

Twelve Spring Data MongoDB repositories:

| Repository | Collection | Notable query methods |
|---|---|---|
| `UserRepository` | `users` | `findByEmail`, `existsByEmail` |
| `RefreshTokenRepository` | `refresh_tokens` | `findByTokenHashAndRevokedAtIsNullAndExpiresAtAfter` |
| `PendingRegistrationRepository` | `pending_registrations` | `findByEmail`, `deleteByEmail` |
| `PasswordResetRequestRepository` | `password_reset_requests` | `findByEmail`, `deleteByEmail` |
| `WorkoutRepository` | `workouts` | `findByUserIdOrderByStartedAtDesc`, `findByUserIdAndId` |
| `ExerciseRepository` | `exercises` | standard CRUD + `findAllById` |
| `ExerciseQueryRepository` | `exercises` | custom `MongoTemplate` — `findFiltered()` with dynamic query |
| `WorkoutPlanRepository` | `workout_plans` | `findByUserId` |
| `ExerciseProgressRepository` | `exercise_progress` | `findByUserId`, `findByUserIdAndExerciseId` |
| `ExerciseProgressHistoryRepository` | `exercise_progress_history` | `existsByUserIdAndExerciseIdAndWorkoutId`, `findByUserIdAndExerciseId` |
| `PrEventRepository` | `pr_events` | `findByUserIdAndExerciseId`, `findByUserId` |
| `UserSettingsRepository` | `user_settings` | `findByUserId` |

`ExerciseQueryRepository` is the only non-standard repository. It uses `MongoTemplate` directly to build dynamic filter queries with optional text search, muscle group, equipment type, and pagination parameters.

---

## Entities

### Core documents

| Entity | Collection | Key fields |
|---|---|---|
| `User` | `users` | `id`, `email`, `displayName`, `passwordHash` |
| `RefreshToken` | `refresh_tokens` | `id`, `userId`, `tokenHash`, `expiresAt`, `revokedAt` |
| `PendingRegistration` | `pending_registrations` | `email`, `otpHash`, `expiresAt`, `attemptCount`, `lastAttemptAt` |
| `PasswordResetRequest` | `password_reset_requests` | `email`, `otpHash`, `expiresAt`, `attemptCount`, `lastAttemptAt` |
| `Exercise` | `exercises` | `name`, `target`, `equipment`, `exerciseType`, `trackingType`, `catalogVersion` |
| `Workout` | `workouts` | `userId`, `name`, `status`, `startedAt`, `finishedAt`, `exercises` (embedded) |
| `WorkoutPlan` | `workout_plans` | `userId`, `name`, `description`, `days` (embedded) |
| `UserSettings` | `user_settings` | `userId`, `units`, `workout`, `appearance` |

### Progress documents

| Entity | Collection | Key fields |
|---|---|---|
| `ExerciseProgress` | `exercise_progress` | `userId`, `exerciseId`, all PR values, `firstWeightPr`, `firstEstimatedOneRepMax` |
| `ExerciseProgressHistory` | `exercise_progress_history` | `userId`, `exerciseId`, `workoutId`, `performedAt`, session metrics |
| `PrEvent` | `pr_events` | `userId`, `exerciseId`, `workoutId`, `prType`, `previousValue`, `newValue`, `achievedAt` |

### Embedded types

| Type | Embedded in | Key fields |
|---|---|---|
| `WorkoutExercise` | `Workout` | `exerciseId`, `name`, `order`, `sets` |
| `WorkoutSet` | `WorkoutExercise` | `order`, `reps`, `weight`, `durationSeconds`, `distanceKm`, `speed`, `incline`, `completedAt`, `setType`, `tempo` |
| `PlanDay` | `WorkoutPlan` | `label`, `exercises` |
| `PlanExercise` | `PlanDay` | `exerciseId`, `exerciseName`, `sets` |

### Enums

| Enum | Values |
|---|---|
| `TrackingType` | `WEIGHT_REPS`, `REPS_ONLY`, `DURATION`, `CARDIO` |
| `PrType` | `WEIGHT`, `REPS`, `ESTIMATED_ONE_REP_MAX`, `DURATION`, `DISTANCE` |

See [TRACKING_TYPES.md](./TRACKING_TYPES.md) for the full specification of how `TrackingType` drives set validation, PR evaluation, and frontend rendering.

---

## Security Package

| Class | Role |
|---|---|
| `JwtAuthenticationFilter` | `OncePerRequestFilter` — extracts Bearer token, calls `JwtService.verifyAccessToken()`, loads `UserPrincipal`, sets `SecurityContext` |
| `CustomUserDetailsService` | `UserDetailsService` — `loadUserByUsername(email)` → `UserPrincipal` via `UserRepository` |
| `UserPrincipal` | `UserDetails` implementation — carries `id`, `email`, `displayName`; `getAuthorities()` returns empty list (role-ready but no roles currently in use) |
| `RestAuthenticationEntryPoint` | Returns a structured JSON `401` instead of redirecting |

`SecurityConfig` (`@Configuration`, `@EnableMethodSecurity`):

- `SessionCreationPolicy.STATELESS` — no server-side session.
- CSRF disabled — not applicable to stateless JWT.
- `JwtAuthenticationFilter` added before `UsernamePasswordAuthenticationFilter`.
- Public routes: `/health`, all `POST /auth/**` auth endpoints, `GET /exercises`, `GET /exercises/*`.
- Everything else: `authenticated()`.

---

## Exception Handling

`GlobalExceptionHandler` (`@RestControllerAdvice`) handles all exceptions at the controller boundary:

| Handler method | Exception type | HTTP status |
|---|---|---|
| `handleAppException` | `AppException` | From `AppException.httpStatus` |
| `handleMethodArgumentNotValid` | `MethodArgumentNotValidException` | 400 |
| `handleValidationException` | Jakarta `ConstraintViolationException` | 422 |
| `handleGeneric` | `Exception` | 500 |

`AppException` carries a `code` string (e.g. `OTP_INVALID`, `INVALID_REFRESH_TOKEN`), a human-readable `message`, and an `HttpStatus`. Clients key on `code` for programmatic error handling.

---

## Validation

- `@Valid` on all `@RequestBody` parameters triggers Jakarta Bean Validation.
- `@StrongPassword` custom `ConstraintValidator` — minimum 8 characters, at least one uppercase, one lowercase, one digit.
- `WorkoutSetValidator` — injected into `WorkoutService.addSet()`. Resolves the exercise's `TrackingType` and validates the request fields against type-specific rules. This validation cannot be expressed as Jakarta annotations because the constraint depends on a separate entity (`Exercise`) not available at the DTO layer.

---

## Startup

`ExerciseSyncRunner` (`ApplicationRunner`) executes once at startup if `EXERCISE_SYNC_ON_STARTUP=true`. It calls `ExerciseSyncService.syncExercises()`, which fetches exercises from `WgerExerciseProvider` and upserts them into the `exercises` collection. `CatalogVersionService.bumpVersion()` is called after a successful sync.

This is optional and disabled by default. A fresh deployment does not require it if the exercise catalog is seeded separately.

---

## Cache

`CatalogVersionCache` — a single in-memory bean holding the current exercise catalog version number. Read by `CatalogVersionService.getCurrentVersion()` and written by `bumpVersion()`. Backed by a document in the `exercises` collection so the value survives restarts. Avoids a MongoDB round-trip on every catalog version check from the frontend.

---

## Utility

`DurationParser` — parses human-readable duration strings (e.g. `"15m"`, `"30d"`) into `java.time.Duration`. Used by `JwtService` to convert `ACCESS_TOKEN_TTL` and `REFRESH_TOKEN_TTL` environment variable values.

---

## API Response Conventions

All endpoints return `ApiResponse<T>`:

```json
// Success
{ "success": true, "data": { ... } }

// Error
{ "success": false, "error": { "code": "ERROR_CODE", "message": "Human readable message" } }
```

See [docs/api/conventions.md](../api/conventions.md) for the full API contract including pagination shape, error codes, and versioning.

---

## Further Reading

| Topic | Document |
|---|---|
| Class-level diagram for every package | [backend-components.md](./backend-components.md) |
| Full request lifecycle sequence | [backend-components.md](./backend-components.md#request-lifecycle) |
| JWT token spec and rotation | [security.md](./security.md#token-architecture) |
| Auth sequence diagrams | [auth-flow.md](./auth-flow.md) |
| All 11 MongoDB collections | [data-model.md](./data-model.md) |
| TrackingType specification | [TRACKING_TYPES.md](./TRACKING_TYPES.md) |
| UserSettings design | [user-settings.md](./user-settings.md) |
| Environment variables | [deployment.md](./deployment.md#environment-variables) |
| Known risks and refactor targets | [architecture-review.md](./architecture-review.md) |
