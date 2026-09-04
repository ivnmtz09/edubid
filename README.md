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

## 🏢 Arquitectura SaaS Multi-Tenant & White-Labeling

EduBid incorpora capacidades multi-inquilino (*multi-tenant*) con personalización de marca (*white-labeling*):

1. **Aislamiento Institucional**: Cada usuario está asociado a una institución (`institucion_id`). Las consultas y transacciones se filtran estrictamente a nivel de queryset en la API según el rol y la institución del usuario.
2. **Identidad Visual Personalizada (White-Label)**: Cada colegio personaliza su experiencia con:
   - Nombre oficial y Código DANE.
   - Logotipo institucional en alta resolución.
   - Paleta de color primario y secundario inyectada dinámicamente en tiempo real en el frontend mediante variables CSS (`--brand-primary`, `--brand-accent`).
3. **Gobernanza Institucional**: Regla de unicidad a nivel de modelo que garantiza la designación de un único **Rector** por colegio para la toma de decisiones directivas.

---

## 👥 Roles y Control de Acceso (RBAC)

El sistema implementa un control de acceso robusto basado en roles (**RBAC**):

| Rol | Ámbito | Responsabilidades Clave |
|-----|--------|-------------------------|
| **SuperAdmin (`admin`)** | Global | Gestión de instituciones, aprovisionamiento de tenants y monitoreo global de la plataforma. |
| **Rector (`rector`)** | Institucional | Configuración de identidad visual del colegio (colores, logo), analítica institucional y supervisión. |
| **Coordinador (`coordinador`)** | Institucional | Monitoreo del progreso académico entre grados y grupos, gestión de alertas y reportes. |
| **Docente (`docente`)** | Aulas / Grupos | Creación de aulas, retos y evaluaciones, calificación masiva, asignación de EduCoins y subastas. |
| **Estudiante (`estudiante`)** | Grupos | Billetera digital de EduCoins, entrega de actividades, participación en subastas y ranking. |

---

## ✨ Características Principales

### 👨‍🏫 Para Docentes
- **🏛️ Gestión de Aulas y Grupos**: Control centralizado de asignaturas, grupos y periodos académicos (cortes).
- **🏆 Actividades Gamificadas**: Creación de retos, misiones, proyectos y evaluaciones con valores asignados de EduCoins y puntos de experiencia (XP).
- **📊 Calificación Inteligente**: Registro de notas con cálculo y acreditación automática de EduCoins mediante señales (*Django signals*).
- **🔨 Centro de Subastas Dinámicas**: Creación de subastas con precio inicial e incrementos mínimos, seguimiento de ofertas en vivo y cierre automático con cobro y reembolso.
- **📈 Tableros Analíticos**: Estadísticas de rendimiento grupal, notas promedio e impacto de la motivación.

### 👨‍🎓 Para Estudiantes
- **💰 Billetera Virtual (EduCoins)**: Monitoreo en tiempo real de saldo disponible, saldo bloqueado en pujas activas y balance histórico.
- **🎯 Sistema de Subastas Estratégicas**: Ofertas en tiempo real; el sistema retiene el saldo de la puja y lo reintegra automáticamente si la oferta es superada o no resulta ganadora.
- **📜 Historial y Trazabilidad Transaccional**: Registro detallado e inmutable de cada EduCoin ganado o utilizado.
- **🏅 Ranking y Progreso**: Visualización clara del posicionamiento dentro del grupo escolar.
- **🔔 Notificaciones Proactivas**: Alertas automáticas ante nuevas notas, actividades por vencer, subastas abiertas y mensajes del docente.

---

## 🛠️ Stack Tecnológico

