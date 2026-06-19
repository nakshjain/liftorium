# Frontend Architecture

> Documents the implemented Angular frontend.
> For the full system context see [system-architecture.md](./system-architecture.md) and [overview.md](./overview.md).

---

## Stack

| Technology | Version / Notes |
|---|---|
| Angular | 21, standalone components |
| TypeScript | Strict mode |
| TailwindCSS | 4, utility-only, no custom CSS unless unavoidable |
| Angular Signals | Core state primitive — no third-party state library |
| IndexedDB | Via `idb` library — guest workout and catalog persistence |
| Lazy-loaded routes | Every feature module loads on demand |
| SCSS | Per-component files — empty files kept as a predictable home for future styles |

---

## Design Goals

- Dark theme by default.
- Mobile-first layout.
- Minimal taps during workout logging — the primary usage context is one-handed operation mid-set.
- Fast perceived performance — Signal-based stores update synchronously; IndexedDB reads happen in the background.
- Clear and calm UI for repeated daily use.

---

## Folder Structure

```
frontend/src/app/
├── core/
│   ├── auth/              AuthService, TokenStorageService, authInterceptor, AuthGateService
│   ├── guards/            authGuard, guestGuard
│   └── api/               API_BASE_URL token, api-response types
├── shared/
│   ├── components/        Reusable UI components (exercise picker, nav bar, etc.)
│   ├── models/            Shared TypeScript types
│   └── utils/             weight.utils, formatting helpers
└── features/
    ├── auth/              login-page, signup-page, forgot-password-page, otp-verify-page
    ├── workouts/          live-workout-page, workout-detail-page, guest workout models
    ├── exercises/         exercise catalog pages
    ├── progress/          progress pages
    ├── plans/             workout plan pages
    └── settings/          settings-page, UserSettingsStore, SettingsService
```

---

## Component File Structure

All components use a dedicated three-file folder:

```
feature-component/
  feature-component.ts      component class — logic, Signals, computed state
  feature-component.html    template — bindings, structural control flow, event wiring only
  feature-component.scss    component-specific styles (may be empty)
```

Inline templates and inline styles are not used. This keeps templates readable as features grow, produces cleaner git diffs, and gives component-specific styles a predictable home.

---

## Routing

All feature routes are lazy-loaded. Protected routes use `authGuard`.

| Path | Auth | Description |
|---|---|---|
| `/auth/login` | Guest | Login page |
| `/auth/signup` | Guest | Registration page |
| `/auth/verify` | Guest | OTP verification step |
| `/auth/forgot-password` | Guest | Forgot password flow |
| `/app/workout` | Auth | Live workout session |
| `/app/exercises` | Auth | Exercise catalog browser |
| `/app/plans` | Auth | Workout plans |
| `/app/progress` | Auth | Progress and PR history |
| `/app/settings` | Auth | User settings |

---

## State Management

Angular Signals are the sole state primitive. There is no NgRx, Akita, or other state library.

### AuthService

Owns the session state. Exposes read-only signals:

| Signal | Type | Description |
|---|---|---|
| `user` | `AuthUser \| null` | Authenticated user — id, email, displayName |
| `accessToken` | `string \| null` | Current access token |
| `status` | `AuthStatus` | `'anonymous' \| 'checking' \| 'authenticated'` |
| `isAuthenticated` | `boolean` (computed) | `status === 'authenticated' && user !== null` |

Session lifecycle:

- `initializeSession()` — called at app startup. If an access token is in storage, attempts `/auth/me`; falls back to token refresh; clears session on both failures.
- `applySession()` — called after any successful auth response. Updates all signals, persists the access token, lazy-loads `UserSettingsStore`.
- `clearSession()` — called on logout or unrecoverable 401. Clears storage, resets signals, sets the `loggedOut` flag, clears `UserSettingsStore`.

### LiveWorkoutStore

Owns the in-progress workout session. All mutations are synchronous Signal updates followed by an async IndexedDB persist.

| Signal / Computed | Description |
|---|---|
| `activeWorkout` | The current `LiveWorkout` or `null` |
| `elapsedSeconds` | Computed — respects pause/resume and `accumulatedMs` |
| `restRemainingSeconds` | Computed — countdown from `restEndsAt` |
| `restTimerActive` | Computed — `restRemainingSeconds > 0` |
| `paused` | Computed — `resumedAt === 0` |
| `completedSetCount` | Computed — count of completed sets across all exercises |
| `totalVolume` | Computed — total kg·reps for `WEIGHT_REPS` sets only |

Key operations: `startWorkout`, `pauseWorkout`, `resumeWorkout`, `finishWorkout`, `addExerciseFromPicker`, `removeExercise`, `moveExercise`, `replaceExercise`, `addSet`, `removeSet`, `toggleSetComplete`, `adjustSet`, `adjustDuration`, `setValue`, `addRestTime`, `skipRest`.

On `toggleSetComplete`, the rest timer starts automatically at the configured default duration. The rest timer `tick()` method is called by a periodic interval in the workout page component.

### UserSettingsStore

Owns user preferences. Exposes read-only signals with sensible defaults:

