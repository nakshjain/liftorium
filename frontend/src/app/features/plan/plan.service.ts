import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { WorkoutPlan } from './plan.models';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

interface PlanDayPayload {
  dayOfWeek: number;
  label: string;
  muscleGroups: string[];
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
  private readonly base = '/api/v1/plan';

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
        rest: d.rest,
      })),
    };
  }
}
