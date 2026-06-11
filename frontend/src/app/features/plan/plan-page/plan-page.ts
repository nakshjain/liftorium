import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DAY_LABELS, MUSCLE_GROUPS, PLAN_TEMPLATES, MuscleGroup } from '../plan.models';
import { PlanStore } from '../plan.store';
import { ExerciseService } from '../../exercises/exercise.service';
import { Exercise } from '../../exercises/exercise.models';

@Component({
  selector: 'app-plan-page',
  imports: [RouterLink, FormsModule],
  templateUrl: './plan-page.html',
})
export class PlanPageComponent {
  protected readonly store = inject(PlanStore);
  private readonly exerciseService = inject(ExerciseService);

  protected readonly templates = PLAN_TEMPLATES;
  protected readonly muscleGroups = MUSCLE_GROUPS;
  protected readonly dayLabels = DAY_LABELS;

  protected readonly expandedDay = signal<number | null>(null);
  protected readonly todayIndex = this.store.todayDayOfWeek;

  protected readonly searchingDay = signal<number | null>(null);
  protected readonly searchQuery = signal('');
  protected readonly searchResults = signal<Exercise[]>([]);
  protected readonly exercisesLoading = signal(true);

  private allExercises: Exercise[] = [];

  protected readonly activeTemplateDescription = computed(() => {
    const tid = this.store.activeTemplateId();
    if (!tid) return null;
    return this.templates.find((t) => t.id === tid)?.description ?? null;
  });

  constructor() {
    this.loadAllExercises();
  }

  private loadAllExercises(): void {
    this.exercisesLoading.set(true);
    this.allExercises = [];
    this.fetchPage(undefined);
  }

  private fetchPage(cursor: string | undefined): void {
    this.exerciseService.list({ limit: 100, cursor }).subscribe({
      next: (page) => {
        this.allExercises = [...this.allExercises, ...page.items];
        if (page.hasNext && page.nextCursor) {
          this.fetchPage(page.nextCursor);
        } else {
          this.exercisesLoading.set(false);
        }
      },
      error: () => {
        this.exercisesLoading.set(false);
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
      sets: 3,
      reps: 10,
    });
    this.closeExerciseSearch();
  }

  protected onSetsChange(dayOfWeek: number, exerciseIndex: number, value: string): void {
    const sets = parseInt(value, 10);
    if (sets > 0 && sets <= 20) {
      this.store.updateExercise(dayOfWeek, exerciseIndex, { sets });
    }
  }

  protected onRepsChange(dayOfWeek: number, exerciseIndex: number, value: string): void {
    const reps = parseInt(value, 10);
    if (reps > 0 && reps <= 100) {
      this.store.updateExercise(dayOfWeek, exerciseIndex, { reps });
    }
  }

  protected removeExercise(dayOfWeek: number, exerciseIndex: number): void {
    this.store.removeExercise(dayOfWeek, exerciseIndex);
  }
}
