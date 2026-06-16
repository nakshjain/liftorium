import { Injectable, inject } from '@angular/core';
import { CatalogSyncService } from './catalog-sync.service';
import { ExerciseCacheService } from './exercise-cache.service';
import { ExerciseStoreService } from './exercise-store.service';

/**
 * Orchestrates the exercise catalog boot sequence as an Angular APP_INITIALIZER.
 *
 * Registered in app.config.ts via:
 *   provideAppInitializer(() => inject(ExerciseCacheInitializer).initialize())
 *
 * Boot paths:
 *
 * 1. Returning user (IDB populated):
 *    - Hydrate store from IDB immediately → app renders without network wait
 *    - Fire-and-forget background version check
 *
 * 2. First launch (IDB empty):
 *    - Await full catalog download + persist → app renders only after exercises ready
 *    - On download failure: set syncStatus to 'error', resolve so app still renders
 *
 * 3. IDB unavailable (Safari private, quota exceeded):
 *    - initialize() throws → fall through to downloadAndPersistAll() in-memory only
 *    - Store is fully functional; catalog is re-downloaded every session
 */
@Injectable({ providedIn: 'root' })
export class ExerciseCacheInitializer {
  private readonly cacheService = inject(ExerciseCacheService);
  private readonly storeService = inject(ExerciseStoreService);
  private readonly syncService = inject(CatalogSyncService);

  async initialize(): Promise<void> {
    // Step 1: Open (or upgrade) IndexedDB.
    // If IDB is unavailable the catch swallows the error and we fall through
    // to getAllExercises(), which returns [] from an uninitialised service.
    try {
      await this.cacheService.initialize();
    } catch {
      // IDB unavailable (e.g. Safari private browsing, storage quota exceeded).
      // Proceed in in-memory-only mode — download catalog without persisting.
      try {
        await this.syncService.downloadAndPersistAll();
      } catch {
        this.storeService.setSyncStatus('error');
      }
      return;
    }

    // Step 2: Load any exercises already persisted from a previous session.
    const cached = await this.cacheService.getAllExercises();

    if (cached.length > 0) {
      // Returning user path — hydrate store instantly from IDB, then check
      // for catalog updates in the background without blocking app render.
      this.storeService.hydrate(cached);
      this.syncService.checkVersionInBackground(); // fire-and-forget
    } else {
      // First launch path — download the full catalog before the app renders.
      // The store must be populated for the app to be usable.
      try {
        await this.syncService.downloadAndPersistAll();
      } catch {
        // Network failure — set error state but resolve so the app still renders.
        // ExercisePickerComponent will surface a retry affordance.
        this.storeService.setSyncStatus('error');
      }
    }
  }
}
