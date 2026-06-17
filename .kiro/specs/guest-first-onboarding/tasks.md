# Implementation Plan: Guest-First Onboarding & Workout Sync

## Overview

Transforms the app from a login-wall entry point into a guest-first experience. Implementation proceeds in six logical groups: (1) shared types and the `idb` storage service, (2) routing and guard changes, (3) `GuestWorkoutStorageService` with IndexedDB/localStorage fallback, (4) frontend UI components (NavBar, GuestDashboard, AuthGateModal, WorkoutSummaryPage, WorkoutSyncModal), (5) `WorkoutSyncService` wired to `AuthService`, and (6) the backend bulk-sync endpoint. Each group builds on the previous and ends wired into the running application.

---

## Tasks

- [x] 1. Add shared guest-workout types and install the `idb` package
  - [x] 1.1 Install the `idb` npm package in the frontend workspace
    - Run `npm install idb` inside `frontend/`
    - Confirm the package appears in `package.json` (pinned exact version)
    - _Requirements: 4.3, 6.1_

  - [x] 1.2 Create `GuestCompletedWorkout` and supporting types
    - Create `frontend/src/app/features/workouts/guest-workout.models.ts`
    - Define `GuestCompletedWorkout`, `SyncBulkRequest`, `GuestWorkoutPayload`, `SyncState`, `SyncPreview`, `SyncResult` types matching the design document
    - _Requirements: 7.1–7.5, 14.3, 18.1–18.3_

- [x] 2. Implement `GuestWorkoutStorageService`
  - [x] 2.1 Create the service skeleton and IndexedDB initialisation
    - Create `frontend/src/app/features/workouts/guest-workout-storage.service.ts`
    - Open `liftorium_guest_db` v1 via `idb`; create `active_workout` (keyPath `'key'`) and `completed_workouts` (keyPath `'id'`, indexes `synced`, `startedAt`) object stores
    - Expose `storageType` signal initialised to `'indexeddb'`
    - Catch open errors and set `storageType` to `'localstorage'`
    - _Requirements: 6.1–6.6, 4.3–4.6, 4.8, 20.3_

  - [x] 2.2 Implement active-workout read/write/clear methods
    - Implement `saveActiveWorkout(workout)`, `loadActiveWorkout()`, `clearActiveWorkout()` for both IndexedDB and localStorage backends
    - localStorage key contract: `'liftorium_active_workout'` (matching existing `STORAGE_KEY`)
    - _Requirements: 4.1, 4.2, 4.9, 20.1, 20.2_

  - [x] 2.3 Implement stale active-workout auto-completion inside `loadActiveWorkout`
    - When the stored active workout's `startedAt` date is before today, call `saveCompletedWorkout` with `synced: false`, clear `active_workout`, and return `null`
    - _Requirements: 5.1–5.3_

  - [x] 2.4 Implement `saveCompletedWorkout`, `getPendingWorkouts`, `markWorkoutsSynced`, `clearSyncedWorkouts`
    - `saveCompletedWorkout`: assign UUID `id`, set `synced: false`, `syncedAt: null`, validate `startedAt < finishedAt`
    - `getPendingWorkouts`: query via `synced` index for `synced === false`
    - `markWorkoutsSynced(ids)`: update matched records to `synced: true`, `syncedAt: now ISO`; skip already-synced records
    - `clearSyncedWorkouts`: delete all records where `synced === true`
    - localStorage fallback: implement same operations using JSON-serialised arrays under `'liftorium_completed_workouts'`
    - _Requirements: 4.7, 7.1–7.5, 8.1–8.4, 19.1, 20.1, 20.2_

  - [x] 2.5 Write property test for storage round-trip (Property 6)
    - Use fast-check; generate arbitrary `LiveWorkout` and `GuestCompletedWorkout` objects
    - **Property 6: Storage fallback round-trip** — save then load returns equivalent object for both backends
    - **Validates: Requirements 4.1, 4.2, 4.4, 20.2, 21.1**

  - [x] 2.6 Write property test for `markWorkoutsSynced` idempotency (Property 12)
    - Use fast-check; call `markWorkoutsSynced(ids)` once and twice; assert same final state
    - **Property 12: markWorkoutsSynced idempotency**
    - **Validates: Requirements 8.2, 8.3, 19.1**

  - [x] 2.7 Write property test for completed-workout synced-flag invariant (Property 9)
    - Assert every record created by `saveCompletedWorkout` has `synced: false` and `syncedAt: null`
    - **Property 9: Completed workout synced flag invariant**
    - **Validates: Requirements 4.7, 7.2, 7.3**

  - [x] 2.8 Write property test for pending-workouts query correctness (Property 11)
    - Insert mixed `synced: true` / `synced: false` records; assert `getPendingWorkouts()` returns exactly the `false` subset
    - **Property 11: Pending workouts query correctness**
    - **Validates: Requirements 8.1**

  - [x] 2.9 Write property test for stale active-workout auto-completion (Property 10)
    - Generate workouts with `startedAt` prior to today; assert `loadActiveWorkout()` returns `null` and moves workout to completed
    - **Property 10: Stale active workout auto-completion**
    - **Validates: Requirements 5.1, 5.2, 5.3**

