import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { WorkoutSyncService } from '../workout-sync.service';
import type { SyncPreview } from '../guest-workout.models';

@Component({
  selector: 'app-workout-sync-modal',
  imports: [],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm"></div>

      <!-- Modal card -->
      <div class="relative w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 p-8 shadow-2xl">

        <!-- PENDING state: sync prompt -->
        @if (workoutSyncService.syncState() === 'pending') {
          <!-- Cloud upload icon -->
          <div class="flex justify-center">
            <div class="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                class="h-8 w-8 text-teal-400"
                aria-hidden="true"
              >
                <path
                  fill-rule="evenodd"
                  d="M10.5 3.75a6 6 0 0 0-5.98 6.496A5.25 5.25 0 0 0 6.75 20.25H18a4.5 4.5 0 0 0 .916-8.91 6 6 0 0 0-8.416-7.59Zm1.846 3.498a.75.75 0 0 1 .308 1.025l-.75 1.3h1.346a.75.75 0 0 1 .648 1.125l-1.5 2.6a.75.75 0 1 1-1.296-.75l.75-1.3H10.5a.75.75 0 0 1-.648-1.125l1.5-2.6a.75.75 0 0 1 1.025-.275Z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
          </div>

          <h2 class="mt-5 text-center text-xl font-semibold text-zinc-50">
            Sync your workouts
          </h2>

          <p class="mt-2 text-center text-sm leading-relaxed text-zinc-400">
            You have
            <span class="font-semibold text-zinc-200">{{ preview.count }} {{ preview.count === 1 ? 'workout' : 'workouts' }}</span>
            saved locally
            @if (dateRange) {
              from <span class="font-semibold text-zinc-200">{{ dateRange }}</span>
            }.
            Sync them to your account now.
          </p>

          <div class="mt-8 flex flex-col gap-3">
            <button
              type="button"
              class="h-12 w-full rounded-xl bg-teal-400 px-4 text-sm font-bold text-zinc-950 transition hover:bg-teal-300 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              [disabled]="workoutSyncService.syncState() === 'syncing'"
              (click)="onSyncMyData()"
            >
              Sync My Data
            </button>

            <button
              type="button"
              class="h-12 w-full rounded-xl border border-zinc-700 px-4 text-sm font-semibold text-zinc-200 transition hover:bg-zinc-800 active:scale-[0.98]"
              (click)="onSkip()"
            >
              Skip
            </button>
          </div>
        }

        <!-- SYNCING state: progress indicator -->
        @if (workoutSyncService.syncState() === 'syncing') {
          <div class="flex flex-col items-center gap-4 py-4">
            <!-- Spinner -->
            <svg
              class="h-12 w-12 animate-spin text-teal-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z"
              ></path>
            </svg>
            <p class="text-sm font-medium text-zinc-300">Syncing...</p>
          </div>
        }

        <!-- DONE state: success message -->
        @if (workoutSyncService.syncState() === 'done') {
          <div class="flex justify-center">
            <div class="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                class="h-8 w-8 text-teal-400"
                aria-hidden="true"
              >
                <path
                  fill-rule="evenodd"
                  d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
          </div>

          <h2 class="mt-5 text-center text-xl font-semibold text-zinc-50">
            Sync complete!
          </h2>

          <p class="mt-2 text-center text-sm leading-relaxed text-zinc-400">
            <span class="font-semibold text-zinc-200">{{ workoutSyncService.syncResult()?.synced ?? 0 }} {{ (workoutSyncService.syncResult()?.synced ?? 0) === 1 ? 'workout' : 'workouts' }} synced</span>
            @if ((workoutSyncService.syncResult()?.skipped ?? 0) > 0) {
              ,
              <span class="text-zinc-500">{{ workoutSyncService.syncResult()?.skipped }} already existed</span>
            }
          </p>

          <div class="mt-8">
            <button
              type="button"
              class="h-12 w-full rounded-xl bg-teal-400 px-4 text-sm font-bold text-zinc-950 transition hover:bg-teal-300 active:scale-[0.98]"
              (click)="onDone()"
            >
              Done
            </button>
          </div>
        }

        <!-- ERROR state: error message -->
        @if (workoutSyncService.syncState() === 'error') {
          <div class="flex justify-center">
            <div class="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                class="h-8 w-8 text-red-400"
                aria-hidden="true"
              >
                <path
                  fill-rule="evenodd"
                  d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
          </div>

          <h2 class="mt-5 text-center text-xl font-semibold text-zinc-50">
            Sync failed
          </h2>

          <p class="mt-2 text-center text-sm leading-relaxed text-zinc-400">
            Sync failed. Your workouts are still saved locally. Try again later.
          </p>

          <div class="mt-8">
            <button
              type="button"
              class="h-12 w-full rounded-xl border border-zinc-700 px-4 text-sm font-semibold text-zinc-200 transition hover:bg-zinc-800 active:scale-[0.98]"
              (click)="onClose()"
            >
              Close
            </button>
          </div>
        }

      </div>
    </div>
  `,
})
export class WorkoutSyncModalComponent {
  @Input() preview!: SyncPreview;
  @Output() confirmed = new EventEmitter<void>();
  @Output() skipped = new EventEmitter<void>();

  protected readonly workoutSyncService = inject(WorkoutSyncService);

  /** Formatted date range string, or null if earliest === latest. */
  protected get dateRange(): string | null {
    const fmt = (iso: string) =>
      new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    const earliest = fmt(this.preview.earliestDate);
    const latest = fmt(this.preview.latestDate);

    return earliest === latest ? null : `${earliest} – ${latest}`;
  }

  protected onSyncMyData(): void {
    this.workoutSyncService.executeSync().subscribe();
  }

  protected onSkip(): void {
    this.workoutSyncService.dismissSync();
    this.skipped.emit();
  }

  protected onDone(): void {
    this.confirmed.emit();
  }

  protected onClose(): void {
    this.workoutSyncService.dismissSync();
    this.skipped.emit();
  }
}
