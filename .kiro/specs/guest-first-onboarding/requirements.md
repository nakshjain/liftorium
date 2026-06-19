# Requirements Document

## Introduction

This feature transforms the app's entry point from a mandatory login wall into a guest-first experience. Users land directly on the Dashboard, can complete full workouts locally without an account, and are invited to sign up only after experiencing value. When they do authenticate, locally stored guest workouts sync automatically to the backend.

The change spans Angular routing and guards (making Dashboard the public default), a new `GuestWorkoutStorageService` backed by IndexedDB with localStorage fallback, and a new `WorkoutSyncService` paired with a backend bulk-import endpoint for deduplication-safe upload on sign-in.

---

## Glossary

- **Guest**: An unauthenticated user interacting with the app without a registered account.
- **GuestWorkoutStorageService**: The Angular service responsible for persisting guest workout data to the browser using IndexedDB with a localStorage fallback.
- **WorkoutSyncService**: The Angular service that orchestrates post-authentication upload of pending guest workouts to the backend.
- **AuthGateModal**: A modal overlay shown to guest users who attempt to access a protected feature, replacing hard navigation redirects.
- **WorkoutSyncModal**: A modal shown after authentication when pending guest workouts are detected, prompting the user to confirm or skip sync.
- **GuestDashboardComponent**: The welcome view embedded in `DashboardPageComponent` and rendered for unauthenticated users.
- **NavBarComponent**: The top-level navigation bar that adapts its displayed controls based on authentication state.
- **WorkoutSummaryPageComponent**: The post-workout summary screen, enhanced with a "Save Progress" CTA for guest users.
- **AuthGuard**: The Angular route guard that protects authenticated-only routes and triggers `AuthGateModal` instead of hard-redirecting.
- **GuestCompletedWorkout**: The local data model representing a completed workout stored by a guest before sync.
- **SyncBulkRequest**: The backend DTO carrying one or more guest workouts to be imported via `POST /api/v1/workouts/sync`.
- **clientId**: A client-generated UUID assigned to a guest workout, used by the backend for deduplication.
- **SyncState**: The reactive state of the sync process: `idle | checking | pending | syncing | done | error`.
- **AuthStatus**: The reactive authentication state: `anonymous | checking | authenticated`.
- **LiveWorkout**: The in-progress workout model used by `LiveWorkoutStore`.
- **IndexedDB**: The browser-native structured storage API used as the primary storage backend for `GuestWorkoutStorageService`.
- **pendingFeature**: A signal set by the updated `AuthGuard` to communicate which protected feature a guest attempted to access, consumed by `AuthGateModal`.

---

## Requirements

### Requirement 1: Public Dashboard Landing Page

**User Story:** As a guest user, I want the app to open directly to the Dashboard without requiring login, so that I can start using the app immediately and evaluate its value before creating an account.

#### Acceptance Criteria

1. WHEN an unauthenticated user navigates to the root path (`/`), THE Router SHALL redirect the user to `/app` without requiring authentication.
2. WHEN an unauthenticated user navigates to an unrecognised path, THE Router SHALL redirect the user to `/app` without requiring authentication.
3. WHILE `AuthStatus` is `checking`, THE DashboardPageComponent SHALL render without requiring a resolved authenticated session.
4. THE DashboardPageComponent SHALL be accessible to both guest and authenticated users without triggering any authentication guard.
5. WHEN an unauthenticated user accesses `/app`, THE DashboardPageComponent SHALL render the `GuestDashboardComponent`.
6. WHEN an authenticated user accesses `/app`, THE DashboardPageComponent SHALL render the authenticated dashboard view.

---

### Requirement 2: Guest Dashboard Experience

**User Story:** As a guest user, I want to see a welcoming dashboard with a clear call-to-action to start a workout, so that I can begin tracking without friction.

#### Acceptance Criteria

