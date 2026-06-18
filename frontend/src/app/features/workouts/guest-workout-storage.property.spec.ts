/**
 * Property-based tests for GuestWorkoutStorageService (localStorage fallback path).
 *
 * All tests force localStorage mode by setting (service as any).dbPromise = Promise.resolve(null).
 * This avoids needing a real IndexedDB environment.
 *
 * Uses vitest (globals) + fast-check.
 */

import * as fc from 'fast-check';
import { GuestWorkoutStorageService } from './guest-workout-storage.service';
import type { LiveWorkout, WorkoutExercise, WorkoutSet } from './live-workout.models';
import type { GuestCompletedWorkout } from './guest-workout.models';

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

const arbWorkoutSet: fc.Arbitrary<WorkoutSet> = fc.record({
  id: fc.uuid(),
  order: fc.integer({ min: 0, max: 100 }),
  reps: fc.integer({ min: 0, max: 999 }),
  weight: fc.float({ min: 0, max: 500, noNaN: true }),
  completed: fc.boolean(),
  completedAt: fc.oneof(fc.constant(null), fc.constant(new Date().toISOString())),
});

const arbWorkoutExercise: fc.Arbitrary<WorkoutExercise> = fc.record({
  id: fc.uuid(),
  exerciseId: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 60 }),
  target: fc.string({ minLength: 1, maxLength: 40 }),
  equipment: fc.string({ minLength: 1, maxLength: 40 }),
  previous: fc.array(fc.record({ reps: fc.integer({ min: 0, max: 999 }), weight: fc.float({ min: 0, max: 500, noNaN: true }) }), { maxLength: 5 }),
  bestSet: fc.oneof(fc.constant(null), fc.record({ reps: fc.integer({ min: 0, max: 999 }), weight: fc.float({ min: 0, max: 500, noNaN: true }) })),
  sets: fc.array(arbWorkoutSet, { maxLength: 10 }),
});

const arbLiveWorkout: fc.Arbitrary<LiveWorkout> = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 80 }),
  startedAt: fc.integer({ min: 1_000_000, max: Date.now() }),
  finishedAt: fc.oneof(fc.constant(null), fc.integer({ min: Date.now(), max: Date.now() + 86_400_000 })),
  resumedAt: fc.integer({ min: 0, max: Date.now() }),
  accumulatedMs: fc.integer({ min: 0, max: 86_400_000 }),
  exercises: fc.array(arbWorkoutExercise, { maxLength: 8 }),
});

/** Generates a valid GuestCompletedWorkout with startedAt strictly before finishedAt. */
const arbGuestCompletedWorkout = (overrides?: Partial<GuestCompletedWorkout>): fc.Arbitrary<GuestCompletedWorkout> =>
  fc.tuple(
    fc.integer({ min: 1_000_000, max: 1_700_000_000_000 }),
    fc.integer({ min: 1, max: 86_400_000 }),
  ).chain(([startedAt, duration]) =>
    fc.record({
      id: fc.uuid(),
      name: fc.string({ minLength: 1, maxLength: 80 }),
      startedAt: fc.constant(startedAt),
      finishedAt: fc.constant(startedAt + duration),
      accumulatedMs: fc.integer({ min: 0, max: duration }),
      exercises: fc.array(arbWorkoutExercise, { maxLength: 8 }),
      synced: overrides?.synced !== undefined ? fc.constant(overrides.synced) : fc.boolean(),
      syncedAt: overrides?.syncedAt !== undefined ? fc.constant(overrides.syncedAt) : fc.oneof(fc.constant(null), fc.constant(new Date().toISOString())),
      createdLocally: fc.constant(new Date().toISOString()),
    }),
  );

/** Builds a service instance wired to localStorage-only mode. */
function makeService(): GuestWorkoutStorageService {
  const svc = new GuestWorkoutStorageService();
  (svc as unknown as { dbPromise: Promise<null> }).dbPromise = Promise.resolve(null);
  return svc;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const LS_COMPLETED_KEY = 'liftorium_completed_workouts';
const LS_ACTIVE_KEY = 'liftorium_active_workout';

function lsWriteCompleted(workouts: GuestCompletedWorkout[]): void {
  localStorage.setItem(LS_COMPLETED_KEY, JSON.stringify(workouts));
}

function lsReadCompleted(): GuestCompletedWorkout[] {
  const raw = localStorage.getItem(LS_COMPLETED_KEY);
  return raw ? (JSON.parse(raw) as GuestCompletedWorkout[]) : [];
}

// ---------------------------------------------------------------------------
// Test setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  localStorage.clear();
});

// ---------------------------------------------------------------------------
// Property 6 — Storage fallback round-trip
// Validates: Requirements 4.1, 4.2, 4.4, 20.2, 21.1
// ---------------------------------------------------------------------------

