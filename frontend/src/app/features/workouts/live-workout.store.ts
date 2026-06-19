import { Injectable, computed, inject, signal } from '@angular/core';
import { PlanExercise } from '../plan/plan.models';
import { GuestWorkoutStorageService } from './guest-workout-storage.service';
import {
  ExerciseOption,
  LiveWorkout,
  PreviousSet,
  TrackingType,
  WorkoutExercise,
  WorkoutSet,
} from './live-workout.models';
import { UserSettingsStore } from '../settings/settings.store';
import { defaultWeight, weightStep } from '../../shared/utils/weight.utils';

const DEFAULT_REST_SECONDS = 90;

@Injectable({ providedIn: 'root' })
export class LiveWorkoutStore {
  private readonly guestStorage = inject(GuestWorkoutStorageService);
  private readonly settingsStore = inject(UserSettingsStore);

  /** Exposed so templates and the page component can read the current unit. */
  readonly weightUnit = this.settingsStore.weightUnit;
  /** Step used by the ±2.5 / ±5 weight stepper buttons. */
  readonly weightStepSize = computed(() => weightStep(this.weightUnit()));

  private readonly workout = signal<LiveWorkout | null>(null);
  private readonly finishedWorkout = signal<LiveWorkout | null>(null);
  private readonly now = signal(Date.now());
  private readonly restEndsAt = signal<number | null>(null);

  readonly activeWorkout = this.workout.asReadonly();
  readonly lastFinishedWorkout = this.finishedWorkout.asReadonly();

  readonly restRemainingSeconds = computed(() => {
    const endsAt = this.restEndsAt();
    if (!endsAt) return 0;
    return Math.max(0, Math.ceil((endsAt - this.now()) / 1000));
  });
  readonly restTimerActive = computed(() => this.restRemainingSeconds() > 0);
  readonly paused = computed(() => {
    const workout = this.workout();
    return workout !== null && workout.resumedAt === 0;
  });
  readonly elapsedSeconds = computed(() => {
    const workout = this.workout();
    if (!workout) return 0;
    if (workout.resumedAt === 0) {
      return Math.floor(workout.accumulatedMs / 1000);
    }
    const currentStretch = (workout.finishedAt ?? this.now()) - workout.resumedAt;
    return Math.floor((workout.accumulatedMs + currentStretch) / 1000);
  });
  readonly completedSetCount = computed(
    () => this.workout()?.exercises.reduce(
      (count, ex) => count + ex.sets.filter((s) => s.completed).length, 0
    ) ?? 0
  );

  /**
   * Total volume — only meaningful for WEIGHT_REPS exercises.
   * REPS_ONLY / DURATION / CARDIO sets contribute 0 to keep the display clean.
   */
  readonly totalVolume = computed(
    () => this.workout()?.exercises.reduce(
      (total, ex) => total + ex.sets.reduce(
        (t, s) => t + (s.completed && s.reps != null && s.weight != null
          ? s.reps * s.weight
          : 0),
        0,
      ),
      0,
    ) ?? 0
  );

  constructor() {
    this.hydrateFromStorage();
  }

  private async hydrateFromStorage(): Promise<void> {
    const workout = await this.guestStorage.loadActiveWorkout();
    if (workout) {
      const accumulated = workout.resumedAt !== 0
        ? workout.accumulatedMs + (Date.now() - workout.resumedAt)
        : workout.accumulatedMs;
      this.workout.set({ ...workout, resumedAt: 0, accumulatedMs: accumulated });
    }
  }

  tick(): void {
    this.now.set(Date.now());
  }

  startWorkout(): void {
    if (this.workout()) return;
    const now = Date.now();
    const workout: LiveWorkout = {
      id: crypto.randomUUID(),
      name: 'Today',
      startedAt: now,
      finishedAt: null,
      resumedAt: now,
      accumulatedMs: 0,
      exercises: [],
    };
    this.workout.set(workout);
    this.persist(workout);
  }

  pauseWorkout(): void {
    this.workout.update((workout) => {
      if (!workout || workout.resumedAt === 0) return workout;
      const elapsed = Date.now() - workout.resumedAt;
      const updated: LiveWorkout = { ...workout, accumulatedMs: workout.accumulatedMs + elapsed, resumedAt: 0 };
      this.persist(updated);
      return updated;
    });
  }

  resumeWorkout(): void {
    this.workout.update((workout) => {
      if (!workout || workout.resumedAt !== 0) return workout;
      const updated: LiveWorkout = { ...workout, resumedAt: Date.now() };
      this.persist(updated);
      return updated;
    });
  }

  resetWorkout(): void {
    this.workout.set(null);
    this.restEndsAt.set(null);
    this.clearStorage();
  }

  /** Add an exercise directly from the shared ExercisePickerComponent. */
  addExerciseFromPicker(
    id: string,
    name: string,
    target: string,
    equipment: string,
    trackingType: TrackingType,
  ): void {
    this.workout.update((workout) => {
      if (!workout || workout.exercises.some((ex) => ex.exerciseId === id)) return workout;
      const option: ExerciseOption = {
        id,
        name,
        target,
        equipment,
        trackingType,
        previous: [],
        bestSet: null,
      };
      const updated = { ...workout, exercises: [...workout.exercises, this.createWorkoutExercise(option)] };
      this.persist(updated);
      return updated;
    });
  }