1. THE GuestDashboardComponent SHALL display a prominent "Start Workout" call-to-action that navigates to the live workout page.
2. THE GuestDashboardComponent SHALL display feature cards for Workout Tracking, Progressive Overload, Analytics, and PR Tracking.
3. WHEN a guest user taps a feature card for a protected feature, THE GuestDashboardComponent SHALL open the `AuthGateModal` with the name of that feature.
4. THE GuestDashboardComponent SHALL display a lock icon on feature cards that require authentication.

---

### Requirement 3: Guest Workout Recording

**User Story:** As a guest user, I want to start, log, and complete a full workout without an account, so that I can experience the core feature before signing up.

#### Acceptance Criteria

1. THE Router SHALL allow unauthenticated users to access `/app/workout` without triggering any authentication guard.
2. THE Router SHALL allow unauthenticated users to access `/app/exercises` without triggering any authentication guard.
3. WHEN a guest user completes a workout, THE LiveWorkoutPage SHALL save the completed workout via `GuestWorkoutStorageService.saveCompletedWorkout()`.
4. WHEN a guest user completes a workout, THE LiveWorkoutPage SHALL navigate to `WorkoutSummaryPage` with the summary data.

---

### Requirement 4: Guest Workout Local Persistence

**User Story:** As a guest user, I want my workouts to be saved locally so that my data is not lost if I close the browser or refresh the page.

#### Acceptance Criteria

1. THE GuestWorkoutStorageService SHALL persist an in-progress workout by calling `saveActiveWorkout(workout)` so it survives page refreshes.
2. THE GuestWorkoutStorageService SHALL restore an in-progress workout via `loadActiveWorkout()` returning the previously saved `LiveWorkout` object.
3. WHEN `saveActiveWorkout` is called, THE GuestWorkoutStorageService SHALL write to IndexedDB as the primary storage mechanism.
4. IF IndexedDB is unavailable, THEN THE GuestWorkoutStorageService SHALL fall back to localStorage for all read and write operations.
5. WHEN the storage backend switches from IndexedDB to localStorage, THE GuestWorkoutStorageService SHALL update the `storageType` signal to `'localstorage'`.
6. THE GuestWorkoutStorageService SHALL expose a `storageType` signal reflecting the active backend (`'indexeddb'` or `'localstorage'`).
7. WHEN `saveCompletedWorkout(workout)` is called, THE GuestWorkoutStorageService SHALL store the workout with `synced` set to `false`.
8. THE GuestWorkoutStorageService SHALL initialise with `storageType` set to `'indexeddb'` when IndexedDB is available.
9. WHEN `clearActiveWorkout()` is called, THE GuestWorkoutStorageService SHALL remove the active workout record from storage.

---

### Requirement 5: Stale Active Workout Handling

**User Story:** As a guest user, I want a workout I left open on a previous day to be safely recovered rather than lost, so that my data is preserved even if I forgot to finish it.

#### Acceptance Criteria

1. WHEN `loadActiveWorkout()` is called and the stored active workout has a `startedAt` date prior to the current calendar day, THE GuestWorkoutStorageService SHALL save that workout to `completed_workouts` with `synced` set to `false`.
2. WHEN a stale active workout is moved to `completed_workouts`, THE GuestWorkoutStorageService SHALL return `null` from `loadActiveWorkout()`.
3. WHEN a stale active workout is auto-completed, THE GuestWorkoutStorageService SHALL clear the active workout record from the `active_workout` store.

---

### Requirement 6: IndexedDB Schema

**User Story:** As a developer, I want the guest workout storage to use a well-defined IndexedDB schema, so that queries are efficient and the data model is consistent.

#### Acceptance Criteria

