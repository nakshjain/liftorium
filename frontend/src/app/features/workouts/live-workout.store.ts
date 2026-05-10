import { Injectable, computed, signal } from '@angular/core';
import { ExerciseOption, LiveWorkout, PreviousSet, WorkoutExercise, WorkoutSet } from './live-workout.models';

const defaultRestSeconds = 90;

const exerciseCatalog: ExerciseOption[] = [
  {
    id: 'barbell-bench-press',
    name: 'Bench Press',
    target: 'Chest',
    equipment: 'Barbell',
    previous: [
      { reps: 8, weight: 75 },
      { reps: 7, weight: 75 },
      { reps: 6, weight: 75 }
    ]
  },
  {
    id: 'back-squat',
    name: 'Back Squat',
    target: 'Quads',
    equipment: 'Barbell',
    previous: [
      { reps: 6, weight: 105 },
      { reps: 6, weight: 105 },
      { reps: 5, weight: 110 }
    ]
  },
  {
    id: 'lat-pulldown',
    name: 'Lat Pulldown',
    target: 'Back',
    equipment: 'Cable',
    previous: [
      { reps: 10, weight: 60 },
      { reps: 9, weight: 60 },
      { reps: 8, weight: 65 }
    ]
  },
  {
    id: 'dumbbell-shoulder-press',
    name: 'Shoulder Press',
    target: 'Shoulders',
    equipment: 'Dumbbells',
    previous: [
      { reps: 10, weight: 22.5 },
      { reps: 8, weight: 22.5 },
      { reps: 8, weight: 22.5 }
    ]
  },
  {
    id: 'romanian-deadlift',
    name: 'Romanian Deadlift',
    target: 'Hamstrings',
    equipment: 'Barbell',
    previous: [
      { reps: 8, weight: 95 },
      { reps: 8, weight: 95 },
      { reps: 7, weight: 100 }
    ]
  }
];

@Injectable({ providedIn: 'root' })
export class LiveWorkoutStore {
  private readonly workout = signal<LiveWorkout | null>(null);
  private readonly finishedWorkout = signal<LiveWorkout | null>(null);
  private readonly now = signal(Date.now());
  private readonly restEndsAt = signal<number | null>(null);

  public readonly exercises = signal<ExerciseOption[]>(exerciseCatalog);
  public readonly activeWorkout = this.workout.asReadonly();
  public readonly lastFinishedWorkout = this.finishedWorkout.asReadonly();
  public readonly restRemainingSeconds = computed(() => {
    const endsAt = this.restEndsAt();

    if (!endsAt) {
      return 0;
    }

    return Math.max(0, Math.ceil((endsAt - this.now()) / 1000));
  });
  public readonly restTimerActive = computed(() => this.restRemainingSeconds() > 0);
  public readonly elapsedSeconds = computed(() => {
    const workout = this.workout();

    if (!workout) {
      return 0;
    }

    const end = workout.finishedAt ?? this.now();
    return Math.max(0, Math.floor((end - workout.startedAt) / 1000));
  });
  public readonly completedSetCount = computed(
    () => this.workout()?.exercises.reduce((count, exercise) => count + exercise.sets.filter((set) => set.completed).length, 0) ?? 0
  );
  public readonly totalVolume = computed(
    () =>
      this.workout()?.exercises.reduce(
        (exerciseTotal, exercise) =>
          exerciseTotal +
          exercise.sets.reduce((setTotal, set) => setTotal + (set.completed ? set.reps * set.weight : 0), 0),
        0
      ) ?? 0
  );

  public tick(): void {
    this.now.set(Date.now());
  }

  public startWorkout(): void {
    if (this.workout()) {
      return;
    }

    const firstExercise = exerciseCatalog[0];
    this.workout.set({
      id: crypto.randomUUID(),
      name: 'Today',
      startedAt: Date.now(),
      finishedAt: null,
      exercises: firstExercise ? [this.createWorkoutExercise(firstExercise)] : []
    });
  }

  public addExercise(exerciseId: string): void {
    const option = exerciseCatalog.find((exercise) => exercise.id === exerciseId);

    if (!option) {
      return;
    }

    this.workout.update((workout) => {
      if (!workout || workout.exercises.some((exercise) => exercise.exerciseId === exerciseId)) {
        return workout;
      }

      return {
        ...workout,
        exercises: [...workout.exercises, this.createWorkoutExercise(option)]
      };
    });
  }

  public removeExercise(workoutExerciseId: string): void {
    this.workout.update((workout) => {
      if (!workout) {
        return workout;
      }

      return {
        ...workout,
        exercises: workout.exercises.filter((exercise) => exercise.id !== workoutExerciseId)
      };
    });
  }

