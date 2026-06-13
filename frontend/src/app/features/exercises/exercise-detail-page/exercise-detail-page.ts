import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ExerciseService } from '../exercise.service';
import { Exercise } from '../exercise.models';
import { LiveWorkoutStore } from '../../workouts/live-workout.store';
import { ToastService } from '../../../shared/ui/toast/toast.service';

@Component({
  selector: 'app-exercise-detail-page',
  imports: [RouterLink],
  templateUrl: './exercise-detail-page.html',
  styleUrl: './exercise-detail-page.scss'
})
export class ExerciseDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly exerciseService = inject(ExerciseService);
  private readonly liveWorkoutStore = inject(LiveWorkoutStore);
  private readonly toastService = inject(ToastService);

  protected readonly exercise = signal<Exercise | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly adding = signal(false);

  protected readonly hasActiveWorkout = computed(() => this.liveWorkoutStore.activeWorkout() !== null);
  protected readonly isInWorkout = computed(() => {
    const ex = this.exercise();
    const workout = this.liveWorkoutStore.activeWorkout();
    if (!ex || !workout) return false;
    return workout.exercises.some(wex => wex.exerciseId === ex.id);
  });

  public ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error.set('Exercise not found.');
      this.loading.set(false);
      return;
    }

    this.exerciseService.getById(id, true).subscribe({
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

  protected muscleList(muscles: string[]): string {
    return muscles.length > 0 ? muscles.join(', ') : '—';
  }

  protected addToWorkout(): void {
    const ex = this.exercise();
    if (!ex || this.adding()) return;

    this.adding.set(true);

    // Add exercise to active workout
    this.liveWorkoutStore.addExercise(ex.id);

    // Show success toast and navigate to workout
    this.toastService.success(`${ex.name} added to workout`);

    setTimeout(() => {
      this.adding.set(false);
      this.router.navigate(['/app/workout/live']);
    }, 500);
  }

  protected startWorkoutWith(): void {
    const ex = this.exercise();
    if (!ex || this.adding()) return;

    this.adding.set(true);

    // Start a new workout with this exercise
    // First, ensure any existing workout is cleared (user confirmed via button context)
    // Then add this exercise and navigate to live workout page
    this.liveWorkoutStore.addExercise(ex.id);

    this.toastService.success(`Started workout with ${ex.name}`);

    setTimeout(() => {
      this.adding.set(false);
      this.router.navigate(['/app/workout/live']);
    }, 500);
  }
}
