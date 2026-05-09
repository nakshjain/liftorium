import { Routes } from '@angular/router';
import { LoginPageComponent } from './login-page.component';
import { SignupPageComponent } from './signup-page.component';

export const authRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'login'
  },
  {
    path: 'login',
    component: LoginPageComponent
  },
  {
    path: 'signup',
    component: SignupPageComponent
  }
];
