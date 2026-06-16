# Implementation Plan: Exercise Catalog Cache

## Overview

Implement the exercise catalog cache in two phases: first the backend `catalog-version` endpoint, then the frontend IndexedDB persistence layer, runtime signals store, sync orchestration, and migration of `ExercisePickerComponent`. All new frontend code lives under `frontend/src/app/features/exercises/cache/`.

## Tasks

- [x] 1. Backend: CatalogVersionService and endpoint
  - [x] 1.1 Add `CatalogVersionResponse` record and `CatalogVersionService` with SHA-1 version computation
    - Create `backend/src/main/java/com/liftorium/dto/CatalogVersionResponse.java` as a Java record with `String version` and `int exerciseCount` fields
    - Create `backend/src/main/java/com/liftorium/service/CatalogVersionService.java`
    - Inject `ExerciseRepository`; call `countByActiveTrue()` for the count and `findTopByActiveTrueOrderByUpdatedAtDesc()` for the latest `updatedAt`
    - Compute version as `SHA1("<count>:<updatedAt.toEpochMilli>")` using `java.security.MessageDigest`; handle the zero-exercises edge case by hashing `"0:0"`
    - Annotate the public method with `@Cacheable("catalogVersion")` and configure a 60-second TTL in-memory cache using `@EnableCaching` + `CaffeineCacheManager` (or `ConcurrentMapCacheManager` with TTL) in a `CacheConfig` class
    - Add the two new repository query methods `countByActiveTrue()` and `findTopByActiveTrueOrderByUpdatedAtDesc()` to `ExerciseRepository`
    - _Requirements: 7.2, 7.3, 7.4, 7.6, 7.7_

  - [x] 1.2 Add `GET /api/v1/exercises/catalog-version` mapping to `ExerciseController`
    - Inject `CatalogVersionService` into `ExerciseController` alongside the existing `ExerciseService`
    - Add a `@GetMapping("/catalog-version")` method that calls `catalogVersionService.getVersion()` and wraps the result in `ApiResponse.success(...)`
    - Permit this path in Spring Security config (no JWT required) — add `.requestMatchers("/api/v1/exercises/catalog-version").permitAll()` before the authenticated matcher
    - _Requirements: 7.1, 7.5_

  - [x] 1.3 Checkpoint — verify backend compiles and endpoint responds
    - Ensure all tests pass, ask the user if questions arise.

- [x] 2. Frontend models and IDB schema
  - [x] 2.1 Create `exercise-cache.models.ts` with all shared TypeScript types
    - Create `frontend/src/app/features/exercises/cache/exercise-cache.models.ts`
    - Define and export: `CachedExercise`, `CatalogMetadata`, `ExerciseCacheSchema` (extends `DBSchema` from `idb`), `SyncStatus`, `ExerciseFilters`, `CatalogVersionResponse`
    - `CachedExercise` must include `normalizedName: string` and must NOT include `content`
    - `CatalogMetadata` must have `key: 'catalog'`, `catalogVersion: string`, `exerciseCount: number`, `lastSyncedAt: string`
    - `ExerciseCacheSchema` must declare the `exercises` object store (key: `string`, value: `CachedExercise`, indexes: `'by-name'` on `normalizedName`, `'by-type'` on `exerciseType`) and the `metadata` object store (key: `string`, value: `CatalogMetadata`)
    - _Requirements: 1.2, 1.3, 1.4_

  - [x] 2.2 Install `idb` package
    - Run `npm install idb` inside `frontend/`
    - Verify the package appears in `package.json` dependencies
    - _Requirements: 1.1_

- [x] 3. Frontend: ExerciseCacheService (IndexedDB persistence)
  - [x] 3.1 Implement `ExerciseCacheService`
    - Create `frontend/src/app/features/exercises/cache/exercise-cache.service.ts`
    - `initialize()`: call `openDB<ExerciseCacheSchema>('ExerciseCacheDB', 1, { upgrade(db) { ... } })` from `idb`; create both object stores with correct key paths and indexes in the `upgrade` callback; store the handle in a private field
    - `getAllExercises()`: return `this.db.getAll('exercises')` — returns `[]` if store is empty
    - `replaceAll(exercises, metadata)`: open a `readwrite` transaction spanning both `'exercises'` and `'metadata'` stores; call `tx.store` for exercises, clear + bulkPut all records, then write the metadata record; commit atomically — if any step throws, the whole transaction is aborted (IDB behaviour)
    - `getMetadata()`: return `this.db.get('metadata', 'catalog') ?? null`
    - Ensure `normalizedName` is set to `exercise.name.toLowerCase()` in `replaceAll` for any record that does not already have it
    - Do NOT expose the raw `db` handle outside the service
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9_

