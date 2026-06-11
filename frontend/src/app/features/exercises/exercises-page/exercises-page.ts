import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject, switchMap, of } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ExerciseService } from '../exercise.service';
import { Exercise, ExercisePage, ExerciseType, MovementPattern } from '../exercise.models';

type FilterState = {
  query: string;
  bodyPart: string;
  exerciseType: ExerciseType | '';
  movementPattern: MovementPattern | '';
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

  protected readonly filters = signal<FilterState>({
    query: '',
    bodyPart: '',
    exerciseType: '',
    movementPattern: ''
  });

  protected readonly hasActiveFilters = computed(
    () => this.filters().bodyPart !== '' || this.filters().exerciseType !== '' || this.filters().movementPattern !== ''
  );

  protected readonly bodyParts: string[] = [
    'Back', 'Biceps', 'Chest', 'Core', 'Forearms', 'Legs', 'Shoulders', 'Triceps', 'Full Body'
  ];

  protected readonly exerciseTypes: { value: ExerciseType; label: string }[] = [
    { value: 'STRENGTH', label: 'Strength' },
    { value: 'CARDIO', label: 'Cardio' },
    { value: 'STRETCHING', label: 'Stretching' },
    { value: 'MOBILITY', label: 'Mobility' },
    { value: 'BALANCE', label: 'Balance' },
    { value: 'PLYOMETRICS', label: 'Plyometrics' },
    { value: 'REHABILITATION', label: 'Rehab' },
    { value: 'OTHER', label: 'Other' }
  ];

  protected readonly movementPatterns: { value: MovementPattern; label: string }[] = [
    { value: 'HORIZONTAL_PUSH', label: 'Horizontal Push' },
    { value: 'HORIZONTAL_PULL', label: 'Horizontal Pull' },
    { value: 'VERTICAL_PUSH', label: 'Vertical Push' },
    { value: 'VERTICAL_PULL', label: 'Vertical Pull' },
    { value: 'SQUAT', label: 'Squat' },
    { value: 'HIP_HINGE', label: 'Hip Hinge' },
    { value: 'LUNGE', label: 'Lunge' },
    { value: 'CARRY', label: 'Carry' },
    { value: 'ROTATION', label: 'Rotation' },
    { value: 'CORE', label: 'Core' },
    { value: 'ISOLATION', label: 'Isolation' },
    { value: 'CARDIO', label: 'Cardio' },
    { value: 'OTHER', label: 'Other' }
  ];

  constructor() {
    this.search$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((query) => {
          const trimmed = query.trim();
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
        }
      });
  }

  public ngOnInit(): void {
    this.fetchList(false);
  }

  protected onQueryChange(query: string): void {
    this.filters.update((f) => ({ ...f, query }));
    this.search$.next(query);
  }

  protected onBodyPartFilter(value: string): void {
    this.filters.update((f) => ({ ...f, bodyPart: f.bodyPart === value ? '' : value }));
    this.fetchList(false);
  }

  protected onTypeFilter(value: ExerciseType | ''): void {
    this.filters.update((f) => ({ ...f, exerciseType: value }));
    this.fetchList(false);
  }

  protected onPatternFilter(value: MovementPattern | ''): void {
    this.filters.update((f) => ({ ...f, movementPattern: value }));
    this.fetchList(false);
  }

  protected loadMore(): void {
    if (!this.hasNext() || this.loadingMore()) return;
    this.fetchList(true);
  }

  protected clearFilters(): void {
    this.filters.set({ query: '', bodyPart: '', exerciseType: '', movementPattern: '' });
    this.fetchList(false);
  }

  protected primaryMuscleLabel(exercise: Exercise): string {
    return exercise.primaryMuscles[0] ?? exercise.bodyParts[0] ?? '—';
  }

  protected equipmentLabel(exercise: Exercise): string {
    return exercise.equipment.length > 0 ? exercise.equipment.slice(0, 2).join(', ') : 'Bodyweight';
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
      bodyPart: f.bodyPart || undefined,
      exerciseType: f.exerciseType || undefined,
      movementPattern: f.movementPattern || undefined
    });
  }

  private applyPage(page: ExercisePage, append: boolean): void {
    this.exercises.update((prev) => (append ? [...prev, ...page.items] : page.items));
    this.nextCursor.set(page.nextCursor);
    this.hasNext.set(page.hasNext);
    this.loading.set(false);
    this.loadingMore.set(false);
  }
}
