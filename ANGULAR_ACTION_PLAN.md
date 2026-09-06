# ANGULAR_ACTION_PLAN.md — Plan de Acción: Frontend Angular 19

> **Proyecto:** EduBid — Plataforma educativa gamificada
> **Stack objetivo:** Angular 19+ (Standalone, Signals, TypeScript estricto) + Tailwind CSS 4.x + Flowbite
> **Backend:** Django REST Framework + SimpleJWT
> **Estado:** ✅ **Completado y en Producción** — Migración completa de React a Angular 19+ Standalone con Signals, Tailwind CSS 4, Flowbite y Flowbite SVG Icons. Implementación integral de los 5 Dashboards (Admin, Rector, Coordinador, Docente, Estudiante), jerarquía académica (Clases -> Grupos -> Unión por código con provisión de Wallet), White-Labeling dinámico, layout con scroll desacoplado y blindaje RBAC estricto.

---

## Tabla de Contenidos

1. [Paso 0: Eliminación del Frontend React y Scaffolding Angular](#paso-0-eliminación-del-frontend-react-y-scaffolding-angular)
2. [Paso 1: Configuración Base (Tailwind + Environments)](#paso-1-configuración-base-tailwind--environments)
3. [Paso 2: Estructura de Carpetas SaaS](#paso-2-estructura-de-carpetas-saas)
4. [Paso 3: Módulo de Autenticación (Auth Feature)](#paso-3-módulo-de-autenticación-auth-feature)
5. [Paso 4: Código Inicial — AuthService y Auth Interceptor](#paso-4-código-inicial--authservice-y-auth-interceptor)

---

## Paso 0: Eliminación del Frontend React y Scaffolding Angular

### 0.1 Eliminar la carpeta edubid-frontend (React legacy)

```bash
# Verificar que estamos en la raíz del proyecto
cd /home/ivnmtz09/Proyectos/edubid

# Eliminar la carpeta completa del frontend React
rm -rf edubid-frontend
```

### 0.2 Verificar Angular CLI instalado

```bash
# Si no está instalado globalmente
npm install -g @angular/cli

# Verificar versión (debe ser 19+)
ng version
```

### 0.3 Crear proyecto Angular desde cero

```bash
# Generar nuevo proyecto Angular con:
#   - SCSS como preprocesador de estilos
#   - Routing habilitado
#   - SSR deshabilitado (SPA puro)
#   - Skip git (ya estamos en un repo)
#   - Strict mode habilitado
ng new edubid-frontend --style=scss --routing --ssr=false --skip-git --skip-tests=false

# Navegar al directorio
cd edubid-frontend
```

> **Nota:** El directorio `edubid-frontend` se recrea con el mismo nombre que el React eliminado.

### 0.4 Verificar que el proyecto compila

```bash
ng serve --open
# El servidor de desarrollo arranca en http://localhost:4200
# Ctrl+C para detener
```

---

## Paso 1: Configuración Base (Tailwind + Environments)

### 1.1 Instalar y configurar Tailwind CSS 4.x

```bash
# Instalar Tailwind CSS y dependencias PostCSS
npm install -D tailwindcss @tailwindcss/postcss postcss autoprefixer

# Crear archivo de configuración PostCSS
cat > postcss.config.js << 'EOF'
module.exports = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
EOF
```

**Configurar Tailwind en SCSS principal** — Editar `src/styles.scss`:

```scss
@import "tailwindcss";

/* === Variables CSS globales === */
:root {
  --brand-primary: #f97316;
  --brand-primary-hover: #ea580c;
  --brand-accent: #3b82f6;
  --brand-accent-hover: #2563eb;

  --color-bg: #ffffff;
  --color-surface: #f8fafc;
  --color-text: #0f172a;
  --color-text-muted: #64748b;
  --color-border: #e2e8f0;
}

.dark {
  --color-bg: #0f172a;
  --color-surface: #1e293b;
  --color-text: #f1f5f9;
  --color-text-muted: #94a3b8;
  --color-border: #334155;
}

/* === Brand colors via Tailwind === */
@theme {
  --color-primary: var(--brand-primary);
  --color-primary-hover: var(--brand-primary-hover);
  --color-accent: var(--brand-accent);
  --color-accent-hover: var(--brand-accent-hover);
  --color-surface: var(--color-surface);
  --color-bg: var(--color-bg);
}

body {
  @apply bg-bg text-text font-sans antialiased;
}
```

### 1.2 Configurar Environment files para el Backend

Crear `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000/api',
  googleClientId: 'TU_GOOGLE_CLIENT_ID.apps.googleusercontent.com',
};
```

Crear `src/environments/environment.prod.ts`:

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://edubid-backend-production.up.railway.app/api',
  googleClientId: 'TU_GOOGLE_CLIENT_ID.apps.googleusercontent.com',
};
```

### 1.3 Configurar proxy para desarrollo (equivalente a vite.config.js)

Crear `proxy.conf.json` en la raíz del proyecto:

```json
{
  "/api": {
    "target": "http://localhost:8000",
    "secure": false,
    "changeOrigin": true
  },
  "/media": {
    "target": "http://localhost:8000",
    "secure": false,
    "changeOrigin": true
  }
}
```

Actualizar `angular.json` → `serve.options.proxyConfig`:

```json
"serve": {
  "builder": "@angular-devkit/build-angular:dev-server",
  "options": {
    "proxyConfig": "proxy.conf.json"
  }
}
```

### 1.4 Instalar dependencias adicionales

```bash
# Iconos
npm install @ng-icons/core @ng-icons/heroicons

# Toast notifications
npm install ngx-toastr

# Google OAuth (Identity Services)
npm install @abacritt/angularx-google-login
```

---

## Paso 2: Estructura de Carpetas SaaS

```
src/
├── app/
│   ├── app.component.ts                  ← Root component (standalone)
│   ├── app.config.ts                     ← Bootstrap config (providers)
│   ├── app.routes.ts                     ← Definición de rutas
│   │
│   ├── core/                             ← Servicios singulares, guards, interceptors
│   │   ├── services/
│   │   │   ├── auth.service.ts           ← Login, register, logout, refresh, profile
│   │   │   ├── theme.service.ts          ← Dark/light mode + inyección de colores tenant
│   │   │   └── notification.service.ts   ← Service para notificaciones
│   │   ├── guards/
│   │   │   ├── auth.guard.ts             ← CanActivateFn — protege rutas privadas
│   │   │   └── role.guard.ts             ← CanActivateFn — protección por rol
│   │   ├── interceptors/
│   │   │   └── auth.interceptor.ts       ← HttpInterceptorFn — JWT + refresh token
│   │   ├── models/
│   │   │   └── user.model.ts             ← Interfaces: User, LoginResponse, etc.
│   │   └── constants/
│   │       └── api.constants.ts          ← Endpoints mapeados del backend
│   │
│   ├── shared/                           ← Componentes reutilizables + pipes + directivas
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── layout.component.ts   ← Shell: Sidebar + Header + <router-outlet>
│   │   │   │   ├── sidebar.component.ts  ← Navegación lateral por rol
│   │   │   │   └── header.component.ts   ← Barra superior + notificaciones
│   │   │   ├── ui/
│   │   │   │   ├── button.component.ts
│   │   │   │   ├── input.component.ts
│   │   │   │   ├── modal.component.ts
│   │   │   │   ├── loading-spinner.component.ts
│   │   │   │   └── institution-select.component.ts
│   │   │   └── patterns/
│   │   │       ├── hero-pattern.component.ts
│   │   │       └── particles-background.component.ts
│   │   ├── pipes/
│   │   │   └── time-ago.pipe.ts
│   │   └── directives/
│   │       └── click-outside.directive.ts
│   │
│   └── features/                         ← Módulos de negocio (lazy-loaded)
│       ├── auth/
│       │   ├── auth.routes.ts            ← Rutas del módulo auth
│       │   ├── components/
│       │   │   ├── login/
│       │   │   │   ├── login.component.ts
│       │   │   │   └── login.component.html
│       │   │   ├── register/
│       │   │   │   ├── register.component.ts
│       │   │   │   └── register.component.html
│       │   │   ├── complete-profile/
│       │   │   │   ├── complete-profile.component.ts
│       │   │   │   └── complete-profile.component.html
│       │   │   ├── verify-email/
│       │   │   │   ├── verify-email.component.ts
│       │   │   │   └── verify-email.component.html
│       │   │   ├── forgot-password/
│       │   │   │   ├── forgot-password.component.ts
│       │   │   │   └── forgot-password.component.html
│       │   │   └── reset-password/
│       │   │       ├── reset-password.component.ts
│       │   │       └── reset-password.component.html
│       │   └── services/
│       │       └── auth-api.service.ts    ← Llamadas HTTP específicas de auth
│       │
│       ├── dashboard/
│       │   ├── dashboard.routes.ts
│       │   ├── components/
│       │   │   ├── dashboard.component.ts
│       │   │   ├── teacher-dashboard/
│       │   │   └── student-dashboard/
│       │   └── services/
│       │
│       ├── classrooms/
│       ├── groups/
│       ├── activities/
│       ├── auctions/
│       ├── wallet/
│       ├── profile/
│       └── notifications/
│
├── environments/
│   ├── environment.ts
│   └── environment.prod.ts
│
├── styles.scss                          ← Estilos globales + Tailwind
├── index.html
└── main.ts                              ← Bootstrap standalone
```

---

## Paso 3: Módulo de Autenticación (Auth Feature)

### 3.1 Modelos (Interfaces TypeScript)

**`core/models/user.model.ts`**

```typescript
export interface UserInstitution {
  id: number;
  nombre: string;
  color_primario: string;
  color_secundario: string;
  logo: string | null;
}

export interface UserProfile {
  bio: string | null;
  telefono: string | null;
  direccion: string | null;
  fecha_nacimiento: string | null;
  institucion: UserInstitution | null;
}

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  avatar: string | null;
  date_joined: string;
  profile: UserProfile;
}

export type UserRole = 'admin' | 'rector' | 'coordinador' | 'docente' | 'estudiante';

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  user: User;
  tokens: AuthTokens;
}

export interface RegisterRequest {
  first_name: string;
  last_name: string;
  email: string;
  institution?: number;
  role: UserRole;
  password: string;
  password_confirm: string;
}

export interface RegisterResponse {
  message: string;
  email: string;
  verification_required: boolean;
  user_id: number;
}

export interface GoogleLoginRequest {
  id_token: string;
}

export interface EmailVerificationResponse {
  message: string;
  user: User;
  tokens: AuthTokens;
}

export interface TokenRefreshRequest {
  refresh: string;
}

export interface TokenRefreshResponse {
  access: string;
}

export interface PublicInstitution {
  id: number;
  nombre: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirmRequest {
  new_password: string;
  confirm_password: string;
}
```

### 3.2 Constantes de endpoints

**`core/constants/api.constants.ts`**

```typescript
import { environment } from '../../../environments/environment';

export const API_BASE = environment.apiUrl;

export const AUTH_ENDPOINTS = {
  REGISTER: `${API_BASE}/users/register/`,
  LOGIN: `${API_BASE}/users/login/`,
  GOOGLE_LOGIN: `${API_BASE}/users/google/`,
  TOKEN_REFRESH: `${API_BASE}/users/token/refresh/`,
  VERIFY_EMAIL: (token: string) => `${API_BASE}/users/verify-email/${token}/`,
  RESEND_VERIFICATION: `${API_BASE}/users/resend-verification/`,
  PROFILE: `${API_BASE}/users/profile/`,
  PROFILE_UPDATE: `${API_BASE}/users/profile/update/`,
  DELETE_ACCOUNT: `${API_BASE}/users/delete-account/`,
  CHANGE_PASSWORD: `${API_BASE}/users/change-password/`,
  PASSWORD_RESET: `${API_BASE}/users/password-reset/`,
  PASSWORD_RESET_CONFIRM: (uidb64: string, token: string) =>
    `${API_BASE}/users/password-reset-confirm/${uidb64}/${token}/`,
  INSTITUTIONS_PUBLIC: `${API_BASE}/institutions/public/`,
} as const;

export const USER_ROLES = {
  ADMIN: 'admin',
  RECTOR: 'rector',
  COORDINATOR: 'coordinador',
  TEACHER: 'docente',
  STUDENT: 'estudiante',
} as const;

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user',
  THEME: 'edubid-theme',
} as const;
```

### 3.3 Rutas del módulo Auth

**`features/auth/auth.routes.ts`**

```typescript
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
```

### 3.4 Configuración de rutas principales

**`app.routes.ts`**

```typescript
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
  // ... más rutas lazy-loaded para groups, activities, auctions, wallet, profile
  {
    path: '**',
    redirectTo: '',
  },
];
```

### 3.5 Guards funcionales

**`core/guards/auth.guard.ts`**

```typescript
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/']);
};
```

**`core/guards/role.guard.ts`**

```typescript
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/user.model';

