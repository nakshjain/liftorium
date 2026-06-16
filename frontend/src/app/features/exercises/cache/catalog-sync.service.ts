import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { EMPTY, catchError, firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../../../core/api/api.config';
import { ApiSuccessResponse } from '../../../core/api/api-response';
import { Exercise, ExercisePage } from '../exercise.models';
import { ExerciseCacheService } from './exercise-cache.service';
import { CachedExercise, CatalogMetadata, CatalogVersionResponse } from './exercise-cache.models';
import { ExerciseStoreService } from './exercise-store.service';

@Injectable({ providedIn: 'root' })
export class CatalogSyncService {
  private readonly http = inject(HttpClient);
  private readonly cacheService = inject(ExerciseCacheService);
  private readonly storeService = inject(ExerciseStoreService);
  private readonly baseUrl = inject(API_BASE_URL);

  /**
   * Downloads the full exercise catalog via paginated requests, persists it to
   * IndexedDB, and hydrates the runtime store.
   *
   * Steps:
   *  1. Fetch catalog version from GET /api/v1/exercises/catalog-version
   *  2. Paginate through GET /api/v1/exercises?limit=500 following nextCursor
   *  3. Filter out inactive exercises
   *  4. Map Exercise → CachedExercise
   *  5. Persist via cacheService.replaceAll() (only after all pages succeed)
   *  6. Hydrate the store via storeService.hydrate()
   *
   * Any HTTP error is propagated — cacheService.replaceAll() is never called
   * on partial results.
   */
  async downloadAndPersistAll(): Promise<void> {
    // Step 1: fetch the current catalog version
    const versionRes = await firstValueFrom(
      this.http.get<ApiSuccessResponse<CatalogVersionResponse>>(
        `${this.baseUrl}/exercises/catalog-version`
      )
    );
    const remoteVersion = versionRes.data.version;

    // Step 2: paginated download — accumulate all exercises
    const allExercises: CachedExercise[] = [];
    let cursor: string | null = null;

    do {
      let params = new HttpParams().set('limit', 500);
      if (cursor) {
        params = params.set('cursor', cursor);
      }

      const page = await firstValueFrom(
        this.http.get<ApiSuccessResponse<ExercisePage>>(
          `${this.baseUrl}/exercises`,
          { params }
        )
      );

      // Step 3 & 4: filter inactive, map to CachedExercise
      const mapped = page.data.items
        .filter((e: Exercise) => e.active)
        .map((e: Exercise): CachedExercise => ({
          id: e.id,
          name: e.name,
          normalizedName: e.name.toLowerCase(),
          primaryMuscles: e.primaryMuscles,
          secondaryMuscles: e.secondaryMuscles,
          equipment: e.equipment,
          exerciseType: e.exerciseType,
          level: e.level,
          mechanic: e.mechanic,
          slug: e.slug,
          active: e.active,
          updatedAt: e.updatedAt,
        }));

      allExercises.push(...mapped);

      cursor = page.data.hasNext ? page.data.nextCursor : null;
    } while (cursor !== null);

    // Step 5: persist — only reached if all pages succeeded
    const metadata: CatalogMetadata = {
      key: 'catalog',
      catalogVersion: remoteVersion,
      exerciseCount: allExercises.length,
      lastSyncedAt: new Date().toISOString(),
    };

    await this.cacheService.replaceAll(allExercises, metadata);

    // Step 6: hydrate runtime store
    this.storeService.hydrate(allExercises);
  }

  /**
   * Fire-and-forget version check.
   *
   * Fetches the remote catalog version and compares it to the locally stored
   * version. If they differ (or no local metadata exists), triggers a full
   * re-download and sets syncStatus accordingly.
   *
   * Errors from the version endpoint are swallowed silently (catchError → EMPTY).
   * Errors from downloadAndPersistAll() are caught inside the subscriber to
   * avoid leaving the UI stuck in 'refreshing'.
   */
  checkVersionInBackground(): void {
    this.http
      .get<ApiSuccessResponse<CatalogVersionResponse>>(
        `${this.baseUrl}/exercises/catalog-version`
      )
      .pipe(catchError(() => EMPTY))
      .subscribe(async (res) => {
        try {
          const local = await this.cacheService.getMetadata();

          if (local === null || local.catalogVersion !== res.data.version) {
            this.storeService.setSyncStatus('refreshing');
            await this.downloadAndPersistAll();
            this.storeService.setSyncStatus('ready');
          }
          // versions match — no action needed
        } catch {
          // downloadAndPersistAll() failed mid-flight; reset to avoid stuck UI
          this.storeService.setSyncStatus('ready');
        }
      });
  }
}