- [x] 3. Update `LiveWorkoutStore` to delegate persistence to `GuestWorkoutStorageService`
  - [x] 3.1 Inject `GuestWorkoutStorageService` and replace direct `localStorage` calls
    - Replace `persist()` → `guestStorage.saveActiveWorkout(workout)` (fire-and-forget async)
    - Replace `clearStorage()` → `guestStorage.clearActiveWorkout()`
    - Replace synchronous `loadFromStorage()` with async hydration from `guestStorage.loadActiveWorkout()`; initialise `workout` signal to `null`, hydrate after bootstrap
    - Move stale-workout auto-complete logic into `GuestWorkoutStorageService.loadActiveWorkout()` (already handled in task 2.3); remove duplicate code from `LiveWorkoutStore`
    - _Requirements: 4.1, 4.2, 4.9, 21.1, 21.2, 21.3_

  - [x] 3.2 Update `finishWorkout` to call `GuestWorkoutStorageService.saveCompletedWorkout` for unauthenticated users
    - After clearing the active workout, check `authService.status()`; if `'anonymous'`, call `guestStorage.saveCompletedWorkout(finished)` instead of (or in addition to) the network save
    - Guest users do NOT call `workoutService.save()` on finish
    - _Requirements: 3.3, 4.7_

  - [x] 3.3 Write unit tests for updated `LiveWorkoutStore` persistence delegation
    - Test that `persist()` calls `saveActiveWorkout`, `clearStorage()` calls `clearActiveWorkout`, and async hydration works
    - Test that `finishWorkout()` routes to `saveCompletedWorkout` when `authStatus === 'anonymous'`
    - _Requirements: 3.3, 4.1, 4.9, 21.1_

- [x] 4. Update Angular routing and guards
  - [x] 4.1 Rewrite `app.routes.ts` to make Dashboard the public default
    - Change root `redirectTo` from `'auth/login'` to `'app'`
    - Change `'**'` wildcard `redirectTo` from `'auth/login'` to `'app'`
    - Remove `canActivate: [authGuard]` from `/app` (Dashboard), `/app/workout`, and `/app/exercises`
    - Keep `authGuard` on `/app/workouts/history`, `/app/workouts/:workoutId`, `/app/plan`, `/app/progress`
    - _Requirements: 1.1, 1.2, 3.1, 3.2, 10.1–10.4, 23.1_

  - [x] 4.2 Create `AuthGateService` and update `AuthGuard` to avoid hard redirects
    - Create `frontend/src/app/core/auth/auth-gate.service.ts` with a `pendingFeature` writable signal and a `returnUrl` writable signal
    - Refactor `authGuard` so that when the session refresh fails it sets `authGateService.pendingFeature` and `authGateService.returnUrl`, then returns `false` — no `router.createUrlTree(['/auth/login'])`
    - _Requirements: 9.1, 9.7, 23.2_

  - [x] 4.3 Write property test for auth-gate navigation preservation (Property 4)
    - Generate arbitrary protected route URLs; assert `authGuard` sets `pendingFeature` signal and does not redirect
    - **Property 4: Auth-gate preserves navigation intent**
    - **Validates: Requirements 9.1, 9.7**

  - [x] 4.4 Write property test for existing authenticated flows unchanged (Property 5)
    - Assert every previously protected route still resolves to `true` for authenticated users
    - **Property 5: Existing authenticated flows unchanged**
    - **Validates: Requirements 23.1, 23.2**

  - [x] 4.5 Write property test for Dashboard as unauthenticated landing page (Property 8)
    - Assert that navigating to `''` or any unrecognised path resolves to `/app` without a guard
    - **Property 8: Dashboard is always the unauthenticated landing page**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4**

