import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { WorkoutService } from '../workout.service';
import { HistoryInsights, WorkoutDto, WorkoutStats } from '../workout-history.models';
import { TrainingHubLinkComponent } from '../../../shared/ui/training-hub-link/training-hub-link';

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
  imports: [RouterLink, FormsModule, TrainingHubLinkComponent],
  templateUrl: './workout-history-page.html',
})
export class WorkoutHistoryPageComponent implements OnInit, OnDestroy {
  private readonly workoutService = inject(WorkoutService);

  /** Cancels in-flight history/stats requests when the month changes or the component destroys. */
  private readonly cancelLoad$ = new Subject<void>();
  private readonly destroy$ = new Subject<void>();

  protected readonly workouts = signal<WorkoutDto[]>([]);
  protected readonly stats = signal<WorkoutStats | null>(null);
  protected readonly insights = signal<HistoryInsights | null>(null);
  protected readonly insightsLoading = signal(true);
  protected readonly loading = signal(false);
  protected readonly listError = signal(false);
  protected readonly statsError = signal(false);
  protected readonly insightsError = signal(false);
  protected readonly currentMonth = signal(this.getCurrentYearMonth());
  protected readonly page = signal(1);
  protected readonly totalPages = signal(1);
  protected readonly loadingMore = signal(false);

  /** Live search query — filtered client-side, no API call. */
  protected readonly searchQuery = signal('');

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

  // ── Completed workouts only (no active sessions in history) ───────────
  protected readonly completedWorkouts = computed(() =>
    this.workouts().filter((w) => w.status === 'completed' && w.exercises.length > 0),
  );

