import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Subject, finalize, takeUntil } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { AuthGateService } from '../../../core/auth/auth-gate.service';
import { LiveWorkoutStore } from '../../workouts/live-workout.store';
import { WorkoutService } from '../../workouts/workout.service';
import { WorkoutStats } from '../../workouts/workout-history.models';
import { PlanService } from '../../plan/plan.service';
import { WorkoutPlan } from '../../plan/plan.models';
import { ProgressService } from '../../progress/progress.service';
import { ProgressOverview } from '../../progress/progress.models';

@Component({
  selector: 'app-dashboard-page',
  imports: [RouterLink],
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.scss',
})
export class DashboardPageComponent implements OnInit, OnDestroy {
  protected readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly liveStore = inject(LiveWorkoutStore);
  private readonly workoutService = inject(WorkoutService);
  private readonly planService = inject(PlanService);
  private readonly progressService = inject(ProgressService);

  private readonly destroy$ = new Subject<void>();

  protected readonly authStatus = this.authService.status;
  protected readonly authGateService = inject(AuthGateService);

  /** Opens the auth gate modal for a named feature. */
  protected openAuthGate(feature: string): void {
    this.authGateService.pendingFeature.set(feature);
  }

  protected readonly loggingOut = signal(false);
  protected readonly logoutButtonLabel = computed(() =>
    this.loggingOut() ? 'Signing out…' : 'Sign out',
  );

  // ── Live workout ───────────────────────────────────────────────────────
  /** Exposed from the global store — no extra fetch needed. */
  protected readonly activeWorkout = this.liveStore.activeWorkout;
  protected readonly elapsedSeconds = this.liveStore.elapsedSeconds;
  protected readonly completedSetCount = this.liveStore.completedSetCount;

  protected readonly elapsedLabel = computed(() => {
    const s = this.elapsedSeconds();
    if (s === 0) return null;
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  });

  /** Time-of-day prefix for the anonymous greeting ("Good morning", etc.). */
  protected readonly timeOfDay = computed(() => {
    const hour = new Date().getHours();
    return hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
  });

  /** Time-of-day greeting personalised with the user's first name. */
  protected readonly greetingLine = computed(() => {
    const hour = new Date().getHours();
    const prefix = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    const name = this.authService.user()?.displayName?.split(' ')[0] ?? '';
    return name ? `${prefix}, ${name}` : prefix;
  });

  // ── History stats ──────────────────────────────────────────────────────
  protected readonly stats = signal<WorkoutStats | null>(null);

  // ── Plan ───────────────────────────────────────────────────────────────
  protected readonly plan = signal<WorkoutPlan | null>(null);

  /**
   * Today's plan day (0 = Mon … 6 = Sun, matching plan.models.ts).
   * JS getDay() returns 0 = Sun, so we remap: Sun → 6, Mon → 0.
   */
  protected readonly todayPlanDay = computed(() => {
    const p = this.plan();
    if (!p) return null;
    const jsDay = new Date().getDay(); // 0 = Sun
    const planDay = jsDay === 0 ? 6 : jsDay - 1; // 0 = Mon
    return p.days.find((d) => d.dayOfWeek === planDay) ?? null;
  });

  protected readonly todayPlanLabel = computed(() => {
    const day = this.todayPlanDay();
    if (!day) return null;
    if (day.rest) return 'Rest day today';
    const groups = day.muscleGroups.slice(0, 2).join(' · ');
    return day.label ? `${day.label}${groups ? ' · ' + groups : ''}` : groups || null;
  });

  /**
   * Next upcoming active training day after today.
   * Used by the Plan card to show "what's coming" not "what's today".
   */
  protected readonly nextTrainingDay = computed(() => {
    const p = this.plan();
    if (!p) return null;
    const jsDay = new Date().getDay();
    const todayIndex = jsDay === 0 ? 6 : jsDay - 1; // 0 = Mon
    // Search the next 7 days (excluding today)
    for (let i = 1; i <= 7; i++) {
      const idx = (todayIndex + i) % 7;
      const day = p.days.find((d) => d.dayOfWeek === idx);
      if (day && !day.rest) return day;
    }
    return null;
  });

  /** Count of active (non-rest) days in the week plan. */
  protected readonly weekTrainingDayCount = computed(() => {
    const p = this.plan();
    if (!p) return 0;
    return p.days.filter((d) => !d.rest).length;
  });

  // ── Progress ───────────────────────────────────────────────────────────
  protected readonly progressOverview = signal<ProgressOverview | null>(null);

  /**
   * SVG stroke-dasharray for the week activity ring.
   * Circle radius = 19, circumference = 2π×19 ≈ 119.4.
   * Maps sessions this month to a max of 4 visible sessions per week (target).
   * Capped at full circumference so it never overflows.
   */
  protected readonly weekRingDasharray = computed(() => {
    const CIRCUMFERENCE = 2 * Math.PI * 19; // ≈ 119.38
    const sessions = this.stats()?.sessions ?? 0;
    // Show progress as sessions toward a weekly target of 4
    const target = 4;
    const ratio = Math.min(sessions / target, 1);
    const filled = ratio * CIRCUMFERENCE;
    return `${filled} ${CIRCUMFERENCE}`;
  });

  // ── Lifecycle ─────────────────────────────────────────────────────────
  ngOnInit(): void {
    const currentMonth = this.getCurrentYearMonth();

    this.workoutService
      .getStats(currentMonth)
      .pipe(takeUntil(this.destroy$))
      .subscribe({ next: (s) => this.stats.set(s), error: () => {} });

    this.planService
      .get()
      .pipe(takeUntil(this.destroy$))
      .subscribe({ next: (p) => this.plan.set(p), error: () => {} });

    this.progressService
      .getOverview()
      .pipe(takeUntil(this.destroy$))
      .subscribe({ next: (o) => this.progressOverview.set(o), error: () => {} });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  protected logout(): void {
    if (this.loggingOut()) return;
    this.loggingOut.set(true);
    this.authService
      .logout()
      .pipe(finalize(() => this.loggingOut.set(false)))
      .subscribe();
  }

  // ── Formatters ─────────────────────────────────────────────────────────
  protected formatVolume(vol: number): string {
    if (vol >= 1000) return (vol / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    return Math.round(vol).toString();
  }

  /** "Jun 14" relative label for the latest PR date. */
  protected formatPrDate(iso: string | null): string | null {
    if (!iso) return null;
    const date = new Date(iso);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / 86_400_000);
    if (diffDays === 0) return 'today';
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  private getCurrentYearMonth(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }
}