1. THE GuestWorkoutStorageService SHALL create an IndexedDB database named `liftorium_guest_db` at schema version 1.
2. THE GuestWorkoutStorageService SHALL create an object store named `active_workout` with `keyPath` set to `'key'`.
3. THE GuestWorkoutStorageService SHALL create an object store named `completed_workouts` with `keyPath` set to `'id'`.
4. THE GuestWorkoutStorageService SHALL create a non-unique index named `synced` on the `completed_workouts` store.
5. THE GuestWorkoutStorageService SHALL create a non-unique index named `startedAt` on the `completed_workouts` store.
6. WHEN querying pending workouts, THE GuestWorkoutStorageService SHALL use the `synced` index to retrieve only records where `synced` is `false`.

---

### Requirement 7: GuestCompletedWorkout Data Model

**User Story:** As a developer, I want the guest workout data model to be well-defined and validated, so that invalid data cannot be persisted or synced.

#### Acceptance Criteria

1. THE GuestWorkoutStorageService SHALL assign a client-generated UUID to the `id` field of every `GuestCompletedWorkout` on creation.
2. THE GuestWorkoutStorageService SHALL set `synced` to `false` on every newly created `GuestCompletedWorkout`.
3. THE GuestWorkoutStorageService SHALL set `syncedAt` to `null` on every newly created `GuestCompletedWorkout`.
4. WHEN validating a `GuestCompletedWorkout`, THE GuestWorkoutStorageService SHALL reject records where `startedAt` is not less than `finishedAt`.
5. THE GuestWorkoutStorageService SHALL accept `GuestCompletedWorkout` records with an empty `exercises` array as valid.

---

### Requirement 8: Sync Pending Workouts Tracking

**User Story:** As a guest user, I want the app to track which of my local workouts have not yet been synced, so that none are missed when I eventually sign up.

#### Acceptance Criteria

1. THE GuestWorkoutStorageService SHALL return all `GuestCompletedWorkout` records with `synced` equal to `false` when `getPendingWorkouts()` is called.
2. WHEN `markWorkoutsSynced(ids)` is called, THE GuestWorkoutStorageService SHALL update the `synced` field to `true` and set `syncedAt` to the current ISO timestamp for each matching record.
3. WHEN `markWorkoutsSynced(ids)` is called with an ID that is already marked as synced, THE GuestWorkoutStorageService SHALL leave that record unchanged.
4. WHEN `clearSyncedWorkouts()` is called, THE GuestWorkoutStorageService SHALL remove all records where `synced` is `true` from the `completed_workouts` store.

---

### Requirement 9: Auth Gate Modal

**User Story:** As a guest user, I want to see a contextual prompt when I try to access a feature that requires an account, so that I understand why I am being prompted and can choose whether to sign up.

#### Acceptance Criteria

1. WHEN `AuthGuard` blocks a guest user from accessing a protected route, THE AuthGuard SHALL set the `AuthGateService.pendingFeature` signal and return `false` without issuing a URL redirect.
2. WHEN `AuthGateService.pendingFeature` signal is set, THE AuthGateModal SHALL open and display the name of the protected feature.
3. THE AuthGateModal SHALL display a "Sign Up" action that navigates the user to `/auth/signup`.
4. THE AuthGateModal SHALL display a "Login" action that navigates the user to `/auth/login`.
5. THE AuthGateModal SHALL display a "Maybe Later" action that dismisses the modal without navigating.
6. WHEN the "Maybe Later" action is taken, THE AuthGateModal SHALL emit a `dismissed` event and close without changing the current route.
7. WHEN `AuthGuard` blocks a guest user, THE AuthGuard SHALL preserve the attempted URL as a `returnUrl` parameter for use after successful authentication.

---

### Requirement 10: Protected Route Configuration

**User Story:** As a developer, I want protected routes to be clearly configured so that guest users cannot access authenticated-only features directly.

#### Acceptance Criteria

1. THE Router SHALL protect `/app/workouts/history` with `AuthGuard`.
2. THE Router SHALL protect `/app/workouts/:workoutId` with `AuthGuard`.
3. THE Router SHALL protect `/app/plan` with `AuthGuard`.
4. THE Router SHALL protect `/app/progress` and all child routes with `AuthGuard`.
5. THE Router SHALL apply `guestGuard` to the `/auth` route tree to redirect already-authenticated users away from login/signup pages.

