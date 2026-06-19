# Data Model

> Reflects the implemented MongoDB collections as of the current codebase.
> Cross-referenced against [backend-components.md](./backend-components.md) and [TRACKING_TYPES.md](./TRACKING_TYPES.md).

---

## Collections

| Collection | Purpose | TTL index |
|---|---|---|
| `users` | Account identity | — |
| `refresh_tokens` | Active refresh token hashes | `expiresAt` |
| `pending_registrations` | In-progress OTP registrations | `expiresAt` |
| `password_reset_requests` | In-progress password resets | `expiresAt` |
| `exercises` | Exercise catalog | — |
| `workouts` | Sessions with embedded exercises and sets | — |
| `workout_plans` | Multi-day training plan templates | — |
| `exercise_progress` | All-time PR values per user per exercise | — |
| `exercise_progress_history` | One snapshot per exercise per finished workout | — |
| `pr_events` | Individual PR records | — |
| `user_settings` | Per-user preferences | — |

Collections `refresh_tokens`, `pending_registrations`, and `password_reset_requests` use MongoDB TTL indexes for automatic document expiry. No application-layer cleanup job is required.

---

## users

```
User @Document("users")
─────────────────────────────
id            String        (MongoDB ObjectId)
email         String        unique index
displayName   String
passwordHash  String        BCrypt hash
createdAt     Instant
updatedAt     Instant
```

`email` is stored lowercased and trimmed. `passwordHash` is a BCrypt hash; the raw password is never persisted.

---

## refresh_tokens

```
RefreshToken @Document("refresh_tokens")
─────────────────────────────────────────
id          String    (pre-generated ObjectId — used as tokenId claim)
userId      String    index
tokenHash   String    HMAC-SHA256(rawToken, JWT_REFRESH_SECRET)
expiresAt   Instant   TTL index
revokedAt   Instant   null until revoked
```

Raw refresh tokens are never stored. The hash is derived by HMAC-SHA256 keyed with `JWT_REFRESH_SECRET`. On refresh or logout, `revokedAt` is set to the current instant. Expired documents are removed automatically by the TTL index.

The `id` is pre-generated before token signing so session creation requires exactly one MongoDB write, not two.

---

## pending_registrations

```
PendingRegistration @Document("pending_registrations")
───────────────────────────────────────────────────────
email           String    unique index
displayName     String
passwordHash    String    BCrypt hash (pre-hashed before OTP step)
otpHash         String    BCrypt hash of the 6-digit OTP
expiresAt       Instant   TTL index (10 minutes from creation)
attemptCount    int
lastAttemptAt   Instant
```

Created at `POST /auth/register/initiate`. Deleted immediately after a successful `POST /auth/register/verify`. Expired documents are removed by the TTL index. Rate limiting is enforced at the service layer: ≥ 3 attempts within 10 minutes returns `429 Too Many Requests`.

---

## password_reset_requests

```
PasswordResetRequest @Document("password_reset_requests")
──────────────────────────────────────────────────────────
email           String    unique index
otpHash         String    BCrypt hash of the 6-digit OTP
expiresAt       Instant   TTL index (10 minutes from creation)
attemptCount    int
lastAttemptAt   Instant
```

Created at `POST /auth/forgot-password`. Deleted immediately after a successful `POST /auth/forgot-password/reset`. Rate-limit errors are silently suppressed to prevent enumeration of registered emails.

---

## exercises

```
Exercise @Document("exercises")
────────────────────────────────
id             String
name           String
target         String        primary muscle group
equipment      String
exerciseType   String        e.g. "strength", "cardio"
trackingType   TrackingType  WEIGHT_REPS | REPS_ONLY | DURATION | CARDIO
providerType   String        source provider identifier
sourceInfo     String        provider-specific metadata
catalogVersion int           bumped on catalog updates
```

`trackingType` defaults to `WEIGHT_REPS` for any document that predates the field. No migration is required — the service layer applies a null-safe default.