  removeExercise(workoutExerciseId: string): void {
    this.workout.update((workout) => {
      if (!workout) return workout;
      const updated = { ...workout, exercises: workout.exercises.filter((ex) => ex.id !== workoutExerciseId) };
      this.persist(updated);
      return updated;
    });
  }

  moveExercise(workoutExerciseId: string, direction: 'up' | 'down'): void {
    this.workout.update((workout) => {
      if (!workout) return workout;
      const exercises = [...workout.exercises];
      const idx = exercises.findIndex((ex) => ex.id === workoutExerciseId);
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (idx === -1 || targetIdx < 0 || targetIdx >= exercises.length) return workout;
      [exercises[idx], exercises[targetIdx]] = [exercises[targetIdx], exercises[idx]];
      const updated = { ...workout, exercises };
      this.persist(updated);
      return updated;
    });
  }

  replaceExercise(
    workoutExerciseId: string,
    id: string,
    name: string,
    target: string,
    equipment: string,
    trackingType: TrackingType,
  ): void {
    this.workout.update((workout) => {
      if (!workout) return workout;
      const option: ExerciseOption = { id, name, target, equipment, trackingType, previous: [], bestSet: null };
      const exercises = workout.exercises.map((ex) =>
        ex.id === workoutExerciseId ? { ...this.createWorkoutExercise(option), id: ex.id } : ex
      );
      const updated = { ...workout, exercises };
      this.persist(updated);
      return updated;
    });
  }

  addSet(workoutExerciseId: string): void {
    this.workout.update((workout) => {
      const updated = this.updateExercise(workout, workoutExerciseId, (exercise) => {
        const previousSet = exercise.sets.at(-1);
        const comparisonSet = exercise.previous[exercise.sets.length] ?? exercise.previous.at(-1);
        const baseSet = previousSet ?? this.createWorkoutSet(1, exercise.trackingType, comparisonSet);
        return {
          ...exercise,
          sets: [
            ...exercise.sets,
            this.createWorkoutSet(exercise.sets.length + 1, exercise.trackingType, {
              reps: baseSet.reps,
              weight: baseSet.weight,
              durationSeconds: baseSet.durationSeconds,
              distanceKm: baseSet.distanceKm,
            }),
          ],
        };
      });
      if (updated) this.persist(updated);
      return updated;
    });
  }

  removeSet(workoutExerciseId: string, setId: string): void {
    this.workout.update((workout) => {
      const updated = this.updateExercise(workout, workoutExerciseId, (exercise) => ({
        ...exercise,
        sets: exercise.sets
          .filter((s) => s.id !== setId)
          .map((s, i) => ({ ...s, order: i + 1 })),
      }));
      if (updated) this.persist(updated);
      return updated;
    });
  }

  /** Adjust a numeric field on a set by a delta. Only applies to strength fields. */
  adjustSet(
    workoutExerciseId: string,
    setId: string,
    field: 'reps' | 'weight',
    amount: number,
  ): void {
    this.workout.update((workout) => {
      const updated = this.updateSet(workout, workoutExerciseId, setId, (set) => {
        const current = set[field] ?? 0;
        const next = Math.max(0, current + amount);
        return { ...set, [field]: field === 'reps' ? Math.round(next) : Number(next.toFixed(1)) };
      });
      if (updated) this.persist(updated);
      return updated;
    });
  }

  /** Adjust a duration field by a delta (seconds). */
  adjustDuration(workoutExerciseId: string, setId: string, amount: number): void {
    this.workout.update((workout) => {
      const updated = this.updateSet(workout, workoutExerciseId, setId, (set) => {
        const current = set.durationSeconds ?? 0;
        return { ...set, durationSeconds: Math.max(0, current + amount) };
      });
      if (updated) this.persist(updated);
      return updated;
    });
  }

  setValue(
    workoutExerciseId: string,
    setId: string,
    field: 'reps' | 'weight' | 'durationSeconds' | 'distanceKm' | 'speed' | 'incline',
    value: string,
  ): void {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return;

    this.workout.update((workout) => {
      const updated = this.updateSet(workout, workoutExerciseId, setId, (set) => {
        if (field === 'reps') {
          return { ...set, reps: Math.max(0, Math.round(parsed)) };
        }
        if (field === 'durationSeconds') {
          return { ...set, durationSeconds: Math.max(0, Math.round(parsed)) };
        }
        return { ...set, [field]: Math.max(0, Number(parsed.toFixed(2))) };
      });
      if (updated) this.persist(updated);
      return updated;
    });
  }

  toggleSetComplete(workoutExerciseId: string, setId: string): void {
    this.workout.update((workout) => {
      const updated = this.updateSet(workout, workoutExerciseId, setId, (set) => {
        const completed = !set.completed;
        if (completed) this.restEndsAt.set(Date.now() + DEFAULT_REST_SECONDS * 1000);
        return { ...set, completed, completedAt: completed ? new Date().toISOString() : null };
      });
      if (updated) this.persist(updated);
      return updated;
    });
  }

