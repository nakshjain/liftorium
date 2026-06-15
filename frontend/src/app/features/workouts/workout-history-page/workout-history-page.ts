import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { WorkoutService } from '../workout.service';
import { WorkoutDto, WorkoutStats } from '../workout-history.models';

/** One cell in the consistency heatmap. */
export type HeatmapDay = {
  date: Date;
  dayOfMonth: number;
  hasWorkout: boolean;
  isToday: boolean;
  isFuture: boolean;
  label: string;
};

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

  /** Controls whether the full PR list is expanded. */
  protected readonly showAllPrs = signal(false);

  // ── Month / navigation ─────────────────────────────────────────────────
  protected readonly monthLabel = computed(() => {
    const [year, month] = this.currentMonth().split('-').map(Number);
    return new Date(year, month - 1).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  });

  protected readonly isCurrentMonth = computed(
    () => this.currentMonth() >= this.getCurrentYearMonth(),
  );

  // ── Stats derivations ─────────────────────────────────────────────────
  protected readonly volumeChangePercent = computed(() => {
    const s = this.stats();
    if (!s || s.previousMonthVolume === 0) return null;
    return Math.round(
      ((s.totalVolume - s.previousMonthVolume) / s.previousMonthVolume) * 100,
    );
  });

  protected readonly prExerciseIds = computed(() => {
    const s = this.stats();
    if (!s) return new Set<string>();
    return new Set(s.personalRecords.map((pr) => pr.exerciseId));
  });

  /** Biggest PR by weight this month. */
  protected readonly biggestPr = computed(() => {
    const s = this.stats();
    if (!s || s.personalRecords.length === 0) return null;
    return s.personalRecords.reduce((best, pr) =>
      pr.weight > best.weight ? pr : best,
    );
  });

  /** PR list: collapsed = first 3, expanded = all. */
  protected readonly visiblePrs = computed(() => {
    const s = this.stats();
    if (!s) return [];
    return this.showAllPrs() ? s.personalRecords : s.personalRecords.slice(0, 3);
  });

  protected readonly hiddenPrCount = computed(() => {
    const s = this.stats();
    if (!s) return 0;
    return Math.max(0, s.personalRecords.length - 3);
  });

  // ── Completed workouts only (no active sessions in history) ───────────
  protected readonly completedWorkouts = computed(() =>
    this.workouts().filter((w) => w.status === 'completed' && w.exercises.length > 0),
  );

  // ── Best workout (highest volume) ─────────────────────────────────────
  protected readonly bestWorkout = computed((): WorkoutDto | null => {
    const ws = this.completedWorkouts();
    if (ws.length < 2) return null; // only meaningful with 2+ workouts
    return ws.reduce((best, w) =>
      this.workoutVolume(w) > this.workoutVolume(best) ? w : best,
    );
  });

  // ── Highest-volume exercise across all workouts this month ─────────────
  protected readonly topVolumeExercise = computed((): { name: string; volume: number } | null => {
    const volumes = new Map<string, number>();
    for (const w of this.completedWorkouts()) {
      for (const ex of w.exercises) {
        const vol = ex.sets.reduce((t, s) => t + s.reps * s.weight, 0);
        volumes.set(ex.exerciseName, (volumes.get(ex.exerciseName) ?? 0) + vol);
      }
    }
    if (volumes.size === 0) return null;
    let topName = '';
    let topVol = 0;
    for (const [name, vol] of volumes) {
      if (vol > topVol) { topVol = vol; topName = name; }
    }
    return { name: topName, volume: topVol };
  });

  // ── Heatmap ────────────────────────────────────────────────────────────
  protected readonly heatmapDays = computed((): HeatmapDay[] => {
    const [year, month] = this.currentMonth().split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const workedDays = new Set(
      this.workouts().map((w) => {
        const d = new Date(w.startedAt);
        return d.getFullYear() === year && d.getMonth() + 1 === month
          ? d.getDate()
          : -1;
      }),
    );

    const days: HeatmapDay[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month - 1, d);
      date.setHours(0, 0, 0, 0);
      days.push({
        date,
        dayOfMonth: d,
        hasWorkout: workedDays.has(d),
        isToday: date.getTime() === today.getTime(),
        isFuture: date > today,
        label: date.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        }),
      });
    }
    return days;
  });

  protected readonly heatmapWeeks = computed((): (HeatmapDay | null)[][] => {
    const days = this.heatmapDays();
    if (days.length === 0) return [];

    const firstDow = days[0].date.getDay();
    const weeks: (HeatmapDay | null)[][] = [];
    let week: (HeatmapDay | null)[] = Array(firstDow).fill(null);

    for (const day of days) {
      week.push(day);
      if (week.length === 7) {
        weeks.push(week);
        week = [];
      }
    }
    if (week.length > 0) {
      while (week.length < 7) week.push(null);
      weeks.push(week);
    }
    return weeks;
  });

  protected readonly workedDayCount = computed(
    () => this.heatmapDays().filter((d) => d.hasWorkout).length,
  );

  protected readonly weekCount = computed(() => this.heatmapWeeks().length);

  /** Days elapsed so far (or total days for past months). */
  protected readonly elapsedDays = computed(() => {
    const [year, month] = this.currentMonth().split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    if (!this.isCurrentMonth()) return daysInMonth;
    return new Date().getDate();
  });

  // ── Per-workout helpers ───────────────────────────────────────────────
  protected workoutHasPr(workout: WorkoutDto): boolean {
    const ids = this.prExerciseIds();
    return workout.exercises.some((ex) => ids.has(ex.exerciseId));
  }

  protected workoutPrCount(workout: WorkoutDto): number {
    const ids = this.prExerciseIds();
    return workout.exercises.filter((ex) => ids.has(ex.exerciseId)).length;
  }

  protected exercisePreview(workout: WorkoutDto): string {
    const names = workout.exercises.map((ex) => ex.exerciseName);
    if (names.length === 0) return 'No exercises';
    if (names.length <= 2) return names.join(', ');
    return `${names[0]}, ${names[1]}, +${names.length - 2}`;
  }

  protected workoutVolume(workout: WorkoutDto): number {
    return workout.exercises.reduce(
      (total, ex) =>
        total + ex.sets.reduce((t, s) => t + s.reps * s.weight, 0),
      0,
    );
  }

  protected workoutSetCount(workout: WorkoutDto): number {
    return workout.exercises.reduce((t, ex) => t + ex.sets.length, 0);
  }

  protected isBestWorkout(workout: WorkoutDto): boolean {
    const best = this.bestWorkout();
    return best !== null && best.id === workout.id;
  }

  /** Whether a load-more request is in flight. */
  protected readonly loadingMore = signal(false);

  // ── Skeleton ──────────────────────────────────────────────────────────
  protected readonly skeletonHeights = [88, 76, 88, 76, 68];

  // ── Lifecycle ─────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.loadData();
  }

  protected prevMonth(): void {
    this.currentMonth.set(this.offsetMonth(this.currentMonth(), -1));
    this.page.set(1);
    this.showAllPrs.set(false);
    this.loadData();
  }

  protected nextMonth(): void {
    const next = this.offsetMonth(this.currentMonth(), 1);
    if (next <= this.getCurrentYearMonth()) {
      this.currentMonth.set(next);
      this.page.set(1);
      this.showAllPrs.set(false);
      this.loadData();
    }
  }

  protected jumpToCurrentMonth(): void {
    if (this.isCurrentMonth()) return;
    this.currentMonth.set(this.getCurrentYearMonth());
    this.page.set(1);
    this.showAllPrs.set(false);
    this.loadData();
  }

  protected retry(): void {
    this.loadData();
  }

  protected loadMore(): void {
    if (this.page() >= this.totalPages() || this.loadingMore()) return;
    const nextPage = this.page() + 1;
    this.loadingMore.set(true);
    this.workoutService
      .getHistory({ page: nextPage, limit: 20, month: this.currentMonth() })
      .subscribe({
        next: (result) => {
          this.page.set(nextPage);
          this.workouts.update((prev) => [...prev, ...result.items]);
          this.totalPages.set(result.totalPages);
          this.loadingMore.set(false);
        },
        error: () => this.loadingMore.set(false),
      });
  }

  // ── Formatters ────────────────────────────────────────────────────────
  protected formatDuration(seconds: number | null): string {
    if (!seconds) return '—';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
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

  protected formatVolume(vol: number): string {
    if (vol >= 1000)
      return (vol / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    return Math.round(vol).toString();
  }

  // ── Private ───────────────────────────────────────────────────────────
  private loadData(): void {
    this.loading.set(true);
    this.listError.set(false);
    this.statsError.set(false);
    this.stats.set(null);
    const month = this.currentMonth();

    this.workoutService.getStats(month).subscribe({
      next: (stats) => this.stats.set(stats),
      error: () => this.statsError.set(true),
    });

    this.workoutService
      .getHistory({ page: 1, limit: 20, month })
      .subscribe({
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