| Signal | Default | Description |
|---|---|---|
| `weightUnit` | `'kg'` | Weight display and input unit |
| `distanceUnit` | `'km'` | Distance display and input unit |
| `theme` | `'dark'` | App theme |
| `defaultRestSeconds` | `90` | Default rest timer duration |
| `autoStartRestTimer` | `true` | Whether rest timer starts automatically |

Startup flow:

1. `loadFromStorage()` — reads from `localStorage` at construction time. Signals are immediately populated; no flicker.
2. `load()` — called after login by `AuthService.applySession()`. Fetches from `/api/v1/settings` and updates signals + localStorage.

Updates are applied optimistically via `update(patch)`: signals and localStorage are updated before the API call. On failure, the previous values are restored.

`clear()` is called on logout to remove in-memory and persisted settings so the next user starts with defaults.

### ExerciseStoreService

Owns the exercise catalog. The catalog is downloaded from the backend in versioned pages and cached in IndexedDB.

Initialized at app startup via `APP_INITIALIZER` (`ExerciseCacheInitializer`). On startup:

1. Fetch the current catalog version from the backend.
2. Compare against the locally cached version in IndexedDB.
3. If unchanged: load from IndexedDB into memory.
4. If changed: download all pages from `/api/v1/exercises`, write to IndexedDB, update the cached version.

Exercises are available synchronously via Signal after the initializer resolves, so the workout logging page can query exercises without a network call.

---

## Offline Support

### Guest Workout Persistence

`GuestWorkoutStorageService` manages offline workout storage using IndexedDB with a localStorage fallback (private browsing, storage quota exceeded).

**Database:** `liftorium_guest_db` (version 1)

**Object stores:**

| Store | Key | Description |
|---|---|---|
| `active_workout` | `'current'` | The in-progress workout — single record |
| `completed_workouts` | `id` (UUID) | Finished workouts, including a `synced` flag |

`completed_workouts` has two indexes: `synced` (boolean) and `startedAt` (epoch ms).

**Stale workout detection:** On `loadActiveWorkout()`, if the stored workout's `startedAt` falls on a previous calendar day, it is automatically moved to `completed_workouts` and the active slot is cleared. This prevents a workout started yesterday from silently blocking a new session.

**Sync tracking:** Each `GuestCompletedWorkout` carries `synced: boolean` and `syncedAt: string | null`. `getPendingWorkouts()` returns all unsynced records. `markWorkoutsSynced(ids)` marks them synced in a single transaction.

### Post-Login Sync

`WorkoutSyncService.syncWorkouts()` is called after a successful login (including token refresh login). It:

1. Calls `guestStorage.getPendingWorkouts()`.
2. Bulk-uploads to `POST /api/v1/sync/workouts`.
3. Calls `guestStorage.markWorkoutsSynced(ids)` on success.
4. Calls `guestStorage.clearSyncedWorkouts()` to clean up.

### localStorage Fallback

When IndexedDB is unavailable, `GuestWorkoutStorageService` falls back to `localStorage` keys:

| Key | Content |
|---|---|
| `liftorium_active_workout` | Active workout JSON |
| `liftorium_completed_workouts` | Array of completed workout JSON |

The `storageType` signal (`'indexeddb' \| 'localstorage'`) reflects which backend is active.

---

## Authentication Architecture

### authInterceptor

An `HttpInterceptorFn` applied globally. On every outgoing request:

1. Checks for the `BYPASS_AUTH_INTERCEPTOR` context token. If present, forwards the request unchanged. Auth endpoints (refresh, logout, signup) bypass the interceptor to prevent infinite retry loops.
2. Clones the request with `Authorization: Bearer <accessToken>` and `withCredentials: true`.
3. If the response is `401`, calls `authService.refreshSession()` and retries the original request with the new token.
4. If refresh fails, calls `authService.clearSession()` and propagates the error.

### Token Storage

`TokenStorageService` manages access token persistence:

- Access token stored in `localStorage` under a stable key.
- A `loggedOut` flag stored in `sessionStorage`. Set on explicit logout. Cleared on next successful login. Checked by `AuthService.refreshSession()` to prevent silent refresh after explicit logout.

### Session Initialization

`initializeSession()` is called once at app startup:

1. If no access token in storage: set status to `'anonymous'`, done.
2. If token exists: attempt `/auth/me`. On success: populate user signal, set status to `'authenticated'`.
3. On `/auth/me` failure: attempt `/auth/refresh`. On success: apply new session.
4. On refresh failure: call `clearSession()`, set status to `'anonymous'`.

---

## Component Guidelines

- Standalone components only — no NgModules.
- No business logic in templates. Computed state, formatting, and condition evaluation belong in `.ts` files, services, or stores.
- TailwindCSS utility classes only. No global custom CSS unless Tailwind cannot express the requirement.
- Keep components small and focused — extract repeated UI into `shared/components/`.
- All route-level components are lazy-loaded.

---

## Mobile Workout Logging Requirements

The live workout page is the primary usage surface. Its design requirements:

- Large tap targets — set completion toggles, weight/rep adjusters.
- Fast set entry — default values pre-populated from previous set or comparison data.
- Minimal navigation while a workout is active — no modal stacks, no nested routes.
- Sticky bottom controls — rest timer and finish workout actions always in thumb reach.
- Previous set comparison — last session's sets shown inline per set row to reduce context switching.
- Rest timer overlay — visible countdown with +30 / +60 s controls and skip button.
