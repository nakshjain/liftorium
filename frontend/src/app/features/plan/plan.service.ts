import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_BASE_URL } from '../../core/api/api.config';
import { PlanTemplate, WorkoutPlan } from './plan.models';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

interface PlanSetPayload {
  reps: number;
}

interface PlanExercisePayload {
  exerciseId: string;
  exerciseName: string;
  sets: PlanSetPayload[];
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
  templateId: string | null;
}

interface PlanDto {
  id: string | null;
  templateId: string | null;
  days: PlanDayPayload[];
  updatedAt: string | null;
}

interface TemplateDto {
  id: string;
  name: string;
  shortName: string;
  description: string;
  days: PlanDayPayload[];
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

  getTemplates(): Observable<PlanTemplate[]> {
    return this.http.get<ApiResponse<{ templates: TemplateDto[] }>>(`${this.base}/templates`).pipe(
      map((res) => res.data.templates.map((t) => this.templateToModel(t))),
    );
  }

  save(plan: WorkoutPlan, templateId: string | null): Observable<WorkoutPlan> {
    const payload: PlanPayload = {
      templateId,
      days: plan.days.map((d) => ({
        dayOfWeek: d.dayOfWeek,
        label: d.label,
        muscleGroups: d.muscleGroups,
        exercises: d.exercises.map((e) => ({
          exerciseId: e.exerciseId,
          exerciseName: e.exerciseName,
          sets: e.sets.map((s) => ({ reps: s.reps })),
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
      id: dto.id ?? null,
      templateId: dto.templateId ?? null,
      name: 'My Plan',
      days: dto.days.map((d) => ({
        dayOfWeek: d.dayOfWeek,
        label: d.label,
        muscleGroups: d.muscleGroups as WorkoutPlan['days'][number]['muscleGroups'],
        exercises: (d.exercises ?? []).map((e) => ({
          exerciseId: e.exerciseId,
          exerciseName: e.exerciseName,
          sets: (e.sets ?? []).map((s) => ({ reps: s.reps })),
          order: e.order,
        })),
        rest: d.rest,
      })),
    };
  }

  private templateToModel(dto: TemplateDto): PlanTemplate {
    return {
      id: dto.id,
      name: dto.name,
      shortName: dto.shortName,
      description: dto.description,
      days: dto.days.map((d) => ({
        dayOfWeek: d.dayOfWeek,
        label: d.label,
        muscleGroups: d.muscleGroups as WorkoutPlan['days'][number]['muscleGroups'],
        exercises: (d.exercises ?? []).map((e) => ({
          exerciseId: e.exerciseId,
          exerciseName: e.exerciseName,
          sets: (e.sets ?? []).map((s) => ({ reps: s.reps })),
          order: e.order,
        })),
        rest: d.rest,
      })),
    };
  }
}
