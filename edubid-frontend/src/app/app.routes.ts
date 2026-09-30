import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: 'EduBid',
    loadComponent: () =>
      import('./features/home/home.component').then(m => m.HomeComponent),
  },
  {
    path: 'login',
    title: 'Iniciar Sesión | EduBid',
    loadComponent: () =>
      import('./features/auth/components/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'register',
    title: 'Registro | EduBid',
    loadComponent: () =>
      import('./features/auth/components/register/register.component').then(m => m.RegisterComponent),
  },
  {
    path: 'verify-email/:token',
    title: 'Verificar Correo | EduBid',
    loadComponent: () =>
      import('./features/auth/components/verify-email/verify-email.component').then(m => m.VerifyEmailComponent),
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
        title: 'Panel Principal | EduBid',
        loadComponent: () =>
          import('./features/dashboard/components/dashboard.component').then(m => m.DashboardComponent),
      },
      {
        path: 'rector',
        title: 'Panel de Rectoría | EduBid',
        canActivate: [roleGuard(['rector'])],
        loadComponent: () =>
          import('./features/dashboard/components/rector-dashboard/rector-dashboard.component').then(m => m.RectorDashboardComponent),
      },
    ],
  },
  {
    path: 'classrooms',
    canActivate: [authGuard, roleGuard(['docente', 'rector', 'coordinador'])],
    loadComponent: () =>
      import('./shared/components/layout/layout.component').then(m => m.LayoutComponent),
    children: [
      {
        path: '',
        title: 'Mis Clases | EduBid',
        loadComponent: () =>
          import('./features/classrooms/components/classrooms.component').then(m => m.ClassroomsComponent),
      },
      {
        path: ':id',
        title: 'Detalle de Clase | EduBid',
        loadComponent: () =>
          import('./features/classrooms/components/classroom-detail.component').then(m => m.ClassroomDetailComponent),
      },
    ],
  },
  {
    path: 'clases',
    redirectTo: 'classrooms',
  },
  {
    path: 'groups',
    canActivate: [authGuard, roleGuard(['estudiante', 'docente', 'rector', 'coordinador'])],
    loadComponent: () =>
      import('./shared/components/layout/layout.component').then(m => m.LayoutComponent),
    children: [
      {
        path: '',
        title: 'Mis Grupos | EduBid',
        loadComponent: () =>
          import('./features/groups/components/student-groups.component').then(m => m.StudentGroupsComponent),
      },
    ],
  },
  {
    path: 'grupos',
    redirectTo: 'groups',
  },
  {
    path: 'activities',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./shared/components/layout/layout.component').then(m => m.LayoutComponent),
    children: [
      {
        path: '',
        title: 'Actividades | EduBid',
        loadComponent: () =>
          import('./features/activities/activities.component').then(m => m.ActivitiesComponent),
      },
    ],
  },
  {
    path: 'actividades',
    redirectTo: 'activities',
  },
  {
    path: 'auctions',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./shared/components/layout/layout.component').then(m => m.LayoutComponent),
    children: [
      {
        path: '',
        title: 'Subastas | EduBid',
        loadComponent: () =>
          import('./features/auctions/auctions.component').then(m => m.AuctionsComponent),
      },
    ],
  },
  {
    path: 'subastas',
    redirectTo: 'auctions',
  },
  {
    path: 'wallet',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./shared/components/layout/layout.component').then(m => m.LayoutComponent),
    children: [
      {
        path: '',
        title: 'Mi Wallet | EduBid',
        loadComponent: () =>
          import('./features/wallet/wallet.component').then(m => m.WalletComponent),
      },
    ],
  },
  {
    path: 'billetera',
    redirectTo: 'wallet',
  },
  {
    path: 'grades',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./shared/components/layout/layout.component').then(m => m.LayoutComponent),
    children: [
      {
        path: '',
        title: 'Calificaciones | EduBid',
        loadComponent: () =>
          import('./features/grades/grades.component').then(m => m.GradesComponent),
      },
    ],
  },
  {
    path: 'calificaciones',
    redirectTo: 'grades',
  },
  {
    path: 'sobre-nosotros',
    title: 'Sobre Nosotros | EduBid',
    loadComponent: () =>
      import('./features/about/about.component').then(m => m.AboutComponent),
  },
  {
    path: 'about',
    redirectTo: 'sobre-nosotros',
  },
  {
    path: 'terminos-y-condiciones',
    title: 'Términos y Condiciones | EduBid',
    loadComponent: () =>
      import('./features/terms/terms.component').then(m => m.TermsComponent),
  },
  {
    path: 'terminos',
    redirectTo: 'terminos-y-condiciones',
  },
  {
    // Ruta directa para nuevos usuarios Google sin institución asignada
    path: 'completar-perfil',
    title: 'Completar Perfil | EduBid',
    loadComponent: () =>
      import('./features/auth/components/complete-profile/complete-profile.component').then(
        m => m.CompleteProfileComponent
      ),
  },
  {
    // Confirmación de registro: el usuario debe verificar su correo
    path: 'email-sent',
    title: 'Verifica tu correo | EduBid',
    loadComponent: () =>
      import('./features/auth/components/email-sent/email-sent.component').then(
        m => m.EmailSentComponent
      ),
  },
  {
    path: '404',
    title: 'Página no encontrada | EduBid',
    loadComponent: () =>
      import('./features/not-found/not-found.component').then(m => m.NotFoundComponent),
  },
  {
    path: '**',
    title: 'Página no encontrada | EduBid',
    loadComponent: () =>
      import('./features/not-found/not-found.component').then(m => m.NotFoundComponent),
  },
];
