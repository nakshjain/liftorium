import { Injectable, signal } from '@angular/core';
import type { CachedExercise, ExerciseFilters, SyncStatus } from './exercise-cache.models';

/**
 * Runtime in-memory store for the exercise catalog.
 *
 * Owns three Angular Signals:
 *  - `exerciseList` — flat array of all cached exercises
 *  - `exerciseMap`  — O(1) lookup map keyed by exercise id
 *  - `syncStatus`   — lifecycle state of the catalog
 *
 * All exercise-consuming components depend solely on this service.
 * Never reads from IndexedDB or makes network requests.
 */
@Injectable({ providedIn: 'root' })
export class ExerciseStoreService {
  // ── Private writeable signals ──────────────────────────────────────────────

  private readonly _exerciseList = signal<CachedExercise[]>([]);
  private readonly _exerciseMap = signal<ReadonlyMap<string, CachedExercise>>(new Map());
  private readonly _syncStatus = signal<SyncStatus>('loading');

  // ── Public readonly signals ────────────────────────────────────────────────

  /** Full flat list — used for browsing and client-side search/filter. */
  readonly exerciseList = this._exerciseList.asReadonly();

  /** Fast O(1) map — used for workout history, analytics, session reconstruction. */
  readonly exerciseMap = this._exerciseMap.asReadonly();

  /** Current lifecycle state: 'loading' → 'ready' → 'refreshing' → 'ready' | 'error' */
  readonly syncStatus = this._syncStatus.asReadonly();

  // ── Mutation methods ───────────────────────────────────────────────────────

  /**
   * Populates both signals from an array.
   * Called by ExerciseCacheInitializer (from IDB) and CatalogSyncService (after download).
   * Sets syncStatus to 'ready'.
   */
  hydrate(exercises: CachedExercise[]): void {
    this._exerciseList.set(exercises);
    this._exerciseMap.set(new Map(exercises.map(e => [e.id, e])));
    this._syncStatus.set('ready');
  }

  /**
   * Directly sets the sync status.
   * Used by CatalogSyncService ('refreshing') and ExerciseCacheInitializer ('error').
   */
  setSyncStatus(status: SyncStatus): void {
    this._syncStatus.set(status);
  }

  // ── Query methods ──────────────────────────────────────────────────────────

  /**
   * Looks up a single exercise by id.
   * Returns undefined if the id is not present (e.g. store not yet hydrated).
   */
  getById(id: string): CachedExercise | undefined {
    return this._exerciseMap().get(id);
  }

  /**
   * In-memory search across exerciseList.
   *
   * - Normalises the query with `.toLowerCase().trim()`
   * - Skips name filtering for queries shorter than 2 characters (shows all)
   * - Applies all present filters (muscle, equipment, exerciseType, level)
   * - Returns at most `maxResults` results (default 50)
   *
   * Never touches IndexedDB or the network.
   */
  search(query: string, filters: ExerciseFilters = {}, maxResults = 50): CachedExercise[] {
    const normalizedQuery = query.toLowerCase().trim();
    const list = this._exerciseList();

    return list
      .filter(exercise => this.matchesQuery(exercise, normalizedQuery))
      .filter(exercise => this.matchesFilters(exercise, filters))
      .slice(0, maxResults);
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private matchesQuery(exercise: CachedExercise, query: string): boolean {
    if (query.length < 2) return true; // empty/short query = show all
    return exercise.normalizedName.includes(query);
  }

  private matchesFilters(exercise: CachedExercise, filters: ExerciseFilters): boolean {
    if (
      filters.muscle &&
      !exercise.primaryMuscles.includes(filters.muscle) &&
      !exercise.secondaryMuscles.includes(filters.muscle)
    ) {
      return false;
    }
    if (filters.equipment && !exercise.equipment.includes(filters.equipment)) {
      return false;
    }
    if (filters.exerciseType && exercise.exerciseType !== filters.exerciseType) {
      return false;
    }
    if (filters.level && exercise.level !== filters.level) {
      return false;
    }
    return true;
  }
}
