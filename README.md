# 🎓 EduBid — Gamificación Educativa & Microeconomía SaaS

> **Transformando la motivación en el aula** | Plataforma SaaS Multi-Tenant de economía gamificada y subastas académicas para instituciones educativas.

[![Backend: Django 5.2](https://img.shields.io/badge/Backend-Django%205.2-darkgreen?style=flat-square&logo=django)](https://www.djangoproject.com/)
[![API: Django REST Framework](https://img.shields.io/badge/API-DRF%203.16-red?style=flat-square)](https://www.django-rest-framework.org/)
[![Frontend: Angular 19+](https://img.shields.io/badge/Frontend-Angular%2019%2B-DD0031?style=flat-square&logo=angular)](https://angular.dev/)
[![Styles: Tailwind CSS 4](https://img.shields.io/badge/Styles-Tailwind%204.x-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![UI: Flowbite](https://img.shields.io/badge/UI-Flowbite-1C64F2?style=flat-square&logo=flowbite)](https://flowbite.com/)
[![Database: MySQL 8.0](https://img.shields.io/badge/Database-MySQL%208.0-orange?style=flat-square&logo=mysql)](https://www.mysql.com/)
[![Auth: SimpleJWT + Google](https://img.shields.io/badge/Auth-JWT%20%2B%20OAuth2-purple?style=flat-square)](https://jwt.io/)
[![Multi--Tenant: White--Label](https://img.shields.io/badge/Architecture-SaaS%20White--Label-blueviolet?style=flat-square)](#-arquitectura-saas-multi-tenant--white-labeling)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

---

## 📋 Tabla de Contenidos

- [Descripción y Propuesta de Valor](#-descripción-y-propuesta-de-valor)
- [Arquitectura SaaS Multi-Tenant & White-Labeling](#-arquitectura-saas-multi-tenant--white-labeling)
- [Roles y Control de Acceso (RBAC)](#-roles-y-control-de-acceso-rbac)
- [Características Principales](#-características-principales)
- [Stack Tecnológico](#-stack-tecnológico)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Guía de Instalación y Puesta en Marcha](#-guía-de-instalación-y-puesta-en-marcha)
  - [Prerrequisitos](#prerrequisitos)
  - [Paso 1: Clonar el Repositorio](#paso-1-clonar-el-repositorio)
  - [Paso 2: Configurar y Levantar el Backend (Django + MySQL en Docker)](#paso-2-configurar-y-levantar-el-backend-django--mysql-en-docker)
  - [Paso 3: Configurar y Levantar el Frontend (Angular)](#paso-3-configurar-y-levantar-el-frontend-angular)
- [API Endpoints y Documentación](#-api-endpoints-y-documentación)
- [Comandos Útiles](#-comandos-útiles)
- [Despliegue](#-despliegue)
- [Documentación Adicional](#-documentación-adicional)
- [Contribuciones](#-contribuciones)
- [Autores](#-autores)
- [Licencia](#-licencia)

---

## 📝 Descripción y Propuesta de Valor

**EduBid** es una solución de software como servicio (**SaaS**) diseñada para colegios e instituciones educativas que buscan combatir la apatía y la desmotivación escolar. A través de una **microeconomía interna basada en el mérito**, el esfuerzo académico de los estudiantes es reconocido con **EduCoins** (moneda virtual educativa).

Los estudiantes pueden utilizar sus tokens en un **sistema de subastas estratégicas** administrado por los docentes, donde compiten por incentivos formativos, beneficios académicos reales (puntos adicionales, extensiones de entrega, reconocimientos de liderazgo) y recursos escolares, transformando el proceso educativo tradicional en una experiencia participativa, lúdica y transparente.

---

## 🏢 Arquitectura SaaS Multi-Tenant, Gobernanza & White-Labeling

EduBid incorpora capacidades multi-inquilino (*multi-tenant*) con aislamiento estricto de datos y personalización de marca (*white-labeling*):

1. **Aislamiento Institucional Estricto**:
   - **SuperAdmin (`admin`)**: Ámbito global estricto. Por regla de integridad de negocio (`User.clean()` y `User.save()`), el administrador global tiene garantizado `institucion = None` y accede a un selector multi-institución dinámico.
   - **Rectoría y Coordinación (`rector`, `coordinador`)**: Acceso delimitado a su institución (`institucion_id`), supervisando docentes, estudiantes, salones y métricas de su respectivo colegio.
   - **Docente (`docente`)**: Gestiona sus Aulas (`Classroom`) y sus Grupos (`Group`), diseñando actividades y subastas para sus estudiantes.
   - **Estudiante (`estudiante`)**: Pertenece a grupos escolares mediante códigos de acceso únicos de 6 caracteres; su billetera digital de EduCoins opera por grupo y período académico.
2. **Jerarquía Académica del Modelo**:
   ```
   Institución (Tenant / White-Label)
     └── Docente
           └── Aula / Asignatura (Classroom)
                 └── Grupos Escolares (Group - con código de unión)
                       ├── Matrícula de Estudiantes (Inscripción vía código)
                       ├── Períodos Académicos / Cortes
                       │     └── Billetera Virtual (Wallet de EduCoins por estudiante)
                       ├── Actividades Gamificadas (Retos, Misiones, Evaluaciones)
                       │     └── Entregas (Submissions) -> Calificaciones (Grades con EduCoins)
                       └── Subastas de Incentivos (Auctions con sistema de pujas y retención)
   ```
3. **Identidad Visual Dinámica (White-Label)**:
   - Cada colegio define su Nombre oficial, Código DANE y Logotipo en alta resolución.
   - Paleta de color primario y secundario inyectada en tiempo de ejecución en el frontend mediante variables CSS (`--brand-primary`, `--brand-accent`).
   - Módulo de personalización institucional para Rectores y Administradores (`InstitutionBrandingComponent`).
4. **Gobernanza Institucional**:
   - Regla de unicidad a nivel de base de datos (`UniqueConstraint`) que garantiza un único **Rector** activo por institución.

---

## 👥 Roles y Control de Acceso (RBAC)

El sistema implementa un control de acceso robusto basado en roles (**RBAC**) verificado en backend y protegido mediante guards reactivos en frontend:

| Rol | Ámbito | Responsabilidades Clave |
|-----|--------|-------------------------|
| **SuperAdmin (`admin`)** | Global (Sin Institución) | Gestión global de colegios, selector de tenant en vivo, métricas globales de la plataforma, aprovisionamiento de rectores y auditoría de usuarios. |
| **Rector (`rector`)** | Institucional | Personalización de identidad corporativa (branding, logo, colores), analítica institucional de desempeño y supervisión de docentes y estudiantes. |
| **Coordinador (`coordinador`)** | Institucional | Supervisión pedagógica, monitoreo de progreso académico entre grados/grupos y trazabilidad de rendimiento. |
| **Docente (`docente`)** | Aulas / Grupos | Creación de asignaturas y salones, generación de códigos de unión, asignación de retos con recompensas, calificación y gestión de subastas. |
| **Estudiante (`estudiante`)** | Grupos Matriculados | Billetera de EduCoins, entrega de actividades, participación en subastas con retención y reembolso automático, y consulta de calificaciones. |

---

## ✨ Características Principales

### 👑 Para SuperAdministradores (Global Admin)
- **🏢 Directorio de Instituciones**: Vista general interactiva con buscador, métricas agregadas y estado de activación.
- **🔄 Selector Dinámico de Institución**: Capacidad de cambiar el contexto visual y operativo para auditar cualquier colegio en tiempo real.
- **🎨 Gestor de Identidad Tenant**: Creación y edición de colegios con selector de paletas cromáticas predefinidas o códigos HEX personalizados y subida de logotipo.
- **👥 Administración Global de Usuarios**: Directorio de usuarios con filtros por rol, institución y estado de activación.

### 🏛️ Para Rectores y Coordinadores
- **📊 Panel Directivo y Analítica**: Métricas de adopción estudiantil, actividad docente y volumen de EduCoins en circulación.
- **🎨 Módulo de Marca (White-Label)**: Edición directa del logo y colores institucionales con previsualización en vivo.
- **👥 Gestión de Comunidad Escolar**: Directorio de docentes y estudiantes matriculados en la institución.

### 👨‍🏫 Para Docentes
- **🏛️ Estructura Clases -> Grupos**: Organización clara de asignaturas (`Classrooms`) y sub-secciones o salones (`Groups`) con códigos de unión generados automáticamente.
- **🏆 Actividades y Misiones Gamificadas**: Creación de retos, misiones, proyectos y evaluaciones asignando valor en EduCoins y XP.
- **📊 Calificación con Acreditación Automática**: Las notas asignadas disparan automáticamente la acreditación de EduCoins hacia la billetera del estudiante según el porcentaje obtenido.
- **🔨 Centro de Subastas Dinámicas**: Creación de subastas por grupo, seguimiento de pujas en vivo y cierre con cobro automático al ganador y desbloqueo de saldo a los demás participantes.

### 👨‍🎓 Para Estudiantes
- **🔑 Unión Rápida por Código**: Ingreso a grupos mediante código alfanumérico de 6 caracteres con provisión automática de billetera.
- **💰 Billetera Virtual (EduCoins)**: Monitoreo en tiempo real de saldo disponible, saldo bloqueado en subastas activas e historial transaccional inmutable.
- **🎯 Sistema de Subastas Estratégicas**: Participación en pujas con validación inmediata de saldo y retención temporal inteligente.
- **📚 Entregas y Retroalimentación**: Envío de actividades con archivos adjuntos y consulta de rúbricas y notas.

---

## 🛠️ Stack Tecnológico

### 🔧 Backend
- **Framework**: [Django 5.2.6](https://www.djangoproject.com/) con [Django REST Framework 3.16](https://www.django-rest-framework.org/)
- **Base de Datos**: [MySQL 8.0](https://www.mysql.com/) con driver [PyMySQL](https://pymysql.readthedocs.io/)
- **Autenticación**: JWT con [djangorestframework-simplejwt](https://django-rest-framework-simplejwt.readthedocs.io/) (rotación y blacklist de tokens)
- **SSO**: [Google OAuth 2.0](https://developers.google.com/identity) (`google-auth` backend verification)
- **Servicios de Correo**: [SendGrid](https://sendgrid.com/) para verificación de cuenta y recuperación de contraseña
- **Producción**: [Gunicorn](https://gunicorn.org/) + [WhiteNoise](https://whitenoise.readthedocs.io/)

### 🎨 Frontend
- **Framework**: [Angular 19+](https://angular.dev/) (Standalone Components, Signals reactivos, Formularios Reactivos tipados)
- **Estilos**: [Tailwind CSS 4.x](https://tailwindcss.com/) + [Flowbite](https://flowbite.com/)
- **Iconografía & UI**: Iconos vectoriales estándar SVG Flowbite y [Ng-Icons (Heroicons)](https://ng-icons.github.io/ng-icons/) (cero emojis en componentes de interfaz)
- **Identidad de Marca**: Logotipo corporativo (`edubid.png`) y favicon (`edubid.ico`) integrados globalmente
- **Notificaciones**: [ngx-toastr](https://github.com/scttcper/ngx-toastr) + servicio centralizado `NotificationService`
- **Gestión de Temas**: Modo Claro / Oscuro / Sistema y personalización tenant en vivo (`ThemeService`)

### 🐳 DevOps e Infraestructura
- **Docker & Docker Compose**: MySQL 8.0 aislado con credenciales parametrizadas mediante `.env`
- **Despliegue Backend**: Listo para [Railway](https://railway.app/) (`Procfile`, `railway.toml`, `railway_setup.sh`)
- **Despliegue Frontend**: Listo para [Netlify](https://www.netlify.com/) o [Vercel](https://vercel.com/) (`dist/` optimizado)

---

## 📁 Estructura del Proyecto

```
edubid/
├── edubid-backend/                   # API REST en Django 5.2.6 + DRF
│   ├── apps/
│   │   ├── activities/               # Actividades (retos, misiones, proyectos y entregas)
│   │   ├── auctions/                 # Subastas y sistema de pujas con retención
│   │   ├── classrooms/               # Aulas académicas y asignaturas (Docente)
│   │   ├── common/                   # Modelos base, utilidades y mixins compartidos
│   │   ├── grades/                   # Calificaciones y disparadores de EduCoins
│   │   ├── groups/                   # Grupos escolares, matrículas por código y períodos
│   │   ├── institutions/             # Módulo SaaS Multi-Tenant y White-Labeling
│   │   ├── notifications/            # Motor de alertas y notificaciones proactivas
│   │   ├── reports/                  # Informes y analítica académica
│   │   ├── tokens/                   # Wallets, periodos y transacciones de EduCoins
│   │   └── users/                    # Autenticación JWT, RBAC estricto, Google SSO y perfiles
│   ├── edubid_core/                  # Configuración Django (settings, urls, wsgi, asgi)
│   ├── docker-compose.yml            # Orquestación de MySQL 8.0
│   ├── .env.example                  # Plantilla de variables para backend y base de datos
│   ├── manage.py
│   ├── requirements.txt
│   ├── BACKEND_API_MAP.md            # Especificación técnica exhaustiva de la API
│   └── README.md                     # Guía de arquitectura y uso del backend
│
├── edubid-frontend/                  # Single Page Application en Angular 19+
│   ├── public/                       # Activos públicos de marca (edubid.png, edubid.ico)
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/                 # Servicios singleton, guards e interceptores
│   │   │   │   ├── services/         # AuthService, ThemeService, NotificationService,
│   │   │   │   │                     # ActivityService, AuctionService, ClassroomService,
│   │   │   │   │                     # GradeService, GroupService, InstitutionService,
│   │   │   │   │                     # UserService, WalletService, DashboardService, GoogleAuthService
│   │   │   │   ├── guards/           # authGuard, roleGuard
│   │   │   │   ├── interceptors/     # authInterceptor (JWT + auto-refresh)
│   │   │   │   └── models/           # Interfaces TypeScript (User, Group, Classroom, etc.)
│   │   │   ├── shared/               # Componentes reutilizables y estructura
│   │   │   │   ├── components/       # Layout (Aside sidebar + Header + Footer), UI atoms,
│   │   │   │   │                     # institution-branding (White-label)
│   │   │   │   └── pipes/            # Pipes de utilidad
│   │   │   └── features/             # Módulos y vistas de negocio:
│   │   │       ├── auth/             # Login, Register, Complete Profile, Email Sent, Google SSO
│   │   │       ├── dashboard/        # 5 Dashboards (Admin, Rector, Coordinator, Teacher, Student)
│   │   │       ├── classrooms/       # Gestión de Aulas y detalle con grupos anidados
│   │   │       ├── groups/           # Vista de grupos para estudiantes y unión por código
│   │   │       ├── activities/       # Retos, entregas y evaluación
│   │   │       ├── auctions/         # Subastas y centro de pujas
│   │   │       ├── wallet/           # Billetera digital y libro de transacciones
│   │   │       ├── profile/          # Perfil de usuario y ajustes
│   │   │       ├── notifications/    # Bandeja interactiva de notificaciones
│   │   │       ├── home/             # Landing page con estado dinámico de sesión
│   │   │       ├── about/            # Información y misión
│   │   │       ├── terms/            # Términos y condiciones
│   │   │       └── not-found/        # Página 404
│   │   ├── environments/             # Configuración por ambiente (local, prod, example)
│   │   ├── styles.scss               # Estilos globales y tokens Tailwind CSS 4
│   │   └── main.ts                   # Bootstrap standalone de la aplicación
│   ├── angular.json                  # Configuración Angular CLI
│   ├── proxy.conf.json               # Proxy para redirección local de API
│   ├── .env.example                  # Plantilla de variables frontend
│   └── package.json
│
├── ANGULAR_ACTION_PLAN.md            # Plan de acción y registro de migración a Angular
└── README.md                         # Documentación principal del repositorio
```

---

## ⚙️ Guía de Instalación y Puesta en Marcha

### Prerrequisitos

- **Python** 3.10 o superior
- **Node.js** 18.0+ (recomendado Node 20 LTS o 22) y **npm** 9+
- **Docker** y **Docker Compose** (Docker Desktop en Windows/Mac o Docker Engine en Linux)
- **Git**

---

### Paso 1: Clonar el Repositorio

```bash
git clone https://github.com/juankAnez/edubid.git
cd edubid
```

---

### Paso 2: Configurar y Levantar el Backend (Django + MySQL en Docker)

#### 2.1 Configurar variables de entorno del backend

Copia la plantilla `.env.example` en la carpeta `edubid-backend/`:

```bash
cp edubid-backend/.env.example edubid-backend/.env
```

Edita `edubid-backend/.env` con tus preferencias locales. Por defecto, incluye los valores listos para trabajar con el contenedor de Docker:

```env
SECRET_KEY=django-insecure-clave-desarrollo-edubid
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Credenciales consumidas tanto por Django como por docker-compose.yml
DB_NAME=edubid_db
DB_USER=edubid_user
DB_PASSWORD=edubid_password
DB_HOST=127.0.0.1
DB_PORT=3306

FRONTEND_URL=http://localhost:4200
CORS_ALLOWED_ORIGINS=http://localhost:4200,http://127.0.0.1:4200,http://localhost:5173
```

#### 2.2 Levantar la Base de Datos con Docker Compose

El archivo `docker-compose.yml` utiliza de forma segura las variables de entorno de tu archivo `.env`:

```bash
cd edubid-backend
docker compose up -d
# Verifica que el contenedor esté corriendo
docker ps
```

#### 2.3 Preparar el Entorno Virtual de Python e Instalar Dependencias

```bash
# Crear entorno virtual
python3 -m venv .venv

# Activar entorno virtual
# Linux / macOS:
source .venv/bin/activate
# Windows:
.venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt
```

#### 2.4 Aplicar Migraciones y Crear Superusuario

```bash
python manage.py migrate
python manage.py createsuperuser
```

#### 2.5 Iniciar el Servidor Backend

```bash
python manage.py runserver
```

- **API REST**: `http://localhost:8000/api/`
- **Panel de Administración**: `http://localhost:8000/admin/`

---

### Paso 3: Configurar y Levantar el Frontend (Angular)

Abre una nueva terminal en la raíz del proyecto:

```bash
cd edubid-frontend
```

#### 3.1 Instalar dependencias

```bash
npm install
```

#### 3.2 Configurar variables de entorno del frontend

Copia la plantilla `.env.example` o configura el entorno en `src/environments/`:

```bash
cp .env.example .env
```

Verifica que `src/environments/environment.ts` apunte a tu servidor local:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000/api',
  googleClientId: 'TU_GOOGLE_CLIENT_ID.apps.googleusercontent.com',
};
```

#### 3.3 Iniciar el Servidor de Desarrollo

```bash
npm start
# o con Angular CLI directamente:
ng serve
```

Navega a **`http://localhost:4200`** en tu navegador. ¡Listo para explorar EduBid! 🚀

---

## 📡 API Endpoints y Documentación

**Base URL**: `http://localhost:8000/api/`

| Módulo | Prefijo | Descripción |
|--------|---------|-------------|
| **Instituciones** | `/institutions/` | Listado público de colegios, registro y configuración White-Label |
| **Usuarios & Auth** | `/users/` | Registro, login JWT, Google SSO, verificación de email y perfil |
| **Aulas** | `/classrooms/` | Gestión de asignaturas y cursos del docente |
| **Grupos** | `/groups/` | Creación de grupos, códigos de unión y matrículas de estudiantes |
| **Actividades** | `/activities/`, `/submissions/` | Tareas, retos, misiones, entregas de archivos y rúbricas |
| **Calificaciones** | `/grades/` | Notas por actividad con asignación de EduCoins |
| **EduCoins & Wallets** | `/tokens/` | Billeteras virtuales, cortes/periodos y libro de transacciones |
| **Subastas** | `/auctions/` | Creación de subastas, registro de pujas y cierre con cobro |
| **Notificaciones** | `/notifications/` | Alertas del sistema, notificaciones de notas y anuncios |
| **Reportes** | `/reports/` | Estadísticas académicas y métricas de motivación |

> 📖 Para consultar la especificación exhaustiva de cada endpoint, esquemas de payload y respuestas JSON, consulta:
> **[`edubid-backend/BACKEND_API_MAP.md`](edubid-backend/BACKEND_API_MAP.md)**

---

## 🔧 Comandos Útiles

### Backend (Django)

```bash
# Crear nuevas migraciones
python manage.py makemigrations

# Aplicar migraciones pendientes
python manage.py migrate

# Ejecutar tests automatizados
python manage.py test

# Cargar archivos estáticos
python manage.py collectstatic --noinput

# Gestión del contenedor de Base de Datos
docker compose stop    # Pausar contenedor MySQL
docker compose down    # Detener contenedor
docker compose logs -f # Ver logs de MySQL
```

### Frontend (Angular)

```bash
# Servidor de desarrollo
npm start

# Compilar para producción (archivos optimizados en dist/)
npm run build

# Ejecutar pruebas unitarias
npm test

# Modo observación continua en desarrollo
npm run watch
```

---

## 🌐 Despliegue

### Backend (Railway)
El repositorio cuenta con configuración lista para Railway:
- `railway.toml` y `Procfile`: Configuración de despliegue con Gunicorn.
- `railway_setup.sh`: Script de migración y recolección de estáticos en el build.

### Frontend (Netlify / Vercel)
La aplicación SPA en Angular se compila mediante `npm run build`, generando una carpeta `dist/` con soporte para routing del lado cliente mediante reescritura hacia `index.html`.

---

## 📚 Documentación Adicional

- [Guía y Arquitectura del Backend Django](edubid-backend/README.md)
- [Mapeo Completo de Endpoints Backend](edubid-backend/BACKEND_API_MAP.md)
- [Guía de Arquitectura del Frontend Angular](edubid-frontend/README.md)
- [Plan de Acción de Migración a Angular](ANGULAR_ACTION_PLAN.md)
- [Documentación Oficial de Angular](https://angular.dev/)
- [Documentación Oficial de Django REST Framework](https://www.django-rest-framework.org/)
- [Documentación de Tailwind CSS](https://tailwindcss.com/)

---

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Si deseas colaborar:

1. Realiza un Fork del repositorio.
2. Crea una rama para tu funcionalidad (`git checkout -b feature/NuevaCaracteristica`).
3. Realiza los commits correspondientes (`git commit -m 'feat: añadir nueva funcionalidad'`).
4. Sube los cambios a tu rama (`git push origin feature/NuevaCaracteristica`).
5. Abre un Pull Request describiendo tus modificaciones.

---

## 👥 Autores

- **Juan Añez** — Backend Developer & Arquitecto de Software — [GitHub](https://github.com/juankAnez)
- **Ivan Martinez** — Full Stack Developer — [GitHub](https://github.com/ivnmtz09)

---

## 📄 Licencia

Este proyecto se encuentra bajo la licencia **MIT**. Consulta el archivo [LICENSE](LICENSE) para más información.

---

<p align="center">
  <b>Hecho con ❤️ en Colombia para transformar la educación. 🎓✨</b>
</p>
