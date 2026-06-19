# Architecture Review

> Based on static analysis of all implemented source code. No features are assumed or invented.

---

## Current Strengths

### Security

**Refresh token design is production-grade.**
Refresh tokens are never stored raw — they are persisted as HMAC-SHA256 hashes using a separate signing secret (`JWT_REFRESH_SECRET`). Rotation is enforced on every use: the old token is revoked atomically before issuing a new one. Revocation is immediate and verifiable.

**OTP handling is correct.**
6-digit codes are generated with `SecureRandom` (cryptographically strong), hashed with BCrypt before storage, and bound to a TTL-indexed MongoDB document. Rate limiting (3 attempts per 10-minute window) is applied at the service layer for both registration and password reset.

**Enumeration attacks are suppressed.**
`initiateForgotPassword` always returns a success message regardless of whether the email exists. Rate-limit errors during password reset are also silently suppressed. Both are deliberate and documented in the code.

**HttpOnly cookie for the refresh token.**
The refresh token is never accessible to JavaScript. `SameSite=Strict` is enforced and `Secure` is gated behind the active Spring profile, so it automatically applies in production.

**BYPASS_AUTH_INTERCEPTOR context token.**
The Angular `authInterceptor` uses a typed `HttpContextToken` to prevent the 401-retry loop from triggering on auth endpoints themselves (refresh, logout). This avoids a subtle infinite-loop class of bug.

**`isLoggedOut()` flag in `TokenStorageService`.**
Prevents a silent refresh attempt after explicit logout, even if the HttpOnly cookie is still technically present in the browser during the `Max-Age=0` processing window.

---

### Architecture

**Clean layering is consistently applied.**
Controller → Service → Repository is followed everywhere. No repository is accessed directly from a controller. No HTTP concerns leak into services.

**`GlobalExceptionHandler` covers all error paths.**
`AppException` carries an application-level error code (e.g. `OTP_INVALID`, `INVALID_REFRESH_TOKEN`) plus an HTTP status, and `GlobalExceptionHandler` maps these uniformly to a structured JSON response via `ApiResponse<T>`. Clients can key on the code string for localization.

**Progress evaluation is decoupled and deferred.**
`ProgressEvaluationService` is invoked exactly once, at `WorkoutService.finish()`. It never runs during live set entry, which keeps the hot write path fast and makes the PR engine independently testable.

**`TrackingType`-aware PR logic.**
The two-phase session-reduction + historical-comparison pattern handles all four tracking types (`WEIGHT_REPS`, `REPS_ONLY`, `DURATION`, `CARDIO`) with explicit `switch` branches. Adding a new tracking type requires changes in exactly one method (`buildSessionRecord`) and one dispatcher (`evaluateSession`).

**Offline-first guest experience with clean sync.**
`GuestWorkoutStorageService` uses IndexedDB with a localStorage fallback, stale-workout auto-completion on a calendar-day boundary, and a `synced` flag per completed workout. `WorkoutSyncService` handles bulk upload post-login. The design is self-contained and does not require a network connection to start working.

**Signal-based state is properly encapsulated.**
`LiveWorkoutStore`, `UserSettingsStore`, and `ExerciseStoreService` expose only read-only signals. Mutations go through methods, not direct signal writes. `UserSettingsStore` applies optimistic updates with a rollback on API failure.

**Exercise catalog is versioned.**
`CatalogVersionService` + `CatalogVersionCache` allow the frontend to detect catalog changes and re-download only when needed, avoiding redundant full downloads on every app load.

---

## Architectural Risks

### R1 — Access token in `localStorage`

**What it is:** The access token is stored in `localStorage` and read back on page load.

**Risk:** Any XSS vulnerability in the Angular app or a third-party script has full access to the token. The 15-minute TTL limits the window, but it does not close it.

