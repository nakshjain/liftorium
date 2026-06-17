import { TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LiveWorkoutStore } from './live-workout.store';
import { GuestWorkoutStorageService } from './guest-workout-storage.service';
import type { LiveWorkout } from './live-workout.models';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeLiveWorkout(overrides: Partial<LiveWorkout> = {}): LiveWorkout {
  const now = Date.now();
  return {
    id: 'test-workout-id',
    name: 'Test Workout',
    startedAt: now,
    finishedAt: null,
    resumedAt: now,
    accumulatedMs: 0,
    exercises: [],
    ...overrides,
  };
}

/** Build a mock GuestWorkoutStorageService with vi.fn() stubs. */
function buildMockStorage(loadResult: LiveWorkout | null = null): GuestWorkoutStorageService {
  return {
    saveActiveWorkout: vi.fn().mockResolvedValue(undefined),
    loadActiveWorkout: vi.fn().mockResolvedValue(loadResult),
    clearActiveWorkout: vi.fn().mockResolvedValue(undefined),
    saveCompletedWorkout: vi.fn().mockResolvedValue(undefined),
    getPendingWorkouts: vi.fn().mockResolvedValue([]),
    markWorkoutsSynced: vi.fn().mockResolvedValue(undefined),
    clearSyncedWorkouts: vi.fn().mockResolvedValue(undefined),
    storageType: Object.assign(() => 'indexeddb' as const, { asReadonly: () => () => 'indexeddb' as const }),
  } as unknown as GuestWorkoutStorageService;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('LiveWorkoutStore — persistence delegation', () => {
  let store: LiveWorkoutStore;
  let mockStorage: GuestWorkoutStorageService;

  // Configure TestBed with a default mock that returns null from loadActiveWorkout.
  function setup(loadResult: LiveWorkout | null = null): void {
    mockStorage = buildMockStorage(loadResult);

    TestBed.configureTestingModule({
      providers: [
        LiveWorkoutStore,
        { provide: GuestWorkoutStorageService, useValue: mockStorage },
      ],
    });

    store = TestBed.inject(LiveWorkoutStore);
  }

  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  // -------------------------------------------------------------------------
  // 1. persist() — called indirectly via startWorkout()
  // -------------------------------------------------------------------------
  it('startWorkout() calls guestStorage.saveActiveWorkout with the new workout', () => {
    setup();

    store.startWorkout();

    expect(mockStorage.saveActiveWorkout).toHaveBeenCalledOnce();
    const savedWorkout = (mockStorage.saveActiveWorkout as ReturnType<typeof vi.fn>).mock.calls[0][0] as LiveWorkout;
    expect(savedWorkout.name).toBe('Today');
    expect(savedWorkout.finishedAt).toBeNull();
    expect(typeof savedWorkout.id).toBe('string');
  });

  // -------------------------------------------------------------------------
  // 2. clearStorage() — called indirectly via resetWorkout()
  // -------------------------------------------------------------------------
  it('resetWorkout() calls guestStorage.clearActiveWorkout', () => {
    setup();

    store.startWorkout();
    store.resetWorkout();

    expect(mockStorage.clearActiveWorkout).toHaveBeenCalledOnce();
  });

  it('resetWorkout() sets activeWorkout signal to null', () => {
    setup();

    store.startWorkout();
    expect(store.activeWorkout()).not.toBeNull();

    store.resetWorkout();
    expect(store.activeWorkout()).toBeNull();
  });

  // -------------------------------------------------------------------------
  // 3. Async hydration in constructor
  // -------------------------------------------------------------------------
  it('hydrateFromStorage sets activeWorkout signal when loadActiveWorkout resolves with a workout', async () => {
    const savedWorkout = makeLiveWorkout({ resumedAt: 0, accumulatedMs: 5000 });
    setup(savedWorkout);

    // Allow the microtask queue (the async constructor promise) to settle.
    await Promise.resolve();

    const active = store.activeWorkout();
    expect(active).not.toBeNull();
    expect(active!.id).toBe(savedWorkout.id);
    expect(active!.name).toBe(savedWorkout.name);
  });

  it('hydrateFromStorage restores workout in paused state (resumedAt === 0)', async () => {
    const savedWorkout = makeLiveWorkout({ resumedAt: 0, accumulatedMs: 12000 });
    setup(savedWorkout);

    await Promise.resolve();

    const active = store.activeWorkout();
    expect(active).not.toBeNull();
    // Hydrated workout is always paused regardless of original resumedAt
    expect(active!.resumedAt).toBe(0);
  });

  it('activeWorkout signal stays null when loadActiveWorkout resolves with null', async () => {
    setup(null);

    await Promise.resolve();

    expect(store.activeWorkout()).toBeNull();
  });

  // -------------------------------------------------------------------------
  // 4. finishWorkout() clears the workout signal and calls clearActiveWorkout
  // -------------------------------------------------------------------------
  it('finishWorkout() sets activeWorkout signal to null', () => {
    setup();

    store.startWorkout();
    expect(store.activeWorkout()).not.toBeNull();

    store.finishWorkout();

    expect(store.activeWorkout()).toBeNull();
  });

  it('finishWorkout() calls guestStorage.clearActiveWorkout', () => {
    setup();

    store.startWorkout();
    store.finishWorkout();

    expect(mockStorage.clearActiveWorkout).toHaveBeenCalledOnce();
  });

  it('finishWorkout() populates lastFinishedWorkout with the completed workout', () => {
    setup();

    store.startWorkout();
    store.finishWorkout();

    const finished = store.lastFinishedWorkout();
    expect(finished).not.toBeNull();
    expect(finished!.finishedAt).not.toBeNull();
  });

  it('finishWorkout() does nothing when no active workout exists', () => {
    setup();

    expect(store.activeWorkout()).toBeNull();
    store.finishWorkout(); // should not throw

    expect(mockStorage.clearActiveWorkout).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // 5. Requirements 3.3 — anonymous user: store clears the active workout signal.
  //    The actual guest saveCompletedWorkout happens in live-workout-page.ts,
  //    NOT in the store — so the store must NOT call saveCompletedWorkout.
  // -------------------------------------------------------------------------
  it('finishWorkout() does NOT call saveCompletedWorkout on the store (guest save is page-layer responsibility)', () => {
    setup();

    store.startWorkout();
    store.finishWorkout();

    // The store only clears; it does not persist completed workouts — that
    // responsibility belongs to LiveWorkoutPageComponent (Req 3.3).
    expect(mockStorage.saveCompletedWorkout).not.toHaveBeenCalled();
  });

  it('finishWorkout() clears active workout signal regardless of auth status (store is auth-agnostic)', () => {
    // The store itself has no dependency on AuthService. The "anonymous" branch
    // lives in live-workout-page.ts. The store just clears and delegates to
    // clearActiveWorkout — verifiable without mocking AuthService.
    setup();

    store.startWorkout();
    expect(store.activeWorkout()).not.toBeNull();

    store.finishWorkout();

    expect(store.activeWorkout()).toBeNull();
    expect(mockStorage.clearActiveWorkout).toHaveBeenCalledOnce();
  });
});
