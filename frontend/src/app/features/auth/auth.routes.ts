import { Routes } from '@angular/router';
import { LoginPageComponent } from './login-page/login-page';
import { SignupPageComponent } from './signup-page/signup-page';
import { ForgotPasswordPageComponent } from './forgot-password-page/forgot-password-page';

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
  },
  {
    path: 'forgot-password',
    component: ForgotPasswordPageComponent
  }
];