export const roleGuard = (allowedRoles: UserRole[]): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const user = authService.currentUser();

    if (user && allowedRoles.includes(user.role)) {
      return true;
    }

    return router.createUrlTree(['/dashboard']);
  };
};
```

### 3.6 LoginComponent (Reactive Forms)

**`features/auth/components/login/login.component.ts`**

```typescript
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  loginForm: FormGroup;
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  showPasswordResetSuggestion = signal(false);
  emailNotVerified = signal(false);
  notVerifiedEmail = signal('');

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.showPasswordResetSuggestion.set(false);
    this.emailNotVerified.set(false);

    this.authService.login(this.loginForm.value).subscribe({
      next: () => {
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        const body = err.error;

        if (body?.email_not_verified) {
          this.emailNotVerified.set(true);
          this.notVerifiedEmail.set(body.email);
          return;
        }

        if (body?.suggest_password_reset) {
          this.showPasswordResetSuggestion.set(true);
        }

        this.errorMessage.set(body?.message || 'Credenciales inválidas');
      },
    });
  }

  loginWithGoogle(idToken: string): void {
    this.isLoading.set(true);
    this.authService.loginWithGoogle(idToken).subscribe({
      next: () => this.isLoading.set(false),
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || 'Error con Google');
      },
    });
  }
}
```

**`features/auth/components/login/login.component.html`**

```html
<div class="min-h-screen flex">
  <!-- Lado izquierdo: Showcase / Branding -->
  <div class="hidden lg:flex lg:w-1/2 bg-primary items-center justify-center">
    <div class="text-center text-white p-12">
      <h1 class="text-5xl font-bold mb-4">EduBid</h1>
      <p class="text-xl opacity-90">Gamificación educativa con EduCoins</p>
    </div>
  </div>

  <!-- Lado derecho: Formulario -->
  <div class="w-full lg:w-1/2 flex items-center justify-center p-8">
    <div class="w-full max-w-md">
      <h2 class="text-3xl font-bold mb-6">Iniciar Sesión</h2>

      <!-- Error general -->
      @if (errorMessage()) {
        <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {{ errorMessage() }}
        </div>
      }

      <!-- Email no verificado -->
      @if (emailNotVerified()) {
        <div class="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded mb-4">
          <p>Por favor verifica tu correo electrónico antes de iniciar sesión.</p>
          <button class="underline text-sm mt-1">Reenviar verificación</button>
        </div>
      }

      <!-- Sugerencia reset password -->
      @if (showPasswordResetSuggestion()) {
        <div class="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded mb-4">
          <p>¿Olvidaste tu contraseña?</p>
          <a routerLink="/forgot-password" class="underline text-sm">Restablecer contraseña</a>
        </div>
      }

      <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="space-y-4">
        <div>
          <label for="email" class="block text-sm font-medium mb-1">Correo electrónico</label>
          <input
            id="email"
            type="email"
            formControlName="email"
            class="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary"
            placeholder="tu@email.com"
          />
        </div>

        <div>
          <label for="password" class="block text-sm font-medium mb-1">Contraseña</label>
          <input
            id="password"
            type="password"
            formControlName="password"
            class="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          [disabled]="loginForm.invalid || isLoading()"
          class="w-full bg-primary hover:bg-primary-hover text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
        >
          @if (isLoading()) {
            <span>Cargando...</span>
          } @else {
            Iniciar Sesión
          }
        </button>
      </form>

      <p class="mt-6 text-center text-sm text-muted">
        ¿No tienes cuenta?
        <a routerLink="/register" class="text-primary hover:underline">Regístrate</a>
      </p>
    </div>
  </div>
