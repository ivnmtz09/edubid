# 🎓 EduBid - Gamificación Educativa

> **Transformando la motivación en el aula** | SaaS de economía gamificada para instituciones educativas

[![Stack: Django](https://img.shields.io/badge/Backend-Django%205.2-darkgreen?style=flat-square)](https://www.djangoproject.com/)
[![Stack: React](https://img.shields.io/badge/Frontend-React%2018-blue?style=flat-square)](https://react.dev/)
[![Database: MySQL](https://img.shields.io/badge/Database-MySQL%208.0-orange?style=flat-square)](https://www.mysql.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

---

## 📋 Tabla de Contenidos

- [Descripción](#descripción)
- [Características](#características)
- [Stack Tecnológico](#stack-tecnológico)
- [Instalación Rápida](#instalación-rápida)
- [Configuración Detallada](#configuración-detallada)
- [API Endpoints](#api-endpoints)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Comandos Útiles](#comandos-útiles)
- [Despliegue](#despliegue)
- [Contribuciones](#contribuciones)
- [Autores](#autores)

---

## 📝 Descripción

**EduBid** es una solución SaaS innovadora diseñada para instituciones educativas que buscan erradicar la desmotivación escolar. Mediante una **economía interna basada en el mérito**, los docentes premian el esfuerzo académico con monedas virtuales, las cuales los estudiantes utilizan en un **sistema de subastas estratégicas** para obtener beneficios reales.

### 🎯 Objetivo

Transformar el proceso de evaluación en una experiencia **dinámica, competitiva e incentivadora** que desarrolle la responsabilidad y participación activa del estudiante.

---

## ✨ Características

### 👨‍🏫 Para Docentes

- **🏛️ Gestión Multi-Clase**: Control total sobre múltiples grupos y periodos académicos.
- **🏆 Economía Basada en Logros**: Asignación flexible de recompensas por actividades, comportamiento y puntualidad.
- **🔨 Centro de Subastas**: Creación y administración de pujas estratégicas por incentivos académicos.
- **📊 Dashboard en Tiempo Real**: Métricas detalladas del rendimiento grupal y participación estudiantil.
- **📈 Analítica Avanzada**: Seguimiento de patrones de motivación e impacto académico.

### 👨‍🎓 Para Estudiantes

- **💰 Billetera Digital**: Seguimiento transparente del saldo de monedas acumuladas.
- **🏅 Ranking Dinámico**: Visualización clara del progreso y posición competitiva.
- **🎯 Sistema de Subastas**: Participación activa en pujas para canjear esfuerzo por recompensas valiosas.
- **📜 Historial Transaccional**: Transparencia completa en cada movimiento de monedas.
- **🔔 Notificaciones en Tiempo Real**: Alertas sobre cambios, subastas y logros.

---

## 🛠️ Stack Tecnológico

### 🔧 Backend

| Tecnología                | Versión | Descripción                        |
| ------------------------- | ------- | ---------------------------------- |
| **Django**                | 5.2     | Framework web robusto para backend |
| **Django REST Framework** | -       | API REST escalable                 |
| **MySQL**                 | 8.0     | Base de datos relacional           |
| **JWT**                   | -       | Autenticación segura               |
| **Google OAuth**          | -       | Integración SSO con django-allauth |
| **Gunicorn**              | -       | Servidor WSGI de producción        |
| **WhiteNoise**            | -       | Servicio de archivos estáticos     |

### 🎨 Frontend

| Tecnología       | Versión | Descripción                              |
| ---------------- | ------- | ---------------------------------------- |
| **React**        | 18      | Librería UI moderna                      |
| **Vite**         | -       | Herramienta de construcción ultra-rápida |
| **Tailwind CSS** | -       | Diseño responsive y accesible            |
| **Axios**        | -       | Cliente HTTP                             |

---

## 🚀 Instalación Rápida

### Prerrequisitos

- **Python** 3.10+
- **Node.js** 18+
- **MySQL** 8.0+
- **Git**

### Pasos Iniciales

```bash
# Clonar repositorio
git clone https://github.com/juankAnez/educoin.git
cd educoin
```

---

## ⚙️ Configuración Detallada

### Backend

#### Paso 1: Preparar entorno

```bash
cd edubid-backend

# Windows
python -m venv .venv
.venv\Scripts\activate

# Linux/Mac
python -m venv .venv
source .venv/bin/activate
```

#### Paso 2: Instalar dependencias

```bash
pip install -r requirements.txt
```

#### Paso 3: Configurar base de datos

```bash
python manage.py migrate
python manage.py createsuperuser  # Crear cuenta de administrador
```

#### Paso 4: Ejecutar servidor

```bash
python manage.py runserver
# Backend disponible en: http://localhost:8000
# Admin disponible en: http://localhost:8000/admin
```

### Frontend

#### Paso 1: Preparar proyecto

```bash
cd ../edubid-frontend
npm install
```

#### Paso 2: Variables de entorno

Crear archivo `.env.local`:

```env
VITE_API_URL=http://localhost:8000/api
VITE_API_KEY=<tu_clave_api>
```

#### Paso 3: Ejecutar desarrollo

```bash
npm run dev
# Frontend disponible en: http://localhost:5173
```

---

## 📡 API Endpoints

### Endpoints Principales

**Base URL**: `http://localhost:8000/api/`

| Módulo             | Endpoints                                             | Descripción                           |
| ------------------ | ----------------------------------------------------- | ------------------------------------- |
| **Autenticación**  | `/users/register/`, `/users/login/`, `/users/google/` | Registro, login y OAuth               |
| **Aulas**          | `/classrooms/`                                        | Gestión de clases y cursos            |
| **Grupos**         | `/groups/`                                            | Creación y administración de grupos   |
| **Actividades**    | `/activities/`                                        | Actividades académicas y asignaciones |
| **Calificaciones** | `/grades/`                                            | Sistema de notas y evaluaciones       |
| **Economía**       | `/coins/wallets/`                                     | Gestión de billeteras virtuales       |
| **Subastas**       | `/auctions/auctions/`                                 | Creación y participación en subastas  |
| **Notificaciones** | `/notifications/`                                     | Sistema de notificaciones             |
| **Reportes**       | `/reports/`                                           | Análisis y reportes académicos        |

---

## 📁 Estructura del Proyecto

```
educoin/
├── edubid-backend/           # API REST (Django)
│   ├── apps/
│   │   ├── activities/       # Gestión de actividades
│   │   ├── auctions/         # Sistema de subastas
│   │   ├── classrooms/       # Gestión de aulas
│   │   ├── coins/            # Economía virtual
│   │   ├── common/           # Utilidades compartidas
│   │   ├── grades/           # Sistema de calificaciones
│   │   ├── groups/           # Grupos de estudiantes
│   │   ├── notifications/    # Sistema de notificaciones
│   │   ├── reports/          # Reportes y análisis
│   │   └── users/            # Autenticación y perfiles
│   ├── edubid-core/          # Configuración principal
│   ├── manage.py
│   └── requirements.txt
│
└── edubid-frontend/          # UI (React + Tailwind)
    ├── src/
    │   ├── components/       # Componentes reutilizables
    │   ├── pages/            # Páginas principales
    │   ├── context/          # Context API
    │   ├── hooks/            # Custom hooks
    │   ├── services/         # Servicios HTTP
    │   ├── styles/           # Estilos personalizados
    │   └── utils/            # Funciones auxiliares
    ├── public/               # Archivos estáticos
    ├── vite.config.js
    └── package.json
```

---

## 🔧 Comandos Útiles

### Backend

```bash
# Crear migraciones
python manage.py makemigrations

# Aplicar migraciones
python manage.py migrate

# Crear superusuario
python manage.py createsuperuser

# Ejecutar tests
python manage.py test

# Recolectar archivos estáticos
python manage.py collectstatic
```

### Frontend

```bash
# Desarrollo
npm run dev

# Build producción
npm run build

# Previsualizar build
npm run preview

# Linting
npm run lint
```

---

## 🌐 Despliegue

### Backend (Railway)

El proyecto incluye configuración lista para Railway:

```bash
# Archivos de configuración
- railway.toml
- railway_setup.sh
- Procfile
```

Consulta la [documentación de Railway](https://docs.railway.app/) para más detalles.

### Frontend (Netlify)

Configuración incluida en `netlify.toml` para despliegue automático.

---

## 📚 Documentación Adicional

- [Django REST Framework Docs](https://www.django-rest-framework.org/)
- [React Documentation](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Vite Guide](https://vitejs.dev/)

---

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Para cambios importantes:

1. Fork el repositorio
2. Crea una rama (`git checkout -b feature/AmazingFeature`)
3. Commit los cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver archivo [LICENSE](LICENSE) para más detalles.

---

## 👥 Autores

- **Juan Añez** - Backend Developer - [GitHub](https://github.com/juankAnez)
- **Ivan Martinez** - Full Stack Developer

---

## 🏆 Hecho en Colombia para el futuro de la educación

Convertimos la motivación en realidad. 🎓✨