**Mitigation paths:**
- Move the access token to a `sessionStorage`-backed in-memory signal only, with no persistence. On hard reload, rely on the refresh cookie to re-issue it via `/auth/refresh`.
- Alternatively, store it in an `HttpOnly` cookie alongside the refresh token and change the backend to read it from the cookie rather than the `Authorization` header.

---

### R2 — No refresh token family / reuse detection

**What it is:** The current design revokes a refresh token on use and issues a new one (rotation). However, if a stolen token is used first, the legitimate user's next request will fail but there is no alert or session invalidation beyond the single token.

**Risk:** A stolen refresh token gives the attacker access until the legitimate user notices their session is broken.

**Mitigation paths:**
- Implement token family tracking: group all tokens in a session under a `familyId`. If a revoked token from the same family is presented (replay detection), immediately revoke all tokens in the family and force re-login.
- This requires adding a `familyId` field to `RefreshToken` and a `findByFamilyId()` repository method.

---

### R3 — `ProgressEvaluationService` runs synchronously in the finish-workout request

**What it is:** `WorkoutService.finish()` calls `ProgressEvaluationService.evaluate()` inline, which issues multiple MongoDB reads (`exerciseRepository.findAllById`, `exerciseProgressRepository.findByUserId`) and multiple writes (`saveAll` on three collections).

**Risk:** As the exercise list or workout history grows, this becomes a latency spike on the finish-workout API call. Under load, it will also contend with other writes on the same collections.

