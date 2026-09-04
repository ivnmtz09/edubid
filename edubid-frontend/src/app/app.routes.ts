import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./features/home/home.component').then(m => m.HomeComponent),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/components/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/components/register/register.component').then(m => m.RegisterComponent),
  },
  {
    path: 'auth',
    loadChildren: () =>
      import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./shared/components/layout/layout.component').then(m => m.LayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/dashboard/components/dashboard.component').then(m => m.DashboardComponent),
      },
      {
        path: 'rector',
        canActivate: [roleGuard(['rector'])],
        loadComponent: () =>
          import('./features/dashboard/components/rector-dashboard/rector-dashboard.component').then(m => m.RectorDashboardComponent),
      },
    ],
  },
  {
    path: 'classrooms',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./shared/components/layout/layout.component').then(m => m.LayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/classrooms/components/classrooms.component').then(m => m.ClassroomsComponent),
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./features/classrooms/components/classroom-detail.component').then(m => m.ClassroomDetailComponent),
      },
    ],
  },
  {
    path: 'sobre-nosotros',
    loadComponent: () =>
      import('./features/about/about.component').then(m => m.AboutComponent),
  },
  {
    path: 'about',
    redirectTo: 'sobre-nosotros',
  },
  {
    path: 'terminos-y-condiciones',
    loadComponent: () =>
      import('./features/terms/terms.component').then(m => m.TermsComponent),
  },
  {
    path: 'terminos',
    redirectTo: 'terminos-y-condiciones',
  },
  {
    path: '404',
    loadComponent: () =>
      import('./features/not-found/not-found.component').then(m => m.NotFoundComponent),
  },
  {
    path: '**',
    loadComponent: () =>
      import('./features/not-found/not-found.component').then(m => m.NotFoundComponent),
  },
];
