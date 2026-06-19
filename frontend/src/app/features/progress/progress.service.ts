import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_BASE_URL } from '../../core/api/api.config';
import { ApiSuccessResponse } from '../../core/api/api-response';
import {
  ExerciseProgressDetail,
  ExerciseProgressHistory,
  ListExerciseProgressParams,
  ListPrEventsParams,
  PaginatedExerciseProgress,
  PaginatedPrEvents,
  ProgressOverview,
} from './progress.models';

@Injectable({ providedIn: 'root' })
export class ProgressService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  getOverview(): Observable<ProgressOverview> {
    return this.http
      .get<ApiSuccessResponse<ProgressOverview>>(`${this.baseUrl}/progress/overview`)
      .pipe(map((res) => res.data));
  }

  listExerciseProgress(params: ListExerciseProgressParams = {}): Observable<PaginatedExerciseProgress> {
    let httpParams = new HttpParams();
    if (params.page != null) httpParams = httpParams.set('page', params.page);
    if (params.limit != null) httpParams = httpParams.set('limit', params.limit);
    if (params.search) httpParams = httpParams.set('search', params.search);

    return this.http
      .get<ApiSuccessResponse<PaginatedExerciseProgress>>(`${this.baseUrl}/progress/exercises`, {
        params: httpParams,
      })
      .pipe(map((res) => res.data));
  }

  getExerciseProgress(exerciseId: string): Observable<ExerciseProgressDetail> {
    return this.http
      .get<ApiSuccessResponse<ExerciseProgressDetail>>(
        `${this.baseUrl}/progress/exercises/${exerciseId}`
      )
      .pipe(map((res) => res.data));
  }

  getExerciseProgressHistory(exerciseId: string): Observable<ExerciseProgressHistory> {
    return this.http
      .get<ApiSuccessResponse<ExerciseProgressHistory>>(
        `${this.baseUrl}/progress/exercises/${exerciseId}/history`
      )
      .pipe(map((res) => res.data));
  }

  listPrEvents(params: ListPrEventsParams = {}): Observable<PaginatedPrEvents> {
    let httpParams = new HttpParams();
    if (params.page != null) httpParams = httpParams.set('page', params.page);
    if (params.limit != null) httpParams = httpParams.set('limit', params.limit);
    if (params.prType) httpParams = httpParams.set('prType', params.prType);
    if (params.exerciseId) httpParams = httpParams.set('exerciseId', params.exerciseId);

    return this.http
      .get<ApiSuccessResponse<PaginatedPrEvents>>(`${this.baseUrl}/progress/prs`, {
        params: httpParams,
      })
      .pipe(map((res) => res.data));
  }
}
