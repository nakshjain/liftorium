import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, from, map, switchMap, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL } from '../../core/api/api.config';
import type { GuestWorkoutPayload, SyncBulkRequest, SyncPreview, SyncResult, SyncState } from './guest-workout.models';
import { GuestWorkoutStorageService } from './guest-workout-storage.service';

@Injectable({
  providedIn: 'root'
})
export class WorkoutSyncService {
  private readonly guestStorage = inject(GuestWorkoutStorageService);
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  private readonly _syncState = signal<SyncState>('idle');
  private readonly _pendingCount = signal<number>(0);

  readonly syncState = this._syncState.asReadonly();
  readonly pendingCount = this._pendingCount.asReadonly();
  readonly syncResult = signal<SyncResult | null>(null);
  readonly preview = signal<SyncPreview | null>(null);

  /**
   * Resets the sync state to 'idle' without modifying any local records.
   * Called when the user dismisses the WorkoutSyncModal.
   */
  dismissSync(): void {
    this._syncState.set('idle');
    this.preview.set(null);
  }

  /**
   * Checks for pending guest workouts awaiting sync.
   * Sets syncState to 'checking', then to 'pending' if records are found, or back to 'idle' if none.
   * Requirements: 13.1, 13.2, 13.6
   */
  async checkForPendingWorkouts(): Promise<SyncPreview | null> {
    this._syncState.set('checking');

    const workouts = await this.guestStorage.getPendingWorkouts();

    if (workouts.length > 0) {
      this._pendingCount.set(workouts.length);
      this._syncState.set('pending');

      const count = workouts.length;
      const sortedDates = workouts.map(w => w.startedAt).sort((a, b) => a - b);
      const earliestDate = new Date(sortedDates[0]).toISOString();
      const latestDate = new Date(sortedDates[sortedDates.length - 1]).toISOString();

      const syncPreview: SyncPreview = { count, earliestDate, latestDate };
      this.preview.set(syncPreview);
      return syncPreview;
    }

    this._syncState.set('idle');
    return null;
  }

  /**
   * Executes the bulk sync of pending guest workouts to the backend.
   * Maps pending workouts to a SyncBulkRequest, POSTs to /api/v1/workouts/sync,
   * and marks records as synced on success.
   * Requirements: 14.1–14.7, 15.1–15.3, 18.1–18.3
   */
  executeSync(): Observable<SyncResult> {
    this._syncState.set('syncing');

    return from(this.guestStorage.getPendingWorkouts()).pipe(
      switchMap(workouts => {
        const ids = workouts.map(w => w.id);
        const payload: SyncBulkRequest = {
          workouts: workouts.map(w => ({
            clientId: w.id,
            name: w.name,
            startedAt: new Date(w.startedAt).toISOString(),
            finishedAt: new Date(w.finishedAt).toISOString(),
            durationSeconds: Math.max(0, Math.floor(w.accumulatedMs / 1000)),
            exercises: w.exercises.map(ex => ({
              exerciseId: ex.exerciseId,
              sets: ex.sets.filter(s => s.completed).map(s => ({
                reps: s.reps,
                weight: s.weight,
                durationSeconds: s.durationSeconds,
                distanceKm: s.distanceKm,
                speed: s.speed,
                incline: s.incline,
                completedAt: s.completedAt ?? null,
              })),
            })),
          } satisfies GuestWorkoutPayload)),
        };

        return this.http.post<{ data: SyncResult }>(
          `${this.apiBaseUrl}/workouts/sync`,
          payload
        ).pipe(
          tap(async response => {
            this._syncState.set('done');
            this.syncResult.set(response.data);
            await this.guestStorage.markWorkoutsSynced(ids);
            this._pendingCount.set(0);
          }),
          map(response => response.data),
          catchError(err => {
            this._syncState.set('error');
            throw err;
          })
        );
      })
    );
  }
}