---

### Requirement 11: NavBar Dynamic Auth Controls

**User Story:** As a user, I want the navigation bar to show appropriate controls based on whether I am logged in or not, so that I can always access login, signup, or my account easily.

#### Acceptance Criteria

1. WHEN `AuthStatus` is `anonymous`, THE NavBarComponent SHALL display "Login" and "Sign Up" buttons.
2. WHEN `AuthStatus` is `authenticated`, THE NavBarComponent SHALL display the user avatar and account menu instead of login/signup buttons.
3. WHILE `AuthStatus` is `checking`, THE NavBarComponent SHALL display a loading skeleton or spinner in place of auth controls.
4. THE NavBarComponent SHALL read authentication state exclusively via the `authService.status` signal.

---

### Requirement 12: Workout Summary Page Guest CTA

**User Story:** As a guest user who has just completed a workout, I want to see my summary and be invited to save my progress, so that I have a natural moment to consider creating an account.

#### Acceptance Criteria

1. WHEN `AuthStatus` is `anonymous`, THE WorkoutSummaryPageComponent SHALL display a banner stating that the workout is stored locally.
2. WHEN `AuthStatus` is `anonymous`, THE WorkoutSummaryPageComponent SHALL display a "Create Account" action.
3. WHEN `AuthStatus` is `anonymous`, THE WorkoutSummaryPageComponent SHALL display a "Login" action.
4. WHEN `AuthStatus` is `anonymous`, THE WorkoutSummaryPageComponent SHALL display a "Continue as Guest" action that returns the user to the Dashboard.
5. WHEN `AuthStatus` is `authenticated`, THE WorkoutSummaryPageComponent SHALL display the standard completion actions (view history, start new workout) without the guest banner.

---

### Requirement 13: Sync Preview and Confirmation

**User Story:** As a user who has just authenticated, I want to be informed about my pending guest workouts and given the choice to sync them, so that I remain in control of my data.

#### Acceptance Criteria

1. WHEN `AuthService` establishes a session after login or signup, THE AuthService SHALL call `WorkoutSyncService.checkForPendingWorkouts()`.
2. WHEN `checkForPendingWorkouts()` finds one or more pending workouts, THE WorkoutSyncService SHALL set `syncState` to `'pending'` and expose a `SyncPreview` with `count`, `earliestDate`, and `latestDate`.
3. WHEN `syncState` is `'pending'`, THE WorkoutSyncModal SHALL display the pending workout count and date range to the user.
4. THE WorkoutSyncModal SHALL display a "Sync My Data" action that calls `WorkoutSyncService.executeSync()`.
5. THE WorkoutSyncModal SHALL display a "Skip" action that calls `WorkoutSyncService.dismissSync()`.
6. WHEN `checkForPendingWorkouts()` finds no pending workouts, THE WorkoutSyncService SHALL remain in `'idle'` state and THE WorkoutSyncModal SHALL not be shown.

---

### Requirement 14: Sync Execution

**User Story:** As a user, I want my locally stored guest workouts uploaded to my account after I sign in, so that I do not lose any workout data.

#### Acceptance Criteria

1. WHEN `executeSync()` is called, THE WorkoutSyncService SHALL set `syncState` to `'syncing'`.
2. WHEN `executeSync()` is called, THE WorkoutSyncService SHALL read all pending workouts from `GuestWorkoutStorageService.getPendingWorkouts()`.
3. WHEN building the sync payload, THE WorkoutSyncService SHALL map each `GuestCompletedWorkout.id` to `clientId` in the `SyncBulkRequest`.
4. WHEN `executeSync()` is called, THE WorkoutSyncService SHALL send a `POST /api/v1/workouts/sync` request with the bulk payload.
5. WHEN the backend responds with success, THE WorkoutSyncService SHALL call `GuestWorkoutStorageService.markWorkoutsSynced(ids)` for all submitted workout IDs.
6. WHEN the backend responds with success, THE WorkoutSyncService SHALL set `syncState` to `'done'`.
7. WHEN `executeSync()` completes successfully, THE WorkoutSyncModal SHALL display the number of synced and skipped workouts from the response.

