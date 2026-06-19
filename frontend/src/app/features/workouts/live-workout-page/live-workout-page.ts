import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LiveWorkout, PreviousSet, TrackingType } from '../live-workout.models';
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
import { formatWeightCompact } from '../../../shared/utils/weight.utils';
import { toDisplayDistance } from '../../../shared/utils/distance.utils';
import type { WeightUnit } from '../../settings/settings.models';

type FinishedWorkoutSummary = {
  exercises: number;
  sets: number;
  volume: number;
  durationMinutes: number;
};

/** A PR worth surfacing in the completion card. */
type CompletionPr = {
  exerciseName: string;
  weight: number;
  reps: number;
};

@Component({
  selector: 'app-live-workout-page',
  imports: [
    RouterLink,
    FormsModule,
    NgClass,
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

  protected readonly justCompletedSetId = signal<string | null>(null);

  private readonly manuallyCollapsed = signal<Set<string>>(new Set());
  private readonly manuallyExpanded  = signal<Set<string>>(new Set());

  // ── State-aware page title ───────────────────────────────────────────────

  protected readonly pageTitle = computed(() => {
    if (this.store.lastFinishedWorkout()) return 'Session Summary';
    const active = this.store.activeWorkout();
    if (active) return active.name || 'Live Workout';
    // Pre-workout: use the selected day's label if it has exercises
    const day = this.planStore.getDay(this.selectedDayIndex());
    if (day && !day.rest && day.exercises.length > 0) return day.label || "Today's Workout";
    return "Today's Workout";
  });

  // ── Pre-workout info ─────────────────────────────────────────────────────

  /**
   * Name + exercise count + estimated duration for the selected plan day.
   * Duration: ~3 min per set, averaged across exercises. Rounded to nearest 5.
   */
  protected readonly preWorkoutInfo = computed(() => {
    const day = this.planStore.getDay(this.selectedDayIndex());
    if (!day || day.rest || day.exercises.length === 0) return null;
    const totalSets = day.exercises.reduce((n, ex) => n + ex.sets.length, 0);
    const rawMin = totalSets * 3;
    const estMin = Math.max(5, Math.round(rawMin / 5) * 5);
    return {
      name:      day.label || null,
      exercises: day.exercises.length,
      estMin,
    };
  });

  // ── Next workout (for post-completion plan card) ─────────────────────────

  protected readonly nextWorkoutDay = computed(() => {
    const p = this.planStore.plan();
    if (!p) return null;
    const todayIndex = this.selectedDayIndex();
    for (let i = 1; i <= 7; i++) {
      const idx = (todayIndex + i) % 7;
      const day = p.days.find((d) => d.dayOfWeek === idx);
      if (day && !day.rest && day.exercises.length > 0) return day;
    }
    return null;
  });

  // ── Completion PRs ───────────────────────────────────────────────────────

  /**
   * Detects new PRs achieved in the just-finished workout.
   * A PR is detected when any completed set's weight exceeds the exercise's
   * stored bestSet.weight (the pre-workout historical best).
   * Returns at most 3 PRs to keep the completion card compact.
   */
  protected readonly completionPrs = computed((): CompletionPr[] => {
    const workout = this.store.lastFinishedWorkout();
    if (!workout) return [];
    const prs: CompletionPr[] = [];
    for (const ex of workout.exercises) {
      // Only surface weight-based PRs on the completion card
      if (ex.trackingType !== 'WEIGHT_REPS') continue;
      const prSet = ex.sets
        .filter((s) => s.completed && s.weight != null && s.reps != null)
        .reduce<{ weight: number; reps: number } | null>((best, s) => {
          const w = s.weight!;
          const r = s.reps!;
          if (!best || w > best.weight || (w === best.weight && r > best.reps)) {
            return { weight: w, reps: r };
          }
          return best;
        }, null);
      if (!prSet) continue;
      // Only surface if this set beats the stored bestSet
      const prev = ex.bestSet;
      const prevW = prev?.weight ?? null;
      const prevR = prev?.reps ?? null;
      if (!prev || prSet.weight > (prevW ?? 0) || (prSet.weight === prevW && prSet.reps > (prevR ?? 0))) {
        prs.push({ exerciseName: ex.name, weight: prSet.weight, reps: prSet.reps });
      }
    }
    return prs.slice(0, 3);
  });

  // ── Collapse logic ───────────────────────────────────────────────────────

  protected isFullyComplete(exerciseId: string): boolean {
    const ex = this.store.activeWorkout()?.exercises.find((e) => e.id === exerciseId);
    if (!ex || ex.sets.length === 0) return false;
    return ex.sets.every((s) => s.completed);
  }

  protected readonly firstIncompleteExerciseId = computed(() => {
    const exercises = this.store.activeWorkout()?.exercises ?? [];
    return exercises.find((ex) => ex.sets.length > 0 && ex.sets.some((s) => !s.completed))?.id ?? null;
  });

  protected shouldCollapse(exerciseId: string): boolean {
    if (this.manuallyCollapsed().has(exerciseId)) return true;
    if (this.manuallyExpanded().has(exerciseId))  return false;
    if (exerciseId === this.firstIncompleteExerciseId()) return false;
    return this.isFullyComplete(exerciseId);
  }

  protected toggleCollapse(exerciseId: string): void {
    const collapsed = this.shouldCollapse(exerciseId);
    if (collapsed) {
      this.manuallyCollapsed.update((s) => { const n = new Set(s); n.delete(exerciseId); return n; });
      this.manuallyExpanded.update((s)  => new Set(s).add(exerciseId));
    } else {
      this.manuallyExpanded.update((s)  => { const n = new Set(s); n.delete(exerciseId); return n; });
      this.manuallyCollapsed.update((s) => new Set(s).add(exerciseId));
    }
  }

  // ── Picker sheet ─────────────────────────────────────────────────────────

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

  protected openAddExercise(): void    { this.pickerTarget.set(''); }
  protected openReplaceExercise(id: string): void { this.pickerTarget.set(id); }
  protected closePicker(): void        { this.pickerTarget.set(null); }

  protected onExercisePicked(exercise: CachedExercise): void {
    const target = this.pickerTarget();
    if (target === null) return;
    const trackingType = exercise.trackingType ?? 'WEIGHT_REPS';
    if (target === '') {
      this.store.addExerciseFromPicker(exercise.id, exercise.name, exercise.primaryMuscles[0] ?? '', exercise.equipment[0] ?? '', trackingType);
    } else {
      this.store.replaceExercise(target, exercise.id, exercise.name, exercise.primaryMuscles[0] ?? '', exercise.equipment[0] ?? '', trackingType);
    }
    this.closePicker();
  }

  // ── Overflow menu ─────────────────────────────────────────────────────────

  protected onOverflowAction(workoutExerciseId: string, action: ExerciseOverflowAction): void {
    switch (action) {
      case 'add-set':        this.store.addSet(workoutExerciseId); break;
      case 'remove-last-set': this.store.removeSet(workoutExerciseId, this.lastSetId(workoutExerciseId)); break;
      case 'replace':        this.openReplaceExercise(workoutExerciseId); break;
      case 'move-up':        this.store.moveExercise(workoutExerciseId, 'up'); break;
      case 'move-down':      this.store.moveExercise(workoutExerciseId, 'down'); break;
      case 'remove':         this.store.removeExercise(workoutExerciseId); break;
    }
  }

  private lastSetId(workoutExerciseId: string): string {
    const ex = this.store.activeWorkout()?.exercises.find((e) => e.id === workoutExerciseId);
    return ex?.sets.at(-1)?.id ?? '';
  }

  // ── Timer / elapsed ───────────────────────────────────────────────────────

  protected readonly elapsedTimeLabel = computed(() => this.formatTime(this.store.elapsedSeconds()));
  protected readonly restTimerLabel   = computed(() =>
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

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  public ngOnInit(): void {
    this.timerId = window.setInterval(() => this.store.tick(), 1000);
    this.checkStaleWorkoutNotification();
  }

  private checkStaleWorkoutNotification(): void {
    try {
      const raw = localStorage.getItem('liftorium_stale_workout_notification');
      if (!raw) return;
      const n = JSON.parse(raw) as { setCount: number; timestamp: number };
      if ((Date.now() - n.timestamp) / 3_600_000 < 24) {
        this.toastService.info(`Yesterday's workout was auto-saved (${n.setCount} sets).`);
      }
      localStorage.removeItem('liftorium_stale_workout_notification');
    } catch { /* ignore */ }
  }

  public ngOnDestroy(): void {
    if (this.timerId !== null) window.clearInterval(this.timerId);
  }

  // ── Template helpers ──────────────────────────────────────────────────────

  protected inputValue(event: Event): string {
    return event.target instanceof HTMLInputElement ? event.target.value : '';
  }

  protected selectAll(event: FocusEvent): void {
    if (event.target instanceof HTMLInputElement) event.target.select();
  }

  protected previousSetLabel(previousSets: readonly PreviousSet[], index: number): string {
    const set = previousSets[index];
    if (!set) return '–';
    if (set.weight != null && set.reps != null) return `${set.weight}×${set.reps}`;
    if (set.reps != null) return `${set.reps} reps`;
    if (set.durationSeconds != null) return this.formatTime(set.durationSeconds);
    if (set.distanceKm != null) return `${set.distanceKm}km`;
    return '–';
  }

  protected exercisePerfLabel(
    previous: readonly PreviousSet[],
    bestSet: PreviousSet | null,
    trackingType: TrackingType,
  ): string | null {
    const unit: WeightUnit = this.store.weightUnit();
    const lastSet = previous[0] ?? null;
    if (!lastSet && !bestSet) return null;
    const parts: string[] = [];

    if (trackingType === 'WEIGHT_REPS') {
      if (lastSet?.weight != null && lastSet.reps != null) {
        parts.push(`Last: ${formatWeightCompact(lastSet.weight, unit)} × ${lastSet.reps}`);
      }
      if (bestSet?.weight != null && bestSet.reps != null) {
        const isDifferent = !lastSet || bestSet.weight !== lastSet.weight || bestSet.reps !== lastSet.reps;
        if (isDifferent) parts.push(`Best: ${formatWeightCompact(bestSet.weight, unit)} × ${bestSet.reps}`);
      }
    } else if (trackingType === 'REPS_ONLY') {
      if (lastSet?.reps != null) parts.push(`Last: ${lastSet.reps} reps`);
      if (bestSet?.reps != null && bestSet.reps !== lastSet?.reps) parts.push(`Best: ${bestSet.reps} reps`);
    } else if (trackingType === 'DURATION') {
      if (lastSet?.durationSeconds != null) parts.push(`Last: ${this.formatTime(lastSet.durationSeconds)}`);
      if (bestSet?.durationSeconds != null && bestSet.durationSeconds !== lastSet?.durationSeconds) {
        parts.push(`Best: ${this.formatTime(bestSet.durationSeconds)}`);
      }
    } else if (trackingType === 'CARDIO') {
      if (lastSet?.durationSeconds != null) {
        const distUnit = this.store.distanceUnit();
        const dist = lastSet.distanceKm != null
          ? ` · ${toDisplayDistance(lastSet.distanceKm, distUnit)}${distUnit}`
          : '';
        parts.push(`Last: ${this.formatTime(lastSet.durationSeconds)}${dist}`);
      }
    }

    return parts.length > 0 ? parts.join('  ·  ') : null;
  }

  /**
   * Returns a Tailwind grid-cols class string based on tracking type.
   * Used by both the column header row and each set row.
   */
  protected setGridCols(trackingType: TrackingType): string {
    switch (trackingType) {
      case 'WEIGHT_REPS': return 'grid-cols-[2rem_1fr_1fr_2.75rem]';
      case 'REPS_ONLY':   return 'grid-cols-[2rem_1fr_2.75rem]';
      case 'DURATION':    return 'grid-cols-[2rem_1fr_2.75rem]';
      case 'CARDIO':      return 'grid-cols-[2rem_1fr_1fr_1fr_2.75rem]';
    }
  }

  protected formatTime(totalSeconds: number): string {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  protected formatVolume(vol: number): string {
    if (vol >= 1000) return (vol / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    return Math.round(vol).toString();
  }

  protected completeSet(workoutExerciseId: string, setId: string, currentlyCompleted: boolean): void {
    this.store.toggleSetComplete(workoutExerciseId, setId);
    if (!currentlyCompleted) {
      this.justCompletedSetId.set(setId);
      window.setTimeout(() => {
        if (this.justCompletedSetId() === setId) this.justCompletedSetId.set(null);
      }, 300);
    }
  }

  // ── Workout lifecycle ─────────────────────────────────────────────────────

  private createFinishedSummary(workout: LiveWorkout): FinishedWorkoutSummary {
    const durationMs = workout.accumulatedMs;
    return {
      exercises: workout.exercises.length,
      sets: workout.exercises.reduce((c, ex) => c + ex.sets.filter((s) => s.completed).length, 0),
      volume: workout.exercises.reduce(
        (t, ex) => t + ex.sets.reduce(
          (st, s) => st + (s.completed && s.reps != null && s.weight != null ? s.reps * s.weight : 0),
          0,
        ),
        0,
      ),
      durationMinutes: Math.max(1, Math.round(durationMs / 60_000)),
    };
  }

  protected onDayChange(value: string): void { this.selectedDayIndex.set(parseInt(value, 10)); }

  protected resetWorkout(): void  { this.showResetConfirm.set(true); }
  protected confirmReset(): void  { this.showResetConfirm.set(false); this.store.resetWorkout(); }
  protected cancelReset(): void   { this.showResetConfirm.set(false); }

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
      const gw: GuestCompletedWorkout = {
        id: finishedWorkout.id, name: finishedWorkout.name,
        startedAt: finishedWorkout.startedAt, finishedAt: finishedWorkout.finishedAt!,
        accumulatedMs: finishedWorkout.accumulatedMs, exercises: finishedWorkout.exercises,
        synced: false, syncedAt: null, createdLocally: new Date().toISOString(),
      };
      this.guestStorage.saveCompletedWorkout(gw)
        .then(() => this.toastService.success('Workout saved locally.'))
        .catch(() => this.toastService.error('Failed to save workout locally.'));
    } else {
      this.workoutService.save(finishedWorkout).subscribe({
        next:  () => this.toastService.success('Workout saved successfully!'),
        error: () => this.toastService.error('Failed to save workout.', {
          label: 'Retry', handler: () => this.retrySaveWorkout(finishedWorkout),
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
    const s = this.createFinishedSummary(this.pendingFinishWorkout);
    return `${s.sets} sets · ${this.formatVolume(s.volume)} ${this.store.weightUnit()}`;
  });

  private captureWorkoutSnapshot(workout: LiveWorkout): LiveWorkout {
    const now = Date.now();
    const finalAccumulated = workout.resumedAt !== 0
      ? workout.accumulatedMs + (now - workout.resumedAt)
      : workout.accumulatedMs;
    return { ...workout, finishedAt: now, resumedAt: 0, accumulatedMs: finalAccumulated };
  }

  private retrySaveWorkout(workout: LiveWorkout): void {
    this.workoutService.save(workout).subscribe({
      next:  () => this.toastService.success('Workout saved successfully!'),
      error: () => this.toastService.error('Failed to save workout.', {
        label: 'Retry', handler: () => this.retrySaveWorkout(workout),
      }),
    });
  }

  protected startFromPlan(): void {
    if (this.store.paused()) { this.store.resumeWorkout(); return; }
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
