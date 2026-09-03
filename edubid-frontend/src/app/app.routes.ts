import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
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
    path: '**',
    redirectTo: '',
  },
];
