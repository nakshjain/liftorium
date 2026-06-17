/**
 * Property 1: Guest data isolation
 *
 * Validates: Requirements 22.1
 *
 * Assert that executeSync() is only called after the user explicitly confirms
 * the WorkoutSyncModal. It is never called on session establishment alone.
 *
 * Concretely:
 *  - checkForPendingWorkouts() sets syncState to 'pending' but makes NO HTTP POST
 *  - executeSync() is the only path that makes a POST /workouts/sync request
 *  - dismissSync() sets syncState to 'idle' without making any HTTP request
 *
 * Uses Angular TestBed + HttpClientTestingModule (vitest globals).
 * The GuestWorkoutStorageService is replaced with a lightweight mock so we can
 * control what getPendingWorkouts() returns and verify that markWorkoutsSynced
 * is never called as a side-effect of checkForPendingWorkouts().
 */

import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import * as fc from 'fast-check';

import { WorkoutSyncService } from './workout-sync.service';
import { GuestWorkoutStorageService } from './guest-workout-storage.service';
import { API_BASE_URL } from '../../core/api/api.config';
import type { GuestCompletedWorkout } from './guest-workout.models';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Flush pending microtasks so that from(promise) has a chance to resolve. */
function flushMicrotasks(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0));
}

function makeWorkout(overrides: Partial<GuestCompletedWorkout> = {}): GuestCompletedWorkout {
  const startedAt = Date.now() - 3_600_000;
  return {
    id: crypto.randomUUID(),
    name: 'Test Workout',
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

/** fast-check arbitrary for GuestCompletedWorkout (synced: false, no exercises). */
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
// TestBed factory
// ---------------------------------------------------------------------------

function setupTestBed(mockStorage: Partial<GuestWorkoutStorageService>): {
  service: WorkoutSyncService;
  httpMock: HttpTestingController;
} {
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
// Property 1: Guest data isolation
// Validates: Requirements 22.1
// ---------------------------------------------------------------------------

describe('Property 1: Guest data isolation', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('checkForPendingWorkouts sets state to pending but never calls HTTP POST', async () => {
    // This is the core isolation guarantee: discovering that workouts exist
    // must never automatically upload them. The user must explicitly confirm.
    const getPendingWorkoutsMock = vi.fn().mockResolvedValue([makeWorkout(), makeWorkout()]);
    const markWorkoutsSyncedMock = vi.fn().mockResolvedValue(undefined);

    const { service, httpMock } = setupTestBed({
      getPendingWorkouts: getPendingWorkoutsMock,
      markWorkoutsSynced: markWorkoutsSyncedMock,
    });

    await service.checkForPendingWorkouts();

    // State must be 'pending', not 'syncing' or 'done'
    expect(service.syncState()).toBe('pending');

    // No HTTP POST to /workouts/sync must have been made
    httpMock.expectNone('/api/v1/workouts/sync');

    // markWorkoutsSynced must not have been called either
    expect(markWorkoutsSyncedMock).not.toHaveBeenCalled();

    httpMock.verify();
  });

  it('executeSync is the only method that calls HTTP POST /workouts/sync', async () => {
    // Part 1: checkForPendingWorkouts alone produces no HTTP traffic.
    // Part 2: executing the sync does produce exactly one POST.
    const workouts = [makeWorkout(), makeWorkout()];
    const getPendingWorkoutsMock = vi.fn().mockResolvedValue(workouts);
    const markWorkoutsSyncedMock = vi.fn().mockResolvedValue(undefined);

    const { service, httpMock } = setupTestBed({
      getPendingWorkouts: getPendingWorkoutsMock,
      markWorkoutsSynced: markWorkoutsSyncedMock,
    });

    // Step 1 — check only: no HTTP POST
    await service.checkForPendingWorkouts();
    httpMock.expectNone('/api/v1/workouts/sync');
    expect(service.syncState()).toBe('pending');

    // Step 2 — explicit executeSync: HTTP POST must happen
    const syncPromise = firstValueFrom(service.executeSync());
    await flushMicrotasks();

    const req = httpMock.expectOne('/api/v1/workouts/sync');
    expect(req.request.method).toBe('POST');

    req.flush({ data: { synced: workouts.length, skipped: 0 } });
    await syncPromise;
    await flushMicrotasks();

    expect(service.syncState()).toBe('done');
    httpMock.verify();
  });

  it('dismissSync sets state to idle without making any HTTP requests', () => {
    const { service, httpMock } = setupTestBed({
      getPendingWorkouts: vi.fn().mockResolvedValue([]),
      markWorkoutsSynced: vi.fn().mockResolvedValue(undefined),
    });

    // Manually put service into a non-idle state to verify dismissSync resets it.
    // Access private signal through type cast (same pattern used in other spec files).
    (service as unknown as { _syncState: { set: (v: string) => void } })['_syncState'].set(
      'pending',
    );
    expect(service.syncState()).toBe('pending');

    service.dismissSync();

    expect(service.syncState()).toBe('idle');

    // dismissSync must not trigger any HTTP call
    httpMock.expectNone('/api/v1/workouts/sync');
    httpMock.verify();
  });

  // -----------------------------------------------------------------------
  // Property-based variant: the isolation guarantee holds for any number of
  // pending workouts (1–10), not just the fixed examples above.
  // Validates: Requirements 22.1
  // -----------------------------------------------------------------------

  it(
    'checkForPendingWorkouts never initiates HTTP POST for any non-empty workout list',
    async () => {
      const getPendingWorkoutsMock = vi.fn();
      const markWorkoutsSyncedMock = vi.fn().mockResolvedValue(undefined);

      const { service, httpMock } = setupTestBed({
        getPendingWorkouts: getPendingWorkoutsMock,
        markWorkoutsSynced: markWorkoutsSyncedMock,
      });

      await fc.assert(
        fc.asyncProperty(
          fc.array(arbWorkout, { minLength: 1, maxLength: 10 }),
          async (workouts) => {
            getPendingWorkoutsMock.mockResolvedValue(workouts);

            await service.checkForPendingWorkouts();

            // Isolation: no HTTP traffic regardless of workout count
            httpMock.expectNone('/api/v1/workouts/sync');

            // State reflects that workouts were found
            expect(service.syncState()).toBe('pending');

            // markWorkoutsSynced must NOT have been called automatically
            expect(markWorkoutsSyncedMock).not.toHaveBeenCalled();

            // Reset for the next iteration
            service.dismissSync();
          },
        ),
        { numRuns: 30 },
      );

      httpMock.verify();
    },
    30_000,
  );
});