**Mitigation paths:**
- Publish a `WorkoutFinishedEvent` (Spring's `ApplicationEventPublisher`) and process it in a `@TransactionalEventListener` or async `@EventListener`. This decouples the response time from the evaluation duration.
- For higher scale, move to a message queue (e.g. a simple MongoDB change stream or an external queue).

---

### R4 — No pagination on `ExerciseProgressRepository.findByUserId()`

**What it is:** `ProgressEvaluationService` calls `exerciseProgressRepository.findByUserId(userId)` and loads all progress records into memory before filtering. `ProgressService` similarly loads full result sets.

**Risk:** A user with a large and varied exercise history (hundreds of distinct exercises) will cause an unbounded in-memory collection on every workout finish. This is not a problem today but becomes one at scale.

**Mitigation path:** Replace the full-load + in-memory filter with a `findByUserIdAndExerciseIdIn(userId, exerciseIds)` query scoped to only the exercises in the current workout.

---

### R5 — `WgerExerciseProvider` is a single external dependency with no fallback

**What it is:** `ExerciseSyncRunner` fetches exercise data from the Wger API on startup when `EXERCISE_SYNC_ON_STARTUP=true`.

**Risk:** If the Wger API is unavailable or changes its schema, startup sync fails silently (or loudly), and the exercise catalog may be stale or empty in a fresh deployment.

**Mitigation paths:**
- Bundle a seed JSON file as a classpath resource to use as a fallback when the external fetch fails.
- Add retry logic with exponential backoff in `ExerciseSyncService`.
- Consider running the sync as a scheduled task rather than only at startup.

---

### R6 — No token blacklist for access tokens

**What it is:** Access tokens cannot be revoked before their 15-minute TTL expires. Logout only revokes the refresh token.

**Risk:** After logout, if an access token is captured (e.g. from a log, proxy, or shoulder surfing), it remains valid for up to 15 minutes.

**Context:** This is a standard trade-off for stateless JWT architectures. The 15-minute TTL is already on the short end of industry practice.

**Mitigation path (if needed):** Introduce a short-lived revocation cache (e.g. Redis set of revoked JTIs). Check the cache in `JwtAuthenticationFilter`. Only worth the added complexity if the security posture requires near-instant token invalidation.

---

## Scalability Concerns

| Concern | Current Behavior | Threshold |
|---|---|---|
| PR evaluation latency | Synchronous on workout finish, multiple DB round trips | Noticeable around 50+ distinct exercises per user |
| Progress full-load | `findByUserId()` loads all ExerciseProgress for a user | Noticeable around 200+ distinct exercises |
| Workout history query | `findByUserIdOrderByStartedAtDesc` without limit | Noticeable around 500+ workouts per user |
| IndexedDB guest storage | All completed workouts retained until synced | Not practically bounded, but stale workouts auto-complete and clear after sync |
| Exercise catalog download | Versioned paginated download | Well-handled; catalog version check prevents unnecessary re-downloads |
| MongoDB connection pool | Default Spring Boot pool | Needs tuning for concurrent users; no pooling config seen in `application.properties` |

---

## Missing Layers

### No test coverage visible in the repository

No test classes were found under `src/test`. For the PR evaluation engine, JWT logic, OTP rate limiting, and the refresh token rotation logic in particular, the absence of unit tests is the highest-priority gap — these are non-trivial state machines with edge cases (concurrent refresh attempts, TTL boundary conditions, Epley formula precision).

**Recommended starting points:**
- `ProgressEvaluationServiceTest` — unit test all five PR evaluators with boundary inputs.
- `AuthServiceTest` — test OTP expiry, rate limiting, registration race condition.
- `JwtServiceTest` — test token expiry, tampered signature, wrong key.
- `WorkoutSyncServiceTest` — test idempotency of bulk sync.

---

### No API versioning enforcement beyond URL prefix

The URL prefix `/api/v1/` is present but there is no version negotiation mechanism. If a breaking change is needed, there is no path for `/api/v2/` controllers to coexist with `/api/v1/` without adding new controller classes.

**Recommendation:** Document a versioning policy before the first external client integration.

---

### No rate limiting at the HTTP layer

OTP endpoints have application-level rate limiting in `AuthService`. However, there is no global HTTP-layer rate limiting (e.g. via a Spring filter or API gateway). All endpoints are equally exposed to brute-force and enumeration attacks.

**Recommendation:** Add a request-rate filter (e.g. Bucket4j) or deploy behind a gateway that enforces rate limits per IP.

---

### No structured logging / correlation IDs

`AuthService` uses `log.info/warn/error` with email addresses in the message. There is no correlation ID propagated through the request lifecycle, which makes it difficult to trace a single user journey across log lines in a multi-request flow (registration initiate → verify → login).

**Recommendation:** Add an MDC filter that attaches a `requestId` (UUID) to every log line for the duration of a request.

---

## Areas to Refactor Later

| Area | Current State | Suggested Refactor |
|---|---|---|
| `AuthService.createSession()` | Builds access + refresh tokens and persists the refresh token. Session creation logic is embedded in the service. | Extract a `SessionFactory` or `TokenIssuer` component responsible only for token issuance and persistence. |
| `ProgressEvaluationService` | One large class handles all four tracking types, all five PR types, and snapshot creation. | Split into `WeightRepsEvaluator`, `CardioEvaluator`, etc., each implementing a common `TrackingTypeEvaluator` interface. |
| `AuthController.sendSession()` + `refreshCookie()` | Cookie construction and response shaping are private methods on the controller. | Move to a `SessionResponseFactory` so the response contract is reusable and independently testable. |
| `GuestWorkoutStorageService` | IndexedDB and localStorage paths are interleaved throughout each method with `if (db) ... else ...` branches. | Extract `IdbWorkoutStore` and `LocalStorageWorkoutStore` implementing a common `WorkoutStorageBackend` interface. `GuestWorkoutStorageService` selects the backend once at init time. |
| `LiveWorkoutStore` | Persist call is scattered across every mutation method. | Centralize persistence in a single `effect()` that reacts to the `workout` signal changing, so new mutations cannot accidentally skip the persist call. |
| Guest → authenticated user data merge | `WorkoutSyncService` handles bulk workout sync post-login, but there is no equivalent merge for plan data or progress history created as a guest. | Define a clear "guest data ownership" policy and implement sync handlers for each offline-capable resource. |
