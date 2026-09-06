# 🐍 EduBid Backend — Django REST Framework API

> **API RESTful robusta, multi-tenant y gamificada para EduBid** | Django 5.2.6, Django REST Framework 3.16, SimpleJWT & MySQL 8.0

[![Python: 3.10+](https://img.shields.io/badge/Python-3.10%2B-blue?style=flat-square&logo=python)](https://www.python.org/)
[![Django: 5.2.6](https://img.shields.io/badge/Django-5.2.6-darkgreen?style=flat-square&logo=django)](https://www.djangoproject.com/)
[![DRF: 3.16](https://img.shields.io/badge/DRF-3.16-red?style=flat-square)](https://www.django-rest-framework.org/)
[![Database: MySQL 8.0](https://img.shields.io/badge/Database-MySQL%208.0-orange?style=flat-square&logo=mysql)](https://www.mysql.com/)
[![Auth: SimpleJWT + Google SSO](https://img.shields.io/badge/Auth-JWT%20%2B%20OAuth2-purple?style=flat-square)](https://jwt.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](../LICENSE)

---

## 📋 Descripción

El backend de **EduBid** proporciona una API REST completa de alto rendimiento encargada de gestionar el ciclo de vida educativo, el aislamiento institucional multi-inquilino (*multi-tenant*), el control de acceso basado en roles (**RBAC**), la economía gamificada basada en **EduCoins** y el motor de subastas estratégicas de incentivos académicos.

---

## 🏛️ Arquitectura Modular de Aplicaciones

El código fuente está estructurado en módulos desacoplados bajo el directorio `apps/`:

```
edubid-backend/
├── apps/
│   ├── institutions/             # Aprovisionamiento SaaS de colegios, Código DANE y White-Labeling (colores, logo)
│   ├── users/                    # Modelo User personalizado, RBAC, SimpleJWT, Google OAuth y verificación por email
│   ├── classrooms/               # Aulas académicas / asignaturas gestionadas por docentes
│   ├── groups/                   # Salones escolares, generación de códigos de unión (6 caracteres) y matrículas
│   ├── activities/               # Retos, misiones, proyectos, evaluaciones y módulo de entregas (Submissions)
│   ├── grades/                   # Registro de notas y señales automáticas de acreditación de EduCoins
│   ├── tokens/                   # Períodos académicos (cortes), Billeteras virtuales (Wallets) y libro mayor contable
│   ├── auctions/                 # Subastas de incentivos creadas por docentes con retención y reembolso de pujas
│   ├── notifications/            # Sistema centralizado de alertas, eventos y anuncios institucionales
│   ├── reports/                  # Métricas consolidadas, analítica agregada y reportes de rendimiento
│   └── common/                   # Modelos abstractos base (`BaseModel`), mixins y utilidades compartidas
├── edubid_core/                  # Ajustes del proyecto Django (`settings.py`, `urls.py`, `wsgi.py`, `asgi.py`)
├── docker-compose.yml            # Orquestación de contenedor MySQL 8.0
├── requirements.txt              # Dependencias de producción y desarrollo
├── BACKEND_API_MAP.md            # Especificación completa de endpoints, esquemas y payloads
└── manage.py
```

---

## 🛡️ Seguridad, Gobernanza y Multi-Tenant

### 1. Ámbito Global Estricto para SuperAdmin (`admin`)
- Un Administrador Global tiene garantizado `institucion = None` en base de datos mediante validaciones en `User.clean()` y sobreescritura en `User.save()`.
- Los endpoints de actualización de perfil (`api_update_profile`) y los serializadores de usuario impiden asociar una institución a un usuario `admin`, habilitando su supervisión global neutral sobre todos los inquilinos.

### 2. Aislamiento Institucional (Rector y Coordinador)
- Cada consulta de usuarios, aulas, grupos, notas y subastas se filtra a nivel de `get_queryset()` según el `institucion_id` del usuario autenticado.
- Regla de unicidad en base de datos (`UniqueConstraint`) que garantiza un único usuario con rol `rector` activo por institución.

### 3. Delimitación Docente y Estudiantil
- **Docentes**: Solo acceden a las aulas y grupos que ellos mismos crearon (`docente == request.user`).
- **Validaciones Cruzadas de Seguridad**:
  - `POST /api/tokens/wallets/{id}/depositar/`: Valida estrictamente que el docente autenticado sea el titular del aula del estudiante al que pertenece la wallet.
  - `POST /api/grades/`: Valida que la actividad pertenezca a un aula del docente que califica.
- **Estudiantes**: Acceso exclusivo a grupos donde estén formalmente matriculados (`estudiantes == request.user`) y a su propia billetera (`Wallet`).

---

## ⚙️ Puesta en Marcha en Desarrollo

### Prerrequisitos

- **Python** 3.10 o superior
- **MySQL** 8.0 (recomendado mediante Docker)
- **Docker** & **Docker Compose**

### 1. Configuración de Variables de Entorno

Copia la plantilla `.env.example`:

```bash
cd edubid-backend
cp .env.example .env
```

Edita `.env` con la configuración deseada:
```env
SECRET_KEY=django-insecure-clave-desarrollo-edubid
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

DB_NAME=edubid_db
DB_USER=edubid_user
DB_PASSWORD=edubid_password
DB_HOST=127.0.0.1
DB_PORT=3306

FRONTEND_URL=http://localhost:4200
CORS_ALLOWED_ORIGINS=http://localhost:4200,http://127.0.0.1:4200
```

### 2. Levantar MySQL con Docker

```bash
docker compose up -d
```

Verifica el estado del contenedor con `docker ps`.

### 3. Entorno Virtual de Python

```bash
# Crear entorno virtual
python3 -m venv .venv

# Activar en Linux/macOS:
source .venv/bin/activate

# Activar en Windows:
.venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt
```

### 4. Migraciones y Superusuario

```bash
python manage.py migrate
python manage.py createsuperuser
```

### 5. Iniciar el Servidor

```bash
python manage.py runserver
```

- **API REST Base**: `http://localhost:8000/api/`
- **Django Admin**: `http://localhost:8000/admin/`

---

## 📡 Mapeo Exhaustivo de la API

Para consultar el listado completo de rutas, métodos, permisos requeridos, estructuras JSON de solicitud y respuesta, y detalles de seguridad por endpoint, consulta el documento:

👉 **[`BACKEND_API_MAP.md`](BACKEND_API_MAP.md)**

---

## 🧪 Pruebas Automatizadas

```bash
python manage.py test
```

---

## 📄 Licencia

Este proyecto está bajo la licencia **MIT**. Consulta el archivo [LICENSE](../LICENSE) para más información.
