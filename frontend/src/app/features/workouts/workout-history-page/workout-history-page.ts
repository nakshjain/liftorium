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
  protected readonly listError = signal(false);
  protected readonly statsError = signal(false);
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

  protected readonly isCurrentMonth = computed(() =>
    this.currentMonth() >= this.getCurrentYearMonth()
  );

  /** Varied skeleton heights to mimic the shape of real workout rows. */
  protected readonly skeletonHeights = [72, 64, 72, 64, 56];

  /** Set of exerciseIds that earned a PR this month — used to badge workout rows. */
  protected readonly prExerciseIds = computed(() => {
    const s = this.stats();
    if (!s) return new Set<string>();
    return new Set(s.personalRecords.map((pr) => pr.exerciseId));
  });

  /** Whether a workout contains at least one exercise that earned a PR this month. */
  protected workoutHasPr(workout: WorkoutDto): boolean {
    const ids = this.prExerciseIds();
    return workout.exercises.some((ex) => ids.has(ex.exerciseId));
  }

  /** "Squat, Bench Press, +3" instead of "5 exercises". */
  protected exercisePreview(workout: WorkoutDto): string {
    const names = workout.exercises.map((ex) => ex.exerciseName);
    if (names.length === 0) return 'No exercises';
    if (names.length <= 2) return names.join(', ');
    return `${names[0]}, ${names[1]}, +${names.length - 2}`;
  }

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

  protected jumpToCurrentMonth(): void {
    if (this.isCurrentMonth()) return;
    this.currentMonth.set(this.getCurrentYearMonth());
    this.page.set(1);
    this.loadData();
  }

  protected retryList(): void {
    this.loadData();
  }

  protected loadMore(): void {
    if (this.page() >= this.totalPages()) return;
    this.page.update((p) => p + 1);
    this.workoutService
      .getHistory({ page: this.page(), limit: 20, month: this.currentMonth() })
      .subscribe({
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
    const now = new Date();
    const showYear = date.getFullYear() !== now.getFullYear();
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      weekday: 'short',
      ...(showYear ? { year: 'numeric' } : {}),
    });
  }

  protected workoutVolume(workout: WorkoutDto): number {
    return workout.exercises.reduce(
      (total, ex) => total + ex.sets.reduce((t, s) => t + s.reps * s.weight, 0),
      0,
    );
  }

  protected formatVolume(vol: number): string {
    if (vol >= 1000) return (vol / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    return Math.round(vol).toString();
  }

  private loadData(): void {
    this.loading.set(true);
    this.listError.set(false);
    this.statsError.set(false);
    // Clear stale data immediately so the previous month's stats don't
    // sit visible while the new month's request is in flight.
    this.stats.set(null);
    const month = this.currentMonth();

    this.workoutService.getStats(month).subscribe({
      next: (stats) => this.stats.set(stats),
      error: () => this.statsError.set(true),
    });

    this.workoutService.getHistory({ page: 1, limit: 20, month }).subscribe({
      next: (result) => {
        this.workouts.set(result.items);
        this.totalPages.set(result.totalPages);
        this.loading.set(false);
      },
      error: () => {
        this.listError.set(true);
        this.loading.set(false);
      },
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
