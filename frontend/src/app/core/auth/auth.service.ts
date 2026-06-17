import { HttpClient, HttpContext } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, map, Observable, of, tap, throwError } from 'rxjs';
import { API_BASE_URL } from '../api/api.config';
import type { ApiSuccessResponse } from '../api/api-response';
import { BYPASS_AUTH_INTERCEPTOR } from './auth.context';
import type {
  AuthSessionData,
  AuthStatus,
  AuthUser,
  CurrentUserData,
  ForgotPasswordRequest,
  LoginRequest,
  LogoutData,
  ResetPasswordRequest,
  SignupInitiateRequest,
  SignupInitiateResponse,
  SignupRequest,
  SignupVerifyRequest
} from './auth.models';
import { TokenStorageService } from './token-storage.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly tokenStorage = inject(TokenStorageService);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  private readonly userSignal = signal<AuthUser | null>(null);
  private readonly accessTokenSignal = signal<string | null>(this.tokenStorage.getAccessToken());
  private readonly statusSignal = signal<AuthStatus>(this.accessTokenSignal() ? 'checking' : 'anonymous');

  public readonly user = this.userSignal.asReadonly();
  public readonly accessToken = this.accessTokenSignal.asReadonly();
  public readonly status = this.statusSignal.asReadonly();
  public readonly isAuthenticated = computed(() => this.statusSignal() === 'authenticated' && !!this.userSignal());

  public initializeSession(): void {
    if (!this.accessTokenSignal()) {
      this.statusSignal.set('anonymous');
      return;
    }

    this.loadCurrentUser()
      .pipe(
        catchError(() => this.refreshSession()),
        catchError(() => {
          this.clearSession();
          return of(null);
        })
      )
      .subscribe();
  }

  public login(input: LoginRequest): Observable<AuthUser> {
    return this.http
      .post<ApiSuccessResponse<AuthSessionData>>(`${this.apiBaseUrl}/auth/login`, input, {
        context: this.bypassContext(),
        withCredentials: true
      })
      .pipe(map((response) => this.applySession(response.data)));
  }

  public signup(input: SignupRequest): Observable<AuthUser> {
    return this.http
      .post<ApiSuccessResponse<AuthSessionData>>(`${this.apiBaseUrl}/auth/register`, input, {
        context: this.bypassContext(),
        withCredentials: true
      })
      .pipe(map((response) => this.applySession(response.data)));
  }

  public signupInitiate(input: SignupInitiateRequest): Observable<string> {
    return this.http
      .post<ApiSuccessResponse<SignupInitiateResponse>>(`${this.apiBaseUrl}/auth/register/initiate`, input, {
        context: this.bypassContext()
      })
      .pipe(map((response) => response.data.message));
  }

  public signupVerify(input: SignupVerifyRequest): Observable<AuthUser> {
    return this.http
      .post<ApiSuccessResponse<AuthSessionData>>(`${this.apiBaseUrl}/auth/register/verify`, input, {
        context: this.bypassContext(),
        withCredentials: true
      })
      .pipe(map((response) => this.applySession(response.data)));
  }

  public forgotPassword(input: ForgotPasswordRequest): Observable<void> {
    return this.http
      .post<void>(`${this.apiBaseUrl}/auth/forgot-password`, input, {
        context: this.bypassContext()
      })
      .pipe(map(() => undefined));
  }

  public resetPassword(input: ResetPasswordRequest): Observable<AuthUser> {
    return this.http
      .post<ApiSuccessResponse<AuthSessionData>>(`${this.apiBaseUrl}/auth/forgot-password/reset`, input, {
        context: this.bypassContext(),
        withCredentials: true
      })
      .pipe(map((response) => this.applySession(response.data)));
  }

  public refreshSession(): Observable<AuthUser> {
    // If the user explicitly logged out, do not attempt a silent refresh.
    // The refresh cookie may still be present in the browser until the
    // Set-Cookie maxAge=0 response is fully processed, so we must gate here.
    if (this.tokenStorage.isLoggedOut()) {
      return throwError(() => new Error('User has logged out'));
    }

    return this.http
      .post<ApiSuccessResponse<AuthSessionData>>(
        `${this.apiBaseUrl}/auth/refresh`,
        {},
        {
          context: this.bypassContext(),
          withCredentials: true
        }
      )
      .pipe(map((response) => this.applySession(response.data)));
  }

  public loadCurrentUser(): Observable<AuthUser> {
    return this.http.get<ApiSuccessResponse<CurrentUserData>>(`${this.apiBaseUrl}/auth/me`).pipe(
      map((response) => response.data.user),
      tap((user) => {
        this.userSignal.set(user);
        this.statusSignal.set('authenticated');
      })
    );
  }

  public logout(): Observable<void> {
    return this.http
      .post<ApiSuccessResponse<LogoutData>>(
        `${this.apiBaseUrl}/auth/logout`,
        {},
        {
          context: this.bypassContext(),
          withCredentials: true
        }
      )
      .pipe(
        tap(() => this.clearSession()),
        map(() => undefined),
        catchError(() => {
          this.clearSession();
          return of(undefined);
        })
      );
  }

  public clearSession(): void {
    this.tokenStorage.clearAccessToken();
    this.tokenStorage.setLoggedOut();
    this.accessTokenSignal.set(null);
    this.userSignal.set(null);
    this.statusSignal.set('anonymous');
  }

  private applySession(session: AuthSessionData): AuthUser {
    this.tokenStorage.setAccessToken(session.accessToken);
    this.accessTokenSignal.set(session.accessToken);
    this.userSignal.set(session.user);
    this.statusSignal.set('authenticated');
    return session.user;
  }

  private bypassContext(): HttpContext {
    return new HttpContext().set(BYPASS_AUTH_INTERCEPTOR, true);
  }
}