</div>
```

### 3.7 RegisterComponent (Reactive Forms)

**`features/auth/components/register/register.component.ts`**

```typescript
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { PublicInstitution } from '../../../../core/models/user.model';
import { AUTH_ENDPOINTS } from '../../../../core/constants/api.constants';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
})
export class RegisterComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private http = inject(HttpClient);

  registerForm: FormGroup;
  institutions = signal<PublicInstitution[]>([]);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  showTermsModal = signal(false);

  constructor() {
    this.registerForm = this.fb.group(
      {
        first_name: ['', [Validators.required]],
        last_name: ['', [Validators.required]],
        email: ['', [Validators.required, Validators.email]],
        institution: ['', [Validators.required]],
        role: ['estudiante', [Validators.required]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        password_confirm: ['', [Validators.required]],
        accept_terms: [false, [Validators.requiredTrue]],
      },
      { validators: this.passwordMatchValidator }
    );
  }

  ngOnInit(): void {
    this.loadInstitutions();
  }

  passwordMatchValidator(control: AbstractControl): { [key: string]: boolean } | null {
    const password = control.get('password');
    const confirm = control.get('password_confirm');
    if (password && confirm && password.value !== confirm.value) {
      confirm.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  }

  loadInstitutions(): void {
    this.http.get<{ results: PublicInstitution[] }>(AUTH_ENDPOINTS.INSTITUTIONS_PUBLIC)
      .subscribe({
        next: (res) => this.institutions.set(res.results),
        error: () => {},
      });
  }

  onSubmit(): void {
    if (this.registerForm.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const formValue = this.registerForm.value;

    this.authService.register({
      first_name: formValue.first_name,
      last_name: formValue.last_name,
      email: formValue.email,
      institution: formValue.institution,
      role: formValue.role,
      password: formValue.password,
      password_confirm: formValue.password_confirm,
    }).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/email-sent']);
      },
      error: (err) => {
        this.isLoading.set(false);
        const errors = err.error?.errors;
        if (errors) {
          const firstKey = Object.keys(errors)[0];
          this.errorMessage.set(errors[firstKey][0]);
        } else {
          this.errorMessage.set(err.error?.message || 'Error al registrarse');
        }
      },
    });
  }
}
```

**`features/auth/components/register/register.component.html`**

```html
<div class="min-h-screen flex items-center justify-center p-8 bg-surface">
  <div class="w-full max-w-lg">
    <div class="text-center mb-8">
      <h1 class="text-4xl font-bold text-primary">EduBid</h1>
      <h2 class="text-2xl font-semibold mt-4">Crear Cuenta</h2>
    </div>

    @if (errorMessage()) {
      <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
        {{ errorMessage() }}
      </div>
    }

    <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="space-y-4">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium mb-1">Nombre</label>
          <input
            type="text"
            formControlName="first_name"
            class="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Apellido</label>
          <input
            type="text"
            formControlName="last_name"
            class="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium mb-1">Correo electrónico</label>
        <input
          type="email"
          formControlName="email"
          class="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary"
        />
      </div>

      <div>
        <label class="block text-sm font-medium mb-1">Institución</label>
        <select formControlName="institution" class="w-full px-4 py-2 border border-border rounded-lg">
          <option value="">Selecciona tu institución</option>
          @for (inst of institutions(); track inst.id) {
            <option [value]="inst.id">{{ inst.nombre }}</option>
          }
        </select>
      </div>

      <div>
        <label class="block text-sm font-medium mb-1">Rol</label>
        <div class="flex gap-4">
          <label class="flex items-center gap-2">
            <input type="radio" formControlName="role" value="estudiante" class="text-primary" />
            Estudiante
          </label>
          <label class="flex items-center gap-2">
            <input type="radio" formControlName="role" value="docente" class="text-primary" />
            Docente
          </label>
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium mb-1">Contraseña</label>
        <input
          type="password"
          formControlName="password"
          class="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary"
        />
        @if (registerForm.get('password')?.touched && registerForm.get('password')?.hasError('minlength')) {
          <p class="text-red-500 text-sm mt-1">Mínimo 6 caracteres</p>
        }
      </div>

      <div>
        <label class="block text-sm font-medium mb-1">Confirmar contraseña</label>
        <input
          type="password"
          formControlName="password_confirm"
          class="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary"
        />
        @if (registerForm.get('password_confirm')?.hasError('passwordMismatch')) {
          <p class="text-red-500 text-sm mt-1">Las contraseñas no coinciden</p>
        }
      </div>

      <div class="flex items-start gap-2">
        <input type="checkbox" formControlName="accept_terms" class="mt-1" />
        <span class="text-sm">
          Acepto los
          <button type="button" (click)="showTermsModal.set(true)" class="text-primary underline">
            términos y condiciones
          </button>
        </span>
      </div>

      <button
        type="submit"
        [disabled]="registerForm.invalid || isLoading()"
        class="w-full bg-primary hover:bg-primary-hover text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
      >
        @if (isLoading()) {
          <span>Creando cuenta...</span>
        } @else {
          Crear Cuenta
        }
      </button>
    </form>

    <p class="mt-6 text-center text-sm text-muted">
      ¿Ya tienes cuenta?
      <a routerLink="/" class="text-primary hover:underline">Iniciar Sesión</a>
    </p>
  </div>
