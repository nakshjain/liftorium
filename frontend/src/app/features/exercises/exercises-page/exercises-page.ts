import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ExerciseService } from '../exercise.service';
import { Exercise, ExercisePage, ExerciseType } from '../exercise.models';
import { TrainingHubLinkComponent } from '../../../shared/ui/training-hub-link/training-hub-link';
import { ExerciseSearchInputComponent } from '../../../shared/ui/exercise-search-input/exercise-search-input';

// ─── Types ───────────────────────────────────────────────────────────────────

type FilterState = {
  query: string;
  muscle: string;
  exerciseType: ExerciseType | '';
  level: string;
  equipment: string;
  mechanic: string;
  force: string;
};

type ActiveChip = {
  key: keyof Omit<FilterState, 'query'>;
  label: string;
};

// ─── Component ───────────────────────────────────────────────────────────────

@Component({
  selector: 'app-exercises-page',
  imports: [RouterLink, FormsModule, TrainingHubLinkComponent, ExerciseSearchInputComponent],
  templateUrl: './exercises-page.html',
  styleUrl: './exercises-page.scss'
})
export class ExercisesPageComponent implements OnInit {
  private readonly exerciseService = inject(ExerciseService);
  private readonly search$ = new Subject<string>();

  // ── List state ─────────────────────────────────────────────────────────────
  protected readonly exercises = signal<Exercise[]>([]);
  protected readonly loading = signal(false);
  protected readonly loadingMore = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly nextCursor = signal<string | null>(null);
  protected readonly hasNext = signal(false);
  protected readonly searching = signal(false);
  protected readonly resultCount = signal<number | null>(null);

  // ── Applied filter state (drives API calls) ────────────────────────────────
  protected readonly filters = signal<FilterState>({
    query: '',
    muscle: '',
    exerciseType: '',
    level: '',
    equipment: '',
    mechanic: '',
    force: ''
  });

  // ── Draft state (lives inside the sheet; applied on "Apply Filters") ────────
  protected readonly draft = signal<FilterState>({
    query: '',
    muscle: '',
    exerciseType: '',
    level: '',
    equipment: '',
    mechanic: '',
    force: ''
  });

  // ── Sheet visibility ───────────────────────────────────────────────────────
  protected readonly sheetOpen = signal(false);

  // ── Expanded muscle category inside sheet ──────────────────────────────────
  protected readonly expandedMuscleCategory = signal<string | null>(null);

  // ── Computed helpers ───────────────────────────────────────────────────────
  protected readonly activeFilterCount = computed(() => {
    const f = this.filters();
    return [f.muscle, f.exerciseType, f.level, f.equipment, f.mechanic, f.force]
      .filter(Boolean).length;
  });

  protected readonly hasActiveFilters = computed(() => this.activeFilterCount() > 0);

  /** Chips rendered under the search bar — one per active filter (excluding query). */
  protected readonly activeChips = computed<ActiveChip[]>(() => {
    const f = this.filters();
    const chips: ActiveChip[] = [];
    if (f.muscle)       chips.push({ key: 'muscle',       label: f.muscle });
    if (f.equipment)    chips.push({ key: 'equipment',    label: f.equipment });
    if (f.exerciseType) chips.push({ key: 'exerciseType', label: this.typeLabel(f.exerciseType) });
    if (f.level)        chips.push({ key: 'level',        label: f.level });
    if (f.mechanic)     chips.push({ key: 'mechanic',     label: f.mechanic });
    if (f.force)        chips.push({ key: 'force',        label: f.force });
    return chips;
  });

  /** Count of active selections in the draft (used for sheet Apply button label). */
  protected readonly draftFilterCount = computed(() => {
    const d = this.draft();
    return [d.muscle, d.exerciseType, d.level, d.equipment, d.mechanic, d.force]
      .filter(Boolean).length;
  });

  // ── Static option data ─────────────────────────────────────────────────────

  /**
   * Muscle groups with full nested breakdown.
   * Each category has a label, an emoji anchor, and the individual muscles.
   */
  protected readonly muscleCategories = [
    {
      key: 'upper',
      label: 'Upper Body',
      muscles: [
        'Chest', 'Lats', 'Upper Back', 'Middle Back',
        'Shoulders', 'Triceps', 'Biceps', 'Forearms', 'Traps'
      ]
    },
    {
      key: 'lower',
      label: 'Lower Body',
      muscles: [
        'Quadriceps', 'Hamstrings', 'Glutes', 'Calves',
        'Adductors', 'Abductors'
      ]
    },
    {
      key: 'core',
      label: 'Core',
      muscles: ['Abdominals', 'Obliques', 'Lower Back']
    }
  ];

  protected readonly exerciseTypes: { value: ExerciseType; label: string }[] = [
    { value: 'STRENGTH',       label: 'Strength' },
    { value: 'CARDIO',         label: 'Cardio' },
    { value: 'STRETCHING',     label: 'Stretching' },
    { value: 'MOBILITY',       label: 'Mobility' },
    { value: 'BALANCE',        label: 'Balance' },
    { value: 'PLYOMETRICS',    label: 'Plyometrics' },
    { value: 'REHABILITATION', label: 'Rehab' }
  ];

  protected readonly levels: { value: string; label: string }[] = [
    { value: 'Beginner',     label: 'Beginner' },
    { value: 'Intermediate', label: 'Intermediate' },
    { value: 'Expert',       label: 'Expert' }
  ];

