/**
 * Auth guard tests — Properties 4, 5, and 8.
 *
 * Property 4: Auth-gate preserves navigation intent
 *   Validates: Requirements 9.1, 9.7
 *
 * Property 5: Existing authenticated flows unchanged
 *   Validates: Requirements 23.1, 23.2
 *
 * Property 8: Dashboard is always the unauthenticated landing page
 *   Validates: Requirements 1.1, 1.2, 1.3, 1.4
 */

// ---------------------------------------------------------------------------
// Part 1 — Property 8 (structural, no DI needed)
// ---------------------------------------------------------------------------

import { routes } from '../../app.routes';
import { authGuard } from './auth.guard';

describe('Property 8: Dashboard is always the unauthenticated landing page', () => {
  it('root path redirects to app', () => {
    expect(routes.find(r => r.path === '' && r.pathMatch === 'full')?.redirectTo).toBe('app');
  });
  it('wildcard redirects to app', () => {
    expect(routes.find(r => r.path === '**')?.redirectTo).toBe('app');
  });
  it('Dashboard /app has no canActivate guard', () => {
    expect(routes.find(r => r.path === 'app')?.canActivate).toBeFalsy();
  });
  it('/app/workout has no canActivate guard', () => {
    expect(routes.find(r => r.path === 'app/workout')?.canActivate).toBeFalsy();
  });
  it('/app/exercises has no canActivate guard', () => {
    expect(routes.find(r => r.path === 'app/exercises')?.canActivate).toBeFalsy();
  });
  it('protected routes still have authGuard', () => {
    for (const path of ['app/workouts/history', 'app/workouts/:workoutId', 'app/plan', 'app/progress']) {
      expect(routes.find(r => r.path === path)?.canActivate).toContain(authGuard);
    }
  });
});

// ---------------------------------------------------------------------------
// Part 2 — Properties 4 & 5 (needs Angular TestBed)
// ---------------------------------------------------------------------------

import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, firstValueFrom, throwError } from 'rxjs';
import { AuthGateService } from './auth-gate.service';
import { AuthService } from './auth.service';

function makeRoute(data = {}): ActivatedRouteSnapshot {
  return { data } as unknown as ActivatedRouteSnapshot;
}
function makeState(url: string): RouterStateSnapshot {
  return { url } as unknown as RouterStateSnapshot;
}

// ---------------------------------------------------------------------------
// Property 4: Auth-gate preserves navigation intent
// Validates: Requirements 9.1, 9.7
// ---------------------------------------------------------------------------

describe('Property 4: Auth-gate preserves navigation intent', () => {
  const protectedUrls = ['/app/workouts/history', '/app/plan', '/app/progress'];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuthGateService,
        {
          provide: AuthService,
          useValue: {
            isAuthenticated: () => false,
            refreshSession: () => throwError(() => new Error('no session')),
          },
        },
      ],
    });
  });
  afterEach(() => TestBed.resetTestingModule());

  it.each(protectedUrls)('blocks %s and sets pendingFeature + returnUrl', async (url) => {
    const authGateService = TestBed.inject(AuthGateService);
    const result = await TestBed.runInInjectionContext(() =>
      firstValueFrom(authGuard(makeRoute({ feature: 'Test Feature' }), makeState(url)) as Observable<boolean>)
    );
    expect(result).toBe(false);
    expect(authGateService.pendingFeature()).not.toBeNull();
    expect(authGateService.returnUrl()).toBe(url);
  });
});

// ---------------------------------------------------------------------------
// Property 5: Existing authenticated flows unchanged
// Validates: Requirements 23.1, 23.2
// ---------------------------------------------------------------------------

describe('Property 5: Existing authenticated flows unchanged', () => {
  const protectedUrls = ['/app/workouts/history', '/app/plan', '/app/progress'];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuthGateService,
        {
          provide: AuthService,
          useValue: { isAuthenticated: () => true },
        },
      ],
    });
  });
  afterEach(() => TestBed.resetTestingModule());

  it.each(protectedUrls)('allows authenticated user to access %s', async (url) => {
    const authGateService = TestBed.inject(AuthGateService);
    const result = TestBed.runInInjectionContext(() =>
      authGuard(makeRoute({}), makeState(url))
    );
    expect(result).toBe(true);
    expect(authGateService.pendingFeature()).toBeNull();
  });
});
