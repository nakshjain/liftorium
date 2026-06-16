import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DAY_LABELS, MUSCLE_GROUPS, PLAN_TEMPLATES, MuscleGroup } from '../plan.models';
import { PlanStore } from '../plan.store';
import { ExerciseService } from '../../exercises/exercise.service';
import { Exercise } from '../../exercises/exercise.models';
import { ConfirmationDialogComponent } from '../../../shared/ui/confirmation-dialog/confirmation-dialog';
import { ToastService } from '../../../shared/ui/toast/toast.service';
import { TrainingHubLinkComponent } from '../../../shared/ui/training-hub-link/training-hub-link';

@Component({
  selector: 'app-plan-page',
  imports: [RouterLink, FormsModule, ConfirmationDialogComponent, TrainingHubLinkComponent],
  templateUrl: './plan-page.html',
})
export class PlanPageComponent {
  protected readonly store = inject(PlanStore);
  private readonly exerciseService = inject(ExerciseService);
  private readonly toastService = inject(ToastService);

  protected readonly templates = PLAN_TEMPLATES;
  protected readonly muscleGroups = MUSCLE_GROUPS;
  protected readonly dayLabels = DAY_LABELS;

  // Muscle group quick-picks
  protected readonly muscleGroupPresets = [
    { label: 'Push', groups: ['Chest' as MuscleGroup, 'Shoulders' as MuscleGroup, 'Triceps' as MuscleGroup] },
    { label: 'Pull', groups: ['Back' as MuscleGroup, 'Biceps' as MuscleGroup, 'Forearms' as MuscleGroup] },
    { label: 'Legs', groups: ['Legs' as MuscleGroup] },
  ];

  protected readonly expandedDay = signal<number | null>(null);
  protected readonly showAdvancedMuscleGroups = signal<number | null>(null);
  protected readonly todayIndex = this.store.todayDayOfWeek;

  protected readonly searchingDay = signal<number | null>(null);
  protected readonly searchQuery = signal('');
  protected readonly searchResults = signal<Exercise[]>([]);
  protected readonly exercisesLoading = signal(true);
  protected readonly exerciseLoadError = signal(false);

  // Confirmation dialog state
  protected readonly showRemoveExerciseConfirm = signal(false);
  protected readonly showResetConfirm = signal(false);
  protected pendingRemoval: { dayOfWeek: number; exerciseIndex: number; exerciseName: string; setCount: number } | null = null;

  private allExercises: Exercise[] = [];
  private templateSwitchTimeout: any = null;

  protected readonly planLoading = signal(true);

  protected readonly activeTemplateDescription = computed(() => {
    const tid = this.store.activeTemplateId();
    if (!tid) return null;
    return this.templates.find((t) => t.id === tid)?.description ?? null;
  });

  constructor() {
    this.loadAllExercises();

    // Hide loading skeleton once the plan arrives from the server
    effect(() => {
      const plan = this.store.plan();
      if (plan && plan.days.length > 0) {
        this.planLoading.set(false);
      }
    }, { allowSignalWrites: true });
  }

  ngOnDestroy(): void {
    if (this.templateSwitchTimeout) {
      clearTimeout(this.templateSwitchTimeout);
    }
  }

  private loadAllExercises(): void {
    this.exercisesLoading.set(true);
    this.exerciseLoadError.set(false);
    this.allExercises = [];
    this.fetchPage(undefined);
  }

  protected retryLoadExercises(): void {
    this.loadAllExercises();
  }

  private fetchPage(cursor: string | undefined): void {
    this.exerciseService.list({ limit: 100, cursor }).subscribe({
      next: (page) => {
        this.allExercises = [...this.allExercises, ...page.items];
        if (page.hasNext && page.nextCursor) {
          this.fetchPage(page.nextCursor);
        } else {
          this.exercisesLoading.set(false);
          this.exerciseLoadError.set(false);
        }
      },
      error: () => {
        this.exercisesLoading.set(false);
        this.exerciseLoadError.set(true);
      },
    });
  }

  protected get exerciseCount(): number {
    return this.allExercises.length;
  }

  protected toggleDay(dayOfWeek: number): void {
    this.expandedDay.update((current) => (current === dayOfWeek ? null : dayOfWeek));
  }

  protected hasMuscleGroup(dayOfWeek: number, group: MuscleGroup): boolean {
    return this.store.getDay(dayOfWeek).muscleGroups.includes(group);
  }

  protected hasAllPresetGroups(dayOfWeek: number, presetGroups: MuscleGroup[]): boolean {
    const dayGroups = this.store.getDay(dayOfWeek).muscleGroups;
    return presetGroups.every(g => dayGroups.includes(g));
  }

  protected togglePresetGroups(dayOfWeek: number, presetGroups: MuscleGroup[]): void {
    const hasAll = this.hasAllPresetGroups(dayOfWeek, presetGroups);
    if (hasAll) {
      // Remove all preset groups
      presetGroups.forEach(g => {
        if (this.hasMuscleGroup(dayOfWeek, g)) {
          this.store.toggleMuscleGroup(dayOfWeek, g);
        }
      });
    } else {
      // Add all preset groups
      presetGroups.forEach(g => {
        if (!this.hasMuscleGroup(dayOfWeek, g)) {
          this.store.toggleMuscleGroup(dayOfWeek, g);
        }
      });
    }
  }

