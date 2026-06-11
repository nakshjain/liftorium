import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LiveWorkout } from '../live-workout.models';
import { LiveWorkoutStore } from '../live-workout.store';
import { PlanStore } from '../../plan/plan.store';
import { DAY_LABELS, PlanDay } from '../../plan/plan.models';

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
  protected readonly planStore = inject(PlanStore);
  private timerId: number | null = null;

  protected readonly dayLabels = DAY_LABELS;
  protected readonly selectedDayIndex = signal(this.getTodayIndex());

  protected readonly selectedDay = computed((): PlanDay => {
    return this.planStore.getDay(this.selectedDayIndex());
  });

  protected readonly hasPlan = computed(() => {
    return this.planStore.plan().days.some((d) => !d.rest && d.exercises.length > 0);
  });

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

  protected formatTime(totalSeconds: number): string {
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

  protected onDayChange(value: string): void {
    this.selectedDayIndex.set(parseInt(value, 10));
  }

  protected startFromPlan(): void {
    if (this.store.paused()) {
      this.store.resumeWorkout();
      return;
    }
    const day = this.selectedDay();
    if (day.exercises.length > 0) {
      this.store.startWorkoutFromPlan(day.exercises, day.label);
    } else {
      this.store.startNewWorkout();
    }
  }

  protected getTodayIndex(): number {
    const jsDay = new Date().getDay();
    return jsDay === 0 ? 6 : jsDay - 1;
  }
}
