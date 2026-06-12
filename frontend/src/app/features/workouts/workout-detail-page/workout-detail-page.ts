import { DecimalPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { WorkoutService } from '../workout.service';
import { WorkoutDto } from '../workout-history.models';

@Component({
  selector: 'app-workout-detail-page',
  imports: [RouterLink, DecimalPipe],
  templateUrl: './workout-detail-page.html',
})
export class WorkoutDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly workoutService = inject(WorkoutService);

  protected readonly workout = signal<WorkoutDto | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

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
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
    });
  }

  protected formatDuration(seconds: number | null): string {
    if (!seconds) return '—';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m} min`;
  }

  protected totalVolume(): number {
    const w = this.workout();
    if (!w) return 0;
    return w.exercises.reduce(
      (total, ex) => total + ex.sets.reduce((t, s) => t + s.reps * s.weight, 0), 0
    );
  }

  protected formatWeight(weight: number): string {
    return weight % 1 === 0 ? weight.toString() : weight.toFixed(1);
  }
}