---

### Requirement 15: Sync Error Handling

**User Story:** As a user, I want to be clearly informed if my workout sync fails and have my data preserved, so that I can retry later without losing anything.

#### Acceptance Criteria

1. IF the `POST /api/v1/workouts/sync` request returns a network error or a 5xx response, THEN THE WorkoutSyncService SHALL set `syncState` to `'error'`.
2. IF `syncState` is `'error'`, THEN THE WorkoutSyncModal SHALL display an error message indicating that sync failed and the user can try again later.
3. WHEN a sync attempt fails, THE GuestWorkoutStorageService SHALL retain all affected `GuestCompletedWorkout` records with `synced` equal to `false`.
4. WHEN `dismissSync()` is called, THE WorkoutSyncService SHALL set `syncState` to `'idle'` without modifying any local workout records.

---

### Requirement 16: Backend Bulk Sync Endpoint

**User Story:** As a developer, I want a dedicated bulk sync endpoint that accepts guest workouts and deduplicates them, so that repeat sync attempts do not create duplicate records.

#### Acceptance Criteria

1. THE SyncController SHALL expose `POST /api/v1/workouts/sync` requiring a valid JWT bearer token.
2. WHEN a valid `SyncBulkRequest` is received, THE SyncController SHALL persist each workout in the payload that does not already exist for the authenticated user.
3. WHEN processing a `SyncBulkRequest`, THE SyncController SHALL use the `clientId` field to detect duplicates by querying for existing workouts with matching `{ userId, clientId }`.
4. WHEN a workout in the payload has a `clientId` that already exists for the user, THE SyncController SHALL count it as `skipped` and not create a duplicate record.
5. WHEN processing completes, THE SyncController SHALL return a response with `synced` and `skipped` counts.
6. THE SyncController SHALL reject any `SyncBulkRequest` containing more than 50 workouts with a 400 response.
7. THE SyncController SHALL reject a `SyncBulkRequest` with zero workouts with a 400 response.
8. WHEN a `SyncWorkoutRequest` is received, THE SyncController SHALL validate `reps` in the range 0–1000 and `weight` in the range 0–2000.
9. WHEN a `SyncWorkoutRequest` is received, THE SyncController SHALL validate that `name` is not blank and does not exceed 120 characters.
10. WHEN a `SyncWorkoutRequest` is received, THE SyncController SHALL validate that `exerciseId` is not blank.
11. THE Workout entity SHALL store the `clientId` field as a nullable indexed field, populated only for guest-synced workouts.

---

### Requirement 17: Sync Deduplication Correctness

**User Story:** As a user, I want syncing the same workout multiple times to result in exactly one stored copy, so that my history is accurate even if I sync from multiple devices.

#### Acceptance Criteria

1. WHEN the same `clientId` is submitted to `POST /api/v1/workouts/sync` in separate requests for the same user, THE SyncController SHALL store exactly one workout record per unique `clientId` per user.
2. WHEN duplicate `clientId` values are submitted in a single `SyncBulkRequest`, THE SyncController SHALL store one record and count the remainder as `skipped`.

---

### Requirement 18: Sync Payload Integrity

**User Story:** As a developer, I want to ensure the sync payload produced by the frontend always conforms to the backend contract, so that integration errors are caught early.

#### Acceptance Criteria

