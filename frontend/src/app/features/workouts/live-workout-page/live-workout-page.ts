import { Component, OnDestroy, OnInit, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LiveWorkout } from '../live-workout.models';
import { LiveWorkoutStore } from '../live-workout.store';

type FinishedWorkoutSummary = {
  exercises: number;
  sets: number;
  volume: number;
};

@Component({
  selector: 'app-live-workout-page',
  imports: [RouterLink, FormsModule],
  templateUrl: './live-workout-page.html',
  styleUrl: './live-workout-page.scss'
})
export class LiveWorkoutPageComponent implements OnInit, OnDestroy {
  protected readonly store = inject(LiveWorkoutStore);
  private timerId: number | null = null;

  protected readonly addedExerciseIds = computed(
    () => new Set(this.store.activeWorkout()?.exercises.map((exercise) => exercise.exerciseId) ?? [])
  );
  protected readonly availableExerciseCount = computed(
    () => this.store.exercises().filter((exercise) => !this.addedExerciseIds().has(exercise.id)).length
  );
  protected readonly elapsedTimeLabel = computed(() => this.formatTime(this.store.elapsedSeconds()));
  protected readonly restTimerLabel = computed(() =>
    this.store.restTimerActive() ? this.formatTime(this.store.restRemainingSeconds()) : 'Ready'
  );
  protected readonly finishedSummary = computed(() => {
    const workout = this.store.lastFinishedWorkout();

    if (!workout) {
      return null;
    }

    return this.createFinishedSummary(workout);
  });

  public ngOnInit(): void {
    this.timerId = window.setInterval(() => this.store.tick(), 1000);
  }

  public ngOnDestroy(): void {
    if (this.timerId !== null) {
      window.clearInterval(this.timerId);
    }
  }

  protected isExerciseAdded(exerciseId: string): boolean {
    return this.addedExerciseIds().has(exerciseId);
  }

  protected inputValue(event: Event): string {
    return event.target instanceof HTMLInputElement ? event.target.value : '';
  }

  protected previousSetLabel(previousSets: readonly { reps: number; weight: number }[], index: number): string {
    const previousSet = previousSets[index];

    return previousSet ? `${previousSet.weight}x${previousSet.reps}` : 'New';
  }

  private formatTime(totalSeconds: number): string {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  private createFinishedSummary(workout: LiveWorkout): FinishedWorkoutSummary {
    return {
      exercises: workout.exercises.length,
      sets: workout.exercises.reduce((count, exercise) => count + exercise.sets.filter((set) => set.completed).length, 0),
      volume: workout.exercises.reduce(
        (total, exercise) =>
          total + exercise.sets.reduce((setTotal, set) => setTotal + (set.completed ? set.reps * set.weight : 0), 0),
        0
      )
    };
  }
}
