import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject, switchMap, of } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ExerciseService } from '../exercise.service';
import { Exercise, ExercisePage, ExerciseType } from '../exercise.models';

type FilterState = {
  query: string;
  muscle: string;
  exerciseType: ExerciseType | '';
  level: string;
};

@Component({
  selector: 'app-exercises-page',
  imports: [RouterLink, FormsModule],
  templateUrl: './exercises-page.html',
  styleUrl: './exercises-page.scss'
})
export class ExercisesPageComponent implements OnInit {
  private readonly exerciseService = inject(ExerciseService);
  private readonly search$ = new Subject<string>();

  protected readonly exercises = signal<Exercise[]>([]);
  protected readonly loading = signal(false);
  protected readonly loadingMore = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly nextCursor = signal<string | null>(null);
  protected readonly hasNext = signal(false);
  protected readonly searching = signal(false);
  protected readonly resultCount = signal<number | null>(null);

  protected readonly filters = signal<FilterState>({
    query: '',
    muscle: '',
    exerciseType: '',
    level: ''
  });

  protected readonly hasActiveFilters = computed(
    () => this.filters().muscle !== '' || this.filters().exerciseType !== '' || this.filters().level !== ''
  );

  protected readonly muscleGroups = [
    { label: 'Upper', muscles: ['Chest', 'Lats', 'Shoulders', 'Biceps', 'Triceps', 'Forearms', 'Middle Back', 'Traps'] },
    { label: 'Lower', muscles: ['Quadriceps', 'Hamstrings', 'Glutes', 'Calves', 'Abductors', 'Adductors'] },
    { label: 'Core', muscles: ['Abdominals', 'Lower Back'] }
  ];

  protected readonly showAdvancedMuscles = signal(false);

  protected readonly exerciseTypes: { value: ExerciseType; label: string }[] = [
    { value: 'STRENGTH', label: 'Strength' },
    { value: 'CARDIO', label: 'Cardio' },
    { value: 'STRETCHING', label: 'Stretching' },
    { value: 'PLYOMETRICS', label: 'Plyometrics' },
    { value: 'OTHER', label: 'Other' }
  ];

  protected readonly levels: { value: string; label: string }[] = [
    { value: 'Beginner', label: 'Beginner' },
    { value: 'Intermediate', label: 'Intermediate' },
    { value: 'Expert', label: 'Expert' }
  ];

  constructor() {
    this.search$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((query) => {
          const trimmed = query.trim();
          this.searching.set(false);
          this.loading.set(true);
          this.error.set(null);
          if (trimmed.length >= 2) {
            return this.exerciseService.search({ q: trimmed, limit: 25 });
          }
          return this.loadList();
        }),
        takeUntilDestroyed()
      )
      .subscribe({
        next: (page) => this.applyPage(page, false),
        error: () => {
          this.error.set('Failed to load exercises. Please try again.');
          this.loading.set(false);
          this.searching.set(false);
        }
      });
  }

  public ngOnInit(): void {
    this.fetchList(false);
  }

  protected onQueryChange(query: string): void {
    this.filters.update((f) => ({ ...f, query }));
    this.searching.set(query.trim().length >= 2);
    this.search$.next(query);
  }

  protected onMuscleFilter(value: string): void {
    this.filters.update((f) => ({ ...f, muscle: f.muscle === value ? '' : value }));
    this.fetchList(false);
  }

  protected onTypeFilter(value: ExerciseType | ''): void {
    this.filters.update((f) => ({ ...f, exerciseType: value }));
    this.fetchList(false);
  }

  protected onLevelFilter(value: string): void {
    this.filters.update((f) => ({ ...f, level: f.level === value ? '' : value }));
    this.fetchList(false);
  }

  protected loadMore(): void {
    if (!this.hasNext() || this.loadingMore()) return;
    this.fetchList(true);
  }

  protected clearFilters(): void {
    this.filters.set({ query: '', muscle: '', exerciseType: '', level: '' });
    this.fetchList(false);
  }

  protected retryLoad(): void {
    // Retry with current filters (don't clear them)
    this.fetchList(false);
  }

  protected toggleAdvancedMuscles(): void {
    this.showAdvancedMuscles.update(v => !v);
  }

  protected hasGroupSelected(groupMuscles: string[]): boolean {
    const selected = this.filters().muscle;
    return groupMuscles.includes(selected);
  }

  protected toggleMuscleGroup(groupMuscles: string[]): void {
    const selected = this.filters().muscle;
    if (groupMuscles.includes(selected)) {
      // Already have one from this group selected, clear it
      this.filters.update((f) => ({ ...f, muscle: '' }));
    } else {
      // Select first from group
      this.onMuscleFilter(groupMuscles[0]);
    }
  }

  protected primaryMuscleLabel(exercise: Exercise): string {
    return exercise.primaryMuscles[0] ?? '—';
  }

  private fetchList(append: boolean): void {
    if (!append) {
      this.loading.set(true);
      this.error.set(null);
    } else {
      this.loadingMore.set(true);
    }

    this.loadList(append ? (this.nextCursor() ?? undefined) : undefined).subscribe({
      next: (page) => this.applyPage(page, append),
      error: () => {
        this.error.set('Failed to load exercises. Please try again.');
        this.loading.set(false);
        this.loadingMore.set(false);
      }
    });
  }

  private loadList(cursor?: string) {
    const f = this.filters();
    return this.exerciseService.list({
      limit: 25,
      cursor,
      muscle: f.muscle || undefined,
      exerciseType: f.exerciseType || undefined,
      level: f.level || undefined
    });
  }

  private applyPage(page: ExercisePage, append: boolean): void {
    this.exercises.update((prev) => (append ? [...prev, ...page.items] : page.items));
    this.nextCursor.set(page.nextCursor);
    this.hasNext.set(page.hasNext);
    this.loading.set(false);
    this.loadingMore.set(false);
    this.searching.set(false);

    // Update result count (total items in current view)
    this.resultCount.set(append ? this.exercises().length : page.items.length);
  }
}
