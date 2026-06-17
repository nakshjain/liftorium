import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'app'
  },
  {
    path: 'auth',
    canActivate: [guestGuard],
    loadChildren: () => import('./features/auth/auth.routes').then((module) => module.authRoutes)
  },
  {
    path: 'app/workout',
    // No authGuard — accessible to guests
    loadComponent: () =>
      import('./features/workouts/live-workout-page/live-workout-page').then((module) => module.LiveWorkoutPageComponent)
  },
  {
    path: 'app/workouts/history',
    canActivate: [authGuard],
    data: { feature: 'Workout History' },
    loadComponent: () =>
      import('./features/workouts/workout-history-page/workout-history-page').then((m) => m.WorkoutHistoryPageComponent)
  },
  {
    path: 'app/workouts/:workoutId',
    canActivate: [authGuard],
    data: { feature: 'Workout Details' },
    loadComponent: () =>
      import('./features/workouts/workout-detail-page/workout-detail-page').then((m) => m.WorkoutDetailPageComponent)
  },
  {
    path: 'app/exercises',
    // No authGuard — accessible to guests
    loadChildren: () => import('./features/exercises/exercises.routes').then((m) => m.exercisesRoutes)
  },
  {
    path: 'app/plan',
    canActivate: [authGuard],
    data: { feature: 'Training Plan' },
    loadComponent: () =>
      import('./features/plan/plan-page/plan-page').then((m) => m.PlanPageComponent)
  },
  {
    path: 'app/progress',
    canActivate: [authGuard],
    data: { feature: 'Progress Analytics' },
    loadChildren: () =>
      import('./features/progress/progress.routes').then((m) => m.progressRoutes)
  },
  {
    path: 'app',
    // No authGuard — Dashboard is the public default
    loadComponent: () =>
      import('./features/dashboard/dashboard-page/dashboard-page').then((module) => module.DashboardPageComponent)
  },
  {
    path: '**',
    redirectTo: 'app'
  }
];
