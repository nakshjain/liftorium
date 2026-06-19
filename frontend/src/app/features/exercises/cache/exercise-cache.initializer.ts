import { Injectable, inject } from '@angular/core';
import { CatalogSyncService } from './catalog-sync.service';
import { ExerciseCacheService } from './exercise-cache.service';
import { ExerciseStoreService } from './exercise-store.service';

/**
 * Orchestrates the exercise catalog boot sequence as an Angular APP_INITIALIZER.
 *
 * Boot paths:
 *
 * 1. Returning user (IDB populated):
 *    - Hydrate store instantly from IDB → app renders with exercises ready
 *    - Fire-and-forget background version check
 *
 * 2. First launch (IDB empty):
 *    - App renders immediately with syncStatus = 'loading'
 *    - Catalog download starts in the background — non-blocking
 *    - Exercise picker shows a loading state until catalog is ready
 *
 * 3. IDB unavailable (Safari private, quota exceeded):
 *    - Download starts in background, in-memory only
 *
 * The app NEVER blocks rendering waiting for a network download.
 */
@Injectable({ providedIn: 'root' })
export class ExerciseCacheInitializer {
  private readonly cacheService = inject(ExerciseCacheService);
  private readonly storeService = inject(ExerciseStoreService);
  private readonly syncService = inject(CatalogSyncService);

  async initialize(): Promise<void> {
    // Step 1: Open IndexedDB — this is fast (local), worth awaiting
    try {
      await this.cacheService.initialize();
    } catch {
      // IDB unavailable — download in background, in-memory only, don't block
      this.downloadInBackground();
      return;
    }

    // Step 2: Load cached exercises — fast local read, worth awaiting
    const cached = await this.cacheService.getAllExercises();

    if (cached.length > 0) {
      // Returning user — hydrate instantly, check for updates in background
      this.storeService.hydrate(cached);
      this.syncService.checkVersionInBackground();
    } else {
      // First launch — don't block. App renders with syncStatus = 'loading'.
      // Exercise picker will show loading state until catalog arrives.
      this.downloadInBackground();
    }
    // Resolve immediately — app renders now
  }

  private downloadInBackground(): void {
    this.syncService.downloadAndPersistAll().catch(() => {
      this.storeService.setSyncStatus('error');
    });
  }
}