- [x] 5. Implement `AuthGateModalComponent`
  - [x] 5.1 Create the modal component
    - Create `frontend/src/app/shared/ui/auth-gate-modal/auth-gate-modal.ts` as a standalone Angular component
    - Accept `@Input() featureName: string` and emit `@Output() dismissed`
    - Display feature-specific message, lock icon, and three actions: "Sign Up" (→ `/auth/signup`), "Login" (→ `/auth/login`), "Maybe Later" (emits `dismissed`)
    - Style with TailwindCSS, dark theme, mobile-first
    - _Requirements: 9.2–9.6_

  - [x] 5.2 Mount `AuthGateModalComponent` in `app.html` and wire to `AuthGateService`
    - Add `<app-auth-gate-modal>` in `app.html` inside a conditional block driven by `authGateService.pendingFeature` signal
    - On `dismissed` output: clear `authGateService.pendingFeature` to `null`
    - _Requirements: 9.2, 9.5, 9.6_

  - [x] 5.3 Write unit tests for `AuthGateModalComponent`
    - Test that "Sign Up" and "Login" navigate to correct routes
    - Test that "Maybe Later" emits `dismissed` without navigating
    - _Requirements: 9.3, 9.4, 9.5, 9.6_

- [x] 6. Implement `GuestDashboardComponent` and update `DashboardPageComponent`
  - [x] 6.1 Create `GuestDashboardComponent`
    - Create `frontend/src/app/features/dashboard/guest-dashboard/guest-dashboard.ts` as a standalone component
    - Display prominent "Start Workout" CTA navigating to `/app/workout`
    - Display four feature cards: Workout Tracking (public), Progressive Overload (locked), Analytics (locked), PR Tracking (locked)
    - Locked cards show a lock icon and open `AuthGateModal` with the feature name via `AuthGateService.pendingFeature`
    - _Requirements: 2.1–2.4_

  - [x] 6.2 Update `DashboardPageComponent` to conditionally render `GuestDashboardComponent`
    - Import and render `GuestDashboardComponent` when `authService.status() === 'anonymous'`
    - Render existing authenticated dashboard when `authService.status() === 'authenticated'`
    - During `'checking'`, render a neutral loading skeleton (no auth guard trigger)
    - _Requirements: 1.3–1.6_

  - [x] 6.3 Write unit tests for `GuestDashboardComponent`
    - Test locked feature cards show lock icon and trigger `AuthGateModal` with correct feature name
    - Test "Start Workout" CTA navigates to `/app/workout`
    - _Requirements: 2.1–2.4_

- [x] 7. Update `NavBarComponent` for dynamic auth controls
  - [x] 7.1 Update `NavBarComponent` to consume `authService.status` signal
    - When `'anonymous'`: display "Login" (`/auth/login`) and "Sign Up" (`/auth/signup`) buttons
    - When `'authenticated'`: display user avatar and account menu (existing behaviour)
    - When `'checking'`: display a loading skeleton in place of auth controls
    - Remove any existing hard-coded auth assumptions
    - _Requirements: 11.1–11.4_

  - [x] 7.2 Write unit tests for `NavBarComponent` auth states
    - Test all three `AuthStatus` values render the correct controls
    - _Requirements: 11.1–11.3_

- [ ] 8. Checkpoint — Routing, storage, and core UI
  - Ensure all tests pass. Verify the app opens at `/app` without auth, live workout saves to IndexedDB, and the NavBar shows correct controls for each auth state. Ask the user if questions arise.

