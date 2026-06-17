/**
 * Property-based tests for WorkoutSyncService.
 *
 * Uses vitest (globals) + fast-check + Angular TestBed + HttpClientTestingModule.
 *
 * Properties covered:
 *  - Property 13 (task 10.4): Sync payload integrity
 *  - Property 14 (task 10.5): Sync state preserved on failure
 *  - Property  2 (task 10.6): No data loss on authentication
 *  - Property 17 (task 10.7): Sync preview accuracy
 *
 * Design note: WorkoutSyncService is providedIn:'root', so Angular TestBed creates
 * it in a root-like injector that persists across describe blocks in the same file.
 * Each describe block calls TestBed.resetTestingModule() at the START of beforeEach
 * (not just afterEach) to guarantee a clean slate.
 *
 * The service's tap() callback calls markWorkoutsSynced as a fire-and-forget async
 * call. After firstValueFrom() resolves we flush a microtask tick so that side
 * effects are observable before assertions.
 */

import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import * as fc from 'fast-check';
import { WorkoutSyncService } from './workout-sync.service';
import { GuestWorkoutStorageService } from './guest-workout-storage.service';
import { API_BASE_URL } from '../../core/api/api.config';
import type { GuestCompletedWorkout, SyncBulkRequest } from './guest-workout.models';
import { firstValueFrom } from 'rxjs';

// ---------------------------------------------------------------------------
// Utility: flush all pending microtasks
// ---------------------------------------------------------------------------
function flushMicrotasks(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0));
}

// ---------------------------------------------------------------------------
// Shared factory helper
// ---------------------------------------------------------------------------

function makeWorkout(overrides: Partial<GuestCompletedWorkout> = {}): GuestCompletedWorkout {
  const startedAt = Date.now() - 3_600_000;
  return {
    id: crypto.randomUUID(),
    name: 'Test',
    startedAt,
    finishedAt: startedAt + 3_600_000,
    accumulatedMs: 3_600_000,
    exercises: [],
    synced: false,
    syncedAt: null,
    createdLocally: new Date().toISOString(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// fast-check arbitrary for GuestCompletedWorkout
// ---------------------------------------------------------------------------

const arbWorkout: fc.Arbitrary<GuestCompletedWorkout> = fc
  .tuple(
    fc.integer({ min: 1_000_000, max: 1_700_000_000_000 }),
    fc.integer({ min: 1, max: 86_400_000 }),
  )
  .chain(([startedAt, duration]) =>
    fc.record({
      id: fc.uuid(),
      name: fc.string({ minLength: 1, maxLength: 80 }),
      startedAt: fc.constant(startedAt),
      finishedAt: fc.constant(startedAt + duration),
      accumulatedMs: fc.integer({ min: 0, max: duration }),
      exercises: fc.constant([]),
      synced: fc.constant(false as const),
      syncedAt: fc.constant(null),
      createdLocally: fc.constant(new Date().toISOString()),
    }),
  );

// ---------------------------------------------------------------------------
// TestBed factory — called at the start of each beforeEach
// ---------------------------------------------------------------------------

function setupTestBed(
  mockStorage: Partial<GuestWorkoutStorageService>,
): { service: WorkoutSyncService; httpMock: HttpTestingController } {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    imports: [HttpClientTestingModule],
    providers: [
      WorkoutSyncService,
      { provide: GuestWorkoutStorageService, useValue: mockStorage },
      { provide: API_BASE_URL, useValue: '/api/v1' },
    ],
  });

  return {
    service: TestBed.inject(WorkoutSyncService),
    httpMock: TestBed.inject(HttpTestingController),
  };
}

// ---------------------------------------------------------------------------
// Property 13: Sync payload integrity
// Validates: Requirements 14.3, 18.1, 18.2, 18.3
// ---------------------------------------------------------------------------

describe('Property 13: Sync payload integrity', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it(
    'SyncBulkRequest has correct clientIds, ISO dates, and non-negative durationSeconds for any workout list',
    async () => {
      // timeout handled by numRuns limit
      const getPendingWorkoutsMock = vi.fn();
      const markWorkoutsSyncedMock = vi.fn().mockResolvedValue(undefined);

      const { service, httpMock } = setupTestBed({
        getPendingWorkouts: getPendingWorkoutsMock,
        markWorkoutsSynced: markWorkoutsSyncedMock,
      });

      await fc.assert(
        fc.asyncProperty(
          fc.array(arbWorkout, { minLength: 1, maxLength: 5 }),
          async (workouts) => {
            getPendingWorkoutsMock.mockResolvedValue(workouts);

            // Subscribe before flushing HTTP
            const syncPromise = firstValueFrom(service.executeSync());

            // Flush microtasks so the from(promise) in executeSync resolves
            // and the HTTP POST is actually queued before we intercept it
            await flushMicrotasks();

            const req = httpMock.expectOne('/api/v1/workouts/sync');
            const body = req.request.body as SyncBulkRequest;

            req.flush({ data: { synced: workouts.length, skipped: 0 } });
            await syncPromise;
            await flushMicrotasks();

            // Assertion 1: every clientId matches the source workout id
            expect(body.workouts).toHaveLength(workouts.length);
            for (let i = 0; i < workouts.length; i++) {
              expect(body.workouts[i].clientId).toBe(workouts[i].id);
            }

            // Assertion 2: startedAt and finishedAt are valid ISO 8601 strings
            for (const payload of body.workouts) {
              expect(isNaN(new Date(payload.startedAt).getTime())).toBe(false);
              expect(isNaN(new Date(payload.finishedAt).getTime())).toBe(false);
            }

            // Assertion 3: durationSeconds is a non-negative integer
            for (const payload of body.workouts) {
              expect(Number.isInteger(payload.durationSeconds)).toBe(true);
              expect(payload.durationSeconds).toBeGreaterThanOrEqual(0);
            }

            // Reset service state for next iteration
            service.dismissSync();
          },
        ),
        { numRuns: 20 },
      );

      httpMock.verify();
    },
    30_000,
  );
});

