import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProgressService } from '../progress.service';
import { formatRelativeTime } from '../../../shared/utils/format-relative-time';
import { TrainingHubLinkComponent } from '../../../shared/ui/training-hub-link/training-hub-link';
import { ExerciseSearchInputComponent } from '../../../shared/ui/exercise-search-input/exercise-search-input';
import {
  ExerciseProgressSummary,
  PrEvent,
  PrType,
  ProgressOverview,
} from '../progress.models';
import { UserSettingsStore } from '../../settings/settings.store';
import { formatWeight, formatWeightCompact } from '../../../shared/utils/weight.utils';
import type { WeightUnit } from '../../settings/settings.models';

type Tab = 'exercises' | 'prs';

@Component({
  selector: 'app-progress-page',
  imports: [RouterLink, FormsModule, TrainingHubLinkComponent, ExerciseSearchInputComponent],
  templateUrl: './progress-page.html',
})
export class ProgressPageComponent implements OnInit {
  private readonly progressService = inject(ProgressService);
  private readonly settingsStore = inject(UserSettingsStore);

  protected readonly weightUnit = this.settingsStore.weightUnit;

  protected readonly activeTab = signal<Tab>('exercises');
  protected readonly overview = signal<ProgressOverview | null>(null);

  // Exercise list state
  protected readonly exercises = signal<ExerciseProgressSummary[]>([]);
  protected readonly exercisesLoading = signal(false);
  protected readonly exercisesPage = signal(1);
  protected readonly exercisesTotalPages = signal(1);
  protected readonly exercisesTotal = signal(0);
  protected readonly searchQuery = signal('');
  protected readonly searchPending = signal(false);
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
    this.searchPending.set(true);
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
    return formatRelativeTime(iso, 'short');
  }

  protected formatPrEventDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }

  protected formatWeight(kg: number): string {
    return formatWeight(kg, this.settingsStore.weightUnit());
  }

  protected formatRepPr(weightKg: number, reps: number): string {
    return weightKg > 0 ? `${formatWeightCompact(weightKg, this.settingsStore.weightUnit())} × ${reps}` : '—';
  }

  protected formatPrTransition(event: PrEvent): string {
    const unit: WeightUnit = this.settingsStore.weightUnit();
    const prev = event.previousValue;
    const next = event.newValue;

    switch (event.prType) {
      case 'WEIGHT':
        return prev != null && next != null
          ? `${formatWeightCompact(prev, unit)} → ${formatWeightCompact(next, unit)}`
          : `${next != null ? formatWeightCompact(next, unit) : '—'}`;

      case 'REPS': {
        const prevStr = prev != null
          ? `${event.prevRepWeight != null ? formatWeightCompact(event.prevRepWeight, unit) + ' × ' : ''}${prev}`
          : null;
        const nextStr = `${event.newRepWeight != null ? formatWeightCompact(event.newRepWeight, unit) + ' × ' : ''}${next ?? '—'}`;
        return prevStr ? `${prevStr} → ${nextStr}` : nextStr;
      }

      case 'ESTIMATED_ONE_REP_MAX': {
        const prevE = prev != null ? formatWeightCompact(prev, unit) : null;
        const nextE = next != null ? formatWeightCompact(next, unit) : '—';
        return prevE ? `${prevE} → ${nextE}` : nextE;
      }
    }
  }

  protected prTypeLabel(type: PrType): string {
    switch (type) {
      case 'WEIGHT': return 'Weight PR';
      case 'REPS': return 'Rep PR';
      case 'ESTIMATED_ONE_REP_MAX': return 'e1RM PR';
    }
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
          this.searchPending.set(false);
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
