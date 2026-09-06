# 🅰️ EduBid Frontend — Angular 19+ SPA

> **Interfaz moderna, reactiva y gamificada para EduBid** | Arquitectura Standalone, Signals, Tailwind CSS 4.x, Flowbite & Multi-Tenant White-Labeling

[![Framework: Angular](https://img.shields.io/badge/Angular-19%2B-DD0031?style=flat-square&logo=angular)](https://angular.dev/)
[![CSS: Tailwind v4](https://img.shields.io/badge/Tailwind_CSS-4.x-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Components: Flowbite](https://img.shields.io/badge/UI-Flowbite-1C64F2?style=flat-square&logo=flowbite)](https://flowbite.com/)
[![Icons: SVG Flowbite](https://img.shields.io/badge/Icons-Flowbite%20%2B%20Heroicons-darkblue?style=flat-square)](https://flowbite.com/icons/)
[![Language: TypeScript](https://img.shields.io/badge/Language-TypeScript%205.x-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](../LICENSE)

---

## 📋 Descripción

Este proyecto constituye la aplicación cliente (*Single Page Application*) de **EduBid**, construida en Angular 19 con componentes Standalone, Signals para gestión reactiva de estado y Tailwind CSS 4 para estilización de alto rendimiento.

La plataforma implementa un ecosistema educativo gamificado donde las calificaciones y el mérito académico se traducen en **EduCoins**, habilitando un centro de subastas de incentivos, billeteras virtuales en tiempo real y personalización visual multi-inquilino (*White-Labeling*).

---

## 🌟 Principales Características

- **⚡ Angular Standalone & Signals**: Arquitectura limpia y reactiva sin módulos (`NgModule`), reduciendo boilerplate y optimizando la detección de cambios mediante `signal()`, `computed()` y `effect()`.
- **👑 5 Paneles (Dashboards) Adaptativos por Rol**:
  - **SuperAdmin (`AdminDashboardComponent`)**: Ámbito global (sin institución). Dispone de un selector dinámico de instituciones para auditar en tiempo real cualquier colegio, directorio interactivo de instituciones con métricas agregadas, asistente de creación/edición de colegios con paletas cromáticas o códigos HEX personalizados, y administración global de usuarios con filtros por rol y estado.
  - **Rector (`RectorDashboardComponent`)**: Panel institucional directivo con métricas de profesores, estudiantes, clases activas y volumen de EduCoins. Incorpora el módulo `InstitutionBrandingComponent` para personalizar logotipo escolar y paleta cromática (`--brand-primary`, `--brand-accent`).
  - **Coordinador (`CoordinatorDashboardComponent`)**: Supervisión pedagógica, monitoreo de clases, docentes asignados y avance de grupos escolares.
  - **Docente (`TeacherDashboardComponent`)**: Gestión de aulas y asignaturas, métricas de grupos, accesos directos a actividades por calificar y subastas en curso.
  - **Estudiante (`StudentDashboardComponent`)**: Billetera interactiva (saldo disponible, saldo retenido en pujas), subastas en vivo para pujar, actividades pendientes de entrega y calificaciones recientes con desglose de EduCoins ganados.
- **🏛️ Jerarquía Académica (Clases -> Grupos -> Unión por Código)**:
  - **Docente**: Crea Aulas (`Classroom`) y dentro de ellas organiza Grupos escolares (`Group`). El sistema genera códigos de unión alfanuméricos únicos de 6 caracteres (ej. `ABC-123`).
  - **Estudiante**: Vista `StudentGroupsComponent` para consultar sus grupos inscritos y modal para ingresar el código de invitación. Al unirse, el sistema le provisiona automáticamente su billetera (`Wallet`) vinculada al grupo y período académico activo.
- **🎨 White-Labeling & Theming Dinámico (`ThemeService`)**: Soporte para modo Claro / Oscuro / Sistema y personalización en tiempo real inyectando `--brand-primary` y `--brand-accent` en el elemento raíz del DOM según el tenant del colegio logueado.
- **📐 Arquitectura de Layout con Scroll Independiente (`LayoutComponent`)**: Barra lateral `aside` fija con navegación adaptada por rol e independencia de desplazamiento vertical respecto a la columna principal (`header`, `main content`, `footer`).
- **🛡️ Estandarización Visual e Identidad de Marca**:
  - Reemplazo total de emojis por iconografía vectorial estándar SVG (Flowbite Icons y Heroicons).
  - Integración del logotipo oficial `edubid.png` y favicon `edubid.ico`.
  - Header adaptativo que muestra "EduBid Admin" para superadministradores o la identidad y escudo del colegio para usuarios vinculados.
- **🔐 Seguridad y Control de Acceso (RBAC)**:
  - Manejo de sesión con JWT (`access` y `refresh` tokens), rotación transparente mediante `authInterceptor`, soporte SSO con Google Identity Services y guards de ruta funcionales (`authGuard`, `roleGuard`).
  - Garantía en frontend y backend de que el rol `admin` mantenga `institucion = null`, suprimiendo la exigencia de completar perfil institucional y habilitando el selector global.

---

## 📁 Estructura del Proyecto

```
edubid-frontend/
├── public/                                  # Recursos estáticos de identidad de marca
│   ├── edubid.png                           # Logotipo oficial EduBid
│   ├── edubid.ico                           # Favicon corporativo
│   ├── favicon.svg                          # Favicon vectorial SVG
│   └── favicon.ico                          # Favicon estándar
│
├── src/
│   ├── app/
│   │   ├── core/                            # Núcleo de la aplicación (Singletons)
│   │   │   ├── services/                    # Servicios de comunicación con la API:
│   │   │   │   ├── auth.service.ts          # Autenticación JWT, estado de sesión, Signals
│   │   │   │   ├── google-auth.service.ts   # Integración SDK Google Identity Services
│   │   │   │   ├── theme.service.ts         # Control de temas (Light/Dark) y White-Labeling
│   │   │   │   ├── notification.service.ts  # Feedback visual y toasts
│   │   │   │   ├── dashboard.service.ts     # Métricas y analítica agregada
│   │   │   │   ├── institution.service.ts   # CRUD de instituciones y branding
│   │   │   │   ├── user.service.ts          # Gestión de usuarios del sistema
│   │   │   │   ├── classroom.service.ts     # Aulas y asignaturas del docente
│   │   │   │   ├── group.service.ts         # Grupos, códigos de unión y estudiantes
│   │   │   │   ├── activity.service.ts      # Actividades, misiones y entregas
│   │   │   │   ├── grade.service.ts         # Calificaciones y EduCoins
│   │   │   │   ├── auction.service.ts       # Subastas y sistema de pujas
│   │   │   │   └── wallet.service.ts        # Billeteras y transacciones de tokens
│   │   │   ├── guards/                      # Guards funcionales
│   │   │   │   ├── auth.guard.ts            # Protección de rutas autenticadas
│   │   │   │   └── role.guard.ts            # Control de acceso por rol (RBAC)
│   │   │   ├── interceptors/                # Interceptores HTTP
│   │   │   │   └── auth.interceptor.ts      # Inyección de Bearer Token y auto-refresh 401
│   │   │   ├── models/                      # Interfaces TypeScript estrictas
│   │   │   └── constants/                   # Endpoints y claves de localStorage
│   │   │
│   │   ├── shared/                          # Componentes reutilizables
│   │   │   ├── components/                  # Layout (Aside sidebar, Header, Footer),
│   │   │   │                                # institution-branding (White-label)
│   │   │   └── ui/                          # Spinners, loading-screen, modales
│   │   │
│   │   ├── features/                        # Vistas y módulos de negocio (Lazy-loaded):
│   │   │   ├── home/                        # Landing page con estado dinámico de sesión
│   │   │   ├── about/                       # Sobre EduBid y misión formativa
│   │   │   ├── terms/                       # Términos y condiciones de uso
│   │   │   ├── not-found/                   # Página 404 personalizada
│   │   │   ├── auth/                        # Login, Register, Complete Profile, Email Sent
│   │   │   ├── dashboard/                   # Componente orquestador y 5 dashboards por rol:
│   │   │   │   ├── admin-dashboard/         # Selector de colegios, directorio, branding y usuarios
│   │   │   │   ├── rector-dashboard/        # Analítica directiva y White-Labeling institucional
│   │   │   │   ├── coordinator-dashboard/   # Supervisión de grupos y avance académico
│   │   │   │   ├── teacher-dashboard/       # Aulas, grupos y subastas del docente
│   │   │   │   └── student-dashboard/       # Wallet, pujas activas, notas y actividades
│   │   │   ├── classrooms/                  # Mis Clases y Detalle con grupos anidados
│   │   │   ├── groups/                      # Vista de grupos para estudiantes y unión por código
│   │   │   ├── activities/                  # Retos y entregas
│   │   │   ├── auctions/                    # Centro de subastas y pujas
│   │   │   ├── wallet/                      # Billetera digital y transacciones
│   │   │   └── profile/                     # Perfil de usuario y avatar
│   │   │
│   │   ├── app.routes.ts                    # Matriz de rutas de la SPA
│   │   ├── app.config.ts                    # Providers globales (HttpClient, Animations, Toastr)
│   │   └── app.component.ts                 # Shell raíz de la aplicación
│   │
│   ├── environments/                        # Configuraciones de entorno
│   │   ├── environment.ts                   # Desarrollo local
│   │   ├── environment.prod.ts              # Producción
│   │   └── environment.example.ts           # Plantilla base
│   │
│   ├── styles.scss                          # Importación de Tailwind CSS 4 y variables CSS
│   └── main.ts                              # Punto de entrada y bootstrap standalone
│
├── scripts/
│   └── set-env.js                           # Generador automático de environments desde .env
├── angular.json                             # Configuración del compilador Angular CLI
├── proxy.conf.json                          # Proxy de desarrollo para redirección a Django
├── .env.example                             # Plantilla de variables frontend
└── package.json
```

---

## 🧭 Matriz de Rutas y Permisos

| Ruta | Componente | Acceso / Guard | Descripción |
|------|------------|----------------|-------------|
| `/` | `HomeComponent` | Público | Landing page con llamado a la acción condicional según sesión |
| `/login` | `LoginComponent` | Público | Inicio de sesión con correo y Google SSO |
| `/register` | `RegisterComponent` | Público | Registro de estudiantes o docentes con selección de institución |
| `/email-sent` | `EmailSentComponent` | Público | Pantalla de confirmación tras registro |
| `/completar-perfil` | `CompleteProfileComponent` | Autenticado | Asignación de institución para nuevos usuarios Google |
| `/dashboard` | `DashboardComponent` | `authGuard` | Orquestador reactivo que renderiza el dashboard según el rol |
| `/dashboard/rector` | `RectorDashboardComponent` | `authGuard` + `roleGuard(['rector'])` | Vista directa del panel directivo del colegio |
| `/classrooms` | `ClassroomsComponent` | `authGuard` + `roleGuard(['docente', 'rector', 'coordinador'])` | Gestión de asignaturas y aulas escolares |
| `/classrooms/:id` | `ClassroomDetailComponent` | `authGuard` + `roleGuard(['docente', 'rector', 'coordinador'])` | Detalle del aula con grupos, retos y subastas |
| `/groups` | `StudentGroupsComponent` | `authGuard` + `roleGuard(['estudiante', 'docente', 'rector', 'coordinador'])` | Directorio de grupos inscritos y unión mediante código |
| `/sobre-nosotros` | `AboutComponent` | Público | Información institucional del proyecto EduBid |
| `/terminos-y-condiciones`| `TermsComponent` | Público | Términos de servicio y privacidad |
| `**` | `NotFoundComponent` | Público | Vista de página no encontrada (404) |

---

## 🚀 Instalación y Puesta en Marcha

### Prerrequisitos

- **Node.js**: v18.0 o superior (recomendado v20 LTS / v22)
- **npm**: v9.0 o superior
- **Angular CLI**: v19+ (`npm install -g @angular/cli`)

### 1. Instalar dependencias

```bash
cd edubid-frontend
npm install
```

### 2. Configurar Variables de Entorno

Copia la plantilla de configuración `.env.example`:

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
> Al iniciar el servidor con `npm start` o compilar con `npm run build`, el script `scripts/set-env.js` genera dinámicamente `src/environments/environment.ts` y `environment.prod.ts`. Ambos archivos se encuentran protegidos en `.gitignore` para salvaguardar credenciales.

### 3. Iniciar el Servidor de Desarrollo

```bash
npm start
# o con Angular CLI:
ng serve
```

La aplicación estará disponible en: **`http://localhost:4200`**

---

## 🛠️ Scripts Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm start` | Genera environments e inicia el servidor de desarrollo en `http://localhost:4200` |
| `npm run build` | Compila la aplicación optimizada para producción en `dist/` |
| `npm run watch` | Compilación continua con recarga en modo desarrollo |
| `npm test` | Ejecuta las pruebas unitarias automatizadas |
| `npm run config:env` | Ejecuta manualmente la sincronización del archivo `.env` hacia environments |

---

## 📄 Licencia

Este proyecto se encuentra bajo la licencia **MIT**. Consulta el archivo [LICENSE](../LICENSE) para más información.
