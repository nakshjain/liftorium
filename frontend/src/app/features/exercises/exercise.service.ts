import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_BASE_URL } from '../../core/api/api.config';
import { ApiSuccessResponse } from '../../core/api/api-response';
import { Exercise, ExercisePage, ListExercisesParams, SearchExercisesParams } from './exercise.models';

@Injectable({ providedIn: 'root' })
export class ExerciseService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  list(params: ListExercisesParams = {}): Observable<ExercisePage> {
    let httpParams = new HttpParams();
    if (params.limit != null) httpParams = httpParams.set('limit', params.limit);
    if (params.cursor) httpParams = httpParams.set('cursor', params.cursor);
    if (params.muscle) httpParams = httpParams.set('muscle', params.muscle);
    if (params.equipment) httpParams = httpParams.set('equipment', params.equipment);
    if (params.exerciseType) httpParams = httpParams.set('exerciseType', params.exerciseType);
    if (params.level) httpParams = httpParams.set('level', params.level);

    return this.http
      .get<ApiSuccessResponse<ExercisePage>>(`${this.baseUrl}/exercises`, { params: httpParams })
      .pipe(map((res) => res.data));
  }

  search(params: SearchExercisesParams): Observable<ExercisePage> {
    let httpParams = new HttpParams().set('q', params.q);
    if (params.limit != null) httpParams = httpParams.set('limit', params.limit);
    if (params.muscle) httpParams = httpParams.set('muscle', params.muscle);
    if (params.equipment) httpParams = httpParams.set('equipment', params.equipment);

    return this.http
      .get<ApiSuccessResponse<ExercisePage>>(`${this.baseUrl}/exercises/search`, { params: httpParams })
      .pipe(map((res) => res.data));
  }

  getById(id: string, includeContent = false): Observable<Exercise> {
    let httpParams = new HttpParams();
    if (includeContent) httpParams = httpParams.set('includeContent', true);

    return this.http
      .get<ApiSuccessResponse<Exercise>>(`${this.baseUrl}/exercises/${id}`, { params: httpParams })
      .pipe(map((res) => res.data));
  }
}