  addRestTime(seconds: number): void {
    const base = this.restEndsAt() ?? Date.now();
    this.restEndsAt.set(Math.max(Date.now(), base) + seconds * 1000);
  }

  skipRest(): void {
    this.restEndsAt.set(null);
  }

  finishWorkout(): void {
    const workout = this.workout();
    if (!workout || workout.finishedAt) return;

    const now = Date.now();
    const finalAccumulated = workout.resumedAt !== 0
      ? workout.accumulatedMs + (now - workout.resumedAt)
      : workout.accumulatedMs;
    const finished: LiveWorkout = { ...workout, finishedAt: now, resumedAt: 0, accumulatedMs: finalAccumulated };
    this.finishedWorkout.set(finished);
    this.workout.set(null);
    this.restEndsAt.set(null);
    this.clearStorage();
  }

  clearFinishedWorkout(): void {
    this.finishedWorkout.set(null);
  }

  startNewWorkout(): void {
    this.clearFinishedWorkout();
    if (this.workout()) {
      this.resumeWorkout();
      return;
    }
    this.startWorkout();
  }

  startWorkoutFromPlan(planExercises: PlanExercise[], dayLabel: string): void {
    this.clearFinishedWorkout();
    if (this.workout()) {
      this.resumeWorkout();
      return;
    }

    const now = Date.now();
    // Plan exercises don't carry trackingType yet — default to WEIGHT_REPS.
    // The ExercisePicker path is the recommended entry point for non-weight exercises.
    const exercises: WorkoutExercise[] = planExercises.map((pe) => ({
      id: crypto.randomUUID(),
      exerciseId: pe.exerciseId,
      name: pe.exerciseName,
      target: '',
      equipment: '',
      trackingType: 'WEIGHT_REPS' as TrackingType,
      previous: [],
      bestSet: null,
      sets: pe.sets.map((s, i) =>
        this.createWorkoutSet(i + 1, 'WEIGHT_REPS', {
          reps: s.reps,
          weight: defaultWeight(this.weightUnit()),
        })
      ),
    }));

    const workout: LiveWorkout = {
      id: crypto.randomUUID(),
      name: dayLabel || 'Today',
      startedAt: now,
      finishedAt: null,
      resumedAt: now,
      accumulatedMs: 0,
      exercises,
    };
    this.workout.set(workout);
    this.persist(workout);
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private persist(workout: LiveWorkout): void {
    this.guestStorage.saveActiveWorkout(workout).catch(() => {
      // storage quota exceeded — non-fatal
    });
  }

  private clearStorage(): void {
    this.guestStorage.clearActiveWorkout().catch(() => {});
  }

  private createWorkoutExercise(option: ExerciseOption): WorkoutExercise {
    return {
      id: crypto.randomUUID(),
      exerciseId: option.id,
      name: option.name,
      target: option.target,
      equipment: option.equipment,
      trackingType: option.trackingType,
      previous: option.previous,
      bestSet: option.bestSet ?? null,
      sets: [this.createWorkoutSet(1, option.trackingType, option.previous[0])],
    };
  }

  private createWorkoutSet(
    order: number,
    trackingType: TrackingType,
    previousSet?: PreviousSet,
  ): WorkoutSet {
    const base: WorkoutSet = {
      id: crypto.randomUUID(),
      order,
      reps: null,
      weight: null,
      durationSeconds: null,
      distanceKm: null,
      speed: null,
      incline: null,
      completed: false,
      completedAt: null,
    };

    switch (trackingType) {
      case 'WEIGHT_REPS':
        return {
          ...base,
          reps: previousSet?.reps ?? 8,
          weight: previousSet?.weight ?? defaultWeight(this.weightUnit()),
        };

      case 'REPS_ONLY':
        return {
          ...base,
          reps: previousSet?.reps ?? 8,
        };

      case 'DURATION':
        return {
          ...base,
          durationSeconds: previousSet?.durationSeconds ?? 30,
        };

      case 'CARDIO':
        return {
          ...base,
          durationSeconds: previousSet?.durationSeconds ?? 300,  // 5 min default
          distanceKm: previousSet?.distanceKm ?? null,
        };
    }
  }

  private updateExercise(
    workout: LiveWorkout | null,
    workoutExerciseId: string,
    update: (exercise: WorkoutExercise) => WorkoutExercise,
  ): LiveWorkout | null {
    if (!workout) return workout;
    return {
      ...workout,
      exercises: workout.exercises.map((ex) =>
        ex.id === workoutExerciseId ? update(ex) : ex
      ),
    };
  }

  private updateSet(
    workout: LiveWorkout | null,
    workoutExerciseId: string,
    setId: string,
    update: (set: WorkoutSet) => WorkoutSet,
  ): LiveWorkout | null {
    return this.updateExercise(workout, workoutExerciseId, (exercise) => ({
      ...exercise,
      sets: exercise.sets.map((s) => (s.id === setId ? update(s) : s)),
    }));
  }
}