- [x] 4. Frontend: ExerciseStoreService (runtime Angular Signals store)
  - [x] 4.1 Implement `ExerciseStoreService`
    - Create `frontend/src/app/features/exercises/cache/exercise-store.service.ts`
    - Declare private writeable signals: `_exerciseList = signal<CachedExercise[]>([])`, `_exerciseMap = signal<ReadonlyMap<string, CachedExercise>>(new Map())`, `_syncStatus = signal<SyncStatus>('loading')`
    - Expose readonly public signals: `exerciseList = this._exerciseList.asReadonly()`, `exerciseMap = this._exerciseMap.asReadonly()`, `syncStatus = this._syncStatus.asReadonly()`
    - `hydrate(exercises)`: set `_exerciseList` to the provided array, rebuild `_exerciseMap` as `new Map(exercises.map(e => [e.id, e]))`, set `_syncStatus` to `'ready'`
    - `setSyncStatus(status)`: set `_syncStatus` to `status` (used by `CatalogSyncService` and `ExerciseCacheInitializer`)
    - `getById(id)`: return `this._exerciseMap().get(id)`
    - `search(query, filters?, maxResults?)`: implement the in-memory algorithm from the design — normalise query with `.toLowerCase().trim()`, filter by name contains (skip name filter for query length < 2), apply all present filters, slice to `maxResults` (default 50)
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9, 6.10_

  - [ ]* 4.2 Write property tests for `ExerciseStoreService`
    - Use vitest (already in devDependencies); create `frontend/src/app/features/exercises/cache/exercise-store.service.spec.ts`
    - **Property 1: Map–List Consistency** — for any `exercises` array passed to `hydrate()`, assert `exerciseMap().size === exerciseList().length` and every item in `exerciseList()` is retrievable via `exerciseMap().get(e.id)` and `getById(e.id)`. Use `@fast-check/vitest` or `fast-check` with `fc.array(exerciseArb)` as the arbitrary.
    - **Property 2: Search Soundness** — for any non-empty query `q` (length ≥ 2), every result `r` of `search(q)` satisfies `r.normalizedName.includes(q.toLowerCase().trim())`
    - **Property 3: Search Completeness** — for any query `q`, every exercise `e` where `e.normalizedName.includes(q.toLowerCase().trim())` appears in `search(q, {}, Infinity)`
    - **Property 4: Filter Soundness** — for any `ExerciseFilters`, every result satisfies all filter constraints; adding more filters never increases result count
    - **Property 5: Search Result Cap** — `search(q, filters, maxResults).length ≤ maxResults` for any inputs; default cap is 50
    - **Property 7: Idempotent Hydration** — calling `hydrate(L)` twice produces the same signal state as calling it once
    - **Validates: Requirements 5.4, 5.5, 5.6, 5.7, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9**

- [x] 5. Frontend: CatalogSyncService (download + background version check)
  - [x] 5.1 Implement `CatalogSyncService`
    - Create `frontend/src/app/features/exercises/cache/catalog-sync.service.ts`
    - Inject `HttpClient`, `ExerciseCacheService`, `ExerciseStoreService`, and `API_BASE_URL`
    - `downloadAndPersistAll()`: implement the paginated download loop from the design — fetch `GET /api/v1/exercises?limit=500&cursor=...` sequentially, filter `active === true`, map each `Exercise` to `CachedExercise` (strip `content`, add `normalizedName`), accumulate all pages, then call `cacheService.replaceAll()` and `storeService.hydrate()` in that order; if any HTTP request throws, propagate the error without writing to IDB
    - `checkVersionInBackground()`: subscribe to `GET /api/v1/exercises/catalog-version`, pipe through `catchError(() => EMPTY)`, and in the subscribe callback: compare `res.data.version` to `(await cacheService.getMetadata())?.catalogVersion`; if they differ (or metadata is null) set `syncStatus` to `'refreshing'` and call `downloadAndPersistAll()`, then set `syncStatus` to `'ready'`
    - Use `ApiSuccessResponse<T>` wrapper and `firstValueFrom` for the paginated fetches
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 9.4, 9.5_

