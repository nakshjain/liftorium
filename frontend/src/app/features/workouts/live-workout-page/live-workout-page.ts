import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LiveWorkout } from '../live-workout.models';
import { CachedExercise } from '../../exercises/cache/exercise-cache.models';
import { LiveWorkoutStore } from '../live-workout.store';
import { PlanStore } from '../../plan/plan.store';
import { DAY_LABELS, PlanDay } from '../../plan/plan.models';
import { ConfirmationDialogComponent } from '../../../shared/ui/confirmation-dialog/confirmation-dialog';
import { ExercisePickerComponent } from '../../../shared/ui/exercise-picker/exercise-picker';
import { ToastService } from '../../../shared/ui/toast/toast.service';
import { WorkoutService } from '../workout.service';
import { TrainingHubLinkComponent } from '../../../shared/ui/training-hub-link/training-hub-link';
import { AuthService } from '../../../core/auth/auth.service';
import { GuestWorkoutStorageService } from '../guest-workout-storage.service';
import type { GuestCompletedWorkout } from '../guest-workout.models';

type FinishedWorkoutSummary = {
  exercises: number;
  sets: number;
  volume: number;
};

@Component({
  selector: 'app-live-workout-page',
  imports: [RouterLink, FormsModule, ConfirmationDialogComponent, TrainingHubLinkComponent, ExercisePickerComponent],
  templateUrl: './live-workout-page.html',
  styleUrl: './live-workout-page.scss'
})
export class LiveWorkoutPageComponent implements OnInit, OnDestroy {
  protected readonly store = inject(LiveWorkoutStore);
  protected readonly planStore = inject(PlanStore);
  private readonly toastService = inject(ToastService);
  private readonly workoutService = inject(WorkoutService);
  protected readonly authService = inject(AuthService);
  private readonly guestStorage = inject(GuestWorkoutStorageService);
  private timerId: number | null = null;

  protected readonly showResetConfirm = signal(false);
  protected readonly showFinishConfirm = signal(false);
  private pendingFinishWorkout: LiveWorkout | null = null;

  /** Set ID that just completed — used to fire the one-shot pop animation. */
  protected readonly justCompletedSetId = signal<string | null>(null);

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

  protected onExercisePicked(exercise: CachedExercise): void {
    this.store.addExerciseFromPicker(
      exercise.id,
      exercise.name,
      exercise.primaryMuscles[0] ?? '',
      exercise.equipment[0] ?? '',
    );
  }

  protected readonly elapsedTimeLabel = computed(() => this.formatTime(this.store.elapsedSeconds()));
  protected readonly restTimerLabel = computed(() =>
    this.store.restTimerActive() ? this.formatTime(this.store.restRemainingSeconds()) : 'Ready'
  );
  protected readonly hasCompletedSets = computed(() => {
    const workout = this.store.activeWorkout();
    if (!workout) return false;
    return workout.exercises.some((ex) => ex.sets.some((s) => s.completed));
  });
  protected readonly finishedSummary = computed(() => {
    const workout = this.store.lastFinishedWorkout();
    if (!workout) return null;
    return this.createFinishedSummary(workout);
  });

  public ngOnInit(): void {
    this.timerId = window.setInterval(() => this.store.tick(), 1000);
    this.checkStaleWorkoutNotification();
  }

  private checkStaleWorkoutNotification(): void {
    try {
      const raw = localStorage.getItem('liftorium_stale_workout_notification');
      if (!raw) return;

      const notification = JSON.parse(raw) as { setCount: number; timestamp: number };
      const ageHours = (Date.now() - notification.timestamp) / (1000 * 60 * 60);

      if (ageHours < 24) {
        this.toastService.info(`Yesterday's workout was auto-saved (${notification.setCount} sets).`);
      }

      localStorage.removeItem('liftorium_stale_workout_notification');
    } catch {
      // Invalid JSON or storage error — ignore
    }
  }

  public ngOnDestroy(): void {
    if (this.timerId !== null) {
      window.clearInterval(this.timerId);
    }
  }

  protected inputValue(event: Event): string {
    return event.target instanceof HTMLInputElement ? event.target.value : '';
  }

  protected selectAll(event: FocusEvent): void {
    if (event.target instanceof HTMLInputElement) {
      event.target.select();
    }
  }

  /**
   * Returns a compact weight×reps label for the matching previous-session set.
   * Shown per-row in the set number column. "–" when no history exists for that index.
   */
  protected previousSetLabel(
    previousSets: readonly { reps: number; weight: number }[],
    index: number,
  ): string {
    const set = previousSets[index];
    return set ? `${set.weight}×${set.reps}` : '–';
  }

