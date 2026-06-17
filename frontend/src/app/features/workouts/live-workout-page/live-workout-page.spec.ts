import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { LiveWorkoutPageComponent } from './live-workout-page';
import { LiveWorkoutStore } from '../live-workout.store';
import { AuthService } from '../../../core/auth/auth.service';
import { PlanStore } from '../../plan/plan.store';
import { WorkoutService } from '../workout.service';
import { ToastService } from '../../../shared/ui/toast/toast.service';
import { GuestWorkoutStorageService } from '../guest-workout-storage.service';
import type { LiveWorkout } from '../live-workout.models';
import type { AuthStatus } from '../../../core/auth/auth.models';
import { emptyPlan } from '../../plan/plan.models';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Minimal LiveWorkout that satisfies `createFinishedSummary`. */
function makeWorkout(): LiveWorkout {
  return {
    id: 'test-id',
    name: 'Test',
    startedAt: Date.now() - 3000,
    finishedAt: Date.now(),
    resumedAt: 0,
    accumulatedMs: 3000,
    exercises: [
      {
        id: 'ex-1',
        exerciseId: 'squat',
        name: 'Squat',
        target: 'Legs',
        equipment: 'Barbell',
        previous: [],
        sets: [
          { id: 's1', order: 1, reps: 5, weight: 100, completed: true, completedAt: null },
        ],
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// Factory — creates fresh signal-based mocks each test
// ---------------------------------------------------------------------------

function buildMocks() {
  const lastFinishedWorkout = signal<LiveWorkout | null>(null);
  const statusSignal = signal<AuthStatus>('anonymous');

  const mockStore = {
    activeWorkout: signal(null),
    lastFinishedWorkout: lastFinishedWorkout.asReadonly(),
    elapsedSeconds: signal(0),
    completedSetCount: signal(0),
    totalVolume: signal(0),
    restRemainingSeconds: signal(0),
    restTimerActive: signal(false),
    paused: signal(false),
    tick: vi.fn(),
    finishWorkout: vi.fn(),
    startNewWorkout: vi.fn(),
    resetWorkout: vi.fn(),
    resumeWorkout: vi.fn(),
    pauseWorkout: vi.fn(),
    addSet: vi.fn(),
    removeSet: vi.fn(),
    adjustSet: vi.fn(),
    setValue: vi.fn(),
    toggleSetComplete: vi.fn(),
    addRestTime: vi.fn(),
    skipRest: vi.fn(),
    removeExercise: vi.fn(),
    addExerciseFromPicker: vi.fn(),
    startWorkoutFromPlan: vi.fn(),
    clearFinishedWorkout: vi.fn(),
  };

  const mockAuth = {
    status: statusSignal.asReadonly(),
    isAuthenticated: signal(false),
    user: signal(null),
    accessToken: signal(null),
  };

  const mockPlan = {
    plan: signal(emptyPlan()),
    getDay: (i: number) => emptyPlan().days[i],
  };

  const mockWorkoutService = { save: vi.fn() };

  const mockToastService = {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    show: vi.fn(),
    dismiss: vi.fn(),
    activeToasts: signal([]),
  };

  const mockGuestStorage = {
    saveActiveWorkout: vi.fn().mockResolvedValue(undefined),
    loadActiveWorkout: vi.fn().mockResolvedValue(null),
    clearActiveWorkout: vi.fn().mockResolvedValue(undefined),
    saveCompletedWorkout: vi.fn().mockResolvedValue(undefined),
    getPendingWorkouts: vi.fn().mockResolvedValue([]),
    markWorkoutsSynced: vi.fn().mockResolvedValue(undefined),
    clearSyncedWorkouts: vi.fn().mockResolvedValue(undefined),
    storageType: signal('indexeddb' as const),
  };

  return { mockStore, mockAuth, mockPlan, mockWorkoutService, mockToastService, mockGuestStorage, lastFinishedWorkout, statusSignal };
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('LiveWorkoutPageComponent — workout summary section', () => {
  let mocks: ReturnType<typeof buildMocks>;

  async function createComponent() {
    await TestBed.configureTestingModule({
      imports: [LiveWorkoutPageComponent],
      providers: [
        provideRouter([]),
        { provide: LiveWorkoutStore, useValue: mocks.mockStore },
        { provide: AuthService, useValue: mocks.mockAuth },
        { provide: PlanStore, useValue: mocks.mockPlan },
        { provide: WorkoutService, useValue: mocks.mockWorkoutService },
        { provide: ToastService, useValue: mocks.mockToastService },
        { provide: GuestWorkoutStorageService, useValue: mocks.mockGuestStorage },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(LiveWorkoutPageComponent);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    mocks = buildMocks();
  });

  // -------------------------------------------------------------------------
  // 1. Banner visible when anonymous
  // -------------------------------------------------------------------------
  it('shows the "Your workout is stored locally" banner when anonymous', async () => {
    mocks.lastFinishedWorkout.set(makeWorkout());
    mocks.statusSignal.set('anonymous');

    const fixture = await createComponent();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Your workout is stored locally');
  });

  // -------------------------------------------------------------------------
  // 2. "Create Account" link points to /auth/signup
  // -------------------------------------------------------------------------
  it('shows a "Create Account" link pointing to /auth/signup when anonymous', async () => {
    mocks.lastFinishedWorkout.set(makeWorkout());
    mocks.statusSignal.set('anonymous');

    const fixture = await createComponent();
    fixture.detectChanges();

    const anchors = fixture.debugElement.queryAll(By.css('a'));
    const createAccountLink = anchors.find((a) =>
      (a.nativeElement.textContent as string).trim() === 'Create Account'
    );

    expect(createAccountLink).toBeTruthy();
    expect(createAccountLink!.attributes['routerLink'] ?? createAccountLink!.nativeElement.getAttribute('href'))
      .toContain('/auth/signup');
  });

  // -------------------------------------------------------------------------
  // 3. "Login" link points to /auth/login
  // -------------------------------------------------------------------------
  it('shows a "Login" link pointing to /auth/login when anonymous', async () => {
    mocks.lastFinishedWorkout.set(makeWorkout());
    mocks.statusSignal.set('anonymous');

    const fixture = await createComponent();
    fixture.detectChanges();

    const anchors = fixture.debugElement.queryAll(By.css('a'));
    const loginLink = anchors.find((a) =>
      (a.nativeElement.textContent as string).trim() === 'Login'
    );

    expect(loginLink).toBeTruthy();
    expect(loginLink!.attributes['routerLink'] ?? loginLink!.nativeElement.getAttribute('href'))
      .toContain('/auth/login');
  });

  // -------------------------------------------------------------------------
  // 4. "Continue as Guest" link points to /app
  // -------------------------------------------------------------------------
  it('shows a "Continue as Guest" link pointing to /app when anonymous', async () => {
    mocks.lastFinishedWorkout.set(makeWorkout());
    mocks.statusSignal.set('anonymous');

    const fixture = await createComponent();
    fixture.detectChanges();

    const anchors = fixture.debugElement.queryAll(By.css('a'));
    const guestLink = anchors.find((a) =>
      (a.nativeElement.textContent as string).trim() === 'Continue as Guest'
    );

    expect(guestLink).toBeTruthy();
    expect(guestLink!.attributes['routerLink'] ?? guestLink!.nativeElement.getAttribute('href'))
      .toContain('/app');
  });

  // -------------------------------------------------------------------------
  // 5. Standard actions shown when authenticated; no guest banner
  // -------------------------------------------------------------------------
  it('shows "View History" and "Start New Workout" for authenticated users without a guest banner', async () => {
    mocks.lastFinishedWorkout.set(makeWorkout());
    mocks.statusSignal.set('authenticated');

    const fixture = await createComponent();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;

    // Authenticated actions present
    expect(text).toContain('View History');
    expect(text).toContain('Start New Workout');

    // No guest banner
    expect(text).not.toContain('Your workout is stored locally');
  });
});
