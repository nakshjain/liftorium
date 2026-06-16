# Requirements Document

## Introduction

The exercise catalog cache feature introduces a client-owned, offline-capable system for the gym workout tracking application. On first launch the complete exercise catalog (~2 k exercises) is downloaded from the backend and persisted in IndexedDB (`ExerciseCacheDB`). On every subsequent app start the catalog is loaded from IndexedDB into an in-memory Angular Signals store, making exercise search, filtering, and lookup instant, network-free, and resilient to connectivity loss. A lightweight background version check determines whether the local cache needs to be refreshed. This replaces the current pattern where `ExercisePickerComponent` re-fetches all exercises via paginated API calls on every mount.

---

## Glossary

- **ExerciseCacheDB**: The IndexedDB database (version 1) that persists the exercise catalog on the client device.
- **ExerciseCacheService**: The Angular service that owns all read/write access to `ExerciseCacheDB`.
- **CatalogSyncService**: The Angular service responsible for downloading fresh exercise data from the backend and coordinating cache updates.
- **ExerciseStoreService**: The Angular service that owns the runtime in-memory state via Angular Signals.
- **ExerciseCacheInitializer**: The Angular `APP_INITIALIZER` that orchestrates the boot sequence.
- **CatalogVersionEndpoint**: The backend HTTP endpoint `GET /api/v1/exercises/catalog-version` that returns a lightweight catalog version token.
- **CachedExercise**: The data model representing a single exercise as stored in IndexedDB and held in memory.
- **CatalogMetadata**: The single IndexedDB record storing the current catalog version, exercise count, and last-synced timestamp.
- **SyncStatus**: The lifecycle state of the store — one of `'loading'`, `'ready'`, `'refreshing'`, or `'error'`.
- **normalizedName**: A lowercase, pre-computed version of the exercise name stored at write time to enable fast case-insensitive search.
- **First Launch**: An app start where `ExerciseCacheDB` contains no exercise records.
- **Returning User**: An app start where `ExerciseCacheDB` already contains a non-empty exercise catalog.
- **Background Sync**: A version check and optional re-download that runs after the app has rendered, without blocking the UI.
- **ExercisePickerComponent**: The existing Angular component that allows users to search for and select exercises, currently fetching data from the network on every mount.

---

## Requirements

### Requirement 1: IndexedDB Schema and Persistence Layer

**User Story:** As a mobile user, I want my exercise catalog to be stored locally on my device, so that I can browse and search exercises without a network connection after the first launch.

#### Acceptance Criteria

1. THE ExerciseCacheService SHALL open an IndexedDB database named `ExerciseCacheDB` at version `1` using the `idb` library.
2. THE ExerciseCacheDB SHALL contain an `exercises` object store with `id` (MongoDB ObjectId string) as the primary key.
3. THE ExerciseCacheDB `exercises` store SHALL maintain a `by-name` index on the `normalizedName` field and a `by-type` index on the `exerciseType` field.
4. THE ExerciseCacheDB SHALL contain a `metadata` object store with `key` as the primary key, holding a single `CatalogMetadata` record with key value `'catalog'`.
5. WHEN ExerciseCacheService stores a `CachedExercise`, THE ExerciseCacheService SHALL pre-compute and persist the `normalizedName` field as the lowercase version of the exercise `name`.
6. THE ExerciseCacheService SHALL NOT store exercise `content` fields (overview, instructions) in the `exercises` store.
7. WHEN `replaceAll(exercises, metadata)` is called, THE ExerciseCacheService SHALL write all exercise records and the metadata record within a single `IDBTransaction` spanning both object stores.
8. IF the `IDBTransaction` in `replaceAll` fails at any point, THEN THE ExerciseCacheService SHALL ensure neither the `exercises` store nor the `metadata` store is partially updated.
9. THE ExerciseCacheService SHALL expose `initialize()`, `getAllExercises()`, `replaceAll()`, and `getMetadata()` as its public API, and SHALL NOT expose the raw IDB database handle outside of controlled access for specific purposes such as debugging or testing.

---

