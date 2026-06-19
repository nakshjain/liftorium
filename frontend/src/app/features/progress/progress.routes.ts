import { Routes } from '@angular/router';

export const progressRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./progress-page/progress-page').then((m) => m.ProgressPageComponent),
  },
  {
    path: 'exercises/:exerciseId',
    loadComponent: () =>
      import('./exercise-progression-page/exercise-progression-page').then(
        (m) => m.ExerciseProgressionPageComponent
      ),
  },
];
