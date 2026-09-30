import { Routes } from '@angular/router';

export const AUTH_ROUTES: Routes = [
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    redirectTo: '/login',
    pathMatch: 'full',
  },
  {
    path: 'register',
    redirectTo: '/register',
    pathMatch: 'full',
  },
  {
    path: 'verify-email/:token',
    title: 'Verificar Correo | EduBid',
    loadComponent: () =>
      import('./components/verify-email/verify-email.component').then(m => m.VerifyEmailComponent),
  },
  {
    path: 'forgot-password',
    title: 'Recuperar Contraseña | EduBid',
    loadComponent: () =>
      import('./components/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent),
  },
  {
    path: 'reset-password/:uidb64/:token',
    title: 'Restablecer Contraseña | EduBid',
    loadComponent: () =>
      import('./components/reset-password/reset-password.component').then(m => m.ResetPasswordComponent),
  },
  {
    path: 'completar-perfil',
    title: 'Completar Perfil | EduBid',
    loadComponent: () =>
      import('./components/complete-profile/complete-profile.component').then(m => m.CompleteProfileComponent),
  },
];
