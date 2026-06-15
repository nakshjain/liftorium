import {
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ProgressService } from '../progress.service';
import { formatRelativeTime } from '../../../shared/utils/format-relative-time';
import {
  ExerciseProgressDetail,
  ExerciseProgressHistoryEntry,
  PrEvent,
  PrType,
} from '../progress.models';

type TooltipState = {
  visible: boolean;
  x: number;
  y: number;
  flipped: boolean; // true = render below the point (avoids top-of-viewport clipping)
  date: string;
  value: string;
};

@Component({
  selector: 'app-exercise-progression-page',
  imports: [RouterLink],
  templateUrl: './exercise-progression-page.html',
})
export class ExerciseProgressionPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly progressService = inject(ProgressService);

  protected readonly detail = signal<ExerciseProgressDetail | null>(null);
  protected readonly history = signal<ExerciseProgressHistoryEntry[]>([]);
  protected readonly prEvents = signal<PrEvent[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly prEventsLoading = signal(false);
  protected readonly prEventsPage = signal(1);
  protected readonly prEventsTotalPages = signal(1);

  protected readonly tooltip = signal<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    flipped: false,
    date: '',
    value: '',
  });

  // Chart geometry — computed once history loads (uses bestWeight, not e1RM)
  protected readonly chartPath = computed(() => this.buildChartPath());
  protected readonly chartPoints = computed(() => this.buildChartPoints());
  protected readonly chartStartLabel = computed(() => this.buildStartLabel());
  protected readonly chartEndLabel = computed(() => this.buildEndLabel());

  // Progression summary — uses firstWeightPr / weightPr from detail
  protected readonly progressionSummary = computed(() => this.buildProgressionSummary());

  // Derived stats
  protected readonly sessionCount = computed(() => this.history().length);
  protected readonly hasEnoughDataForChart = computed(() => this.history().length >= 2);
  protected readonly hasSingleDataPoint = computed(() => this.history().length === 1);

  private exerciseId = '';

  // SVG viewport constants
  protected readonly CHART_W = 600;
  protected readonly CHART_H = 160;
  protected readonly CHART_PAD_X = 8;
  protected readonly CHART_PAD_Y = 20;

  ngOnInit(): void {
    this.exerciseId = this.route.snapshot.paramMap.get('exerciseId') ?? '';
    if (!this.exerciseId) {
      this.error.set('Exercise not found.');
      this.loading.set(false);
      return;
    }

    this.loadDetail();
    this.loadHistory();
    this.loadPrEvents(true);
  }

  protected loadMorePrEvents(): void {
    if (this.prEventsPage() >= this.prEventsTotalPages()) return;
    this.prEventsPage.update((p) => p + 1);
    this.loadPrEvents(false);
  }

  protected onChartPointerMove(event: PointerEvent): void {
    const points = this.chartPoints();
    if (!points.length) return;

    const svgEl = event.currentTarget as SVGSVGElement;

    // Convert pointer position to SVG user-space using the SVG transform matrix.
    // getScreenCTM() accounts for the viewBox-to-viewport mapping including any
    // preserveAspectRatio letterboxing, so this is accurate at any container size.
    const ctm = svgEl.getScreenCTM();
    if (!ctm) return;

    const svgX = (event.clientX - ctm.e) / ctm.a;

    // Find closest point by SVG-space X distance
    let closest = points[0];
    let minDist = Math.abs(points[0].svgX - svgX);
    for (const pt of points) {
      const d = Math.abs(pt.svgX - svgX);
      if (d < minDist) {
        minDist = d;
        closest = pt;
      }
    }

    // Map the closest SVG point back to screen coordinates via the same CTM.
    // ctm.a = scaleX, ctm.d = scaleY, ctm.e = translateX, ctm.f = translateY
    const screenX = closest.svgX * ctm.a + ctm.e;
    const screenY = closest.svgY * ctm.d + ctm.f;

    // Flip the tooltip below the dot when the dot is in the top 20% of the viewport
    // to prevent it clipping out of view (e.g. on mobile with the chart scrolled up).
    const flipped = screenY < window.innerHeight * 0.2;

    this.tooltip.set({
      visible: true,
      x: screenX,
      y: screenY,
      flipped,
      date: this.formatTooltipDate(closest.date),
      value: `${closest.weight}kg`,
    });
  }

  protected onChartPointerLeave(): void {
    this.tooltip.update((t) => ({ ...t, visible: false }));
  }

  protected formatPrType(type: PrType): string {
    switch (type) {
      case 'WEIGHT': return 'Weight';
      case 'REPS': return 'Reps';
      case 'ESTIMATED_ONE_REP_MAX': return 'e1RM';
    }
  }

  /**
   * Format a PR event as a progression transition.
   * Weight: "35kg → 47.5kg"
   * Reps:   "20kg × 10 → 25kg × 12"
   * e1RM:   "54.3kg → 60.2kg"
   */
  protected formatPrTransition(event: PrEvent): string {
    const prev = event.previousValue;
    const next = event.newValue;

    switch (event.prType) {
      case 'WEIGHT':
        return prev != null && next != null
          ? `${prev}kg → ${next}kg`
          : `${next ?? '—'}kg`;

      case 'REPS': {
        // Include weight context so the rep PR is unambiguous
        const prevStr = prev != null
          ? `${event.prevRepWeight != null ? event.prevRepWeight + 'kg × ' : ''}${prev}`
          : null;
        const nextStr = `${event.newRepWeight != null ? event.newRepWeight + 'kg × ' : ''}${next ?? '—'}`;
        return prevStr ? `${prevStr} → ${nextStr}` : nextStr;
      }

      case 'ESTIMATED_ONE_REP_MAX': {
        const prevE = prev != null ? `${(prev).toFixed(1)}kg` : null;
        const nextE = `${(next ?? 0).toFixed(1)}kg`;
        return prevE ? `${prevE} → ${nextE}` : nextE;
      }
    }
  }

  protected formatPrDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }

  protected formatLastImproved(iso: string | null): string {
    return formatRelativeTime(iso, 'long');
  }

  protected hasMorePrEvents = computed(
    () => this.prEventsPage() < this.prEventsTotalPages()
  );

  // ── Chart builders — all driven by bestWeight ─────────────────────────

  private buildChartPath(): string {
    const pts = this.buildChartPoints();
    if (pts.length < 2) return '';

    // Smooth catmull-rom approximation via cubic bezier
    const d: string[] = [`M ${pts[0].svgX} ${pts[0].svgY}`];
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(i - 1, 0)];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[Math.min(i + 2, pts.length - 1)];

      const cp1x = p1.svgX + (p2.svgX - p0.svgX) / 6;
      const cp1y = p1.svgY + (p2.svgY - p0.svgY) / 6;
      const cp2x = p2.svgX - (p3.svgX - p1.svgX) / 6;
      const cp2y = p2.svgY - (p3.svgY - p1.svgY) / 6;

      d.push(`C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${p2.svgX} ${p2.svgY}`);
    }

    return d.join(' ');
  }

  private buildChartPoints(): { svgX: number; svgY: number; weight: number; date: string }[] {
    const entries = this.history();
    if (entries.length < 2) return [];

    const values = entries.map((e) => e.bestWeight);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const range = maxVal - minVal || 1;

    const w = this.CHART_W - this.CHART_PAD_X * 2;
    const h = this.CHART_H - this.CHART_PAD_Y * 2;

    return entries.map((entry, i) => ({
      svgX: this.CHART_PAD_X + (i / (entries.length - 1)) * w,
      svgY: this.CHART_PAD_Y + h - ((entry.bestWeight - minVal) / range) * h,
      weight: entry.bestWeight,
      date: entry.performedAt,
    }));
  }

  private buildStartLabel(): string {
    const entries = this.history();
    if (!entries.length) return '';
    return `${entries[0].bestWeight}kg`;
  }

  private buildEndLabel(): string {
    const entries = this.history();
    if (!entries.length) return '';
    return `${entries[entries.length - 1].bestWeight}kg`;
  }

  /**
   * Builds the progression summary using backend firstWeightPr / weightPr.
   * Falls back to history entries when firstWeightPr is not yet set.
   */
  private buildProgressionSummary(): {
    started: string;
    now: string;
    deltaKg: string;
    deltaPct: string;
    positive: boolean;
  } | null {
    const d = this.detail();
    if (!d || d.weightPr <= 0) return null;

    // Use backend first/current values when available, else fall back to history
    const entries = this.history();
    const firstWeight = d.firstWeightPr
      ?? (entries.length > 0 ? entries[0].bestWeight : null);

    if (firstWeight == null) return null;

    const diff = d.weightPr - firstWeight;
    const pct = firstWeight > 0 ? (diff / firstWeight) * 100 : 0;

    return {
      started: `${firstWeight}kg`,
      now: `${d.weightPr}kg`,
      deltaKg: `${diff >= 0 ? '+' : ''}${diff % 1 === 0 ? diff : diff.toFixed(1)}kg`,
      deltaPct: `${diff >= 0 ? '+' : ''}${pct.toFixed(0)}%`,
      positive: diff >= 0,
    };
  }

  private formatTooltipDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }

  // ── Data loaders ────────────────────────────────────────────────────

  private loadDetail(): void {
    this.progressService.getExerciseProgress(this.exerciseId).subscribe({
      next: (detail) => {
        this.detail.set(detail);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load progress for this exercise.');
        this.loading.set(false);
      },
    });
  }

  private loadHistory(): void {
    this.progressService.getExerciseProgressHistory(this.exerciseId).subscribe({
      next: (result) => this.history.set(result.entries),
    });
  }

  private loadPrEvents(reset: boolean): void {
    this.prEventsLoading.set(true);
    this.progressService
      .listPrEvents({ page: this.prEventsPage(), limit: 30, exerciseId: this.exerciseId })
      .subscribe({
        next: (result) => {
          if (reset) {
            this.prEvents.set(result.items);
          } else {
            this.prEvents.update((prev) => [...prev, ...result.items]);
          }
          this.prEventsTotalPages.set(result.totalPages);
          this.prEventsLoading.set(false);
        },
        error: () => this.prEventsLoading.set(false),
      });
  }
}
