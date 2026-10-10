# 🎓 EduBid — Gamificación Educativa & Microeconomía SaaS

> **Transformando la motivación en el aula** | Plataforma SaaS Multi-Tenant de economía gamificada y subastas académicas para instituciones educativas.

[![Backend: Django 5.2](https://img.shields.io/badge/Backend-Django%205.2-darkgreen?style=flat-square&logo=django)](https://www.djangoproject.com/)
[![API: Django REST Framework](https://img.shields.io/badge/API-DRF%203.16-red?style=flat-square)](https://www.django-rest-framework.org/)
[![Frontend: Angular 19+](https://img.shields.io/badge/Frontend-Angular%2019%2B-DD0031?style=flat-square&logo=angular)](https://angular.dev/)
[![Styles: Tailwind CSS 4](https://img.shields.io/badge/Styles-Tailwind%204.x-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![UI: Flowbite](https://img.shields.io/badge/UI-Flowbite-1C64F2?style=flat-square&logo=flowbite)](https://flowbite.com/)
[![Database: PostgreSQL / Supabase](https://img.shields.io/badge/Database-PostgreSQL%20%7C%20Supabase-336791?style=flat-square&logo=postgresql)](https://supabase.com/)
[![Database Compat: MySQL](https://img.shields.io/badge/Compat-MySQL%208.0-orange?style=flat-square&logo=mysql)](https://www.mysql.com/)
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
  - [Paso 2: Configurar y Levantar el Backend (Django + Supabase / MySQL)](#paso-2-configurar-y-levantar-el-backend-django--supabase--mysql)
  - [Paso 3: Configurar y Levantar el Frontend (Angular)](#paso-3-configurar-y-levantar-el-frontend-angular)
- [API Endpoints y Documentación](#-api-endpoints-y-documentación)
- [Estado Actual del Proyecto y Roadmap](#-estado-actual-del-proyecto-y-roadmap)
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
3. **Identidad Visual Dinámica (White-Label) & Contraste Inteligente**:
   - Cada colegio define su Nombre oficial, Código DANE y Logotipo en alta resolución (vía URL o archivo local `.jpg`, `.jpeg`, `.png` hasta 2MB con previsualización y persistencia dual en `localStorage` y API).
   - Paleta de 32 colores predefinidos con nombres en español, incluyendo escala de grises.
   - Algoritmo de contraste dinámico basado en luminancia YIQ: cuando se seleccionan fondos claros, el texto y elementos de contraste conmutan automáticamente a negro (`#0a0a0a`) para máxima accesibilidad.
   - Inyección en tiempo de ejecución de variables CSS (`--brand-primary`, `--brand-primary-text`, `--brand-accent`).
   - Módulo de personalización institucional contraíble tipo acordeón para Rectores y Administradores (`InstitutionBrandingComponent`).
4. **Gobernanza Institucional**:
   - Regla de unicidad a nivel de base de datos (`UniqueConstraint`) que garantiza un único **Rector** activo por institución.
   - Aislamiento estricto de navegación en el Sidebar: cada rol visualiza únicamente las rutas y módulos autorizados según las directrices RBAC del backend.

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

### 🤖 EDUBID IA — Copiloto Pedagógico Inteligente (Google AI Studio Gemini 3.6 Flash)
- **🧠 Copiloto Pedagógico y de Gestión con Tool Calling**: Asistente pedagógico con conexión directa a la base de datos de EduBid en tiempo real impulsado por **Google Gemini** (`gemini-3.6-flash` / `gemini-3.8-flash`) con respaldo escalonado en OpenRouter (`openai/gpt-4o`). Apoya al docente en consultas académicas, orientación de rúbricas y evaluación formativa.
- **🛡️ Política de Seguridad y Permisos Delimitados**: Acceso protegido para consulta operativa, verificación de existencia real de clases/grupos, calificación asistida y premios por mérito (la creación y eliminación estructural quedan reservadas al control directo del usuario en la plataforma).
- **📚 Consultas Operativas y Estudiantes**: Docentes y directivos pueden consultar asignaturas, grupos activos, códigos de acceso de unión de 6 caracteres y listados de alumnos matriculados con sus saldos de EduCoins en tiempo real.
- **📊 Revisión y Calificación Formativa Asistida**: Consulta entregas de estudiantes y califica con nota numérica (0.0 a 5.0) y retroalimentación pedagógica formativa, acreditando los EduCoins automáticamente a la billetera al aprobar.
- **🔨 Monitoreo de Subastas Educativas**: Consulta el estado de subastas pedagógicas activas o cerradas y seguimiento a los incentivos de aula.
- **🪙 Asignación Directa de EduCoins por Mérito**: Permite premiar la participación, puntualidad o esfuerzo de los estudiantes en tiempo real con transacciones contables en su `Wallet`.
- **🏛️ Reportes Directivos Consolidados**: Genera resúmenes ejecutivos para Rectores y Coordinadores con estadísticas globales de la institución.
- **🔄 Sincronización Reactiva en Tiempo Real (Cero F5)**: Bus de eventos reactivo `actionCompleted$` en frontend que actualiza automáticamente la pantalla cada vez que el copiloto ejecuta herramientas.
- **💬 Widget Flotante, Chat Permanente & Asistente Kawaii**:
  - Chatbot interactivo con avatar kawaii expresivo (ojos y sonrisa con seguimiento ocular reactivo al cursor, libre de rubor).
  - Persistencia total de la conversación en `localStorage` segmentada por usuario (no se borra al cerrar el widget flotante).
  - Botón de vaciado manual del historial con modal de confirmación segura.
  - Bandeja desplegable y colapsable de sugerencias rápidas contextuales por rol.
  - Foco automático en el campo de texto al abrir y renderizado enriquecido de Markdown con bloques de código.

### 🎮 Experiencia Gamificada & Minijuegos SVG Interactivos en el Home (Exclusivo PC)
- **🕹️ Selector de Fondos en el Header**: Dropdown integrado junto al selector de temas para alternar entre tres fondos interactivos:
  - **✨ Partículas Interactivas**: Fondo canvas predeterminado reactivo al cursor.
  - **🪙 Recolector de Monedas**: Stickman con carreta que corre sobre el suelo siguiendo el ratón, recoge EduCoins (+10 pts) y Super Monedas (+50 pts) y esquiva bombas de peligro (-1 HP).
  - **🚀 Galaga Espacial**: Caza estelar con cañones de plasma dobles automáticos, asteroides poligonales y naves alienígenas invasoras con trayectoria sinusoidal.
- **📺 Doble Modalidad de Juego**:
  - *Modo Fondo Vivo*: El juego corre detrás de la web (`fixed inset-0 z-0 pointer-events-none`), permitiendo navegar y operar la plataforma normalmente mientras el juego interactúa con el cursor de fondo.
  - *Modo Arcade Enfocado*: Atenúa la página web al 10% y permite jugar a pantalla completa tanto con el ratón como con el teclado (flechas o A/D/W/S y tecla `Esc` para salir).
- **🏆 HUD Flotante & Persistencia**: Marcador de puntuación en vivo, 3 vidas/escudos vectoriales SVG, récord histórico (High Score) guardado en `localStorage` y botón de reinicio.
- **⚡ Rendimiento Óptimo a 60 FPS**: Game loop en `requestAnimationFrame` desacoplado, eliminación de filtros Gaussianos pesados y renderizado OnPush eficiente con cero tirones de CPU.
- **🎨 Regla Estricta Cero Emojis**: 100% de la interfaz gráfica y HUD construida con iconos vectoriales SVG limpios.

---

## 🛠️ Stack Tecnológico

### 🔧 Backend
- **Framework**: [Django 5.2.6](https://www.djangoproject.com/) con [Django REST Framework 3.16](https://www.django-rest-framework.org/)
- **Inteligencia Artificial**: [Google AI Studio (Gemini API)](https://ai.google.dev/) con `gemini-3.6-flash` y `gemini-3.8-flash`, orquestación multi-turno con Tool Calling en tiempo real y fallback a [OpenRouter API](https://openrouter.ai/)
- **Tiempo Real (WebSockets)**: [Django Channels 4.x](https://channels.readthedocs.io/) con servidor ASGI [Daphne](https://github.com/django/daphne)
- **Base de Datos**: [PostgreSQL en Supabase](https://supabase.com/) (producción) y [MySQL 8.0](https://www.mysql.com/) con driver [PyMySQL](https://pymysql.readthedocs.io/)
- **Almacenamiento Multimedia**: [Supabase Storage S3](https://supabase.com/storage) con `django-storages` y `boto3`
- **Autenticación**: JWT con [djangorestframework-simplejwt](https://django-rest-framework-simplejwt.readthedocs.io/) (rotación y blacklist de tokens)
- **SSO**: [Google OAuth 2.0](https://developers.google.com/identity) (`google-auth` backend verification)
- **Servicios de Correo**: [SendGrid](https://sendgrid.com/) para verificación de cuenta y recuperación de contraseña
- **Generación de Reportes**: [ReportLab 5.x](https://www.reportlab.com/) (PDF membretado) y [OpenPyXL 3.1](https://openpyxl.readthedocs.io/) (planillas Excel DANE)
- **Producción**: [Gunicorn](https://gunicorn.org/) + [WhiteNoise](https://whitenoise.readthedocs.io/)

### 🎨 Frontend
- **Framework**: [Angular 19+](https://angular.dev/) (Standalone Components, Signals reactivos, Formularios Reactivos tipados, zoneless change detection)
- **Estilos**: [Tailwind CSS 4.x](https://tailwindcss.com/) + [Flowbite](https://flowbite.com/)
- **Iconografía & UI**: Iconos vectoriales estándar SVG Flowbite y [Ng-Icons (Heroicons)](https://ng-icons.github.io/ng-icons/) (regla estricta de cero emojis en componentes de interfaz)
- **Identidad de Marca**: Logotipo corporativo (`edubid.png`) y favicon (`edubid.ico`) integrados globalmente
- **Minijuegos SVG Nativos**: Recolector de Monedas y Galaga Espacial integrados como fondos vivos interactivos a 60 FPS
- **Navegación con Aside Persistente**: Menú lateral con persistencia del estado contraído en `localStorage` y navegación sin expansión automática indeseada
- **Billeteras Realistas con Drawer**: Diseño con textura de cuero, pespuntes artesanales y drawer deslizable para auditoría financiera profunda (saldo disponible vs retenido en subastas)
- **Notificaciones**: Centro de notificaciones in-app interactivo (`InAppNotificationService`) + Toasts reactivos con [ngx-toastr](https://github.com/scttcper/ngx-toastr)
- **Sincronización Real-Time**: WebSockets con RxJS (`WebSocketService`) para pujas en vivo y notificaciones dinámicas
- **Gestión de Temas**: Modo Claro / Oscuro puro (escala de negros y grises neutros `#0a0a0a`, `#141414`, `#262626` sin matices azules), contraste dinámico YIQ automático para textos en botones (`--brand-primary-text`) y personalización institucional en vivo (`ThemeService`)
- **Home Landing Interactiva**: Carrusel rotativo de demostración de módulos en tiempo real (Subasta, Billetera, Evaluación) y cuadrícula informativa de 6 características clave
- **Módulos de Negocio Standalone**: Vistas independientes y lazy-loaded para `activities`, `auctions`, `wallet` y `grades` con exportaciones oficiales a PDF y Excel DANE

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
│   │   ├── auctions/                 # Subastas en vivo, WebSockets (consumers), pujas con retención
│   │   ├── classrooms/               # Aulas académicas y asignaturas (Docente)
│   │   ├── common/                   # Modelos base, reportes (PDF/Excel), utilidades y mixins
│   │   ├── grades/                   # Calificaciones, exportaciones y disparadores de EduCoins
│   │   ├── groups/                   # Grupos escolares, matrículas por código y períodos
│   │   ├── institutions/             # Módulo SaaS Multi-Tenant, exportaciones DANE y White-Labeling
│   │   ├── notifications/            # Motor de alertas, señales automáticas y anuncios institucionales
│   │   ├── ai_assistant/             # EDUBID IA: Agente autónomo con Tool Calling en tiempo real
│   │   ├── reports/                  # Informes y analítica académica
│   │   ├── tokens/                   # Wallets, periodos y transacciones de EduCoins
│   │   └── users/                    # Autenticación JWT, RBAC estricto, Google SSO y throttles
│   ├── edubid_core/                  # Configuración Django, ASGI Channels, paginación y excepciones globales
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
│   │   │   │   │                     # InAppNotificationService, WebSocketService,
│   │   │   │   │                     # ActivityService, AuctionService, ClassroomService,
│   │   │   │   │                     # GradeService, GroupService, InstitutionService,
│   │   │   │   │                     # UserService, WalletService, DashboardService, GoogleAuthService,
│   │   │   │   │                     # AiAssistantService (Cliente HTTP para EDUBID IA)
│   │   │   │   ├── guards/           # authGuard, roleGuard
│   │   │   │   ├── interceptors/     # authInterceptor (JWT), errorInterceptor (Resiliencia HTTP)
│   │   │   │   └── models/           # Interfaces TypeScript (User, Group, Classroom, etc.)
│   │   │   ├── shared/               # Componentes reutilizables y estructura
│   │   │   │   ├── components/       # Layout (Aside sidebar + Header + Campana + Footer), UI atoms,
│   │   │   │   │                     # institution-branding (White-label),
│   │   │   │   │                     # ai-assistant (Botón flotante y chatbot EDUBID IA)
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

### Paso 2: Configurar y Levantar el Backend (Django + Supabase / MySQL)

#### 2.1 Configurar variables de entorno del backend

Copia la plantilla `.env.example` en la carpeta `edubid-backend/`:

```bash
cp edubid-backend/.env.example edubid-backend/.env
```

Edita `edubid-backend/.env` según tu base de datos preferida:

##### Opción A: Supabase (PostgreSQL en la Nube — Recomendado)
```env
SECRET_KEY=django-insecure-clave-desarrollo-edubid
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

DB_ENGINE=django.db.backends.postgresql
DB_NAME=postgres
DB_USER=postgres.[TU_PROJECT_REF]
DB_PASSWORD=[TU_PASSWORD_DE_SUPABASE]
DB_HOST=aws-0-us-east-1.pooler.supabase.com
DB_PORT=5432
DB_SSLMODE=require

FRONTEND_URL=http://localhost:4200
CORS_ALLOWED_ORIGINS=http://localhost:4200,http://127.0.0.1:4200,http://localhost:5173
```
*(No requiere levantar contenedores Docker en tu máquina local).*

##### Opción B: MySQL en Docker Compose (Local)
Si prefieres usar MySQL en contenedor local:
```bash
cd edubid-backend
docker compose up -d
docker ps
```
Configura en `.env`:
```env
DB_ENGINE=django.db.backends.mysql
DB_NAME=edubid_db
DB_USER=edubid_user
DB_PASSWORD=edubid_password
DB_HOST=127.0.0.1
DB_PORT=3306
```

#### 2.2 Preparar el Entorno Virtual de Python e Instalar Dependencias

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

#### 2.3 Aplicar Migraciones y Crear Superusuario

```bash
python manage.py migrate
python manage.py createsuperuser
```

#### 2.4 Iniciar el Servidor Backend

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
| **EDUBID IA** | `/ai/chat/`, `/ai/suggestions/` | Agente autónomo con Google Gemini (21 herramientas con CRUD total en BD) |

> 📖 Para consultar la especificación exhaustiva de cada endpoint, esquemas de payload y respuestas JSON, consulta:
> **[`edubid-backend/BACKEND_API_MAP.md`](edubid-backend/BACKEND_API_MAP.md)**

---

## 🚀 Estado Actual del Proyecto y Roadmap

Para consultar el registro técnico detallado de todas las funcionalidades implementadas, arquitectura por capas, y la hoja de ruta de tareas pendientes (incluyendo la migración a Supabase y especificaciones pedagógicas), consulta el documento oficial:

👉 **[ROADMAP_Y_ESTADO_DEL_PROYECTO.md](ROADMAP_Y_ESTADO_DEL_PROYECTO.md)**

### Hitos Recientes Clave:
* **EDUBID IA (Google AI Studio Gemini 3.6 Flash + Copiloto Pedagógico Restringido)**: Asistente impulsado por `gemini-3.6-flash` con fallback escalonado. Dispone de herramientas seguras de consulta, verificación estricta de existencia real de clases/grupos, calificación asistida y abono de incentivos formativos (con permisos de creación y eliminación bloqueados para control directo del usuario). Incluye sincronización reactiva en tiempo real en frontend vía `actionCompleted$` (cero F5) y respuestas pedagógicas limpias sin IDs técnicos.
* **Erradicación de Alertas confirm() Nativas**: Reemplazadas por modales visuales integrados (`ConfirmDialogService`) con los colores institucionales del colegio.
* **Identidad Institucional Completa**: Paleta cromática de 24 colores, contraste dinámico YIQ, degradado simétrico superior (`secondary -> primary -> secondary`) y scrollbars institucionales.
* **Flujo Seguro de Sesión**: Modal de confirmación interactivo, overlay de cierre de sesión cinematográfico, reseteo de variables CSS (`ThemeService.resetBrandColors()`) y hard refresh a Home.
* **Módulos Académicos**: Aulas con grupos anidados (`Classrooms`), Actividades con notas reales 0-100 y acreditación automática de EduCoins, Subastas en vivo con WebSockets, Billetera digital y Reportes DANE en PDF y Excel.
* **Notificaciones Interactivas**: Centro in-app con marcado automático y redirección contextual según el recurso (`/auctions`, `/activities`, `/grades`, `/wallet`, `/profile`).
* **Módulo de Perfil (`/profile`)**: Edición de datos personales, cambio de contraseña seguro y resumen institucional.
* **Guía de Supabase (PostgreSQL + Storage)**: Documento paso a paso para el despliegue y migración en [edubid-backend/MIGRACION_SUPABASE.md](edubid-backend/MIGRACION_SUPABASE.md).

---

## 🔧 Comandos Útiles

### Backend (Django)

```bash
# Crear nuevas migraciones
python manage.py makemigrations

# Aplicar migraciones pendientes
python manage.py migrate

# Ejecutar suite completa de tests automatizados (76 pruebas)
python manage.py test apps

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

# Ejecutar pruebas unitarias automatizadas (23 pruebas)
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

- [Estado Actual del Proyecto y Hoja de Ruta (Roadmap)](ROADMAP_Y_ESTADO_DEL_PROYECTO.md)
- [Guía de Migración de MySQL a Supabase (PostgreSQL + Storage)](edubid-backend/MIGRACION_SUPABASE.md)
- [Plan de Auditoría Técnica, Resiliencia y Mejoras del MVP](AUDIT_AND_IMPROVEMENT_PLAN.md)
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