  protected toggleAdvancedMuscleGroups(dayOfWeek: number): void {
    const current = this.showAdvancedMuscleGroups();
    this.showAdvancedMuscleGroups.set(current === dayOfWeek ? null : dayOfWeek);
  }

  protected muscleGroupChips(dayOfWeek: number): string {
    const groups = this.store.getDay(dayOfWeek).muscleGroups;
    return groups.length ? groups.join(', ') : '';
  }

  protected getDayLabel(dayOfWeek: number): string {
    return this.store.getDay(dayOfWeek).label;
  }

  protected onLabelChange(dayOfWeek: number, value: string): void {
    this.store.setLabel(dayOfWeek, value);
  }

  protected openExerciseSearch(dayOfWeek: number): void {
    this.searchingDay.set(dayOfWeek);
    this.searchQuery.set('');
    this.searchResults.set([]);
  }

  protected closeExerciseSearch(): void {
    this.searchingDay.set(null);
    this.searchQuery.set('');
    this.searchResults.set([]);
  }

  protected onSearchInput(value: string): void {
    this.searchQuery.set(value);
    if (value.length < 2) {
      this.searchResults.set([]);
      return;
    }
    const query = value.toLowerCase();
    const filtered = this.allExercises
      .filter((e) => e.name.toLowerCase().includes(query))
      .slice(0, 15);
    this.searchResults.set(filtered);
  }

  protected selectExercise(exercise: Exercise): void {
    const dayOfWeek = this.searchingDay();
    if (dayOfWeek === null) return;
    this.store.addExercise(dayOfWeek, {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
    });
    this.closeExerciseSearch();
  }

  protected addSet(dayOfWeek: number, exerciseIndex: number): void {
    this.store.addSet(dayOfWeek, exerciseIndex);
  }

  protected removeSet(dayOfWeek: number, exerciseIndex: number, setIndex: number): void {
    this.store.removeSet(dayOfWeek, exerciseIndex, setIndex);
  }

  protected onSetRepsChange(dayOfWeek: number, exerciseIndex: number, setIndex: number, value: string): void {
    const reps = parseInt(value, 10);
    if (reps > 0 && reps <= 100) {
      this.store.updateSetReps(dayOfWeek, exerciseIndex, setIndex, reps);
    }
  }

  protected removeExercise(dayOfWeek: number, exerciseIndex: number): void {
    const day = this.store.getDay(dayOfWeek);
    const exercise = day.exercises[exerciseIndex];

    // If exercise has >1 set or custom reps, require confirmation
    if (exercise.sets.length > 1 || exercise.sets.some(s => s.reps !== 10)) {
      this.pendingRemoval = {
        dayOfWeek,
        exerciseIndex,
        exerciseName: exercise.exerciseName,
        setCount: exercise.sets.length
      };
      this.showRemoveExerciseConfirm.set(true);
    } else {
      // Single set with default reps — remove immediately
      this.store.removeExercise(dayOfWeek, exerciseIndex);
    }
  }

  protected confirmRemoveExercise(): void {
    if (this.pendingRemoval) {
      this.store.removeExercise(this.pendingRemoval.dayOfWeek, this.pendingRemoval.exerciseIndex);
      this.pendingRemoval = null;
    }
    this.showRemoveExerciseConfirm.set(false);
  }

  protected cancelRemoveExercise(): void {
    this.pendingRemoval = null;
    this.showRemoveExerciseConfirm.set(false);
  }

  protected removalConfirmDetails(): string {
    if (!this.pendingRemoval) return '';
    return `${this.pendingRemoval.setCount} set${this.pendingRemoval.setCount === 1 ? '' : 's'} configured`;
  }

  protected showResetDialog(): void {
    this.showResetConfirm.set(true);
  }

  protected confirmReset(): void {
    this.showResetConfirm.set(false);
    this.store.reset();
  }

  protected cancelReset(): void {
    this.showResetConfirm.set(false);
  }

  protected moveExerciseUp(dayOfWeek: number, exerciseIndex: number): void {
    if (exerciseIndex > 0) {
      this.store.moveExercise(dayOfWeek, exerciseIndex, 'up');
    }
  }

  protected moveExerciseDown(dayOfWeek: number, exerciseIndex: number): void {
    const day = this.store.getDay(dayOfWeek);
    if (exerciseIndex < day.exercises.length - 1) {
      this.store.moveExercise(dayOfWeek, exerciseIndex, 'down');
    }
  }

  protected getActiveDayNames(): string {
    const activeDays = this.store.plan().days
      .filter(d => !d.rest)
      .map(d => this.dayLabels[d.dayOfWeek]);
    return activeDays.join(', ');
  }

  protected applyTemplateDebounced(template: any): void {
    // Clear any pending template switch
    if (this.templateSwitchTimeout) {
      clearTimeout(this.templateSwitchTimeout);
    }

    // Debounce rapid template switching
    this.templateSwitchTimeout = setTimeout(() => {
      this.store.applyTemplate(template);
    }, 200);
  }

  protected clearTemplateDebounced(): void {
    if (this.templateSwitchTimeout) {
      clearTimeout(this.templateSwitchTimeout);
    }

    this.templateSwitchTimeout = setTimeout(() => {
      this.store.clearTemplate();
    }, 200);
  }
}
