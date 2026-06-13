import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { WorkoutService } from '../workout.service';
import { WorkoutDto, WorkoutStats } from '../workout-history.models';

@Component({
  selector: 'app-workout-history-page',
  imports: [RouterLink],
  templateUrl: './workout-history-page.html',
})
export class WorkoutHistoryPageComponent implements OnInit {
  private readonly workoutService = inject(WorkoutService);

  protected readonly workouts = signal<WorkoutDto[]>([]);
  protected readonly stats = signal<WorkoutStats | null>(null);
  protected readonly loading = signal(false);
  protected readonly currentMonth = signal(this.getCurrentYearMonth());
  protected readonly page = signal(1);
  protected readonly totalPages = signal(1);

  protected readonly monthLabel = computed(() => {
    const [year, month] = this.currentMonth().split('-').map(Number);
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  });

  protected readonly volumeChangePercent = computed(() => {
    const s = this.stats();
    if (!s || s.previousMonthVolume === 0) return null;
    return Math.round(((s.totalVolume - s.previousMonthVolume) / s.previousMonthVolume) * 100);
  });

  protected readonly volumeBarWidth = computed(() => {
    const pct = this.volumeChangePercent();
    if (pct === null) return 0;
    return Math.min(100, Math.abs(pct) + 50);
  });

  protected readonly isCurrentMonth = computed(() =>
    this.currentMonth() >= this.getCurrentYearMonth()
  );

  ngOnInit(): void {
    this.loadData();
  }

  protected prevMonth(): void {
    this.currentMonth.set(this.offsetMonth(this.currentMonth(), -1));
    this.page.set(1);
    this.loadData();
  }

  protected nextMonth(): void {
    const next = this.offsetMonth(this.currentMonth(), 1);
    if (next <= this.getCurrentYearMonth()) {
      this.currentMonth.set(next);
      this.page.set(1);
      this.loadData();
    }
  }

  protected loadMore(): void {
    if (this.page() >= this.totalPages()) return;
    this.page.update((p) => p + 1);
    this.workoutService.getHistory({ page: this.page(), limit: 20, month: this.currentMonth() }).subscribe({
      next: (result) => {
        this.workouts.update((prev) => [...prev, ...result.items]);
        this.totalPages.set(result.totalPages);
      },
    });
  }

  protected formatDuration(seconds: number | null): string {
    if (!seconds) return '—';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}min`;
  }

  protected formatDate(iso: string): string {
    const date = new Date(iso);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' });
  }

  protected workoutVolume(workout: WorkoutDto): number {
    return workout.exercises.reduce(
      (total, ex) => total + ex.sets.reduce((t, s) => t + s.reps * s.weight, 0), 0
    );
  }

  protected exerciseNames(workout: WorkoutDto): string {
    return workout.exercises.length + ' exercise' + (workout.exercises.length !== 1 ? 's' : '');
  }

  protected formatVolume(vol: number): string {
    if (vol >= 1000) return (vol / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    return Math.round(vol).toString();
  }

  private loadData(): void {
    this.loading.set(true);
    const month = this.currentMonth();

    this.workoutService.getStats(month).subscribe({
      next: (stats) => this.stats.set(stats),
    });

    this.workoutService.getHistory({ page: 1, limit: 20, month }).subscribe({
      next: (result) => {
        this.workouts.set(result.items);
        this.totalPages.set(result.totalPages);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private getCurrentYearMonth(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  private offsetMonth(ym: string, offset: number): string {
    const [year, month] = ym.split('-').map(Number);
    const date = new Date(year, month - 1 + offset);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }
}