### Requirement 2: Startup and Boot Initialization

**User Story:** As a user opening the app, I want the exercise catalog to be available before any screen requires it, so that I never see a broken or empty exercise list when the app finishes loading.

#### Acceptance Criteria

1. THE ExerciseCacheInitializer SHALL be registered as an Angular `APP_INITIALIZER` and SHALL execute its `initialize()` method before the application renders any routes.
2. WHEN `initialize()` runs, THE ExerciseCacheInitializer SHALL first call `ExerciseCacheService.initialize()` to open the IndexedDB database.
3. WHEN `initialize()` runs, THE ExerciseCacheInitializer SHALL call `ExerciseCacheService.getAllExercises()` after the database is open.
4. WHEN `getAllExercises()` returns a non-empty array, THE ExerciseCacheInitializer SHALL call `ExerciseStoreService.hydrate()` with the cached exercises before resolving the `APP_INITIALIZER` promise.
5. WHEN `getAllExercises()` returns a non-empty array, THE ExerciseCacheInitializer SHALL call `CatalogSyncService.checkVersionInBackground()` without awaiting its result.
6. WHEN `getAllExercises()` returns an empty array, THE ExerciseCacheInitializer SHALL call `CatalogSyncService.downloadAndPersistAll()` and SHALL await its completion before resolving the `APP_INITIALIZER` promise.
7. WHEN `getAllExercises()` returns an empty array and `downloadAndPersistAll()` fails, THE ExerciseCacheInitializer SHALL set `SyncStatus` to `'error'` and SHALL resolve the `APP_INITIALIZER` promise so the application still renders.
8. IF `ExerciseCacheService.initialize()` throws because IndexedDB is unavailable, THEN THE ExerciseCacheInitializer SHALL fall back to in-memory-only mode by proceeding directly to `downloadAndPersistAll()` without persistence.

---

### Requirement 3: First Launch Sync Strategy

**User Story:** As a first-time user, I want the app to automatically download the complete exercise catalog when I open it for the first time, so that all exercises are available for logging workouts immediately.

#### Acceptance Criteria

1. WHEN `CatalogSyncService.downloadAndPersistAll()` is called, THE CatalogSyncService SHALL fetch all exercises from `GET /api/v1/exercises` using cursor pagination with a page size of `500`.
2. WHEN paginating, THE CatalogSyncService SHALL follow the `nextCursor` field in each response until `hasNext` is `false`.
3. WHEN fetching exercises, THE CatalogSyncService SHALL filter out any exercise records where `active` is `false` before persisting.
4. WHEN all pages have been fetched, THE CatalogSyncService SHALL call `ExerciseCacheService.replaceAll()` with the complete exercise array and a `CatalogMetadata` record containing the version, exercise count, and current timestamp.
5. WHEN `replaceAll()` completes, THE CatalogSyncService SHALL call `ExerciseStoreService.hydrate()` with the downloaded exercises.
6. IF any HTTP request during pagination fails, THEN THE CatalogSyncService SHALL abandon the entire download without writing anything to IndexedDB.
7. WHEN `ExerciseStoreService.syncStatus` is `'loading'`, THE ExerciseCacheInitializer SHALL block app rendering until `downloadAndPersistAll()` resolves or rejects.

---

### Requirement 4: Returning User Sync Strategy (Background Sync)

**User Story:** As a returning user, I want the app to open instantly using my locally cached exercises, while automatically checking in the background whether a newer catalog version is available.

#### Acceptance Criteria