  /**
   * Builds the exercise-level performance summary line.
   * Format: "Last: 80kg × 8 · Best: 100kg × 5"
   * Returns null when there is no history at all (no line rendered).
   */
  protected exercisePerfLabel(
    previous: readonly { reps: number; weight: number }[],
    bestSet: { reps: number; weight: number } | null,
  ): string | null {
    const lastSet = previous[0] ?? null;
    if (!lastSet && !bestSet) return null;

    const parts: string[] = [];
    if (lastSet) {
      parts.push(`Last: ${lastSet.weight}kg × ${lastSet.reps}`);
    }
    // Only show best if it differs from last (avoids redundant "Last: X · Best: X")
    if (bestSet && (!lastSet || bestSet.weight !== lastSet.weight || bestSet.reps !== lastSet.reps)) {
      parts.push(`Best: ${bestSet.weight}kg × ${bestSet.reps}`);
    }
    return parts.join('  ·  ');
  }

  protected formatTime(totalSeconds: number): string {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  protected formatVolume(vol: number): string {
    if (vol >= 1000) return (vol / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    return Math.round(vol).toString();
  }

  /**
   * Wraps toggleSetComplete and fires a one-shot pop animation
   * on the Done button whenever a set transitions to completed (not un-completed).
   */
  protected completeSet(workoutExerciseId: string, setId: string, currentlyCompleted: boolean): void {
    this.store.toggleSetComplete(workoutExerciseId, setId);
    if (!currentlyCompleted) {
      this.justCompletedSetId.set(setId);
      window.setTimeout(() => {
        if (this.justCompletedSetId() === setId) {
          this.justCompletedSetId.set(null);
        }
      }, 300);
    }
  }

  private createFinishedSummary(workout: LiveWorkout): FinishedWorkoutSummary {
    return {
      exercises: workout.exercises.length,
      sets: workout.exercises.reduce(
        (count, ex) => count + ex.sets.filter((s) => s.completed).length,
        0,
      ),
      volume: workout.exercises.reduce(
        (total, ex) =>
          total + ex.sets.reduce((t, s) => t + (s.completed ? s.reps * s.weight : 0), 0),
        0,
      ),
    };
  }

  protected onDayChange(value: string): void {
    this.selectedDayIndex.set(parseInt(value, 10));
  }

  protected resetWorkout(): void {
    this.showResetConfirm.set(true);
  }

  protected confirmReset(): void {
    this.showResetConfirm.set(false);
    this.store.resetWorkout();
  }

  protected cancelReset(): void {
    this.showResetConfirm.set(false);
  }

  protected finishWorkout(): void {
    const workout = this.store.activeWorkout();
    if (!workout) return;

    this.pendingFinishWorkout = this.captureWorkoutSnapshot(workout);
    this.showFinishConfirm.set(true);
  }

  protected confirmFinish(): void {
    this.showFinishConfirm.set(false);
    if (!this.pendingFinishWorkout) return;

    const completedSets = this.pendingFinishWorkout.exercises
      .reduce((n, ex) => n + ex.sets.filter((s) => s.completed).length, 0);

    if (completedSets === 0) {
      this.toastService.info('No sets logged — workout was not saved.');
      this.pendingFinishWorkout = null;
      return;
    }

    const finishedWorkout = this.pendingFinishWorkout;
    this.store.finishWorkout();

    if (this.authService.status() === 'anonymous') {
      const guestWorkout: GuestCompletedWorkout = {
        id: finishedWorkout.id,
        name: finishedWorkout.name,
        startedAt: finishedWorkout.startedAt,
        finishedAt: finishedWorkout.finishedAt!,
        accumulatedMs: finishedWorkout.accumulatedMs,
        exercises: finishedWorkout.exercises,
        synced: false,
        syncedAt: null,
        createdLocally: new Date().toISOString(),
      };
      this.guestStorage.saveCompletedWorkout(guestWorkout).then(() => {
        this.toastService.success('Workout saved locally.');
      }).catch(() => {
        this.toastService.error('Failed to save workout locally.');
      });
    } else {
      this.workoutService.save(finishedWorkout).subscribe({
        next: () => {
          this.toastService.success('Workout saved successfully!');
        },
        error: () => {
          this.toastService.error('Failed to save workout.', {
            label: 'Retry',
            handler: () => this.retrySaveWorkout(finishedWorkout),
          });
        },
      });
    }

    this.pendingFinishWorkout = null;
  }

  protected cancelFinish(): void {
    this.showFinishConfirm.set(false);
    this.pendingFinishWorkout = null;
  }

  protected finishConfirmDetails = computed(() => {
    if (!this.pendingFinishWorkout) return '';
    const summary = this.createFinishedSummary(this.pendingFinishWorkout);
    return `${summary.sets} sets logged · ${summary.volume} kg total volume`;
  });

  private captureWorkoutSnapshot(workout: LiveWorkout): LiveWorkout {
    const now = Date.now();
    const finalAccumulated =
      workout.resumedAt !== 0
        ? workout.accumulatedMs + (now - workout.resumedAt)
        : workout.accumulatedMs;
    return { ...workout, finishedAt: now, resumedAt: 0, accumulatedMs: finalAccumulated };
  }

  private retrySaveWorkout(workout: LiveWorkout): void {
    this.workoutService.save(workout).subscribe({
      next: () => {
        this.toastService.success('Workout saved successfully!');
      },
      error: () => {
        this.toastService.error('Failed to save workout.', {
          label: 'Retry',
          handler: () => this.retrySaveWorkout(workout),
        });
      },
    });
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
