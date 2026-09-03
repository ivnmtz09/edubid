import { Routes } from '@angular/router';

export const AUTH_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./components/register/register.component').then(m => m.RegisterComponent),
  },
  {
    path: 'verify-email/:token',
    loadComponent: () =>
      import('./components/verify-email/verify-email.component').then(m => m.VerifyEmailComponent),
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./components/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent),
  },
  {
    path: 'reset-password/:uidb64/:token',
    loadComponent: () =>
      import('./components/reset-password/reset-password.component').then(m => m.ResetPasswordComponent),
  },
  {
    path: 'completar-perfil',
    loadComponent: () =>
      import('./components/complete-profile/complete-profile.component').then(m => m.CompleteProfileComponent),
  },
];