  /** Workout list filtered by searchQuery. */
  protected readonly filteredWorkouts = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    if (!q) return this.completedWorkouts();
    return this.completedWorkouts().filter(
      (w) =>
        w.name.toLowerCase().includes(q) ||
        w.exercises.some((ex) => ex.exerciseName.toLowerCase().includes(q)),
    );
  });

  /**
   * Pre-computed volume per workout id.
   * Prevents O(n²) re-computation: isBestWorkout() and the template both need
   * volumes, so we compute them once per completedWorkouts() change.
   */
  protected readonly volumeByWorkoutId = computed((): Map<string, number> => {
    const map = new Map<string, number>();
    for (const w of this.completedWorkouts()) {
      map.set(
        w.id,
        w.exercises.reduce(
          (total, ex) => total + ex.sets.reduce((t, s) => t + s.reps * s.weight, 0),
          0,
        ),
      );
    }
    return map;
  });

  /** Best workout of the month by total volume. Only crowned when ≥2 sessions exist. */
  protected readonly bestWorkout = computed((): WorkoutDto | null => {
    const ws = this.completedWorkouts();
    if (ws.length < 2) return null;
    const volumes = this.volumeByWorkoutId();
    return ws.reduce((best, w) =>
      (volumes.get(w.id) ?? 0) > (volumes.get(best.id) ?? 0) ? w : best,
    );
  });

  // ── Heatmap ────────────────────────────────────────────────────────────
  protected readonly heatmapDays = computed((): HeatmapDay[] => {
    const [year, month] = this.currentMonth().split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Filter to this month before building the Set so off-month workouts
    // (which previously returned -1) cannot appear as false positives.
    const workedDays = new Set(
      this.workouts()
        .filter((w) => {
          const d = new Date(w.startedAt);
          return d.getFullYear() === year && d.getMonth() + 1 === month;
        })
        .map((w) => new Date(w.startedAt).getDate()),
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

  /** Days elapsed so far (or total days for past months). Always ≥ 1 to avoid division by zero. */
  protected readonly elapsedDays = computed(() => {
    const [year, month] = this.currentMonth().split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    if (!this.isCurrentMonth()) return daysInMonth;
    return Math.max(new Date().getDate(), 1);
  });

  /** Consistency percentage, safe against division by zero. */
  protected readonly consistencyPercent = computed(() =>
    Math.round((this.workedDayCount() / this.elapsedDays()) * 100),
  );

  // ── Skeleton ──────────────────────────────────────────────────────────
  /**
   * Alternating tall/short heights mirror typical workout card sizes
   * so the shimmer placeholder feels proportional to real content.
   */
  protected readonly skeletonHeights = [88, 76, 88, 76, 68];

  // ── Lifecycle ─────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.loadData();
    // Insights are all-time — loaded once on init, not on every month change.
    this.loadInsights();
  }

  ngOnDestroy(): void {
    this.cancelLoad$.next();
    this.cancelLoad$.complete();
    this.destroy$.next();
    this.destroy$.complete();
  }

  protected prevMonth(): void {
    this.currentMonth.set(this.offsetMonth(this.currentMonth(), -1));
    this.page.set(1);
    this.searchQuery.set('');
    this.loadData();
  }

  protected nextMonth(): void {
    const next = this.offsetMonth(this.currentMonth(), 1);
    if (next <= this.getCurrentYearMonth()) {
      this.currentMonth.set(next);
      this.page.set(1);
      this.searchQuery.set('');
      this.loadData();
    }
  }

  protected jumpToCurrentMonth(): void {
    if (this.isCurrentMonth()) return;
    this.currentMonth.set(this.getCurrentYearMonth());
    this.page.set(1);
    this.searchQuery.set('');
    this.loadData();
  }

  protected retry(): void {
    this.loadData();
  }

  protected loadMore(): void {
    // Guard: don't append while initial load is in flight, or past last page.
    if (this.loading() || this.page() >= this.totalPages() || this.loadingMore()) return;
    const nextPage = this.page() + 1;
    this.loadingMore.set(true);
    this.workoutService
      .getHistory({ page: nextPage, limit: 20, month: this.currentMonth() })
      .pipe(takeUntil(this.destroy$))
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

  // ── Per-workout helpers ───────────────────────────────────────────────
  protected exercisePreview(workout: WorkoutDto): string {
    const names = workout.exercises.map((ex) => ex.exerciseName);
    if (names.length === 0) return 'No exercises';
    if (names.length <= 2) return names.join(', ');
    return `${names[0]}, ${names[1]}, +${names.length - 2}`;
  }

  /** Volume lookup via pre-computed map — O(1) per call. */
  protected workoutVolume(workout: WorkoutDto): number {
    return this.volumeByWorkoutId().get(workout.id) ?? 0;
  }

  protected workoutSetCount(workout: WorkoutDto): number {
    return workout.exercises.reduce((t, ex) => t + ex.sets.length, 0);
  }

  protected isBestWorkout(workout: WorkoutDto): boolean {
    const best = this.bestWorkout();
    return best !== null && best.id === workout.id;
  }

  // ── Formatters ────────────────────────────────────────────────────────
  /** Returns a human-readable duration string, e.g. "1h 5m" or "45m". */
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
    if (vol >= 1000) return (vol / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    return Math.round(vol).toString();
  }

  // ── Private ───────────────────────────────────────────────────────────
  private loadData(): void {
    // Cancel any previous in-flight requests for this slot before starting new ones.
    this.cancelLoad$.next();

    this.loading.set(true);
    this.listError.set(false);
    this.statsError.set(false);
    this.stats.set(null);
    const month = this.currentMonth();

    this.workoutService
      .getStats(month)
      .pipe(takeUntil(this.cancelLoad$))
      .subscribe({
        next: (stats) => this.stats.set(stats),
        error: () => this.statsError.set(true),
      });

    this.workoutService
      .getHistory({ page: 1, limit: 20, month })
      .pipe(takeUntil(this.cancelLoad$))
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

  private loadInsights(): void {
    this.insightsError.set(false);
    this.insightsLoading.set(true);
    this.workoutService
      .getInsights()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.insights.set(data);
          this.insightsLoading.set(false);
        },
        error: () => {
          this.insightsError.set(true);
          this.insightsLoading.set(false);
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
