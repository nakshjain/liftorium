import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_BASE_URL } from '../../core/api/api.config';
import { WorkoutPlan } from './plan.models';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

interface PlanExercisePayload {
  exerciseId: string;
  exerciseName: string;
  sets: number;
  reps: number;
  order: number;
}

interface PlanDayPayload {
  dayOfWeek: number;
  label: string;
  muscleGroups: string[];
  exercises: PlanExercisePayload[];
  rest: boolean;
}

interface PlanPayload {
  days: PlanDayPayload[];
}

interface PlanDto {
  id: string | null;
  days: PlanDayPayload[];
  updatedAt: string | null;
}

@Injectable({ providedIn: 'root' })
export class PlanService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly base = `${this.baseUrl}/plan`;

  get(): Observable<WorkoutPlan> {
    return this.http.get<ApiResponse<{ plan: PlanDto }>>(this.base).pipe(
      map((res) => this.toModel(res.data.plan)),
    );
  }

  save(plan: WorkoutPlan): Observable<WorkoutPlan> {
    const payload: PlanPayload = {
      days: plan.days.map((d) => ({
        dayOfWeek: d.dayOfWeek,
        label: d.label,
        muscleGroups: d.muscleGroups,
        exercises: d.exercises.map((e) => ({
          exerciseId: e.exerciseId,
          exerciseName: e.exerciseName,
          sets: e.sets,
          reps: e.reps,
          order: e.order,
        })),
        rest: d.rest,
      })),
    };
    return this.http.put<ApiResponse<{ plan: PlanDto }>>(this.base, payload).pipe(
      map((res) => this.toModel(res.data.plan)),
    );
  }

  private toModel(dto: PlanDto): WorkoutPlan {
    return {
      id: dto.id ?? crypto.randomUUID(),
      name: 'My Plan',
      days: dto.days.map((d) => ({
        dayOfWeek: d.dayOfWeek,
        label: d.label,
        muscleGroups: d.muscleGroups as WorkoutPlan['days'][number]['muscleGroups'],
        exercises: (d.exercises ?? []).map((e) => ({
          exerciseId: e.exerciseId,
          exerciseName: e.exerciseName,
          sets: e.sets,
          reps: e.reps,
          order: e.order,
        })),
        rest: d.rest,
      })),
    };
  }
}