- [x] 9. Update `WorkoutSummaryPageComponent` with guest CTA
  - [x] 9.1 Add guest banner and CTA to `WorkoutSummaryPageComponent`
    - When `authService.status() === 'anonymous'`, render:
      - "Your workout is stored locally" banner
      - "Create Account" button → `/auth/signup`
      - "Login" button → `/auth/login`
      - "Continue as Guest" button → `/app`
    - When `'authenticated'`, render existing completion actions unchanged
    - _Requirements: 12.1–12.5_

  - [x] 9.2 Write unit tests for `WorkoutSummaryPageComponent` guest state
    - Test banner and three CTA buttons appear when `status === 'anonymous'`
    - Test standard actions appear when `status === 'authenticated'`
    - _Requirements: 12.1–12.5_

- [x] 10. Implement `WorkoutSyncService`
  - [x] 10.1 Create `WorkoutSyncService` skeleton with reactive state
    - Create `frontend/src/app/features/workouts/workout-sync.service.ts`
    - Expose `syncState: Signal<SyncState>` (initial `'idle'`) and `pendingCount: Signal<number>`
    - Implement `dismissSync()`: set `syncState` to `'idle'` without modifying local records
    - _Requirements: 13.1, 14.1, 15.4_

  - [x] 10.2 Implement `checkForPendingWorkouts()`
    - Set `syncState` to `'checking'`, call `guestStorage.getPendingWorkouts()`
    - If records found: set `syncState` to `'pending'`, return `SyncPreview` with `count`, `earliestDate`, `latestDate`
    - If none found: keep `syncState` as `'idle'`, return `null`
    - _Requirements: 13.1, 13.2, 13.6_

  - [x] 10.3 Implement `executeSync()`
    - Set `syncState` to `'syncing'`
    - Read pending workouts; map to `SyncBulkRequest` (each `clientId` = source `GuestCompletedWorkout.id`; timestamps as ISO 8601; `durationSeconds` non-negative)
    - POST to `/api/v1/workouts/sync`
    - On success: call `markWorkoutsSynced(ids)`, set `syncState` to `'done'`, emit `SyncResult`
    - On network error or 5xx: set `syncState` to `'error'`; do NOT mutate local records
    - _Requirements: 14.1–14.7, 15.1–15.3, 18.1–18.3_

  - [x] 10.4 Write property test for sync payload integrity (Property 13)
    - Use fast-check; generate arbitrary non-empty `GuestCompletedWorkout[]`; assert `SyncBulkRequest` satisfies clientId match, ISO dates, non-negative `durationSeconds`
    - **Property 13: Sync payload integrity**
    - **Validates: Requirements 14.3, 18.1, 18.2, 18.3**

  - [x] 10.5 Write property test for sync state preserved on failure (Property 14)
    - Mock the HTTP call to return 5xx; assert all pending records retain `synced: false`
    - **Property 14: Sync state preserved on failure**
    - **Validates: Requirements 15.1, 15.3**

  - [x] 10.6 Write property test for no data loss on authentication (Property 2)
    - Generate pending workouts; run `executeSync()` with mocked success response; assert every record is in `synced` or `skipped` count — none silently dropped
    - **Property 2: No data loss on authentication**
    - **Validates: Requirements 14.2, 14.3, 14.5, 16.2**

  - [x] 10.7 Write property test for sync preview accuracy (Property 17)
    - Generate sets of pending workouts; assert `SyncPreview.count`, `earliestDate`, `latestDate` match the actual data
    - **Property 17: Sync preview accuracy**
    - **Validates: Requirements 13.2**

