import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthGateService } from './auth-gate.service';
import { AuthService } from './auth.service';

function deriveFeatureName(route: ActivatedRouteSnapshot, url: string): string {
  if (route.data?.['feature']) {
    return route.data['feature'] as string;
  }

  if (url.startsWith('/app/workouts/history')) return 'Workout History';
  if (url.startsWith('/app/workouts/')) return 'Workout Details';
  if (url.startsWith('/app/plan')) return 'Training Plan';
  if (url.startsWith('/app/progress')) return 'Progress Analytics';

  return 'This Feature';
}

export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const authService = inject(AuthService);
  const authGateService = inject(AuthGateService);

  if (authService.isAuthenticated()) {
    return true;
  }

  return authService.refreshSession().pipe(
    map(() => true),
    catchError(() => {
      authGateService.returnUrl.set(state.url);
      authGateService.pendingFeature.set(deriveFeatureName(route, state.url));
      return of(false);
    })
  );
};

export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return router.createUrlTree(['/app']);
  }

  return true;
};
