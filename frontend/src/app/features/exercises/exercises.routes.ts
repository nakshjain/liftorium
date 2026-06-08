import { Routes } from '@angular/router';

export const exercisesRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./exercises-page/exercises-page').then((m) => m.ExercisesPageComponent)
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./exercise-detail-page/exercise-detail-page').then((m) => m.ExerciseDetailPageComponent)
  }
];
