import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'auth/login'
  },
  {
    path: 'auth',
    canActivate: [guestGuard],
    loadChildren: () => import('./features/auth/auth.routes').then((module) => module.authRoutes)
  },
  {
    path: 'app/workout',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/workouts/live-workout-page.component').then((module) => module.LiveWorkoutPageComponent)
  },
  {
    path: 'app',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/dashboard-page.component').then((module) => module.DashboardPageComponent)
  },
  {
    path: '**',
    redirectTo: 'auth/login'
  }
];