1. WHEN `CatalogSyncService.checkVersionInBackground()` is called, THE CatalogSyncService SHALL fire a non-blocking request to `GET /api/v1/exercises/catalog-version` without awaiting the result on the call stack.
2. WHEN the version response is received and the remote `version` matches `CatalogMetadata.catalogVersion`, THE CatalogSyncService SHALL take no further action.
3. WHEN a successful version response is received and the remote `version` differs from `CatalogMetadata.catalogVersion`, THE CatalogSyncService SHALL set `SyncStatus` to `'refreshing'` and call `downloadAndPersistAll()`.
4. WHEN a successful version response is received and `CatalogMetadata` is `null`, THE CatalogSyncService SHALL treat the versions as differing and trigger a full re-download.
5. IF `GET /api/v1/exercises/catalog-version` returns a network error or non-2xx response, THEN THE CatalogSyncService SHALL silently discard the error and leave the local cache unchanged without triggering a re-download.
6. WHEN `downloadAndPersistAll()` successfully completes during a background refresh, THE CatalogSyncService SHALL set `SyncStatus` to `'ready'`.
7. WHILE a background refresh is in progress, THE ExerciseStoreService SHALL continue to serve the previous cached exercise list to all consumers.

---

### Requirement 5: Runtime Exercise Store (Angular Signals)

**User Story:** As a developer building workout-related features, I want a single in-memory store backed by Angular Signals, so that all exercise-consuming components reactively update when the catalog changes without triggering network calls.

#### Acceptance Criteria

1. THE ExerciseStoreService SHALL expose a `exerciseList` Signal containing the flat array of all cached `CachedExercise` records.
2. THE ExerciseStoreService SHALL expose a `exerciseMap` Signal containing a `ReadonlyMap<string, CachedExercise>` keyed by `exercise.id`.
3. THE ExerciseStoreService SHALL expose a `syncStatus` Signal of type `SyncStatus` with an initial value of `'loading'`.
4. WHEN `hydrate(exercises)` is called, THE ExerciseStoreService SHALL set `exerciseList` to the provided array, rebuild `exerciseMap` from that array, and set `syncStatus` to `'ready'`.
5. WHEN `hydrate(exercises)` is called a second time with the same array, THE ExerciseStoreService SHALL produce the same `exerciseList` and `exerciseMap` signal state as after the first call.
6. THE ExerciseStoreService SHALL expose a `getById(id)` method that returns the `CachedExercise` for the given id from `exerciseMap`, or `undefined` if the id is not present.
7. WHEN `syncStatus` transitions to `'ready'`, THE ExerciseStoreService SHALL ensure `exerciseList` and `exerciseMap` are consistent and both reflect the same set of exercises from the last `hydrate()` call.

---

### Requirement 6: In-Memory Search

**User Story:** As a user logging a workout, I want to search for exercises by name and filter by muscle group, equipment, type, or level instantly as I type, so that finding the right exercise never interrupts my workout flow.

#### Acceptance Criteria

1. THE ExerciseStoreService SHALL expose a `search(query, filters?, maxResults?)` method that operates entirely in memory against the `exerciseList` signal.
2. WHEN `search` is called with a `query` whose trimmed length is `0`, THE ExerciseStoreService SHALL return all exercises in `exerciseList` up to `maxResults`.
3. WHEN `search` is called with a non-empty trimmed `query`, THE ExerciseStoreService SHALL return only exercises whose `normalizedName` contains the lowercase-trimmed query string.
4. WHEN `search` is called with a `muscle` filter, THE ExerciseStoreService SHALL return only exercises where `primaryMuscles` or `secondaryMuscles` includes the specified muscle value.
5. WHEN `search` is called with an `equipment` filter, THE ExerciseStoreService SHALL return only exercises where `equipment` includes the specified equipment value.
6. WHEN `search` is called with an `exerciseType` filter, THE ExerciseStoreService SHALL return only exercises where `exerciseType` equals the specified value.
7. WHEN `search` is called with a `level` filter, THE ExerciseStoreService SHALL return only exercises where `level` equals the specified value.
8. WHEN multiple filters are provided to `search`, THE ExerciseStoreService SHALL return only exercises that satisfy all specified filter criteria simultaneously.
9. THE ExerciseStoreService SHALL return at most `maxResults` exercises from `search`, defaulting to `50` when `maxResults` is not provided.
10. THE ExerciseStoreService `search` method SHALL NOT make any network requests or read from IndexedDB.

---

### Requirement 7: Backend Catalog Version Endpoint

**User Story:** As a frontend developer, I want a lightweight backend endpoint that returns the current catalog version, so that the client can detect when the exercise catalog has changed without downloading the full catalog on every app start.