</div>
```

---

## Paso 4: Código Inicial — AuthService y Auth Interceptor

### 4.1 AuthService

**`core/services/auth.service.ts`**

```typescript
import { Injectable, inject, signal, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, Subject, tap, catchError, throwError, switchMap, of } from 'rxjs';
import {
  User,
  AuthTokens,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  GoogleLoginRequest,
  TokenRefreshResponse,
  UserRole,
} from '../models/user.model';
import { AUTH_ENDPOINTS, STORAGE_KEYS, USER_ROLES } from '../constants/api.constants';
import { ThemeService } from './theme.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private ngZone = inject(NgZone);
  private themeService = inject(ThemeService);

  // Signals reactivos
  private _user = signal<User | null>(null);
  private _isAuthenticated = signal<boolean>(false);
  private _isLoading = signal<boolean>(false);

  // Exposición readonly
  readonly currentUser = this._user.asReadonly();
  readonly isAuthenticated = this._isAuthenticated.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();

  // Subject para logout global (interceptor)
  private logoutSubject = new Subject<void>();
  logout$ = this.logoutSubject.asObservable();

  constructor() {
    this.loadUserFromStorage();
  }

  // ==================== MÉTODOS PÚBLICOS ====================

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(AUTH_ENDPOINTS.LOGIN, credentials).pipe(
      tap((res) => this.handleAuthSuccess(res)),
      catchError((err) => {
        this.handleAuthError(err);
        return throwError(() => err);
      })
    );
  }

  loginWithGoogle(idToken: string): Observable<LoginResponse> {
    const body: GoogleLoginRequest = { id_token: idToken };
    return this.http.post<LoginResponse>(AUTH_ENDPOINTS.GOOGLE_LOGIN, body).pipe(
      tap((res) => {
        this.handleAuthSuccess(res);
        // Si no tiene institución, redirigir a completar perfil
        if (!res.user.profile?.institucion) {
          this.router.navigate(['/completar-perfil']);
        }
      }),
      catchError((err) => {
        this.handleAuthError(err);
        return throwError(() => err);
      })
    );
  }

  register(data: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(AUTH_ENDPOINTS.REGISTER, data);
  }

  logout(): void {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    this._user.set(null);
    this._isAuthenticated.set(false);
    this.router.navigate(['/']);
  }

  logoutAndNotify(): void {
    this.logout();
    this.logoutSubject.next();
  }

  refreshAccessToken(): Observable<TokenRefreshResponse> {
    const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token'));
    }

    return this.http.post<TokenRefreshResponse>(AUTH_ENDPOINTS.TOKEN_REFRESH, {
      refresh: refreshToken,
    });
  }

  getProfile(): Observable<{ user: User }> {
    return this.http.get<{ user: User }>(AUTH_ENDPOINTS.PROFILE).pipe(
      tap((res) => {
        this._user.set(res.user);
        this.storeUser(res.user);
      })
    );
  }

  // ==================== GETTERS ====================

  getToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  }

  getUserRole(): UserRole | null {
    return this._user()?.role ?? null;
  }

  // ==================== MÉTODOS PRIVADOS ====================

  private handleAuthSuccess(res: LoginResponse): void {
    this.storeTokens(res.tokens);
    this.storeUser(res.user);
    this._user.set(res.user);
    this._isAuthenticated.set(true);
    this.themeService.injectBrandColors(res.user.profile?.institucion ?? null);
    this.navigateByRole(res.user.role);
  }

  private handleAuthError(err: any): void {
    // Errores manejados por el componente
  }

  private storeTokens(tokens: AuthTokens): void {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.access);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refresh);
  }

  private storeUser(user: User): void {
    const safeUser = this.sanitizeUser(user);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(safeUser));
  }

  private sanitizeUser(user: User): Partial<User> {
    const { ...safeUser } = user;
    return safeUser;
  }

  private loadUserFromStorage(): void {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    const userJson = localStorage.getItem(STORAGE_KEYS.USER);

    if (token && userJson) {
      try {
        const user = JSON.parse(userJson) as User;
        this._user.set(user);
        this._isAuthenticated.set(true);
        this.themeService.injectBrandColors(user.profile?.institucion ?? null);
      } catch {
        this.logout();
      }
    }
  }

  private navigateByRole(role: UserRole): void {
    const routeMap: Record<UserRole, string[]> = {
      [USER_ROLES.ADMIN]: ['/dashboard'],
      [USER_ROLES.RECTOR]: ['/dashboard/rector'],
      [USER_ROLES.COORDINATOR]: ['/dashboard'],
      [USER_ROLES.TEACHER]: ['/dashboard'],
      [USER_ROLES.STUDENT]: ['/dashboard'],
    };
    const target = routeMap[role] ?? ['/dashboard'];
    this.ngZone.run(() => this.router.navigate(target));
  }
}
```

### 4.2 Auth Interceptor

**`core/interceptors/auth.interceptor.ts`**

```typescript
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError, Subject, filter, take } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { STORAGE_KEYS, AUTH_ENDPOINTS } from '../constants/api.constants';