  protected readonly equipmentOptions: string[] = [
    'Barbell', 'Dumbbell', 'Kettlebell', 'Cable', 'Machine',
    'Bands', 'EZ Curl Bar', 'Trap Bar', 'Smith Machine',
    'Bodyweight', 'Bench', 'Pull-up Bar', 'Foam Roll', 'Medicine Ball'
  ];

  protected readonly mechanicOptions: string[] = [
    'Compound', 'Isolation'
  ];

  protected readonly forceOptions: string[] = [
    'Pull', 'Push', 'Static'
  ];

  // ── Lifecycle ──────────────────────────────────────────────────────────────

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
          this.error.set('Could not load exercises. Check your connection and try again.');
          this.loading.set(false);
          this.searching.set(false);
        }
      });
  }

  public ngOnInit(): void {
    this.fetchList(false);
  }

  // ── Sheet handlers ─────────────────────────────────────────────────────────

  protected openSheet(): void {
    // Seed draft from current applied filters
    this.draft.set({ ...this.filters() });
    this.expandedMuscleCategory.set(null);
    this.sheetOpen.set(true);
    document.body.style.overflow = 'hidden';
  }

  protected closeSheet(): void {
    this.sheetOpen.set(false);
    document.body.style.overflow = '';
  }

  protected applySheet(): void {
    // Promote draft → applied filters, then fetch
    this.filters.update((f) => ({ ...this.draft(), query: f.query }));
    this.closeSheet();
    this.fetchList(false);
  }

  protected clearSheet(): void {
    const clearedDraft: FilterState = {
      query: this.filters().query,
      muscle: '',
      exerciseType: '',
      level: '',
      equipment: '',
      mechanic: '',
      force: ''
    };
    this.draft.set(clearedDraft);
  }

  protected toggleMuscleCategory(key: string): void {
    this.expandedMuscleCategory.update((current) => (current === key ? null : key));
  }

  // ── Draft toggle helpers (used inside sheet) ────────────────────────────────

  protected draftToggleMuscle(muscle: string): void {
    this.draft.update((d) => ({ ...d, muscle: d.muscle === muscle ? '' : muscle }));
  }

  protected draftToggleType(value: ExerciseType): void {
    this.draft.update((d) => ({ ...d, exerciseType: d.exerciseType === value ? '' : value }));
  }

  protected draftToggleLevel(value: string): void {
    this.draft.update((d) => ({ ...d, level: d.level === value ? '' : value }));
  }

  protected draftToggleEquipment(value: string): void {
    this.draft.update((d) => ({ ...d, equipment: d.equipment === value ? '' : value }));
  }

  protected draftToggleMechanic(value: string): void {
    this.draft.update((d) => ({ ...d, mechanic: d.mechanic === value ? '' : value }));
  }

  protected draftToggleForce(value: string): void {
    this.draft.update((d) => ({ ...d, force: d.force === value ? '' : value }));
  }

  // ── Active chip removal (no sheet required) ────────────────────────────────

  protected removeChip(key: keyof Omit<FilterState, 'query'>): void {
    this.filters.update((f) => ({ ...f, [key]: '' }));
    this.fetchList(false);
  }

  // ── Search ─────────────────────────────────────────────────────────────────

  protected onQueryChange(query: string): void {
    this.filters.update((f) => ({ ...f, query }));
    this.searching.set(query.trim().length >= 2);
    this.search$.next(query);
  }

  // ── Pagination ─────────────────────────────────────────────────────────────

  protected loadMore(): void {
    if (!this.hasNext() || this.loadingMore()) return;
    this.fetchList(true);
  }

  // ── Clear all ─────────────────────────────────────────────────────────────

  protected clearFilters(): void {
    this.filters.set({
      query: '',
      muscle: '',
      exerciseType: '',
      level: '',
      equipment: '',
      mechanic: '',
      force: ''
    });
    this.fetchList(false);
  }

  protected retryLoad(): void {
    this.fetchList(false);
  }

  // ── Display helpers ────────────────────────────────────────────────────────

  protected primaryMuscleLabel(exercise: Exercise): string {
    return exercise.primaryMuscles[0] ?? '—';
  }

  protected typeLabel(value: ExerciseType | ''): string {
    return this.exerciseTypes.find((t) => t.value === value)?.label ?? value;
  }

  protected hasMuscleInCategory(categoryMuscles: string[]): boolean {
    return categoryMuscles.includes(this.draft().muscle);
  }

  // ── Private data helpers ───────────────────────────────────────────────────

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
        this.error.set('Could not load exercises. Check your connection and try again.');
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
      muscle:       f.muscle       || undefined,
      exerciseType: f.exerciseType || undefined,
      level:        f.level        || undefined,
      equipment:    f.equipment    || undefined,
      mechanic:     f.mechanic     || undefined,
      force:        f.force        || undefined
    });
  }

  private applyPage(page: ExercisePage, append: boolean): void {
    this.exercises.update((prev) => (append ? [...prev, ...page.items] : page.items));
    this.nextCursor.set(page.nextCursor);
    this.hasNext.set(page.hasNext);
    this.loading.set(false);
    this.loadingMore.set(false);
    this.searching.set(false);
    this.resultCount.set(append ? this.exercises().length : page.items.length);
  }
}
