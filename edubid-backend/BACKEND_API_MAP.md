# BACKEND_API_MAP.md — EduBid Backend (Django REST Framework)

> **Generado automáticamente** — 2026-08-27
> Base: `edubid-backend/` (Django 5.2.6 + DRF + SimpleJWT + MySQL)

---

## Tabla de Contenidos

1. [Tabla de Endpoints](#1-tabla-de-endpoints)
2. [Flujo de Autenticación](#2-flujo-de-autenticación)
3. [Aislamiento Multi-Tenant](#3-aislamiento-multi-tenant)
4. [Formato de Respuestas JSON Clave](#4-formato-de-respuestas-json-clave)

---

## 1. Tabla de Endpoints

### 1.1 Autenticación y Usuarios (`/api/users/`)

| Ruta | Método | Auth | Propósito |
|------|--------|------|-----------|
| `/api/users/register/` | POST | No | Registro manual (email + password). Crea usuario inactivo hasta verificar email. |
| `/api/users/login/` | POST | No | Login manual. Retorna JWT access + refresh tokens. Tracking de fallos de login. |
| `/api/users/google/` | POST | No | Login/registro con Google OAuth (id_token). Auto-crea usuario si es nuevo. |
| `/api/users/token/refresh/` | POST | No | Refrescar access token usando refresh token. |
| `/api/users/verify-email/<token>/` | GET | No | Verificar email con token enviado por SendGrid. Activa la cuenta. |
| `/api/users/resend-verification/` | POST | No | Reenviar email de verificación. Invalida tokens anteriores. |
| `/api/users/profile/` | GET | Sí | Obtener perfil del usuario autenticado. |
| `/api/users/profile/update/` | PATCH | Sí | Actualizar nombre, apellido, institución (escritura única), datos del profile. |
| `/api/users/delete-account/` | DELETE | Sí | Eliminar cuenta propia (requiere password para confirmar). |
| `/api/users/change-password/` | PATCH | Sí | Cambiar contraseña (requiere old_password + new_password + confirm_password). |
| `/api/users/password-reset/` | POST | No | Solicitar reset de contraseña. Envía email con link de reset. |
| `/api/users/password-reset-confirm/<uidb64>/<token>/` | POST | No | Confirmar nueva contraseña con token de reset. |
| `/api/users/list/` | GET | Sí (admin) | Listar todos los usuarios del sistema. |
| `/api/users/<user_id>/update/` | PATCH | Sí (admin) | Actualizar cualquier usuario (admin). |
| `/api/users/<user_id>/delete/` | DELETE | Sí (admin) | Eliminar cualquier usuario (admin). |

### 1.2 Classrooms (`/api/classrooms/`)

| Ruta | Método | Auth | Propósito |
|------|--------|------|-----------|
| `/api/classrooms/` | GET | Sí | Listar classrooms del usuario (docente: los suyos, estudiante: donde tiene grupos). |
| `/api/classrooms/` | POST | Sí (docente) | Crear classroom. Se asigna automáticamente al docente logueado. |
| `/api/classrooms/{id}/` | GET | Sí | Detalle de un classroom con sus grupos anidados. |
| `/api/classrooms/{id}/` | PUT/PATCH | Sí (docente) | Actualizar classroom. |
| `/api/classrooms/{id}/` | DELETE | Sí (docente) | Eliminar classroom. |
| `/api/classrooms/{id}/students/` | GET | Sí (docente) | Listar estudiantes del classroom. |

### 1.3 Grupos (`/api/groups/`)

| Ruta | Método | Auth | Propósito |
|------|--------|------|-----------|
| `/api/groups/` | GET | Sí | Listar grupos del usuario. |
| `/api/groups/` | POST | Sí (docente) | Crear grupo dentro de un classroom propio. |
| `/api/groups/{id}/` | GET | Sí | Detalle de grupo con estudiantes detallados. |
| `/api/groups/{id}/` | PUT/PATCH | Sí (docente) | Actualizar grupo. |
| `/api/groups/{id}/` | DELETE | Sí (docente) | Eliminar grupo. |
| `/api/groups/join/` | POST | Sí (estudiante) | Unirse a grupo por código. Crea wallet automáticamente. |
| `/api/groups/{id}/join/` | POST | Sí (estudiante) | Unirse a grupo por ID. |
| `/api/groups/{id}/estudiantes/` | GET | Sí | Listar estudiantes de un grupo. |

### 1.4 Actividades (`/api/activities/`)

| Ruta | Método | Auth | Propósito |
|------|--------|------|-----------|
| `/api/activities/` | GET | Sí | Listar actividades (docente: las suyas, estudiante: solo habilitadas de sus grupos). Filtrable por `?group=`. |
| `/api/activities/` | POST | Sí (docente) | Crear actividad (reto, misión, proyecto, evaluación). |
| `/api/activities/{id}/` | GET | Sí | Detalle de actividad con submissions (docente ve todas, estudiante solo la suya). |
| `/api/activities/{id}/` | PUT/PATCH | Sí (docente) | Actualizar actividad. |
| `/api/activities/{id}/` | DELETE | Sí (docente) | Eliminar actividad. |
| `/api/submissions/` | GET | Sí | Listar entregas propias (estudiante) o de sus clases (docente). Filtrable por `?activity=`. |
| `/api/submissions/` | POST | Sí (estudiante) | Crear entrega de actividad (1 submission por actividad por estudiante). |
| `/api/submissions/{id}/` | GET | Sí | Detalle de entrega con actividad anidada. |
| `/api/submissions/{id}/` | DELETE | Sí | Cancelar entrega (si no está calificada y no venció). |
| `/api/submissions/{id}/grade/` | PATCH | Sí (docente) | Calificar entrega. Actualiza Grade y crea/actualiza registro en Grade. |

### 1.5 Calificaciones (`/api/grades/`)

| Ruta | Método | Auth | Propósito |
|------|--------|------|-----------|
| `/api/grades/` | GET | Sí | Listar calificaciones (docente: de sus clases, estudiante: las suyas). |
| `/api/grades/` | POST | Sí (docente) | Crear calificación. Signal dispara asignación automática de EduCoins. |
| `/api/grades/{id}/` | GET | Sí | Detalle de calificación con coins_ganados calculados. |
| `/api/grades/mis-notas/` | GET | Sí (estudiante) | Notas propias con promedio general y total EduCoins ganados. |
| `/api/grades/grupo/{group_id}/reporte/` | GET | Sí (docente) | Reporte detallado de notas y EduCoins por grupo. |
| `/api/grades/calificar-multiple/` | POST | Sí (docente) | Calificación masiva para una actividad. |

### 1.6 Tokens / EduCoins (`/api/tokens/`)

| Ruta | Método | Auth | Propósito |
|------|--------|------|-----------|
| `/api/tokens/periods/` | GET | Sí (docente/admin) | Listar periodos (docente: de sus grupos, admin: todos). |
| `/api/tokens/periods/` | POST | Sí (docente/admin) | Crear periodo. Auto-crea wallets para todos los estudiantes del grupo. |
| `/api/tokens/periods/{id}/` | GET | Sí | Detalle de periodo. |
| `/api/tokens/periods/{id}/` | PUT/PATCH | Sí (docente/admin) | Actualizar periodo. |
| `/api/tokens/periods/{id}/` | DELETE | Sí (docente/admin) | Eliminar periodo. |
| `/api/tokens/periods/{id}/activar/` | POST | Sí (docente/admin) | Activar periodo (desactiva los demás del mismo grupo). |
| `/api/tokens/periods/mis_periodos/` | GET | Sí | Periodos del usuario según su rol. |
| `/api/tokens/wallets/` | GET | Sí | Listar wallets (estudiante: solo las suyas). |
| `/api/tokens/wallets/{id}/` | GET | Sí | Detalle de wallet con transacciones. |
| `/api/tokens/wallets/mi-wallet/` | GET | Sí (estudiante) | Wallet del periodo activo del estudiante. |
| `/api/tokens/wallets/{id}/depositar/` | POST | Sí (docente) | Depositar monedas a wallet de un estudiante. |
| `/api/tokens/transactions/` | GET | Sí | Listar transacciones (estudiante: solo las suyas). |
| `/api/tokens/transactions/{id}/` | GET | Sí | Detalle de transacción. |

### 1.7 Subastas (`/api/auctions/`)

| Ruta | Método | Auth | Propósito |
|------|--------|------|-----------|
| `/api/auctions/auctions/` | GET | Sí | Listar subastas (docente: de sus grupos, estudiante: de sus grupos). |
| `/api/auctions/auctions/` | POST | Sí (docente/admin) | Crear subasta con valor mínimo e incremento en EduCoins. |
| `/api/auctions/auctions/{id}/` | GET | Sí | Detalle de subasta con todas las pujas, puja ganadora y más alta. |
| `/api/auctions/auctions/{id}/` | PUT/PATCH | Sí (docente/admin) | Actualizar subasta. |
| `/api/auctions/auctions/{id}/` | DELETE | Sí (docente/admin) | Eliminar subasta (solo si está activa). |
| `/api/auctions/auctions/{id}/close/` | POST | Sí (docente/admin) | Cerrar subasta. Cobra EduCoins al ganador, devuelve a los demás. |
| `/api/auctions/auctions/stats/` | GET | Sí | Estadísticas de subastas (activas, cerradas, totales). |
| `/api/auctions/bids/` | GET | Sí | Listar pujas propias (estudiante) o de sus clases (docente). |
| `/api/auctions/bids/` | POST | Sí (docente/estudiante) | Crear puja. Bloquea monedas en wallet. Estudiante solo puede pujar por sí mismo. |
| `/api/auctions/bids/{id}/` | GET | Sí | Detalle de puja. |
| `/api/auctions/bids/{id}/` | PUT/PATCH | Sí (docente) | Actualizar puja (solo docente). |
| `/api/auctions/bids/{id}/` | DELETE | Sí | Eliminar puja (desbloquea monedas). |
| `/api/auctions/bids/por-subasta/{auction_id}/` | GET | Sí | Pujas de una subasta específica. |

### 1.8 Notificaciones (`/api/notifications/`)

| Ruta | Método | Auth | Propósito |
|------|--------|------|-----------|
| `/api/notifications/` | GET | Sí | Listar notificaciones del usuario autenticado. |
| `/api/notifications/` | POST | Sí | Crear notificación (admin). |
| `/api/notifications/{id}/` | GET | Sí | Detalle de notificación. |
| `/api/notifications/{id}/` | PUT/PATCH | Sí | Actualizar notificación. |
| `/api/notifications/{id}/` | DELETE | Sí | Eliminar notificación. |
| `/api/notifications/no-leidas/` | GET | Sí | Notificaciones no leídas (total + array). |
| `/api/notifications/marcar-todas-leidas/` | POST | Sí | Marcar todas como leídas. |
| `/api/notifications/{id}/marcar-leida/` | POST | Sí | Marcar una notificación como leída. |
| `/api/notifications/eliminar-todas/` | DELETE | Sí | Eliminar todas las notificaciones del usuario. |
| `/api/notifications/estadisticas/` | GET | Sí | Conteo por tipo, leídas/no leídas. |
| `/api/notifications/enviar-estudiantes/` | POST | Sí (docente) | Enviar notificación tipo anuncio a todos sus estudiantes. |

### 1.9 Instituciones (`/api/institutions/`)

| Ruta | Método | Auth | Propósito |
|------|--------|------|-----------|
| `/api/institutions/` | GET | No | Listar instituciones activas (público). |
| `/api/institutions/` | POST | Sí (admin) | Crear institución (solo admin global). |
| `/api/institutions/{id}/` | GET | No | Detalle de institución (público). |
| `/api/institutions/{id}/` | PUT/PATCH | Sí | Actualizar (rector: solo su institución; admin: cualquier una). |
| `/api/institutions/{id}/` | DELETE | Sí (admin) | Eliminar institución (solo admin global). |
| `/api/institutions/public/` | GET | No | Lista pública para selects de registro (solo id + nombre). |

---

## 2. Flujo de Autenticación

### 2.1 Mecanismo Principal: JWT (SimpleJWT)

- **Biblioteca**: `djangorestframework-simplejwt` v5.5.1
- **Token de acceso**: 1 hora de vida
- **Token de refresco**: 1 día de vida
- **Rotación de refresh tokens**: Habilitada (`ROTATE_REFRESH_TOKENS = True`)
- **Blacklist después de rotación**: Habilitado (`BLACKLIST_AFTER_ROTATION = True`)
- **Header**: `Authorization: Bearer <access_token>`

### 2.2 Registro y Verificación de Email

```
POST /api/users/register/
  → Crea usuario con is_active=False, email_verified=False
  → Genera EmailVerificationToken (válido 24h)
  → Envía email de verificación vía SendGrid API
  → Retorna: { message, email, verification_required: true, user_id }

GET /api/users/verify-email/<token>/
  → Activa usuario (is_active=True, email_verified=True)
  → Genera tokens JWT automáticamente
  → Retorna: { message, user: UserProfileSerializer, tokens: { access, refresh } }
```

### 2.3 Login Manual

```
POST /api/users/login/
  → Valida email + password via django.contrib.auth.authenticate()
  → Verifica email_verified (excepto roles admin/rector/coordinador)
  → Tracking de fallos (LoginFailureTracker)
  → Retorna: { message, user: UserProfileSerializer, tokens: { access, refresh } }
```

### 2.4 Login con Google OAuth

```
POST /api/users/google/
  → Recibe { id_token } del frontend (obtenido vía Google Identity Services)
  → Verifica token con google.oauth2.id_token.verify_oauth2_token()
  → get_or_create User (nuevos usuarios: role='estudiante', email_verified=True)
  → Retorna: { user: UserProfileSerializer, tokens: { access, refresh } }
```

### 2.5 Refrescar Token

```
POST /api/users/token/refresh/
  → Body: { "refresh": "<refresh_token>" }
  → Retorna: { "access": "<nuevo_access_token>" }
```

### 2.6 Flujo Completo del Frontend

```
1. Login → POST /api/users/login/ → Guardar access_token + refresh_token
2. Cada petición → Header: Authorization: Bearer <access_token>
3. Token expira (401) → POST /api/users/token/refresh/ → Actualizar access_token
4. Refresh expira → Redirigir a login
```

---

## 3. Aislamiento Multi-Tenant

### 3.1 Mecanismo: FK `institucion_id` en el modelo User

El multi-tenant NO es a nivel de base de datos separada ni por schema. Se implementa mediante una **relación ForeignKey** en el modelo `User` hacia `Institution`:

```python
# apps/users/models.py
class User(AbstractUser, BaseModel):
    institucion = models.ForeignKey(
        'institutions.Institution',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='usuarios'
    )
    role = models.CharField(...)  # admin|rector|coordinador|docente|estudiante
```

### 3.2 Modelo Institution (White-Label)

```python
class Institution(BaseModel):
    nombre = models.CharField(max_length=255)
    codigo_dane = models.CharField(max_length=50, unique=True, null=True, blank=True)
    activo = models.BooleanField(default=True)
    # White-Label
    color_primario = models.CharField(max_length=7, default='#f97316')
    color_secundario = models.CharField(max_length=7, default='#3b82f6')
    logo = models.ImageField(upload_to='instituciones/logos/', null=True, blank=True)
```

### 3.3 Cómo se Filtra por Institución

El filtrado se hace **a nivel de queryset en cada ViewSet**, no a nivel de middleware. Cada vista filtra según el rol del usuario:

| Rol | Filtrado aplicado |
|-----|-------------------|
| `admin` | Ve todo (todas las instituciones) |
| `rector` | Ve solo su institución (`institucion_id` del usuario) |
| `coordinador` | Ve su institución (filtros en signals/notifications) |
| `docente` | Filtra por `classroom.docente == user` (implícitamente restringido a su institución) |
| `estudiante` | Filtra por `estudiantes=user` (solo ve lo de sus grupos) |

### 3.4 Constraint de Rector por Institución

```python
# apps/users/models.py
UniqueConstraint(
    fields=['institucion'],
    condition=Q(role='rector'),
    name='unique_rector_per_institution',
)
# Garantiza que cada institución tenga UN SOLO rector.
```

### 3.5 Restricciones de Escritura en Institución

- Un usuario solo puede **asignar su institución una vez** (escritura única en `api_update_profile`).
- Un rector solo puede **editar datos de personalización** (colores, logo) de su institución.
- Solo un admin global puede **crear o eliminar** instituciones.
- El rector **NO puede cambiar** `activo` ni `codigo_dane`.

### 3.6 Herencia de Institución en el Modelo de Datos

```
Institution
  └── User (institucion FK)
        ├── Classroom (docente FK → User)
        │     └── Group (classroom FK → Classroom)
        │           ├── Estudiantes (M2H → User)
        │           ├── Period → Wallet (usuario FK → User)
        │           ├── Activity
        │           │     └── Submission
        │           │           └── Grade
        │           └── Auction → Bid
        └── Notification (institucion FK → Institution)
```

### 3.7 Notas Importantes para el Frontend

- El `institucion_id` se envía en el registro (`POST /api/users/register/`) como campo opcional.
- Se puede asignar después vía `PATCH /api/users/profile/update/` pero **solo una vez**.
- El frontend debe consultar `GET /api/institutions/public/` para obtener la lista de instituciones disponibles para el select de registro.
- El `user.institucion` en el serializer de perfil retorna el objeto anidado con `{ id, nombre, color_primario, color_secundario, logo }`.

---

## 4. Formato de Respuestas JSON Clave

### 4.1 Login Exitoso

```json
{
  "message": "Login exitoso",
  "user": {
    "id": 1,
    "email": "docente@ejemplo.com",
    "first_name": "Juan",
    "last_name": "Pérez",
    "role": "docente",
    "avatar": null,
    "date_joined": "2026-06-11T21:41:00Z",
    "profile": {
      "bio": "Docente de matemáticas",
      "telefono": "3001234567",
      "direccion": "Calle 123",
      "fecha_nacimiento": "1990-05-15",
      "institucion": {
        "id": 1,
        "nombre": "Colegio San José",
        "color_primario": "#f97316",
        "color_secundario": "#3b82f6",
        "logo": "http://backend/media/instituciones/logos/logo.png"
      }
    }
  },
  "tokens": {
    "access": "eyJhbGciOiJIUzI1NiIs...",
    "refresh": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### 4.2 Login Fallido

```json
{
  "message": "Credenciales inválidas",
  "suggest_password_reset": true,
  "errors": {
    "non_field_errors": ["Credenciales inválidas"]
  }
}
```

### 4.3 Email No Verificado

```json
{
  "message": "Por favor verifica tu correo electrónico antes de iniciar sesión.",
  "email_not_verified": true,
  "email": "usuario@ejemplo.com"
}
```

### 4.4 Registro Exitoso

```json
{
  "message": "Usuario registrado. Por favor verifica tu correo electrónico.",
  "email": "nuevo@ejemplo.com",
  "verification_required": true,
  "user_id": 15
}
```

### 4.5 Verificación de Email Exitosa

```json
{
  "message": "¡Email verificado exitosamente!",
  "user": {
    "id": 15,
    "email": "nuevo@ejemplo.com",
    "first_name": "María",
    "last_name": "López",
    "role": "estudiante",
    "avatar": null,
    "date_joined": "2026-08-27T10:00:00Z",
    "profile": {
      "bio": null,
      "telefono": null,
      "direccion": null,
      "fecha_nacimiento": null,
      "institucion": {
        "id": 1,
        "nombre": "Colegio San José",
        "color_primario": "#f97316",
        "color_secundario": "#3b82f6",
        "logo": null
      }
    }
  },
  "tokens": {
    "access": "eyJhbGciOiJIUzI1NiIs...",
    "refresh": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### 4.6 Perfil del Usuario

```json
{
  "message": "Perfil obtenido exitosamente",
  "user": {
    "id": 1,
    "email": "docente@ejemplo.com",
    "first_name": "Juan",
    "last_name": "Pérez",
    "role": "docente",
    "avatar": null,
    "date_joined": "2026-06-11T21:41:00Z",
    "profile": {
      "bio": "Docente de matemáticas",
      "telefono": "3001234567",
      "direccion": "Calle 123",
      "fecha_nacimiento": "1990-05-15",
      "institucion": {
        "id": 1,
        "nombre": "Colegio San José",
        "color_primario": "#f97316",
        "color_secundario": "#3b82f6",
        "logo": "http://backend/media/instituciones/logos/logo.png"
      }
    }
  }
}
```

### 4.7 Wallet del Estudiante

```json
{
  "id": 5,
  "usuario": 12,
  "usuario_email": "estudiante@ejemplo.com",
  "grupo": 3,
  "grupo_nombre": "Grupo A - 10°",
  "periodo": 1,
  "periodo_nombre": "Corte 1",
  "saldo_educoins": 500,
  "bloqueado_educoins": 150,
  "saldo_disponible": 350,
  "transacciones": [
    {
      "id": 1,
      "wallet": 5,
      "tipo": "earn",
      "cantidad_educoins": 100,
      "descripcion": "Recompensa por 'Proyecto Final' (nota 95/100)",
      "creado": "2026-08-25T14:30:00Z"
    }
  ]
}
```

### 4.8 Listado de Actividades

```json
[
  {
    "id": 10,
    "group": 3,
    "tipo": "reto",
    "nombre": "Reto de Álgebra",
    "descripcion": "Resolver 10 ejercicios de ecuaciones",
    "valor_educoins": 200,
    "puntos_experiencia": 10,
    "fecha_entrega": "2026-09-01T23:59:00Z",
    "habilitada": true,
    "archivo_adjunto": null,
    "classroom": 1,
    "submissions": [],
    "user_submission": null,
    "puede_entregar": true,
    "esta_vencida": false,
    "tiempo_restante": "5 día(s) 2 hora(s)"
  }
]
```

### 4.9 Respuesta de Subasta

```json
{
  "id": 8,
  "titulo": "Subasta: Cuaderno Premium",
  "descripcion": "Cuaderno de 200 hojas",
  "creador": 5,
  "creador_email": "docente@ejemplo.com",
  "creador_nombre": "Juan Pérez",
  "grupo": 3,
  "grupo_nombre": "Grupo A - 10°",
  "valor_minimo_educoins": 50,
  "incremento_minimo_educoins": 10,
  "fecha_fin": "2026-09-05T18:00:00Z",
  "estado": "active",
  "total_pujas": 3,
  "puja_ganadora": null,
  "puja_mas_alta": {
    "cantidad_educoins": 200,
    "estudiante_nombre": "María López"
  },
  "bids": [
    {
      "id": 15,
      "auction": 8,
      "auction_titulo": "Subasta: Cuaderno Premium",
      "estudiante": 12,
      "estudiante_email": "estudiante@ejemplo.com",
      "estudiante_nombre": "María López",
      "cantidad_educoins": 200,
      "registrado_por": 12,
      "registrado_por_email": "estudiante@ejemplo.com",
      "creado": "2026-08-27T10:00:00Z"
    }
  ],
  "creado": "2026-08-26T08:00:00Z"
}
```

### 4.10 Notificaciones

```json
{
  "total": 5,
  "notificaciones": [
    {
      "id": 1,
      "tipo": "calificacion",
      "titulo": "Nueva calificación recibida",
      "mensaje": "Has recibido una calificación de 95 en \"Proyecto Final\". EduCoins ganados: 105.",
      "leida": false,
      "activity_id": 10,
      "grade_id": 5,
      "auction_id": null,
      "metadata": {
        "nota": "95",
        "activity_nombre": "Proyecto Final",
        "educoins_ganados": 105
      },
      "creado": "2026-08-25T14:30:00Z",
      "tiempo_transcurrido": "hace 2 días"
    }
  ]
}
```

### 4.11 Errores de Validación (DRF)

```json
{
  "detail": "No tienes permiso para crear subastas en grupos que no son tuyos."
}
```

```json
{
  "errors": {
    "institucion_id": ["La institución seleccionada no existe o no está activa."],
    "password_confirm": ["Las contraseñas no coinciden"]
  }
}
```

### 4.12 Google Login

```json
{
  "user": {
    "id": 20,
    "email": "usuario@gmail.com",
    "first_name": "Carlos",
    "last_name": "García",
    "role": "estudiante",
    "avatar": null,
    "date_joined": "2026-08-27T12:00:00Z",
    "profile": {
      "bio": null,
      "telefono": null,
      "direccion": null,
      "fecha_nacimiento": null,
      "institucion": null
    }
  },
  "tokens": {
    "access": "eyJhbGciOiJIUzI1NiIs...",
    "refresh": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

---

## Notas Técnicas para el Frontend

| Aspecto | Detalle |
|---------|---------|
| **Base URL** | `https://<dominio-railway>/api/` |
| **Content-Type** | `application/json` (excepto archivos: `multipart/form-data`) |
| **Auth Header** | `Authorization: Bearer <access_token>` |
| **CORS** | Permitido en `localhost:4200` (Angular), `localhost:5173` y `*.netlify.app` |
| **File Uploads** | Actividades (archivo_adjunto), Submissions (archivo), Perfil (avatar), Instituciones (logo) |
| **Roles disponibles** | `admin`, `rector`, `coordinador`, `docente`, `estudiante` |
| **Moneda virtual** | EduCoins — gestionadas por Wallet por grupo + periodo |
| **Períodos** | Se crean automáticamente al crear un grupo (3 cortes de 6 semanas) |
| **Subastas** | Las pujas bloquean monedas en la wallet hasta que se cierre la subasta |
| **Notificaciones** | Se generan automáticamente vía signals Django en eventos clave |
