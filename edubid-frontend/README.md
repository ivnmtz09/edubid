# 🅰️ EduBid Frontend — Angular 19+ SPA

> **Interfaz moderna, reactiva y gamificada para EduBid** | Arquitectura Standalone, Signals, Tailwind CSS 4.x y Flowbite

[![Framework: Angular](https://img.shields.io/badge/Angular-19%2B-DD0031?style=flat-square&logo=angular)](https://angular.dev/)
[![CSS: Tailwind v4](https://img.shields.io/badge/Tailwind_CSS-4.x-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Components: Flowbite](https://img.shields.io/badge/UI-Flowbite-1C64F2?style=flat-square&logo=flowbite)](https://flowbite.com/)
[![Language: TypeScript](https://img.shields.io/badge/Language-TypeScript%205.x-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](../LICENSE)

---

## 📋 Descripción

Este proyecto constituye la aplicación cliente (Single Page Application) de **EduBid**, diseñada para brindar una experiencia de usuario fluida, accesible y gamificada en instituciones educativas. La interfaz interactúa con la API REST de Django mediante autenticación JWT segura y consumo eficiente de datos.

### 🌟 Principales Características

- **⚡ Angular Standalone & Signals**: Arquitectura moderna sin `NgModules`, optimizada para rendimiento y gestión reactiva del estado con Signals.
- **🎨 White-Labeling & Theming Dinámico**: `ThemeService` con soporte para modo Claro / Oscuro / Sistema y personalización en tiempo real de colores institucionales (`--brand-primary`, `--brand-accent`) según el tenant del colegio.
- **🔐 Autenticación Segura & SSR-Safe**: Control de sesión con JWT (access/refresh tokens), rotación automática mediante `HttpInterceptor`, login con Google OAuth (Google Identity Services) y manejo seguro de almacenamiento local.
- **🛡️ Control de Acceso por Roles (RBAC)**: Enrutamiento protegido mediante `authGuard` y `roleGuard` adaptado a los 5 roles: `admin`, `rector`, `coordinador`, `docente` y `estudiante`.
- **🔔 Notificaciones y Feedback**: Integración de alertas reactivas con `NotificationService` y toasts con `ngx-toastr`.
- **📱 Diseño Adaptativo**: Totalmente responsivo mediante Tailwind CSS 4 y componentes estilizados con Flowbite.

---

## 📁 Estructura del Proyecto

```
edubid-frontend/
├── src/
│   ├── app/
│   │   ├── core/                        # Núcleo de la aplicación (Singletons)
│   │   │   ├── services/                # AuthService, ThemeService, NotificationService
│   │   │   ├── guards/                  # auth.guard, role.guard
│   │   │   ├── interceptors/            # auth.interceptor (JWT + auto-refresh)
│   │   │   ├── models/                  # Interfaces y tipos TypeScript (User, Tokens, etc.)
│   │   │   └── constants/               # Mapeo de rutas y endpoints de la API
│   │   ├── shared/                      # Módulos compartidos reutilizables
│   │   │   ├── components/              # Layout (Header, Sidebar), UI atoms, Patterns
│   │   │   ├── pipes/                   # Pipes de utilidad (ej. time-ago)
│   │   │   └── directives/              # Directivas (ej. click-outside)
│   │   ├── features/                    # Módulos de negocio (Lazy Loaded)
│   │   │   ├── home/                    # Landing page principal
│   │   │   ├── about/                   # Información institucional y misión
│   │   │   ├── auth/                    # Login, Registro, Recuperación, Verificación
│   │   │   ├── dashboard/               # Paneles por rol (Docente, Estudiante, Rector)
│   │   │   ├── classrooms/              # Aulas académicas
│   │   │   ├── groups/                  # Grupos de clase
│   │   │   ├── activities/              # Retos, misiones, proyectos y entregas
│   │   │   ├── auctions/                # Subastas y pujas de incentivos
│   │   │   ├── wallet/                  # Billetera digital y transacciones EduCoins
│   │   │   ├── profile/                 # Perfil de usuario y ajustes
│   │   │   ├── notifications/           # Bandeja de alertas y eventos
│   │   │   ├── terms/                   # Términos y condiciones
│   │   │   └── not-found/               # Página de error 404 personalizada
│   │   ├── app.routes.ts                # Configuración principal de enrutamiento
│   │   ├── app.config.ts                # Providers globales de la aplicación
│   │   └── app.ts                       # Componente raíz con inicialización de temas
│   ├── environments/                    # Variables de entorno
│   │   ├── environment.ts               # Desarrollo local
│   │   ├── environment.prod.ts          # Producción
│   │   └── environment.example.ts       # Plantilla de ejemplo
│   ├── styles.scss                      # Importación de Tailwind CSS y variables raíz
│   └── main.ts                          # Bootstrap standalone
├── angular.json                         # Configuración de compilación Angular
├── proxy.conf.json                      # Proxy local para redirigir peticiones a Django
├── .env.example                         # Plantilla de variables de entorno
└── package.json
```

---

## 🚀 Instalación y Puesta en Marcha

### Prerrequisitos

- **Node.js**: v18.0 o superior (recomendado v20 LTS / v22)
- **npm**: v9.0 o superior
- **Angular CLI**: v19+ (opcional pero recomendado: `npm install -g @angular/cli`)

### 1. Instalar dependencias

```bash
cd edubid-frontend
npm install
```

### 2. Configurar Variables de Entorno

Copia el archivo `.env.example` como `.env` y define tus credenciales locales:

```bash
cp .env.example .env
```

Contenido de `.env`:
```env
API_BASE_URL=http://localhost:8000/api
GOOGLE_CLIENT_ID=TU_GOOGLE_CLIENT_ID.apps.googleusercontent.com
PRODUCTION_API_URL=https://edubid-backend-production.up.railway.app/api
```

> [!NOTE]
> Al ejecutar `npm start`, `npm run build` o `npm run config:env`, el script `scripts/set-env.js` lee automáticamente `.env` y genera `src/environments/environment.ts` y `environment.prod.ts`. Estos dos archivos están protegidos en `.gitignore` para evitar filtraciones de credenciales en el repositorio.

### 3. Ejecutar el Servidor de Desarrollo

```bash
npm start
# o alternativamente:
ng serve
```

La aplicación estará disponible en: **`http://localhost:4200`**

El servidor recargará automáticamente los módulos al guardar cambios en el código fuente.

---

## 🛠️ Scripts Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm start` | Inicia el servidor de desarrollo en `http://localhost:4200` |
| `npm run build` | Compila la aplicación para producción en la carpeta `dist/` |
| `npm run watch` | Compila y escucha cambios continuos en modo desarrollo |
| `npm test` | Ejecuta las pruebas unitarias mediante Vitest |

---

## 🔗 Integración con el Backend

El frontend se comunica con el backend Django a través de:
- **Base URL**: `http://localhost:8000/api` (o vía `proxy.conf.json` en `/api`)
- **Autenticación**: Cabecera `Authorization: Bearer <access_token>` inyectada automáticamente por el interceptor HTTP.
- **Multi-Tenant**: El objeto del usuario logueado provee `institucion` (nombre, logo y colores primario/secundario), aplicados dinámicamente al DOM por `ThemeService`.

---

## 📄 Licencia

Este proyecto está bajo la licencia MIT.