- [x] 11. Wire `WorkoutSyncService` into `AuthService` and create `WorkoutSyncModalComponent`
  - [x] 11.1 Call `WorkoutSyncService.checkForPendingWorkouts()` after authentication
    - In `AuthService.applySession()`, inject `WorkoutSyncService` and call `triggerPostAuthSync()` (a new method that calls `checkForPendingWorkouts()`)
    - Use `afterNextRender` or a deferred call to avoid circular injection; alternatively call from the login/signup components after `authService.login()` completes
    - _Requirements: 13.1_

  - [x] 11.2 Create `WorkoutSyncModalComponent`
    - Create `frontend/src/app/features/workouts/workout-sync-modal/workout-sync-modal.ts`
    - Accept `@Input() preview: SyncPreview`; emit `@Output() confirmed`, `@Output() skipped`
    - Display pending count and date range
    - "Sync My Data" button calls `workoutSyncService.executeSync()` and shows progress indicator
    - "Skip" button calls `workoutSyncService.dismissSync()`
    - Show synced/skipped counts on `syncState === 'done'`
    - Show error message on `syncState === 'error'`
    - _Requirements: 13.3–13.6, 14.7, 15.2_

  - [x] 11.3 Mount `WorkoutSyncModalComponent` in `app.html` driven by `syncState`
    - Show modal when `syncService.syncState() === 'pending'`
    - Pass `syncService`'s `SyncPreview` as input
    - _Requirements: 13.3_

  - [x] 11.4 Write property test for guest data isolation (Property 1)
    - Assert `executeSync()` is only called after user confirms `WorkoutSyncModal` — never on session establishment alone
    - **Property 1: Guest data isolation**
    - **Validates: Requirements 22.1**

- [~] 12. Checkpoint — Full frontend sync flow
  - Ensure all tests pass. Run the app as a guest, complete a workout, sign in, and verify the sync modal appears with correct counts. Ask the user if questions arise.

- [x] 13. Backend: add `clientId` to `Workout` entity and `WorkoutRepository`
  - [x] 13.1 Add nullable indexed `clientId` field to `Workout.java`
    - Add `@Indexed private String clientId;` (nullable) with Lombok `@Builder.Default` left unset
    - _Requirements: 16.11_

  - [x] 13.2 Add compound index `{ userId, clientId }` and dedup query to `WorkoutRepository`
    - Add `@CompoundIndex(name = "user_clientid_idx", def = "{'userId': 1, 'clientId': 1}")` on `Workout.java`
    - Add method `List<Workout> findByUserIdAndClientIdIn(String userId, List<String> clientIds)` to `WorkoutRepository`
    - _Requirements: 16.3, 17.1_

- [x] 14. Backend: add sync DTOs to `WorkoutDtos.java`
  - [x] 14.1 Add `SyncWorkoutSetRequest`, `SyncWorkoutExerciseRequest`, `SyncWorkoutRequest`, `SyncBulkRequest`, `SyncBulkResponse` records
    - Place new records inside `WorkoutDtos.java` following the existing pattern
    - Apply Jakarta Validation annotations as specified in the design: `@NotBlank`, `@NotNull`, `@Min`, `@Max`, `@Size(min=1, max=50)` on `workouts` list
    - _Requirements: 16.1, 16.6–16.10_

- [x] 15. Backend: implement `WorkoutSyncService`
  - [x] 15.1 Create `com.liftorium.service.WorkoutSyncService`
    - Method `SyncBulkResponse sync(String userId, SyncBulkRequest request)`
    - Query existing `clientId` values for the user via `WorkoutRepository.findByUserIdAndClientIdIn`
    - For each workout not already stored: build and save a new `Workout` entity with `clientId` populated, `status = COMPLETED`
    - Count saved vs skipped; return `SyncBulkResponse(synced, skipped)`
    - Validate `exerciseId` against `ExerciseRepository` before persisting (or use existing `ExerciseService` lookup)
    - _Requirements: 16.2–16.5, 17.1, 17.2, 19.2_

  - [x] 15.2 Write unit tests for `WorkoutSyncService` deduplication logic
    - Test: first sync saves all; second identical sync skips all; mixed payload saves new, skips existing
    - _Requirements: 17.1, 17.2, 19.2_

