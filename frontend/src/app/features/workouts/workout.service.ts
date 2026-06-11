import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, concatMap, from, map, reduce } from 'rxjs';
import { API_BASE_URL } from '../../core/api/api.config';
import { ApiSuccessResponse } from '../../core/api/api-response';
import { LiveWorkout } from './live-workout.models';

type StartResponse = { id: string };
type AddExerciseResponse = { id: string };

@Injectable({ providedIn: 'root' })
export class WorkoutService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  // Replay the full local-first session to the backend in sequence:
  // POST /workouts → POST /workouts/:id/exercises (x N) → POST .../sets (x M) → POST /workouts/:id/finish
  save(workout: LiveWorkout): Observable<string> {
    return this.http
      .post<ApiSuccessResponse<StartResponse>>(`${this.baseUrl}/workouts`, {
        name: workout.name,
        startedAt: new Date(workout.startedAt).toISOString(),
      })
      .pipe(
        map((res) => res.data.id),
        concatMap((workoutId) =>
          from(workout.exercises).pipe(
            concatMap((ex) =>
              this.http
                .post<ApiSuccessResponse<AddExerciseResponse>>(
                  `${this.baseUrl}/workouts/${workoutId}/exercises`,
                  { exerciseId: ex.exerciseId },
                )
                .pipe(
                  map((res) => res.data.id),
                  concatMap((workoutExerciseId) =>
                    from(ex.sets.filter((s) => s.completed)).pipe(
                      concatMap((set) =>
                        this.http.post(
                          `${this.baseUrl}/workouts/${workoutId}/exercises/${workoutExerciseId}/sets`,
                          {
                            reps: set.reps,
                            weight: set.weight,
                            completedAt: set.completedAt,
                          },
                        ),
                      ),
                      reduce((acc) => acc, null),
                    ),
                  ),
                ),
            ),
            reduce((acc) => acc, null),
            concatMap(() =>
              this.http.post(`${this.baseUrl}/workouts/${workoutId}/finish`, {
                finishedAt: new Date(workout.finishedAt!).toISOString(),
                durationSeconds: workout.finishedAt
                  ? Math.floor((workout.finishedAt - workout.startedAt) / 1000)
                  : null,
              }),
            ),
            map(() => workoutId),
          ),
        ),
      );
  }
}
