import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { API_BASE_URL } from '../../core/api/api.config';
import { ApiSuccessResponse } from '../../core/api/api-response';
import { AuthService } from '../../core/auth/auth.service';
import { AuthUser } from '../../core/auth/auth.models';
import {
  ChangePasswordRequest,
  UpdateAccountRequest,
  UpdateSettingsRequest,
  UserSettings,
} from './settings.models';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly authService = inject(AuthService);

  // ── Settings ────────────────────────────────────────────────────────────

  getSettings(): Observable<UserSettings> {
    return this.http
      .get<ApiSuccessResponse<{ settings: UserSettings }>>(`${this.baseUrl}/settings`)
      .pipe(map((res) => res.data.settings));
  }

  updateSettings(request: UpdateSettingsRequest): Observable<UserSettings> {
    return this.http
      .put<ApiSuccessResponse<{ settings: UserSettings }>>(`${this.baseUrl}/settings`, request)
      .pipe(map((res) => res.data.settings));
  }

  // ── Account ─────────────────────────────────────────────────────────────

  updateAccount(request: UpdateAccountRequest): Observable<AuthUser> {
    return this.http
      .put<ApiSuccessResponse<{ user: AuthUser }>>(`${this.baseUrl}/settings/account`, request)
      .pipe(
        map((res) => res.data.user),
        // Keep the in-memory auth signal in sync so the nav bar updates immediately
        tap((user) => this.authService.patchUser(user)),
      );
  }

  // ── Security ─────────────────────────────────────────────────────────────

  changePassword(request: ChangePasswordRequest): Observable<void> {
    return this.http
      .put(`${this.baseUrl}/settings/security/password`, request, {
        headers: { 'Content-Type': 'application/json' },
        responseType: 'text',
      })
      .pipe(map(() => undefined));
  }

  // ── Data & Privacy ────────────────────────────────────────────────────────

  deleteAccount(): Observable<void> {
    return this.http
      .delete(`${this.baseUrl}/settings/account`, { responseType: 'text' })
      .pipe(
        map(() => undefined),
        tap(() => this.authService.clearSession()),
      );
  }
}