- [x] 16. Backend: implement `SyncController`
  - [x] 16.1 Create `com.liftorium.controller.SyncController`
    - Annotate with `@RestController`, `@RequestMapping("/api/v1/workouts")`
    - `POST /sync` endpoint: `@PreAuthorize("isAuthenticated()")`, accept `@RequestBody @Valid SyncBulkRequest`, extract `userId` from `UserPrincipal`, delegate to `WorkoutSyncService.sync()`
    - Return `ApiResponse<SyncBulkResponse>`
    - _Requirements: 16.1, 22.2_

  - [x] 16.2 Write unit tests for `SyncController`
    - Test 401 when no JWT
    - Test 400 when zero workouts or more than 50 workouts
    - Test 400 when `reps` or `weight` out of range
    - Test 400 when `name` blank or exceeds 120 chars
    - Test 200 with correct `synced`/`skipped` counts
    - _Requirements: 16.1, 16.6–16.10, 22.2, 22.3_

  - [x] 16.3 Write property test for backend input validation (Property 15)
    - Use a Java property-test library (e.g. jqwik); generate requests with out-of-range `reps`/`weight` or zero/51-workout payloads; assert 400 responses
    - **Property 15: Backend input validation**
    - **Validates: Requirements 16.6, 16.7, 16.8**

  - [x] 16.4 Write property test for backend sync idempotency (Property 3)
    - Submit same `SyncBulkRequest` N times for the same user; assert exactly one `Workout` per unique `clientId` in DB
    - **Property 3: Backend sync idempotency**
    - **Validates: Requirements 17.1, 17.2, 19.2**

  - [x] 16.5 Write property test for user-scoped deduplication isolation (Property 16)
    - Submit identical `clientId` values for two distinct users; assert each user's record is stored independently
    - **Property 16: User-scoped deduplication isolation**
    - **Validates: Requirements 22.3, 16.3**

- [~] 17. Final checkpoint — end-to-end integration
  - Ensure all frontend and backend tests pass. Verify the full guest-to-authenticated flow: open app unauthenticated → complete workout → sign up → confirm sync modal → workout appears in history. Verify existing authenticated flows are unchanged. Ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for an MVP build; they must not be implemented by the coding agent during the main pass.
- The `idb` package (task 1.1) must be installed before any other task in group 2 runs.
- Task 3.1 replaces the synchronous `loadFromStorage()` in `LiveWorkoutStore`; the async hydration must not block Angular bootstrap (Requirement 21.3).
- Task 3.2 changes `finishWorkout` branching: guest users skip the `workoutService.save()` network call — the existing retry-toast mechanism remains for authenticated users only.
- The `AuthGateService` introduced in task 4.2 must be `providedIn: 'root'` so both `authGuard` and `app.html` share the same instance.
- Backend task 15.1 should reuse existing `Workout` builder patterns from `WorkoutService` for consistency.
- The `WorkoutSyncService` (task 10.3) must send timestamps as ISO 8601 strings — the backend `SyncWorkoutRequest` stores them as `String` and converts with `Instant.parse()`.
- Property tests use **fast-check** on the frontend and **jqwik** on the backend.
- Each property test task references its property number from the design document for traceability.

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["2.1", "13.1"] },
    { "id": 2, "tasks": ["2.2", "13.2"] },
    { "id": 3, "tasks": ["2.3", "2.4", "14.1"] },
    { "id": 4, "tasks": ["2.5", "2.6", "2.7", "2.8", "2.9", "3.1", "15.1"] },
    { "id": 5, "tasks": ["3.2", "4.1", "4.2", "15.2"] },
    { "id": 6, "tasks": ["3.3", "4.3", "4.4", "4.5", "5.1", "16.1"] },
    { "id": 7, "tasks": ["5.2", "6.1", "16.2", "16.3", "16.4", "16.5"] },
    { "id": 8, "tasks": ["5.3", "6.2", "7.1", "10.1"] },
    { "id": 9, "tasks": ["6.3", "7.2", "9.1", "10.2"] },
    { "id": 10, "tasks": ["9.2", "10.3"] },
    { "id": 11, "tasks": ["10.4", "10.5", "10.6", "10.7", "11.1"] },
    { "id": 12, "tasks": ["11.2"] },
    { "id": 13, "tasks": ["11.3", "11.4"] }
  ]
}
```
