import { Component, EventEmitter, Input, Output, computed, inject, signal } from '@angular/core';
import { ExerciseSearchInputComponent } from '../exercise-search-input/exercise-search-input';
import { ExerciseStoreService } from '../../../features/exercises/cache/exercise-store.service';
import { CatalogSyncService } from '../../../features/exercises/cache/catalog-sync.service';
import { CachedExercise } from '../../../features/exercises/cache/exercise-cache.models';

/**
 * Shared exercise picker used in Plan and Live Workout.
 *
 * - Reads exercises from the runtime ExerciseStoreService (populated at boot by
 *   ExerciseCacheInitializer), then filters client-side on every query change.
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
export class ExercisePickerComponent {
  private readonly storeService = inject(ExerciseStoreService);
  private readonly catalogSyncService = inject(CatalogSyncService);

  /** Set of exercise IDs already added — renders a teal "Added" badge. */
  @Input() alreadyAddedIds: Set<string> = new Set();

  /** Show a Cancel link below the list (default true). */
  @Input() showCancel = true;

  @Output() exerciseSelected = new EventEmitter<CachedExercise>();
  @Output() cancelled = new EventEmitter<void>();

  protected readonly searchQuery = signal('');
  protected readonly searchResults = signal<CachedExercise[]>([]);

  protected readonly loading = computed(() => this.storeService.syncStatus() === 'loading');
  protected readonly loadError = computed(() => this.storeService.syncStatus() === 'error');

  protected onQueryChange(query: string): void {
    this.searchQuery.set(query);
    if (query.length < 2) {
      this.searchResults.set([]);
      return;
    }
    this.searchResults.set(this.storeService.search(query, {}, 20));
  }

  protected select(exercise: CachedExercise): void {
    this.exerciseSelected.emit(exercise);
    // Don't clear query — user may want to add multiple exercises in a row
  }

  protected retry(): void {
    this.catalogSyncService.downloadAndPersistAll();
  }

  protected cancel(): void {
    this.cancelled.emit();
  }

  protected isAdded(id: string): boolean {
    return this.alreadyAddedIds.has(id);
  }
}
