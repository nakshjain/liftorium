import { Injectable, computed, inject, signal } from '@angular/core';
import { PlanExercise } from '../plan/plan.models';
import { GuestWorkoutStorageService } from './guest-workout-storage.service';
import { ExerciseOption, LiveWorkout, PreviousSet, WorkoutExercise, WorkoutSet } from './live-workout.models';

const DEFAULT_REST_SECONDS = 90;

@Injectable({ providedIn: 'root' })
export class LiveWorkoutStore {
  private readonly guestStorage = inject(GuestWorkoutStorageService);

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
  readonly totalVolume = computed(
    () => this.workout()?.exercises.reduce(
      (total, ex) => total + ex.sets.reduce(
        (t, s) => t + (s.completed ? s.reps * s.weight : 0), 0
      ), 0
    ) ?? 0
  );

  constructor() {
    // Hydrate from storage after bootstrap — fire-and-forget (non-blocking).
    this.hydrateFromStorage();
  }

  private async hydrateFromStorage(): Promise<void> {
    const workout = await this.guestStorage.loadActiveWorkout();
    if (workout) {
      // Restore in paused state — user resumes explicitly.
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
  addExerciseFromPicker(id: string, name: string, target: string, equipment: string): void {
    this.workout.update((workout) => {
      if (!workout || workout.exercises.some((ex) => ex.exerciseId === id)) return workout;
      const option: ExerciseOption = { id, name, target, equipment, previous: [], bestSet: null };
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

  addSet(workoutExerciseId: string): void {
    this.workout.update((workout) => {
      const updated = this.updateExercise(workout, workoutExerciseId, (exercise) => {
        const previousSet = exercise.sets.at(-1);
        const comparisonSet = exercise.previous[exercise.sets.length] ?? exercise.previous.at(-1);
        const baseSet = previousSet ?? this.createWorkoutSet(1, comparisonSet);
        return {
          ...exercise,
          sets: [...exercise.sets, this.createWorkoutSet(exercise.sets.length + 1, { reps: baseSet.reps, weight: baseSet.weight })],
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

  adjustSet(workoutExerciseId: string, setId: string, field: 'reps' | 'weight', amount: number): void {
    this.workout.update((workout) => {
      const updated = this.updateSet(workout, workoutExerciseId, setId, (set) => {
        const next = Math.max(0, set[field] + amount);
        return { ...set, [field]: field === 'reps' ? Math.round(next) : Number(next.toFixed(1)) };
      });
      if (updated) this.persist(updated);
      return updated;
    });
  }

  setValue(workoutExerciseId: string, setId: string, field: 'reps' | 'weight', value: string): void {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return;

    this.workout.update((workout) => {
      const updated = this.updateSet(workout, workoutExerciseId, setId, (set) => ({
        ...set,
        [field]: field === 'reps' ? Math.max(0, Math.round(parsed)) : Math.max(0, Number(parsed.toFixed(1))),
      }));
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
    const exercises: WorkoutExercise[] = planExercises.map((pe) => ({
      id: crypto.randomUUID(),
      exerciseId: pe.exerciseId,
      name: pe.exerciseName,
      target: '',
      equipment: '',
      previous: [],
      bestSet: null,
      sets: pe.sets.map((s, i) => this.createWorkoutSet(i + 1, { reps: s.reps, weight: 20 })),
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
      previous: option.previous,
      bestSet: option.bestSet ?? null,
      sets: [this.createWorkoutSet(1, option.previous[0])],
    };
  }

  private createWorkoutSet(order: number, previousSet?: PreviousSet): WorkoutSet {
    return {
      id: crypto.randomUUID(),
      order,
      reps: previousSet?.reps ?? 8,
      weight: previousSet?.weight ?? 20,
      completed: false,
      completedAt: null,
    };
  }

  private updateExercise(
    workout: LiveWorkout | null,
    workoutExerciseId: string,
    update: (exercise: WorkoutExercise) => WorkoutExercise,
  ): LiveWorkout | null {
    if (!workout) return workout;
    return { ...workout, exercises: workout.exercises.map((ex) => ex.id === workoutExerciseId ? update(ex) : ex) };
  }

  private updateSet(
    workout: LiveWorkout | null,
    workoutExerciseId: string,
    setId: string,
    update: (set: WorkoutSet) => WorkoutSet,
  ): LiveWorkout | null {
    return this.updateExercise(workout, workoutExerciseId, (ex) => ({
      ...ex,
      sets: ex.sets.map((s) => s.id === setId ? update(s) : s),
    }));
  }
}
