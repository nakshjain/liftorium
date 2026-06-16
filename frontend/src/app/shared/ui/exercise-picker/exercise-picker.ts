import { Component, EventEmitter, Input, OnInit, Output, inject, signal } from '@angular/core';
import { ExerciseSearchInputComponent } from '../exercise-search-input/exercise-search-input';
import { ExerciseService } from '../../../features/exercises/exercise.service';
import { Exercise } from '../../../features/exercises/exercise.models';

/**
 * Shared exercise picker used in Plan and Live Workout.
 *
 * - Loads all exercises once (paginated list), then filters client-side.
 * - Emits (exerciseSelected) when the user taps an exercise.
 * - Emits (cancelled) when the user taps Cancel (optional — callers that
 *   render this inline without a cancel affordance can ignore it).
 * - Accepts alreadyAddedIds to show a visual "added" state on already-added
 *   exercises (used in live workout).
 */
@Component({
  selector: 'app-exercise-picker',
  standalone: true,
  imports: [ExerciseSearchInputComponent],
  templateUrl: './exercise-picker.html',
})
export class ExercisePickerComponent implements OnInit {
  private readonly exerciseService = inject(ExerciseService);

  /** Set of exercise IDs already added — renders a teal "Added" badge. */
  @Input() alreadyAddedIds: Set<string> = new Set();

  /** Show a Cancel link below the list (default true). */
  @Input() showCancel = true;

  @Output() exerciseSelected = new EventEmitter<Exercise>();
  @Output() cancelled = new EventEmitter<void>();

  protected readonly searchQuery = signal('');
  protected readonly searchResults = signal<Exercise[]>([]);
  protected readonly loading = signal(true);
  protected readonly loadError = signal(false);

  private allExercises: Exercise[] = [];

  ngOnInit(): void {
    this.loadAll();
  }

  private loadAll(): void {
    this.loading.set(true);
    this.loadError.set(false);
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
          this.loading.set(false);
        }
      },
      error: () => {
        this.loading.set(false);
        this.loadError.set(true);
      },
    });
  }

  protected onQueryChange(query: string): void {
    this.searchQuery.set(query);
    if (query.length < 2) {
      this.searchResults.set([]);
      return;
    }
    const q = query.toLowerCase();
    this.searchResults.set(
      this.allExercises.filter((e) => e.name.toLowerCase().includes(q)).slice(0, 20)
    );
  }

  protected select(exercise: Exercise): void {
    this.exerciseSelected.emit(exercise);
    // Don't clear query — user may want to add multiple exercises in a row
  }

  protected retry(): void {
    this.loadAll();
  }

  protected cancel(): void {
    this.cancelled.emit();
  }

  protected isAdded(id: string): boolean {
    return this.alreadyAddedIds.has(id);
  }
}