#### Acceptance Criteria

1. THE CatalogVersionEndpoint SHALL expose a `GET /api/v1/exercises/catalog-version` HTTP endpoint.
2. WHEN the endpoint is called, THE CatalogVersionEndpoint SHALL return a JSON response containing a `version` string and an `exerciseCount` integer.
3. THE CatalogVersionEndpoint SHALL compute the `version` string as the SHA-1 hash of the string `"<activeCount>:<latestUpdatedAtEpochMilli>"` where `activeCount` is the count of active exercises and `latestUpdatedAtEpochMilli` is the epoch milliseconds of the most recently updated active exercise.
4. THE CatalogVersionEndpoint SHALL cache the version computation result in-memory for 60 seconds using Spring's `@Cacheable` to minimize database load.
5. THE CatalogVersionEndpoint SHALL be accessible without JWT authentication.
6. WHEN the endpoint is called, THE CatalogVersionEndpoint SHALL return an `exerciseCount` that equals the current count of active exercises in the database.
7. WHEN no active exercises exist in the database, THE CatalogVersionEndpoint SHALL return a deterministic version string and an `exerciseCount` of `0`.

---

### Requirement 8: Migration of ExercisePickerComponent

**User Story:** As a user selecting exercises, I want the exercise picker to respond instantly when I type, so that searching for exercises during a workout session feels seamless and never waits for a network response.

#### Acceptance Criteria

1. WHEN `ExercisePickerComponent` initialises, THE ExercisePickerComponent SHALL read the exercise list from `ExerciseStoreService.exerciseList()` instead of calling `ExerciseService.list()`.
2. WHEN a user types a search query in `ExercisePickerComponent`, THE ExercisePickerComponent SHALL call `ExerciseStoreService.search()` to filter results instead of making an HTTP request.
3. THE ExercisePickerComponent SHALL NOT depend on `ExerciseService` for fetching the exercise list after migration.
4. WHEN `ExercisePickerComponent` is actively rendered and `ExerciseStoreService.syncStatus` is `'loading'`, THE ExercisePickerComponent SHALL display a loading indicator to the user.
5. WHEN `ExerciseStoreService.syncStatus` is `'error'`, THE ExercisePickerComponent SHALL display an error state with a retry affordance only when the component is actively rendered.
6. THE existing `ExerciseService.list()` and `ExerciseService.search()` methods SHALL remain intact and unmodified to continue serving the admin-facing exercise browser and detail pages.

---

### Requirement 9: Error Handling and Graceful Degradation

**User Story:** As a user in a poor network environment, I want the app to handle download failures gracefully so that a network problem never leaves the app in a permanently broken state.

#### Acceptance Criteria

1. IF IndexedDB is unavailable (e.g., Safari private browsing, storage quota exceeded), THEN THE ExerciseCacheInitializer SHALL operate in in-memory-only mode, downloading the catalog each session without persisting it to IndexedDB.
2. WHEN operating in in-memory-only mode, THE ExerciseStoreService SHALL be fully functional and serve exercises to all consumers in the same way as the persisted mode.
3. IF `downloadAndPersistAll()` fails during first launch due to a network error, THEN THE ExerciseCacheInitializer SHALL set `SyncStatus` to `'error'` and SHALL resolve the `APP_INITIALIZER` promise so the application renders rather than hanging.
4. IF a network error occurs during `checkVersionInBackground()`, THEN THE CatalogSyncService SHALL discard the error silently, leave the local cache unchanged, and NOT notify the user.
5. IF `downloadAndPersistAll()` fails for any reason (including mid-pagination network errors), THEN THE CatalogSyncService SHALL abandon the download, roll back any writes that occurred during the attempt, and leave IndexedDB in its previous consistent state.
6. WHEN `SyncStatus` is `'error'`, THE ExercisePickerComponent SHALL display a retry affordance that allows the user to manually re-trigger `downloadAndPersistAll()`.
7. WHEN a background sync fails and the local cache is still populated, THE ExerciseStoreService SHALL continue serving the existing cached exercises to all consumers.
