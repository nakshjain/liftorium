import {
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProgressService } from '../progress.service';
import {
  ExerciseProgressSummary,
  PaginatedPrEvents,
  PrEvent,
  PrType,
  ProgressOverview,
} from '../progress.models';

type Tab = 'exercises' | 'prs';

@Component({
  selector: 'app-progress-page',
  imports: [RouterLink, FormsModule],
  templateUrl: './progress-page.html',
})
export class ProgressPageComponent implements OnInit {
  private readonly progressService = inject(ProgressService);

  protected readonly activeTab = signal<Tab>('exercises');
  protected readonly overview = signal<ProgressOverview | null>(null);

  // Exercise list state
  protected readonly exercises = signal<ExerciseProgressSummary[]>([]);
  protected readonly exercisesLoading = signal(false);
  protected readonly exercisesPage = signal(1);
  protected readonly exercisesTotalPages = signal(1);
  protected readonly exercisesTotal = signal(0);
  protected readonly searchQuery = signal('');
  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  // PR feed state
  protected readonly prEvents = signal<PrEvent[]>([]);
  protected readonly prEventsLoading = signal(false);
  protected readonly prEventsPage = signal(1);
  protected readonly prEventsTotalPages = signal(1);
  protected readonly selectedPrType = signal<PrType | null>(null);
  protected readonly prFeedLoaded = signal(false);

  protected readonly prTypeOptions: { label: string; value: PrType | null }[] = [
    { label: 'All', value: null },
    { label: 'Weight', value: 'WEIGHT' },
    { label: 'Reps', value: 'REPS' },
    { label: 'e1RM', value: 'ESTIMATED_ONE_REP_MAX' },
  ];

  protected readonly hasMoreExercises = computed(
    () => this.exercisesPage() < this.exercisesTotalPages()
  );

  protected readonly hasMorePrs = computed(
    () => this.prEventsPage() < this.prEventsTotalPages()
  );

  ngOnInit(): void {
    this.loadOverview();
    this.loadExercises(true);
  }

  protected switchTab(tab: Tab): void {
    this.activeTab.set(tab);
    if (tab === 'prs' && !this.prFeedLoaded()) {
      this.loadPrEvents(true);
    }
  }

  protected onSearchInput(value: string): void {
    this.searchQuery.set(value);
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.exercisesPage.set(1);
      this.loadExercises(true);
    }, 300);
  }

  protected loadMoreExercises(): void {
    if (!this.hasMoreExercises()) return;
    this.exercisesPage.update((p) => p + 1);
    this.loadExercises(false);
  }

  protected selectPrType(type: PrType | null): void {
    this.selectedPrType.set(type);
    this.prEventsPage.set(1);
    this.loadPrEvents(true);
  }

  protected loadMorePrs(): void {
    if (!this.hasMorePrs()) return;
    this.prEventsPage.update((p) => p + 1);
    this.loadPrEvents(false);
  }

  protected formatRelativeTime(iso: string | null): string {
    if (!iso) return '';
    const ms = Date.now() - new Date(iso).getTime();
    const days = Math.floor(ms / 86_400_000);
    if (days === 0) return 'today';
    if (days === 1) return 'yesterday';
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    if (days < 365) return `${Math.floor(days / 30)}mo ago`;
    return `${Math.floor(days / 365)}y ago`;
  }

  protected formatPrEventDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  protected prTypeLabel(type: PrType): string {
    switch (type) {
      case 'WEIGHT': return 'Weight';
      case 'REPS': return 'Reps';
      case 'ESTIMATED_ONE_REP_MAX': return 'e1RM';
    }
  }

  protected formatValue(event: PrEvent): string {
    switch (event.prType) {
      case 'WEIGHT': return `${event.value}kg`;
      case 'REPS': return `${event.value} reps`;
      case 'ESTIMATED_ONE_REP_MAX': return `${event.value.toFixed(1)}kg e1RM`;
    }
  }

  protected formatWeight(kg: number): string {
    return kg > 0 ? `${kg}kg` : '—';
  }

  protected formatRepPr(weight: number, reps: number): string {
    return weight > 0 ? `${weight}kg × ${reps}` : '—';
  }

  private loadOverview(): void {
    this.progressService.getOverview().subscribe({
      next: (overview) => this.overview.set(overview),
    });
  }

  private loadExercises(reset: boolean): void {
    this.exercisesLoading.set(true);
    this.progressService
      .listExerciseProgress({
        page: this.exercisesPage(),
        limit: 20,
        search: this.searchQuery() || undefined,
      })
      .subscribe({
        next: (result) => {
          if (reset) {
            this.exercises.set(result.items);
          } else {
            this.exercises.update((prev) => [...prev, ...result.items]);
          }
          this.exercisesTotalPages.set(result.totalPages);
          this.exercisesTotal.set(result.total);
          this.exercisesLoading.set(false);
        },
        error: () => this.exercisesLoading.set(false),
      });
  }

  private loadPrEvents(reset: boolean): void {
    this.prEventsLoading.set(true);
    this.progressService
      .listPrEvents({
        page: this.prEventsPage(),
        limit: 20,
        prType: this.selectedPrType() ?? undefined,
      })
      .subscribe({
        next: (result) => {
          if (reset) {
            this.prEvents.set(result.items);
          } else {
            this.prEvents.update((prev) => [...prev, ...result.items]);
          }
          this.prEventsTotalPages.set(result.totalPages);
          this.prFeedLoaded.set(true);
          this.prEventsLoading.set(false);
        },
        error: () => this.prEventsLoading.set(false),
      });
  }
}
