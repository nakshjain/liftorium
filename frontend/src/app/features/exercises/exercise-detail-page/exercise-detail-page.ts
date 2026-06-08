import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ExerciseService } from '../exercise.service';
import { Exercise } from '../exercise.models';

@Component({
  selector: 'app-exercise-detail-page',
  imports: [RouterLink],
  templateUrl: './exercise-detail-page.html',
  styleUrl: './exercise-detail-page.scss'
})
export class ExerciseDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly exerciseService = inject(ExerciseService);

  protected readonly exercise = signal<Exercise | null>(null);
  protected readonly loading = signal(true);
  protected readonly loadingContent = signal(false);
  protected readonly error = signal<string | null>(null);

  public ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error.set('Exercise not found.');
      this.loading.set(false);
      return;
    }

    this.exerciseService.getById(id).subscribe({
      next: (exercise) => {
        this.exercise.set(exercise);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load exercise. Please try again.');
        this.loading.set(false);
      }
    });
  }

  protected loadContent(): void {
    const id = this.exercise()?.id;
    if (!id || this.loadingContent()) return;

    this.loadingContent.set(true);
    this.exerciseService.getById(id, true).subscribe({
      next: (exercise) => {
        this.exercise.set(exercise);
        this.loadingContent.set(false);
      },
      error: () => {
        this.loadingContent.set(false);
      }
    });
  }

  protected muscleList(muscles: string[]): string {
    return muscles.length > 0 ? muscles.join(', ') : '—';
  }

  protected patternLabel(pattern: string | null): string {
    if (!pattern) return '—';
    return pattern.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  }
}