- [x] 6. Frontend: ExerciseCacheInitializer (APP_INITIALIZER boot orchestration)
  - [x] 6.1 Implement `ExerciseCacheInitializer`
    - Create `frontend/src/app/features/exercises/cache/exercise-cache.initializer.ts`
    - Inject `ExerciseCacheService`, `ExerciseStoreService`, `CatalogSyncService`
    - `initialize()` async method:
      1. `try { await this.cacheService.initialize(); } catch { /* IDB unavailable — continue without persistence */ }`
      2. `const cached = await this.cacheService.getAllExercises();`
      3. If `cached.length > 0`: call `storeService.hydrate(cached)`, then `syncService.checkVersionInBackground()` (no await)
      4. If `cached.length === 0`: `try { await syncService.downloadAndPersistAll(); } catch { storeService.setSyncStatus('error'); }`
    - For the IDB-unavailable fallback (step 1 throws): proceed directly to step 2; `getAllExercises()` will return `[]` from an unopened DB; guard this by catching and calling `downloadAndPersistAll()` directly
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 9.1, 9.2, 9.3_

- [x] 7. Frontend: register initializer in app.config.ts
  - [x] 7.1 Add `provideAppInitializer` to `appConfig`
    - Modify `frontend/src/app/app.config.ts`
    - Add `import { provideAppInitializer, inject } from '@angular/core'`
    - Add `import { ExerciseCacheInitializer } from './features/exercises/cache/exercise-cache.initializer'`
    - Add `provideAppInitializer(() => inject(ExerciseCacheInitializer).initialize())` to the `providers` array
    - _Requirements: 2.1_

- [x] 8. Checkpoint — verify end-to-end boot sequence
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Frontend: migrate ExercisePickerComponent to ExerciseStoreService
  - [ ] 9.1 Rewrite `ExercisePickerComponent` to use `ExerciseStoreService`
    - Modify `frontend/src/app/shared/ui/exercise-picker/exercise-picker.ts`
    - Remove `ExerciseService` injection and the `ExerciseService` import
    - Remove `loadAll()`, `fetchPage()`, `allExercises`, and `ngOnInit` / `OnInit`
    - Inject `ExerciseStoreService`
    - Replace `loading` signal: derive from `storeService.syncStatus() === 'loading'`
    - Replace `loadError` signal: derive from `storeService.syncStatus() === 'error'`
    - Replace `onQueryChange`: call `this.storeService.search(query, {}, 20)` and set `searchResults`; keep the `query.length < 2 → []` short-circuit
    - Add `retry()` method that calls `inject(CatalogSyncService).downloadAndPersistAll()` to support the error retry affordance
    - The `ExercisePickerComponent` template already has `loadError` and `loading` signal usages — verify the template still compiles (no template changes should be needed if signal names are preserved)
    - Keep `@Input() alreadyAddedIds`, `@Input() showCancel`, `@Output() exerciseSelected`, `@Output() cancelled`, and `isAdded()` unchanged
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

- [ ] 10. Final checkpoint — full verification
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- The design uses TypeScript/Angular — all implementation follows the existing project conventions
- `ExerciseService.list()` and `ExerciseService.search()` are NOT modified; they continue serving the admin exercise browser
- The `idb` package must be installed before task 3 (ExerciseCacheService depends on it)
- Backend Spring Cache: use `CaffeineCacheManager` if Caffeine is already on the classpath, otherwise `ConcurrentMapCacheManager` with a 60-second TTL is acceptable for MVP
- The `limit` parameter on `GET /api/v1/exercises` has a current max of `100` — the controller must be updated to allow `500` for the bulk download path (raise `@Max(500)` on that param)
- Property tests require `fast-check` — run `npm install --save-dev fast-check` inside `frontend/` if not already present

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "2.1", "2.2"] },
    { "id": 1, "tasks": ["1.2", "3.1"] },
    { "id": 2, "tasks": ["4.1"] },
    { "id": 3, "tasks": ["4.2", "5.1"] },
    { "id": 4, "tasks": ["6.1"] },
    { "id": 5, "tasks": ["7.1"] },
    { "id": 6, "tasks": ["9.1"] }
  ]
}
```