// Flag global para evitar múltiples refresh simultáneos
let isRefreshing = false;
const refreshSubject = new Subject<string>();

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // No inyectar token en endpoints públicos
  if (isPublicEndpoint(req.url)) {
    return next(req);
  }

  // Agregar token al request
  const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  let authReq = req;
  if (token) {
    authReq = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Si es 401 y no es el request de refresh ni un retry
      if (error.status === 401 && !req.url.includes('token/refresh') && !req.urlWithParams.includes('_retry=true')) {
        return handle401Error(req, next, authService, router);
      }

      // Si es 403, redirigir al dashboard
      if (error.status === 403) {
        router.navigate(['/dashboard']);
      }

      return throwError(() => error);
    })
  );
};

function handle401Error(
  req: any,
  next: any,
  authService: AuthService,
  router: Router
) {
  if (!isRefreshing) {
    isRefreshing = true;

    const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

    if (!refreshToken) {
      isRefreshing = false;
      authService.logoutAndNotify();
      return throwError(() => new Error('No refresh token'));
    }

    return authService.refreshAccessToken().pipe(
      switchMap((tokenRes) => {
        isRefreshing = false;
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokenRes.access);

        // Notificar a otros requests en espera
        refreshSubject.next(tokenRes.access);
        refreshSubject.complete();

        // Reintentar request original con nuevo token
        const retryReq = req.clone({
          setHeaders: { Authorization: `Bearer ${tokenRes.access}` },
          urlWithParams: req.urlWithParams + (req.urlWithParams.includes('?') ? '&' : '?') + '_retry=true',
        });

        return next(retryReq);
      }),
      catchError((refreshError) => {
        isRefreshing = false;
        refreshSubject.error(refreshError);
        authService.logoutAndNotify();
        return throwError(() => refreshError);
      })
    );
  }

  // Si ya se está refrescando, esperar el nuevo token
  return refreshSubject.pipe(
    filter((token) => !!token),
    take(1),
    switchMap((newToken) => {
      const retryReq = req.clone({
        setHeaders: { Authorization: `Bearer ${newToken}` },
      });
      return next(retryReq);
    })
  );
}