  public addSet(workoutExerciseId: string): void {
    this.workout.update((workout) => this.updateExercise(workout, workoutExerciseId, (exercise) => {
      const previousSet = exercise.sets.at(-1);
      const comparisonSet = exercise.previous[exercise.sets.length] ?? exercise.previous.at(-1);
      const baseSet = previousSet ?? this.createWorkoutSet(1, comparisonSet);

      return {
        ...exercise,
        sets: [
          ...exercise.sets,
          this.createWorkoutSet(exercise.sets.length + 1, {
            reps: baseSet.reps,
            weight: baseSet.weight
          })
        ]
      };
    }));
  }

  public removeSet(workoutExerciseId: string, setId: string): void {
    this.workout.update((workout) => this.updateExercise(workout, workoutExerciseId, (exercise) => ({
      ...exercise,
      sets: exercise.sets
        .filter((set) => set.id !== setId)
        .map((set, index) => ({
          ...set,
          order: index + 1
        }))
    })));
  }

  public adjustSet(workoutExerciseId: string, setId: string, field: 'reps' | 'weight', amount: number): void {
    this.workout.update((workout) => this.updateSet(workout, workoutExerciseId, setId, (set) => {
      const nextValue = Math.max(0, set[field] + amount);

      return {
        ...set,
        [field]: field === 'reps' ? Math.round(nextValue) : Number(nextValue.toFixed(1))
      };
    }));
  }

  public setValue(workoutExerciseId: string, setId: string, field: 'reps' | 'weight', value: string): void {
    const parsedValue = Number(value);

    if (!Number.isFinite(parsedValue)) {
      return;
    }

    this.workout.update((workout) => this.updateSet(workout, workoutExerciseId, setId, (set) => ({
      ...set,
      [field]: field === 'reps' ? Math.max(0, Math.round(parsedValue)) : Math.max(0, Number(parsedValue.toFixed(1)))
    })));
  }

  public toggleSetComplete(workoutExerciseId: string, setId: string): void {
    this.workout.update((workout) => this.updateSet(workout, workoutExerciseId, setId, (set) => {
      const completed = !set.completed;

      if (completed) {
        this.restEndsAt.set(Date.now() + defaultRestSeconds * 1000);
      }

      return {
        ...set,
        completed,
        completedAt: completed ? new Date().toISOString() : null
      };
    }));
  }

  public addRestTime(seconds: number): void {
    const base = this.restEndsAt() ?? Date.now();
    this.restEndsAt.set(Math.max(Date.now(), base) + seconds * 1000);
  }

  public skipRest(): void {
    this.restEndsAt.set(null);
  }

  public finishWorkout(): void {
    const workout = this.workout();

    if (!workout || workout.finishedAt) {
      return;
    }

    this.finishedWorkout.set({
      ...workout,
      finishedAt: Date.now()
    });
    this.workout.set(null);
    this.restEndsAt.set(null);
  }

  public clearFinishedWorkout(): void {
    this.finishedWorkout.set(null);
  }

  public startNewWorkout(): void {
    this.clearFinishedWorkout();
    this.startWorkout();
  }

  private createWorkoutExercise(option: ExerciseOption): WorkoutExercise {
    const startingSet = this.createWorkoutSet(1, option.previous[0]);

    return {
      id: crypto.randomUUID(),
      exerciseId: option.id,
      name: option.name,
      target: option.target,
      equipment: option.equipment,
      previous: option.previous,
      sets: [startingSet]
    };
  }

  private createWorkoutSet(order: number, previousSet?: PreviousSet): WorkoutSet {
    return {
      id: crypto.randomUUID(),
      order,
      reps: previousSet?.reps ?? 8,
      weight: previousSet?.weight ?? 20,
      completed: false,
      completedAt: null
    };
  }

  private updateExercise(
    workout: LiveWorkout | null,
    workoutExerciseId: string,
    update: (exercise: WorkoutExercise) => WorkoutExercise
  ): LiveWorkout | null {
    if (!workout) {
      return workout;
    }

    return {
      ...workout,
      exercises: workout.exercises.map((exercise) => (exercise.id === workoutExerciseId ? update(exercise) : exercise))
    };
  }

  private updateSet(
    workout: LiveWorkout | null,
    workoutExerciseId: string,
    setId: string,
    update: (set: WorkoutSet) => WorkoutSet
  ): LiveWorkout | null {
    return this.updateExercise(workout, workoutExerciseId, (exercise) => ({
      ...exercise,
      sets: exercise.sets.map((set) => (set.id === setId ? update(set) : set))
    }));
  }
}
