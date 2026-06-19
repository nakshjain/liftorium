/**
 * Property 8: Dashboard is always the unauthenticated landing page
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4
 *
 * Structural test — reads the routes array directly, no Angular Router setup needed.
 */
import { Route } from '@angular/router';
import { routes } from './app.routes';

describe('Property 8: Dashboard is always the unauthenticated landing page', () => {
  function findRoute(path: string): Route | undefined {
    return routes.find((r) => r.path === path);
  }

  it('root path redirects to app (Requirement 1.1)', () => {
    const root = findRoute('');
    expect(root).toBeDefined();
    expect(root!.redirectTo).toBe('app');
  });

  it('wildcard redirects to app (Requirement 1.2)', () => {
    const wildcard = findRoute('**');
    expect(wildcard).toBeDefined();
    expect(wildcard!.redirectTo).toBe('app');
  });

  it('Dashboard (/app) has no canActivate auth guard (Requirement 1.3)', () => {
    const dashboard = findRoute('app');
    expect(dashboard).toBeDefined();
    const guards = dashboard!.canActivate ?? [];
    expect(guards.length).toBe(0);
  });

  it('Workout (/app/workout) and Exercises (/app/exercises) have no canActivate guard (Requirement 1.4)', () => {
    const workout = findRoute('app/workout');
    expect(workout).toBeDefined();
    expect((workout!.canActivate ?? []).length).toBe(0);

    const exercises = findRoute('app/exercises');
    expect(exercises).toBeDefined();
    expect((exercises!.canActivate ?? []).length).toBe(0);
  });
});