function isPublicEndpoint(url: string): boolean {
  const publicPaths = [
    '/users/login/',
    '/users/register/',
    '/users/google/',
    '/users/token/refresh/',
    '/users/verify-email/',
    '/users/password-reset/',
    '/users/password-reset-confirm/',
    '/institutions/public/',
  ];
  return publicPaths.some((path) => url.includes(path));
}
```

### 4.3 Configuración de Providers en app.config.ts

**`app.config.ts`**

```typescript
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideToastr } from 'ngx-toastr';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAnimations(),
    provideToastr({
      timeOut: 3000,
      positionClass: 'toast-bottom-right',
      preventDuplicates: true,
    }),
  ],
};
```

### 4.4 ThemeService (referencia para AuthService)

**`core/services/theme.service.ts`**

```typescript
import { Injectable, signal } from '@angular/core';
import { UserInstitution } from '../models/user.model';
import { STORAGE_KEYS } from '../constants/api.constants';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private _isDark = signal<boolean>(this.loadInitialTheme());

  readonly isDark = this._isDark.asReadonly();

  constructor() {
    this.applyTheme();
  }

  toggleTheme(): void {
    this._isDark.set(!this._isDark());
    localStorage.setItem(STORAGE_KEYS.THEME, this._isDark() ? 'dark' : 'light');
    this.applyTheme();
  }

  injectBrandColors(institution: UserInstitution | null): void {
    const root = document.documentElement;

    if (!institution?.color_primario) {
      root.style.removeProperty('--brand-primary');
      root.style.removeProperty('--brand-primary-hover');
      root.style.removeProperty('--brand-accent');
      root.style.removeProperty('--brand-accent-hover');
      return;
    }

    const primary = institution.color_primario || '#f97316';
    const accent = institution.color_secundario || '#3b82f6';

    root.style.setProperty('--brand-primary', primary);
    root.style.setProperty('--brand-primary-hover', this.darkenHex(primary));
    root.style.setProperty('--brand-accent', accent);
    root.style.setProperty('--brand-accent-hover', this.darkenHex(accent));
  }

  private applyTheme(): void {
    document.documentElement.classList.toggle('dark', this._isDark());
  }

  private loadInitialTheme(): boolean {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME);
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  private darkenHex(hex: string): string {
    const rgb = this.hexToRgb(hex);
    if (!rgb) return hex;
    const darken = (c: number) => Math.max(0, Math.floor(c * 0.85));
    return `#${darken(rgb.r).toString(16).padStart(2, '0')}${darken(rgb.g).toString(16).padStart(2, '0')}${darken(rgb.b).toString(16).padStart(2, '0')}`;
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
      : null;
  }
}
```

---

## Resumen de Archivos a Crear (Paso 1)

| # | Archivo | Propósito |
|---|---------|-----------|
| 1 | `core/models/user.model.ts` | Interfaces TypeScript para usuarios y auth |
| 2 | `core/constants/api.constants.ts` | Endpoints del backend Django |
| 3 | `core/services/auth.service.ts` | Servicio principal de autenticación |
| 4 | `core/services/theme.service.ts` | Gestión de temas y colores del tenant |
| 5 | `core/interceptors/auth.interceptor.ts` | Interceptor JWT + refresh automático |
| 6 | `core/guards/auth.guard.ts` | Guard para rutas protegidas |
| 7 | `core/guards/role.guard.ts` | Guard para protección por rol |
| 8 | `features/auth/auth.routes.ts` | Rutas lazy-loaded del módulo auth |
| 9 | `features/auth/components/login/login.component.ts` | Componente de login |
| 10 | `features/auth/components/login/login.component.html` | Template del login |
| 11 | `features/auth/components/register/register.component.ts` | Componente de registro |
| 12 | `features/auth/components/register/register.component.html` | Template del registro |
| 13 | `app.config.ts` | Configuración de providers |
| 14 | `app.routes.ts` | Rutas principales de la app |
| 15 | `proxy.conf.json` | Proxy para desarrollo (API → Django) |

---

## Paso 5: Resumen de Ejecución y Logros de Arquitectura

La migración React → Angular 19+ ha sido completada exitosamente, alcanzando todas las metas técnicas y operativas del proyecto:

### 🎯 Hitos Completados

1. **Arquitectura Standalone & Signals Reactivos**:
   - Eliminación total de la base de código legacy en React.
   - Migración al modelo Standalone de Angular 19+, simplificando la inyección de dependencias y eliminando `NgModule`.
   - Reactividad declarativa utilizando `signal()`, `computed()` y `effect()`.

2. **Catálogo Completo de Servicios Core**:
   - `AuthService` & `GoogleAuthService`: Gestión de sesión JWT, rotación automática mediante `authInterceptor`, autenticación Google Identity Services y control RBAC.
   - `ThemeService`: Conmutador de temas Claro / Oscuro / Sistema e inyección dinámica de CSS variables (`--brand-primary`, `--brand-accent`) para el White-Labeling institucional.
   - `NotificationService`: Notificaciones reactivas y toasts con `ngx-toastr`.
   - Servicios de dominio integrados: `ClassroomService`, `GroupService`, `ActivityService`, `GradeService`, `AuctionService`, `WalletService`, `InstitutionService`, `UserService` y `DashboardService`.

3. **5 Dashboards Adaptativos por Rol (`DashboardComponent`)**:
   - **SuperAdmin (`AdminDashboardComponent`)**: Ámbito global estricto (`institucion = null`), selector de colegios en tiempo real, directorio interactivo con búsqueda, creador/editor de instituciones con paletas y gestión global de miembros.
   - **Rector (`RectorDashboardComponent`)**: Supervisión ejecutiva, analítica escolar y personalización de marca con `InstitutionBrandingComponent`.
   - **Coordinador (`CoordinatorDashboardComponent`)**: Supervisión académica de grupos, docentes y rendimiento.
   - **Docente (`TeacherDashboardComponent`)**: Métricas de asignaturas, grupos, accesos a actividades por calificar y subastas.
   - **Estudiante (`StudentDashboardComponent`)**: Billetera virtual de EduCoins, actividades pendientes, historial de calificaciones y ofertas en subastas.

4. **Jerarquía Académica Clases -> Grupos**:
   - Implementación del flujo `Classroom` (Aula / Asignatura) -> `Group` (Salón escolar con código de unión alfanumérico).
   - Vista `StudentGroupsComponent` que permite a los estudiantes listar sus grupos e ingresar códigos (ej. `ABC-123`), enrolándose automáticamente y provisionando su `Wallet` para el período activo.

5. **Layout y Experiencia Visual Profesional**:
   - Layout desacoplado con barra lateral `aside` fija con scroll independiente y columna principal autónoma (`header`, `main`, `footer`).
   - Reemplazo total de emojis por iconografía SVG estándar de Flowbite y Heroicons.
   - Marca oficial unificada mediante `public/edubid.png` y `public/edubid.ico`.

---

*Plan de acción completado y ejecutado exitosamente en el proyecto EduBid.*
