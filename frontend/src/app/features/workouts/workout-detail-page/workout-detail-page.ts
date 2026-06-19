import { DecimalPipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { WorkoutService } from '../workout.service';
import { WorkoutDto } from '../workout-history.models';
import { UserSettingsStore } from '../../settings/settings.store';
import { formatWeight, toDisplayWeight } from '../../../shared/utils/weight.utils';

@Component({
  selector: 'app-workout-detail-page',
  imports: [RouterLink, DecimalPipe],
  templateUrl: './workout-detail-page.html',
})
export class WorkoutDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly workoutService = inject(WorkoutService);
  private readonly settingsStore = inject(UserSettingsStore);

  protected readonly weightUnit = this.settingsStore.weightUnit;

  protected readonly workout = signal<WorkoutDto | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  /** Total lifted volume for the workout. Computed once when the workout loads. */
  protected readonly totalVolume = computed(() => {
    const w = this.workout();
    if (!w) return 0;
    return w.exercises.reduce(
      (total, ex) => total + ex.sets.reduce((t, s) => t + s.reps * s.weight, 0),
      0,
    );
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('workoutId');
    if (!id) {
      this.error.set('Workout not found');
      this.loading.set(false);
      return;
    }

    this.workoutService.getById(id).subscribe({
      next: (workout) => {
        this.workout.set(workout);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load workout');
        this.loading.set(false);
      },
    });
  }

  protected formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  /** Returns a human-readable duration string, e.g. "1h 5m" or "45m". */
  protected formatDuration(seconds: number | null): string {
    if (!seconds) return '—';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  }

  protected formatWeight(kg: number): string {
    return formatWeight(kg, this.settingsStore.weightUnit());
  }

  /** Volume in display units (convert from kg). */
  protected displayVolume(kg: number): number {
    return toDisplayWeight(kg, this.settingsStore.weightUnit());
  }
}