`trackingType` drives set validation (`WorkoutSetValidator`), PR analytics (`ProgressEvaluationService`), and frontend logging UI column layout. See [TRACKING_TYPES.md](./TRACKING_TYPES.md) for full specification.

**Indexes:** text search on `name`; compound indexes for `target`, `equipment`, and `exerciseType` filters; `catalogVersion` for versioned cache invalidation.

---

## workouts

```
Workout @Document("workouts")
──────────────────────────────
id           String
userId       String        index
name         String
status       String        "active" | "completed"
startedAt    Instant       index (with userId for history queries)
finishedAt   Instant       nullable
exercises    List<WorkoutExercise>   embedded
```

Exercises and sets are embedded in the workout document for fast active-session writes and history reads. The workout references exercises in the `exercises` collection by `exerciseId` only — exercise names and metadata are snapshotted at the time of logging.

### WorkoutExercise (embedded)

```
WorkoutExercise
───────────────
id           String
exerciseId   String    reference to exercises collection
name         String    snapshot at time of logging
order        int
sets         List<WorkoutSet>   embedded
```

### WorkoutSet (embedded)

All fields except `order` and `completedAt` are nullable. Required fields depend on the exercise's `TrackingType`.

```
WorkoutSet
──────────────────
order            int
reps             Integer    WEIGHT_REPS (required), REPS_ONLY (required)
weight           Double     WEIGHT_REPS (required), REPS_ONLY (optional)
durationSeconds  Integer    DURATION (required), CARDIO (required)
distanceKm       Double     CARDIO (optional)
speed            Double     CARDIO (optional)
incline          Double     CARDIO (optional)
completedAt      Instant    nullable
setType          String     "standard" | "warmup" | "dropset"
tempo            embedded   eccentric, pauseBottom, concentric, pauseTop (all nullable)
```

| TrackingType | Required fields | Optional fields |
|---|---|---|
| `WEIGHT_REPS` | `reps`, `weight` | — |
| `REPS_ONLY` | `reps` | `weight` |
| `DURATION` | `durationSeconds` | — |
| `CARDIO` | `durationSeconds` | `distanceKm`, `speed`, `incline` |

Validation is enforced by `WorkoutSetValidator` in `WorkoutService.addSet()`, not by Jakarta annotations, because the required-field constraint depends on the exercise's `TrackingType` — a separate entity not available at the DTO layer.

---

## workout_plans

```
WorkoutPlan @Document("workout_plans")
───────────────────────────────────────
id           String
userId       String    index
name         String
description  String    nullable
days         List<PlanDay>   embedded
```

### PlanDay (embedded)

```
PlanDay
───────────────
label        String    e.g. "Day 1 – Push"
exercises    List<PlanExercise>   embedded
```

### PlanExercise (embedded)

```
PlanExercise
────────────────────
exerciseId    String
exerciseName  String    snapshot
sets          List<PlanSet>   embedded
```

### PlanSet (embedded)

```
PlanSet
───────
reps    int
```

---

## exercise_progress

One document per user per exercise. Updated in place when a new PR is set. Created on first workout that includes the exercise.

```
ExerciseProgress @Document("exercise_progress")
────────────────────────────────────────────────
id                       String
userId                   String    compound index with exerciseId
exerciseId               String

weightPr                 double    WEIGHT_REPS — max weight lifted
firstWeightPr            Double    nullable — first recorded weight PR (set once, never overwritten)
repPrReps                int       WEIGHT_REPS / REPS_ONLY — best rep count
repPrWeight              double    WEIGHT_REPS / REPS_ONLY — weight at best rep set
estimatedOneRepMaxPr     double    WEIGHT_REPS — best e1RM (Epley formula)
firstEstimatedOneRepMax  Double    nullable — first recorded e1RM (set once, never overwritten)
longestDurationSeconds   int       DURATION / CARDIO — longest single set duration
longestDistanceKm        double    CARDIO — longest single set distance

totalPrs                 int       lifetime PR count across all types
lastImprovedAt           Instant   nullable
```

