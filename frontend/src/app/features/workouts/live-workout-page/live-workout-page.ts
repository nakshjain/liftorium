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
import { ExerciseOverflowMenuComponent } from '../exercise-overflow-menu/exercise-overflow-menu';
import type { ExerciseOverflowAction } from '../exercise-overflow-menu/exercise-overflow-menu';
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
  imports: [
    RouterLink,
    FormsModule,
    ConfirmationDialogComponent,
    TrainingHubLinkComponent,
    ExercisePickerComponent,
    ExerciseOverflowMenuComponent,
  ],
  templateUrl: './live-workout-page.html',
  styleUrl: './live-workout-page.scss',
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

  /** Set IDs that just completed — drives the one-shot pop animation. */
  protected readonly justCompletedSetId = signal<string | null>(null);

  /** Exercise IDs that are currently collapsed — includes manual + auto-collapsed. */
  protected readonly collapsedExerciseIds = signal<Set<string>>(new Set());

  /**
   * Returns true when every set on this exercise is completed.
   * Used to auto-collapse finished exercises and show the summary state.
   */
  protected isFullyComplete(exerciseId: string): boolean {
    const ex = this.store.activeWorkout()?.exercises.find((e) => e.id === exerciseId);
    if (!ex || ex.sets.length === 0) return false;
    return ex.sets.every((s) => s.completed);
  }

  /**
   * Returns the ID of the first exercise that still has incomplete sets,
   * or null if every exercise is fully complete.
   * Used to auto-expand the active exercise.
   */
  protected readonly firstIncompleteExerciseId = computed(() => {
    const exercises = this.store.activeWorkout()?.exercises ?? [];
    const first = exercises.find((ex) => ex.sets.some((s) => !s.completed));
    return first?.id ?? null;
  });

  /**
   * Whether this exercise should render as collapsed.
   * Priority: auto-collapse when fully complete (unless user manually expanded),
   * or manual collapse when user tapped the header.
   * The first incomplete exercise is always treated as expanded.
   */
  protected shouldCollapse(exerciseId: string): boolean {
    // Always expand the current active exercise
    if (exerciseId === this.firstIncompleteExerciseId()) return false;
    // User manually toggled — respect that
    if (this.collapsedExerciseIds().has(exerciseId)) return true;
    // Auto-collapse when fully complete
    return this.isFullyComplete(exerciseId);
  }

  protected toggleCollapse(exerciseId: string): void {
    this.collapsedExerciseIds.update((ids) => {
      const next = new Set(ids);
      // If currently showing (expanded), collapse it
      if (!this.shouldCollapse(exerciseId)) {
        next.add(exerciseId);
      } else {
        next.delete(exerciseId);
      }
      return next;
    });
  }

  /**
   * When non-null the "+ Add Exercise" picker sheet is open.
   * If replacing, this holds the workoutExerciseId being replaced;
   * if adding fresh, it is the empty string ''.
   */
  protected readonly pickerTarget = signal<string | null>(null);

  protected readonly dayLabels = DAY_LABELS;
  protected readonly selectedDayIndex = signal(this.getTodayIndex());

  protected readonly selectedDay = computed((): PlanDay => {
    return this.planStore.getDay(this.selectedDayIndex());
  });

  protected readonly hasPlan = computed(() => {
    return this.planStore.plan().days.some((d) => !d.rest && d.exercises.length > 0);
  });

  protected readonly addedExerciseIds = computed(
    () => new Set(this.store.activeWorkout()?.exercises.map((ex) => ex.exerciseId) ?? [])
  );

  // ── Picker sheet ────────────────────────────────────────────────────────

  /** Open the picker to add a fresh exercise. */
  protected openAddExercise(): void {
    this.pickerTarget.set('');
  }

  /** Open the picker to replace an existing exercise. */
  protected openReplaceExercise(workoutExerciseId: string): void {
    this.pickerTarget.set(workoutExerciseId);
  }

  protected closePicker(): void {
    this.pickerTarget.set(null);
  }

  protected onExercisePicked(exercise: CachedExercise): void {
    const target = this.pickerTarget();
    if (target === null) return;

    if (target === '') {
      // Fresh add
      this.store.addExerciseFromPicker(
        exercise.id,
        exercise.name,
        exercise.primaryMuscles[0] ?? '',
        exercise.equipment[0] ?? '',
      );
    } else {
      // Replace existing
      this.store.replaceExercise(
        target,
        exercise.id,
        exercise.name,
        exercise.primaryMuscles[0] ?? '',
        exercise.equipment[0] ?? '',
      );
    }
    this.closePicker();
  }

  // ── Overflow menu ────────────────────────────────────────────────────────

  protected onOverflowAction(workoutExerciseId: string, action: ExerciseOverflowAction): void {
    switch (action) {
      case 'replace':
        this.openReplaceExercise(workoutExerciseId);
        break;
      case 'move-up':
        this.store.moveExercise(workoutExerciseId, 'up');
        break;
      case 'move-down':
        this.store.moveExercise(workoutExerciseId, 'down');
        break;
      case 'remove':
        this.store.removeExercise(workoutExerciseId);
        break;
    }
  }

  // ── Timer / elapsed ──────────────────────────────────────────────────────

  protected readonly elapsedTimeLabel = computed(() => this.formatTime(this.store.elapsedSeconds()));
  protected readonly restTimerLabel = computed(() =>
    this.store.restTimerActive() ? this.formatTime(this.store.restRemainingSeconds()) : null
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

  // ── Lifecycle ────────────────────────────────────────────────────────────

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
      // storage error — ignore
    }
  }

  public ngOnDestroy(): void {
    if (this.timerId !== null) {
      window.clearInterval(this.timerId);
    }
  }

  // ── Template helpers ─────────────────────────────────────────────────────

  protected inputValue(event: Event): string {
    return event.target instanceof HTMLInputElement ? event.target.value : '';
  }

  protected selectAll(event: FocusEvent): void {
    if (event.target instanceof HTMLInputElement) {
      event.target.select();
    }
  }

  /**
   * Per-row previous-session reference shown under the set number.
   * Format: "80×8". Falls back to "–" when no history for that index.
   */
  protected previousSetLabel(
    previousSets: readonly { reps: number; weight: number }[],
    index: number,
  ): string {
    const set = previousSets[index];
    return set ? `${set.weight}×${set.reps}` : '–';
  }

  /**
   * Exercise-level performance line shown in the card header.
   * "Last: 80kg × 8 · Best: 100kg × 5" — collapses when best === last.
   */
  protected exercisePerfLabel(
    previous: readonly { reps: number; weight: number }[],
    bestSet: { reps: number; weight: number } | null,
  ): string | null {
    const lastSet = previous[0] ?? null;
    if (!lastSet && !bestSet) return null;
    const parts: string[] = [];
    if (lastSet) parts.push(`Last: ${lastSet.weight}kg × ${lastSet.reps}`);
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
   * Completes or uncompletes a set and fires the pop animation on completion.
   * Rest timer is started automatically inside the store on completion.
   */
  protected completeSet(workoutExerciseId: string, setId: string, currentlyCompleted: boolean): void {
    this.store.toggleSetComplete(workoutExerciseId, setId);
    if (!currentlyCompleted) {
      this.justCompletedSetId.set(setId);
      window.setTimeout(() => {
        if (this.justCompletedSetId() === setId) this.justCompletedSetId.set(null);
      }, 300);
    }
  }

  // ── Workout lifecycle ────────────────────────────────────────────────────

  private createFinishedSummary(workout: LiveWorkout): FinishedWorkoutSummary {
    return {
      exercises: workout.exercises.length,
      sets: workout.exercises.reduce(
        (count, ex) => count + ex.sets.filter((s) => s.completed).length, 0
      ),
      volume: workout.exercises.reduce(
        (total, ex) => total + ex.sets.reduce((t, s) => t + (s.completed ? s.reps * s.weight : 0), 0), 0
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
      this.guestStorage.saveCompletedWorkout(guestWorkout)
        .then(() => this.toastService.success('Workout saved locally.'))
        .catch(() => this.toastService.error('Failed to save workout locally.'));
    } else {
      this.workoutService.save(finishedWorkout).subscribe({
        next: () => this.toastService.success('Workout saved successfully!'),
        error: () => this.toastService.error('Failed to save workout.', {
          label: 'Retry',
          handler: () => this.retrySaveWorkout(finishedWorkout),
        }),
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
      next: () => this.toastService.success('Workout saved successfully!'),
      error: () => this.toastService.error('Failed to save workout.', {
        label: 'Retry',
        handler: () => this.retrySaveWorkout(workout),
      }),
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