### 🔧 Backend
- **Framework**: [Django 5.2.6](https://www.djangoproject.com/) con [Django REST Framework 3.16](https://www.django-rest-framework.org/)
- **Base de Datos**: [MySQL 8.0](https://www.mysql.com/) (conector [PyMySQL](https://pymysql.readthedocs.io/))
- **Autenticación**: JWT con [djangorestframework-simplejwt](https://django-rest-framework-simplejwt.readthedocs.io/) (rotación y lista negra de tokens)
- **SSO**: [Google OAuth 2.0](https://developers.google.com/identity) con integración `google-auth`
- **Mensajería & Email**: [SendGrid](https://sendgrid.com/) para verificación de correos y recuperación de contraseñas
- **Producción**: [Gunicorn](https://gunicorn.org/) + [WhiteNoise](https://whitenoise.readthedocs.io/)

### 🎨 Frontend
- **Framework**: [Angular 19+ / 22](https://angular.dev/) (Standalone Components, Signals, Typed Reactive Forms)
- **Estilos**: [Tailwind CSS 4.x](https://tailwindcss.com/) + [Flowbite](https://flowbite.com/)
- **Iconografía**: [Ng-Icons (Heroicons)](https://ng-icons.github.io/ng-icons/)
- **Notificaciones**: [ngx-toastr](https://github.com/scttcper/ngx-toastr)
- **Gestión de Temas**: Modo Claro / Oscuro / Sistema y personalización dinámica tenant white-label

### 🐳 DevOps e Infraestructura
- **Docker & Docker Compose**: MySQL 8.0 aislado con credenciales parametrizadas mediante `.env`
- **Despliegue Backend**: Listo para [Railway](https://railway.app/) (`Procfile`, `railway.toml`, `railway_setup.sh`)
- **Despliegue Frontend**: Listo para [Netlify](https://www.netlify.com/) o [Vercel](https://vercel.com/) (`dist/` optimizado)

---

## 📁 Estructura del Proyecto

```
edubid/
├── edubid-backend/                   # API REST en Django
│   ├── apps/
│   │   ├── activities/               # Actividades (retos, misiones, proyectos y entregas)
│   │   ├── auctions/                 # Subastas y sistema de pujas
│   │   ├── classrooms/               # Aulas académicas y asignaturas
│   │   ├── common/                   # Modelos base, utilidades y mixins compartidos
│   │   ├── grades/                   # Calificaciones y disparadores de EduCoins
│   │   ├── groups/                   # Grupos de clase, matrículas y periodos
│   │   ├── institutions/             # Módulo SaaS Multi-Tenant y White-Labeling
│   │   ├── notifications/            # Motor de alertas y notificaciones proactivas
│   │   ├── reports/                  # Informes y analítica académica
│   │   ├── tokens/                   # Wallets, periodos y transacciones de EduCoins
│   │   └── users/                    # Autenticación, perfiles, RBAC y verificación
│   ├── edubid_core/                  # Configuración Django (settings, urls, wsgi, asgi)
│   ├── docker-compose.yml            # Orquestación de MySQL 8.0
│   ├── .env.example                  # Plantilla de variables para backend y base de datos
│   ├── manage.py
│   └── requirements.txt
│
├── edubid-frontend/                  # Single Page Application en Angular
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/                 # Servicios singleton (Auth, Theme, Notification), guards, interceptors
│   │   │   ├── shared/               # Componentes reutilizables, layouts, directivas y pipes
│   │   │   └── features/             # Módulos de negocio lazy-loaded:
│   │   │       ├── auth/             # Login, Registro institucional, Verificación de email
│   │   │       ├── dashboard/        # Dashboards por rol (Docente, Estudiante, Rector)
│   │   │       ├── classrooms/       # Aulas y clases
│   │   │       ├── groups/           # Grupos escolares
│   │   │       ├── activities/       # Actividades académicas y entregas
│   │   │       ├── auctions/         # Subastas y pujas en tiempo real
│   │   │       ├── wallet/           # Billetera y transacciones de EduCoins
│   │   │       ├── profile/          # Gestión de perfil de usuario
│   │   │       ├── notifications/    # Centro de notificaciones
│   │   │       ├── home/             # Landing page
│   │   │       ├── about/            # Sobre el proyecto
│   │   │       ├── terms/            # Términos y condiciones
│   │   │       └── not-found/        # Página de error 404
│   │   ├── environments/             # Configuración por ambiente (local, prod, example)
│   │   ├── styles.scss               # Estilos globales y temas CSS
│   │   └── main.ts                   # Bootstrap standalone de la aplicación
│   ├── angular.json                  # Configuración de compilación de Angular CLI
│   ├── proxy.conf.json               # Proxy para redirección local de API
│   ├── .env.example                  # Plantilla de variables de entorno frontend
│   └── package.json
│
├── ANGULAR_ACTION_PLAN.md            # Hoja de ruta y arquitectura técnica del frontend
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
