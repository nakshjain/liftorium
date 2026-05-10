import { Routes } from '@angular/router';
import { LoginPageComponent } from './login-page/login-page';
import { SignupPageComponent } from './signup-page/signup-page';

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
