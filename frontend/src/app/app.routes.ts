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
      import('./features/workouts/live-workout-page/live-workout-page').then((module) => module.LiveWorkoutPageComponent)
  },
  {
    path: 'app/workouts/history',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/workouts/workout-history-page/workout-history-page').then((m) => m.WorkoutHistoryPageComponent)
  },
  {
    path: 'app/workouts/:workoutId',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/workouts/workout-detail-page/workout-detail-page').then((m) => m.WorkoutDetailPageComponent)
  },
  {
    path: 'app/exercises',
    canActivate: [authGuard],
    loadChildren: () => import('./features/exercises/exercises.routes').then((m) => m.exercisesRoutes)
  },
  {
    path: 'app/plan',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/plan/plan-page/plan-page').then((m) => m.PlanPageComponent)
  },
  {
    path: 'app',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/dashboard-page/dashboard-page').then((module) => module.DashboardPageComponent)
  },
  {
    path: '**',
    redirectTo: 'auth/login'
  }
];