describe('Property 6: Storage fallback round-trip', () => {
  it('saveActiveWorkout then loadActiveWorkout returns deeply equal object', async () => {
    await fc.assert(
      fc.asyncProperty(arbLiveWorkout, async (workout) => {
        localStorage.clear();
        const svc = makeService();

        await svc.saveActiveWorkout(workout);
        const loaded = await svc.loadActiveWorkout();

        // Stale workouts (startedAt before today) are auto-completed and return null —
        // filter those out so the round-trip assertion only applies to fresh workouts.
        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
        const startedDay = new Date(
          new Date(workout.startedAt).getFullYear(),
          new Date(workout.startedAt).getMonth(),
          new Date(workout.startedAt).getDate(),
        ).getTime();
        const isStale = startedDay < todayStart;

        if (isStale) {
          expect(loaded).toBeNull();
        } else {
          expect(loaded).toEqual(workout);
        }
      }),
      { numRuns: 50 },
    );
  });

  it('saveCompletedWorkout then getPendingWorkouts returns the record with synced:false / syncedAt:null', async () => {
    await fc.assert(
      fc.asyncProperty(arbGuestCompletedWorkout(), async (workout) => {
        localStorage.clear();
        const svc = makeService();

        await svc.saveCompletedWorkout(workout);
        const pending = await svc.getPendingWorkouts();
        const found = pending.find(w => w.id === workout.id);

        expect(found).toBeDefined();
        expect(found!.synced).toBe(false);
        expect(found!.syncedAt).toBeNull();
        // Core data fields are preserved
        expect(found!.name).toBe(workout.name);
        expect(found!.startedAt).toBe(workout.startedAt);
        expect(found!.finishedAt).toBe(workout.finishedAt);
        expect(found!.accumulatedMs).toBe(workout.accumulatedMs);
      }),
      { numRuns: 50 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 12 — markWorkoutsSynced idempotency
// Validates: Requirements 8.2, 8.3, 19.1
// ---------------------------------------------------------------------------

describe('Property 12: markWorkoutsSynced idempotency', () => {
  it('calling markWorkoutsSynced twice leaves synced:true and does not change syncedAt', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(arbGuestCompletedWorkout({ synced: false, syncedAt: null }), { minLength: 1, maxLength: 10 }),
        fc.func(fc.boolean()),
        async (workouts, shouldInclude) => {
          localStorage.clear();
          // Deduplicate ids
          const unique = workouts.filter((w, i, arr) => arr.findIndex(x => x.id === w.id) === i);
          const forcedFalse: GuestCompletedWorkout[] = unique.map(w => ({ ...w, synced: false, syncedAt: null }));
          lsWriteCompleted(forcedFalse);

          const ids = forcedFalse.filter((_, i) => shouldInclude(i)).map(w => w.id);
          if (ids.length === 0) return; // nothing to assert

          const svc = makeService();

          // First call
          await svc.markWorkoutsSynced(ids);
          const afterFirst = lsReadCompleted();
          const syncedAtValues = new Map(
            afterFirst.filter(w => ids.includes(w.id)).map(w => [w.id, w.syncedAt]),
          );

          // Second call
          await svc.markWorkoutsSynced(ids);
          const afterSecond = lsReadCompleted();

          for (const w of afterSecond) {
            if (ids.includes(w.id)) {
              expect(w.synced).toBe(true);
              // syncedAt must not have changed between first and second call
              expect(w.syncedAt).toBe(syncedAtValues.get(w.id));
            }
          }
        },
      ),
      { numRuns: 50 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 9 — Completed workout synced flag invariant
// Validates: Requirements 4.7, 7.2, 7.3
// ---------------------------------------------------------------------------

describe('Property 9: Completed workout synced flag invariant', () => {
  it('saveCompletedWorkout always stores synced:false and syncedAt:null regardless of input', async () => {
    await fc.assert(
      fc.asyncProperty(arbGuestCompletedWorkout(), async (workout) => {
        localStorage.clear();
        const svc = makeService();

        await svc.saveCompletedWorkout(workout);
        const pending = await svc.getPendingWorkouts();
        const saved = pending.find(w => w.id === workout.id);

        expect(saved).toBeDefined();
        expect(saved!.synced).toBe(false);
        expect(saved!.syncedAt).toBeNull();
      }),
      { numRuns: 50 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 11 — Pending workouts query correctness
// Validates: Requirements 8.1
// ---------------------------------------------------------------------------

describe('Property 11: Pending workouts query correctness', () => {
  it('getPendingWorkouts returns exactly the synced:false subset', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(arbGuestCompletedWorkout(), { minLength: 1, maxLength: 20 }),
        async (rawWorkouts) => {
          localStorage.clear();
          // Deduplicate by id
          const workouts = rawWorkouts.filter((w, i, arr) => arr.findIndex(x => x.id === w.id) === i);
          // Write directly — bypassing saveCompletedWorkout to preserve mixed synced values
          lsWriteCompleted(workouts);

          const svc = makeService();
          const pending = await svc.getPendingWorkouts();
          const pendingIds = new Set(pending.map(w => w.id));
          const expectedIds = new Set(workouts.filter(w => !w.synced).map(w => w.id));

          expect(pendingIds).toEqual(expectedIds);
        },
      ),
      { numRuns: 50 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 10 — Stale active workout auto-completion
// Validates: Requirements 5.1, 5.2, 5.3
// ---------------------------------------------------------------------------

describe('Property 10: Stale active workout auto-completion', () => {
  it('loadActiveWorkout returns null for a stale workout, clears active slot, and moves it to completed', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbLiveWorkout,
        async (workout) => {
          localStorage.clear();

          // Force startedAt to yesterday midnight (definitely stale)
          const today = new Date();
          const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1).getTime();
          const staleWorkout: LiveWorkout = { ...workout, startedAt: yesterday };

          localStorage.setItem(LS_ACTIVE_KEY, JSON.stringify(staleWorkout));

          const svc = makeService();
          const result = await svc.loadActiveWorkout();

          // 1. Return value must be null
          expect(result).toBeNull();

          // 2. Active slot must be cleared
          expect(localStorage.getItem(LS_ACTIVE_KEY)).toBeNull();

          // 3. A completed workout entry must exist with synced:false
          const completed = lsReadCompleted();
          expect(completed.length).toBeGreaterThanOrEqual(1);
          const autoCompleted = completed.find(w => w.startedAt === staleWorkout.startedAt && w.name === staleWorkout.name);
          expect(autoCompleted).toBeDefined();
          expect(autoCompleted!.synced).toBe(false);
        },
      ),
      { numRuns: 30 },
    );
  });
});