`firstWeightPr` and `firstEstimatedOneRepMax` are set exactly once — on the first PR — and never overwritten. They enable "Started: 20 kg → Now: 80 kg" summary displays.

Fields irrelevant to an exercise's `TrackingType` remain at their default value (0) and are not presented in the UI.

---

## exercise_progress_history

One document per exercise per finished workout, unconditionally. Written by `ProgressEvaluationService` regardless of whether a PR occurred.

```
ExerciseProgressHistory @Document("exercise_progress_history")
───────────────────────────────────────────────────────────────
id               String
userId           String    compound unique index: (userId, exerciseId, workoutId)
exerciseId       String
workoutId        String
performedAt      Instant

bestWeight       Double    nullable — WEIGHT_REPS
bestSetWeight    Double    nullable — WEIGHT_REPS / REPS_ONLY
bestSetReps      Integer   nullable — WEIGHT_REPS / REPS_ONLY
bestE1rm         Double    nullable — WEIGHT_REPS (Epley)
bestDurationSeconds  Integer   nullable — DURATION / CARDIO
bestDistanceKm   Double    nullable — CARDIO
```

The unique index on `(userId, exerciseId, workoutId)` makes re-evaluation safe — a second call for the same workout will not produce a duplicate snapshot.

---

## pr_events

One document per PR type per exercise per finished workout. At most one event per type per exercise per workout is ever emitted.

```
PrEvent @Document("pr_events")
───────────────────────────────
id             String
userId         String    index
exerciseId     String    compound index with userId
workoutId      String
prType         PrType    WEIGHT | REPS | ESTIMATED_ONE_REP_MAX | DURATION | DISTANCE
previousValue  Double    nullable — the value before this PR; null if this is the first ever PR
newValue       Double    the new PR value
achievedAt     Instant
```

`previousValue` being null indicates this is the athlete's first ever PR of that type for that exercise. The `previousValue` → `newValue` pair supports "35 kg → 47.5 kg" display in the PR history UI.

---

## user_settings

One document per user. Created atomically at account registration by `AuthService`.

```
UserSettings @Document("user_settings")
────────────────────────────────────────
id       String
userId   String    unique index

units
  weight      String    "kg" | "lb"
  distance    String    "km" | "mi"

workout
  defaultRestSeconds    int
  autoStartRestTimer    boolean

appearance
  theme    String    "dark" | "light"
```

Default values are applied by `UserSettings.createDefaults(userId)`. The `getOrCreate` guard in `UserSettingsService` acts as a safety net for accounts created before this collection existed.

The frontend `UserSettingsStore` reads from localStorage on startup (no flicker), then fetches from the API after login. Updates are applied optimistically and rolled back on API failure.

See [user-settings.md](./user-settings.md) for full architecture rationale.

---

## Removed / Superseded Collections

The following collections appeared in earlier design documents and are **no longer part of the implemented system**:

| Former name | Status | Reason |
|---|---|---|
| `refreshtokens` | Replaced | Collection is named `refresh_tokens` |
| `personal_records` | Replaced | Superseded by `exercise_progress`, `exercise_progress_history`, and `pr_events` |
| `exercise_provider_mappings` | Removed | Provider mapping layer not present in current implementation; exercises carry `providerType` and `sourceInfo` fields directly |

---

## Indexing Notes

| Collection | Index |
|---|---|
| `users` | unique on `email` |
| `refresh_tokens` | TTL on `expiresAt`; index on `userId` |
| `pending_registrations` | TTL on `expiresAt`; unique on `email` |
| `password_reset_requests` | TTL on `expiresAt`; unique on `email` |
| `exercises` | text on `name`; compound on `target`, `equipment`, `exerciseType`; `catalogVersion` |
| `workouts` | compound on `(userId, startedAt)` for history pagination |
| `workout_plans` | index on `userId` |
| `exercise_progress` | compound unique on `(userId, exerciseId)` |
| `exercise_progress_history` | compound unique on `(userId, exerciseId, workoutId)` |
| `pr_events` | compound on `(userId, exerciseId)` |
| `user_settings` | unique on `userId` |