// ---------------------------------------------------------------------------
// Property 14: Sync state preserved on failure
// Validates: Requirements 15.1, 15.3
// ---------------------------------------------------------------------------

describe('Property 14: Sync state preserved on failure', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it(
    'on 5xx error syncState is "error", markWorkoutsSynced is not called, and workouts retain synced:false',
    async () => {
      const getPendingWorkoutsMock = vi.fn();
      const markWorkoutsSyncedMock = vi.fn().mockResolvedValue(undefined);

      const { service, httpMock } = setupTestBed({
        getPendingWorkouts: getPendingWorkoutsMock,
        markWorkoutsSynced: markWorkoutsSyncedMock,
      });

      await fc.assert(
        fc.asyncProperty(
          fc.array(arbWorkout, { minLength: 1, maxLength: 3 }),
          async (workouts) => {
            markWorkoutsSyncedMock.mockClear();
            getPendingWorkoutsMock.mockResolvedValue(workouts);

            const syncPromise = firstValueFrom(service.executeSync()).catch(() => undefined);

            // Flush microtasks so the from(promise) resolves and HTTP request is queued
            await flushMicrotasks();

            const req = httpMock.expectOne('/api/v1/workouts/sync');
            req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });

            await syncPromise;
            await flushMicrotasks();

            // Assertion 1: syncState must be 'error'
            expect(service.syncState()).toBe('error');

            // Assertion 2: markWorkoutsSynced must NOT have been called
            expect(markWorkoutsSyncedMock).not.toHaveBeenCalled();

            // Assertion 3: source workout objects are not mutated
            expect(workouts.every(w => !w.synced)).toBe(true);
            expect(workouts.every(w => w.syncedAt === null)).toBe(true);

            // Reset state for next iteration via private signal
            (service as unknown as { _syncState: { set: (v: string) => void } })['_syncState'].set('idle');
          },
        ),
        { numRuns: 20 },
      );

      httpMock.verify();
    },
    30_000,
  );
});

// ---------------------------------------------------------------------------
// Property 2: No data loss on authentication
// Validates: Requirements 14.2, 14.3, 14.5, 16.2
// ---------------------------------------------------------------------------

describe('Property 2: No data loss on authentication', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it(
    'markWorkoutsSynced is called with ALL workout IDs after a successful sync — none silently dropped',
    async () => {
      const getPendingWorkoutsMock = vi.fn();
      const capturedIds: string[] = [];
      const markWorkoutsSyncedMock = vi.fn().mockImplementation(async (ids: string[]) => {
        capturedIds.push(...ids);
      });

      const { service, httpMock } = setupTestBed({
        getPendingWorkouts: getPendingWorkoutsMock,
        markWorkoutsSynced: markWorkoutsSyncedMock,
      });

      await fc.assert(
        fc.asyncProperty(
          fc.array(arbWorkout, { minLength: 1, maxLength: 5 }),
          async (workouts) => {
            capturedIds.length = 0;
            getPendingWorkoutsMock.mockResolvedValue(workouts);

            const syncPromise = firstValueFrom(service.executeSync());

            // Flush microtasks so the from(promise) resolves and HTTP request is queued
            await flushMicrotasks();

            const req = httpMock.expectOne('/api/v1/workouts/sync');
            req.flush({ data: { synced: workouts.length, skipped: 0 } });

            await syncPromise;
            await flushMicrotasks();

            // Assertion 1: all source IDs appear in the marked set — none dropped
            const expectedIds = workouts.map(w => w.id).sort();
            expect(capturedIds.sort()).toEqual(expectedIds);

            // Assertion 2: syncState is 'done'
            expect(service.syncState()).toBe('done');

            // Reset for next iteration
            service.dismissSync();
          },
        ),
        { numRuns: 20 },
      );

      httpMock.verify();
    },
    30_000,
  );
});

// ---------------------------------------------------------------------------
// Property 17: Sync preview accuracy
// Validates: Requirements 13.2
// ---------------------------------------------------------------------------

describe('Property 17: Sync preview accuracy', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it(
    'SyncPreview count, earliestDate, and latestDate accurately reflect the pending workout data',
    async () => {
      const getPendingWorkoutsMock = vi.fn();

      const { service } = setupTestBed({
        getPendingWorkouts: getPendingWorkoutsMock,
        markWorkoutsSynced: vi.fn().mockResolvedValue(undefined),
      });

      await fc.assert(
        fc.asyncProperty(
          fc.array(arbWorkout, { minLength: 1, maxLength: 5 }),
          async (workouts) => {
            getPendingWorkoutsMock.mockResolvedValue(workouts);

            const preview = await service.checkForPendingWorkouts();

            expect(preview).not.toBeNull();

            // Assertion 1: count equals number of workouts
            expect(preview!.count).toBe(workouts.length);

            // Assertion 2: earliestDate is the ISO string of the minimum startedAt
            const sortedDates = workouts.map(w => w.startedAt).sort((a, b) => a - b);
            const expectedEarliest = new Date(sortedDates[0]).toISOString();
            expect(preview!.earliestDate).toBe(expectedEarliest);

            // Assertion 3: latestDate is the ISO string of the maximum startedAt
            const expectedLatest = new Date(sortedDates[sortedDates.length - 1]).toISOString();
            expect(preview!.latestDate).toBe(expectedLatest);

            // Reset state for next iteration
            service.dismissSync();
          },
        ),
        { numRuns: 30 },
      );
    },
    30_000,
  );
});
