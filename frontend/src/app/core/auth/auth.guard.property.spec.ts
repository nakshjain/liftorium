/**
 * Property-based tests for authGuard.
 *
 * Uses vitest (globals) + fast-check + Angular TestBed.
 *
 * Setup:
 *  - AuthService is mocked: isAuthenticated() returns a configurable value,
 *    refreshSession() throws (simulating an expired/missing session).
 *  - AuthGateService is the real implementation (providedIn: 'root' signal store).
 *  - The guard function is invoked directly inside runInInjectionContext so that
 *    Angular's inject() calls resolve correctly.
 */

import { TestBed, fakeAsync } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import * as fc from 'fast-check';
import { Observable, firstValueFrom, throwError } from 'rxjs';
import { AuthGateService } from './auth-gate.service';
import { authGuard } from './auth.guard';
import { AuthService } from './auth.service';

// ---------------------------------------------------------------------------
// Constants — protected routes taken from the design / app.routes.ts
// ---------------------------------------------------------------------------

const PROTECTED_URLS = [
  '/app/workouts/history',
  '/app/workouts/abc123',
  '/app/workouts/some-other-id',
  '/app/plan',
  '/app/progress',
] as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Builds a minimal ActivatedRouteSnapshot for a given URL segment. */
function makeRoute(url: string): ActivatedRouteSnapshot {
  const snapshot = new ActivatedRouteSnapshot();
  // The guard uses route.data?.['feature'] to derive the feature name.
  // Leave data empty so the fallback URL-matching logic is exercised.
  (snapshot as unknown as { data: Record<string, unknown> }).data = {};
  return snapshot;
}

/** Builds a RouterStateSnapshot whose .url equals the supplied string. */
function makeState(url: string): RouterStateSnapshot {
  return { url } as RouterStateSnapshot;
}

/** Invokes authGuard inside the active injection context and resolves the result. */
async function runGuard(url: string): Promise<boolean> {
  const route = makeRoute(url);
  const state = makeState(url);

  const result = TestBed.runInInjectionContext(() =>
    authGuard(route, state),
  ) as Observable<boolean>;

  return firstValueFrom(result);
}

// ---------------------------------------------------------------------------
// Test setup
// ---------------------------------------------------------------------------

/** Creates a mock AuthService where isAuthenticated() returns the given value. */
function buildMockAuthService(isAuthenticated: boolean): Partial<AuthService> {
  return {
    // isAuthenticated is a computed() in the real service — expose it as a function
    isAuthenticated: (() => isAuthenticated) as unknown as AuthService['isAuthenticated'],
    refreshSession: () => throwError(() => new Error('no session')),
  };
}

beforeEach(() => {
  TestBed.configureTestingModule({
    providers: [
      AuthGateService,
      {
        provide: AuthService,
        useValue: buildMockAuthService(false), // overridden per-suite as needed
      },
    ],
  });
});

afterEach(() => {
  TestBed.resetTestingModule();
});

// ---------------------------------------------------------------------------
// Property 4: Auth-gate preserves navigation intent
// Validates: Requirements 9.1, 9.7
// ---------------------------------------------------------------------------

describe('Property 4: Auth-gate preserves navigation intent', () => {
  /**
   * For every URL in the protected set, when the user is unauthenticated and
   * refreshSession() fails, authGuard must:
   *   1. Return false (not a UrlTree redirect).
   *   2. Set AuthGateService.pendingFeature() to a non-null string.
   *   3. Set AuthGateService.returnUrl() to exactly the attempted URL.
   */
  it('blocks unauthenticated access: returns false, sets pendingFeature and returnUrl', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...PROTECTED_URLS),
        async (url) => {
          // Each run needs a fresh TestBed so signals start clean.
          TestBed.resetTestingModule();
          TestBed.configureTestingModule({
            providers: [
              AuthGateService,
              {
                provide: AuthService,
                useValue: buildMockAuthService(false),
              },
            ],
          });

          const authGateService = TestBed.inject(AuthGateService);

          const result = await runGuard(url);

          // 1. Must return false — no UrlTree redirect
          expect(result).toBe(false);

          // 2. pendingFeature must be set to a non-null, non-empty string
          const feature = authGateService.pendingFeature();
          expect(feature).not.toBeNull();
          expect(typeof feature).toBe('string');
          expect((feature as string).length).toBeGreaterThan(0);

          // 3. returnUrl must equal the attempted URL
          expect(authGateService.returnUrl()).toBe(url);
        },
      ),
      { numRuns: PROTECTED_URLS.length }, // one run per URL — deterministic
    );
  });

  it('sets a descriptive feature name for each known protected route', async () => {
    const expectedFeatures: Record<string, string> = {
      '/app/workouts/history': 'Workout History',
      '/app/workouts/abc123': 'Workout Details',
      '/app/plan': 'Training Plan',
      '/app/progress': 'Progress Analytics',
    };

    for (const [url, expectedFeature] of Object.entries(expectedFeatures)) {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          AuthGateService,
          {
            provide: AuthService,
            useValue: buildMockAuthService(false),
          },
        ],
      });

      const authGateService = TestBed.inject(AuthGateService);

      await runGuard(url);

      expect(authGateService.pendingFeature()).toBe(expectedFeature);
    }
  });
});

// ---------------------------------------------------------------------------
// Property 5: Existing authenticated flows unchanged
// Validates: Requirements 23.1, 23.2
// ---------------------------------------------------------------------------

describe('Property 5: Existing authenticated flows unchanged', () => {
  /**
   * For every previously protected route, when the user IS authenticated,
   * authGuard must return true synchronously without touching AuthGateService.
   */
  it('allows authenticated users through every protected route', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...PROTECTED_URLS),
        async (url) => {
          TestBed.resetTestingModule();
          TestBed.configureTestingModule({
            providers: [
              AuthGateService,
              {
                provide: AuthService,
                useValue: buildMockAuthService(true),
              },
            ],
          });

          const authGateService = TestBed.inject(AuthGateService);

          // Guard returns true synchronously for authenticated users (not an Observable).
          const rawResult = TestBed.runInInjectionContext(() =>
            authGuard(makeRoute(url), makeState(url)),
          );

          // The guard short-circuits with a synchronous `return true` when authenticated.
          expect(rawResult).toBe(true);

          // AuthGateService must NOT be touched
          expect(authGateService.pendingFeature()).toBeNull();
          expect(authGateService.returnUrl()).toBe('');
        },
      ),
      { numRuns: PROTECTED_URLS.length },
    );
  });

  it('does not mutate AuthGateService when already authenticated', async () => {
    // Seed the signals with existing values to verify they are not overwritten.
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        AuthGateService,
        {
          provide: AuthService,
          useValue: buildMockAuthService(true),
        },
      ],
    });

    const authGateService = TestBed.inject(AuthGateService);
    authGateService.pendingFeature.set('Prior Feature');
    authGateService.returnUrl.set('/prior/url');

    for (const url of PROTECTED_URLS) {
      TestBed.runInInjectionContext(() => authGuard(makeRoute(url), makeState(url)));
    }

    // Pre-existing signal values must be untouched
    expect(authGateService.pendingFeature()).toBe('Prior Feature');
    expect(authGateService.returnUrl()).toBe('/prior/url');
  });
});