1. THE WorkoutSyncService SHALL produce a `SyncBulkRequest` where every `clientId` matches the `id` of its source `GuestCompletedWorkout`.
2. THE WorkoutSyncService SHALL produce a `SyncBulkRequest` where `startedAt` and `finishedAt` are valid ISO 8601 timestamps.
3. THE WorkoutSyncService SHALL produce a `SyncBulkRequest` where `durationSeconds` is a non-negative integer.

---

### Requirement 19: Sync Idempotency

**User Story:** As a developer, I want the sync operation to be safely repeatable, so that retries do not corrupt data.

#### Acceptance Criteria

1. WHEN `markWorkoutsSynced(ids)` is called multiple times with the same IDs, THE GuestWorkoutStorageService SHALL produce the same final state as calling it once.
2. WHEN `POST /api/v1/workouts/sync` is called multiple times with the same payload for the same user, THE SyncController SHALL produce the same backend state as calling it once — exactly one workout record per unique `clientId`.

---

### Requirement 20: Storage Fallback Transparency

**User Story:** As a developer, I want the `GuestWorkoutStorageService` to present a consistent interface regardless of which storage backend is active, so that calling code does not need to handle storage type differences.

#### Acceptance Criteria

1. THE GuestWorkoutStorageService SHALL expose the same `saveActiveWorkout`, `loadActiveWorkout`, `clearActiveWorkout`, `saveCompletedWorkout`, `getPendingWorkouts`, `markWorkoutsSynced`, and `clearSyncedWorkouts` methods regardless of whether IndexedDB or localStorage is the active backend.
2. WHEN using the localStorage fallback, THE GuestWorkoutStorageService SHALL read and write data using the same logical key contract as the IndexedDB implementation.
3. THE GuestWorkoutStorageService SHALL not throw unhandled exceptions to callers when switching from IndexedDB to the localStorage fallback.

---

### Requirement 21: Active Workout Continuity After Page Refresh

**User Story:** As a guest user mid-workout, I want to reload the page without losing my session, so that an accidental refresh does not erase my progress.

#### Acceptance Criteria

1. WHEN a guest user refreshes the page during an active workout, THE GuestWorkoutStorageService SHALL return the previously persisted `LiveWorkout` from `loadActiveWorkout()`.
2. WHEN `loadActiveWorkout()` returns a non-null value, THE LiveWorkoutPage SHALL resume the workout from the restored state.
3. THE GuestWorkoutStorageService SHALL not block Angular application bootstrap; the active workout load SHALL be performed asynchronously after bootstrap completes.

---

### Requirement 22: Guest Data Security and Privacy

**User Story:** As a guest user, I want confidence that my locally stored workout data is never sent to the server without my explicit consent, so that I feel safe using the app without an account.

#### Acceptance Criteria

1. THE WorkoutSyncService SHALL only call `POST /api/v1/workouts/sync` after the user explicitly confirms the `WorkoutSyncModal`.
2. THE SyncController SHALL require a valid JWT bearer token and SHALL reject requests without a valid token with a 401 response.
3. WHEN a `clientId` is used for deduplication, THE SyncController SHALL scope the lookup to the authenticated user's `userId` so that one user cannot reference or overwrite another user's workout.
4. THE GuestWorkoutStorageService SHALL store all guest data in origin-scoped browser storage (IndexedDB or localStorage) that is inaccessible to other origins.

---

### Requirement 23: Backward Compatibility for Authenticated Users

**User Story:** As an existing authenticated user, I want all routes and features I currently have access to remain unchanged, so that this new guest feature does not break my existing experience.

#### Acceptance Criteria

1. THE Router SHALL preserve all routes accessible to an authenticated user before this change, with the same paths and component mappings.
2. WHEN an authenticated user navigates to any previously accessible route, THE AuthGuard SHALL allow navigation without triggering `AuthGateModal`.
3. THE guestGuard SHALL continue to redirect authenticated users who navigate to `/auth` routes to `/app`.
4. THE existing `WorkoutController` API contracts SHALL remain unmodified by the addition of the sync endpoint.
