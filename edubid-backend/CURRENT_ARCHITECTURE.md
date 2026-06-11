# Arquitectura Actual del Backend — EduBid

> Documento generado el 2026-06-11 como parte del análisis previo a la migración multi-tenant.
> Propósito: mapear todas las relaciones, dependencias y puntos de acoplamiento del modelo de datos actual.

---

## 1. Aplicaciones Core

| App | Ruta | Estado | Descripción |
|-----|------|--------|-------------|
| `apps.common` | `apps/common/` | ✅ Instalada | Modelo abstracto `BaseModel` con campos `creado`/`actualizado` |
| `apps.users` | `apps/users/` | ✅ Instalada | Modelo de usuario personalizado, perfiles, autenticación (JWT + allauth), verificación email, registro/login |
| `apps.classrooms` | `apps/classrooms/` | ✅ Instalada | Aulas creadas por docentes |
| `apps.groups` | `apps/groups/` | ✅ Instalada | Grupos dentro de aulas, códigos de inscripción, enrolamiento de estudiantes |
| `apps.activities` | `apps/activities/` | ✅ Instalada | Actividades (tareas, exámenes, quizzes, proyectos, exposiciones) y entregas |
| `apps.grades` | `apps/grades/` | ✅ Instalada | Calificaciones vinculadas a actividades con recompensa automática en EduCoins |
| `apps.tokens` | `apps/tokens/` | ✅ Instalada | Periodos académicos (3 por grupo), Wallets de EduCoins y transacciones |
| `apps.auctions` | `apps/auctions/` | ✅ Instalada | Subastas donde los estudiantes pujan con EduCoins |
| `apps.notifications` | `apps/notifications/` | ✅ Instalada | Sistema de notificaciones con tipos discretos y señales automáticas |
| `apps.reports` | `apps/reports/` | ❌ No instalada | Placeholder sin modelos — no registrada en `INSTALLED_APPS` |

### Dependencias entre aplicaciones (orden topológico)

```
common (base abstracta)
  └── users (User, Profile)
  └── classrooms (Classroom → User.docente)
        └── groups (Group → Classroom)
              └── activities (Activity → Group)
              |     └── grades (Grade → Activity + User)
              └── tokens (Period → Group, Wallet → User + Group + Period)
              |     └── auctions (Auction → Group + User)
              └── notifications (Notification → User)
```

---

## 2. Sistema de Usuarios y Roles

### 2.1 Modelo `User` (`apps/users/models.py:6`)

```python
class User(AbstractUser, BaseModel):
```

**Herencia:** `AbstractUser` (abstracto) + `BaseModel` (abstracto) → una sola tabla `users_user`.

**Campos heredados de `AbstractUser`:**
| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | AutoField | PK |
| `password` | CharField(128) | Hasheado |
| `last_login` | DateTimeField | Nullable |
| `is_superuser` | BooleanField | |
| `username` | CharField(150) | Requerido explícitamente via `REQUIRED_FIELDS` |
| `first_name` | CharField(150) | |
| `last_name` | CharField(150) | |
| `is_staff` | BooleanField | |
| `is_active` | BooleanField | |
| `date_joined` | DateTimeField | |

**Campos propios de `User`:**
| Campo | Tipo | Detalle |
|-------|------|---------|
| `email` | EmailField(unique=True) | Usado como `USERNAME_FIELD` para autenticación |
| `role` | CharField(12), choices=`admin`/`docente`/`estudiante` | Default: `estudiante` — **único mecanismo de diferenciación de roles** |
| `avatar` | ImageField(nullable) | Subido a `avatars/` |
| `email_verified` | BooleanField(default=False) | |

**Campos heredados de `BaseModel`:**
| Campo | Tipo |
|-------|------|
| `creado` | DateTimeField(auto_now_add=True) |
| `actualizado` | DateTimeField(auto_now=True) |

### 2.2 Modelo `Profile` (`apps/users/models.py:25`)

Extensión uno-a-uno del usuario. No hay lógica de roles aquí.

| Campo | Tipo | Relación |
|-------|------|----------|
| `user` | OneToOneField → `User` | `related_name="profile"`, CASCADE |
| `bio` | TextField | nullable |
| `telefono` | CharField(20) | nullable |
| `direccion` | CharField(255) | nullable |
| `fecha_nacimiento` | DateField | nullable |
| `institucion` | CharField(255) | nullable — **campo informativo, NO relacional** |

**Señal:** `post_save` de `User` crea automáticamente el `Profile`.

### 2.3 Mecanismo de diferenciación de roles

El sistema usa **exclusivamente** el campo `role` del modelo `User` (cadena en `{'admin', 'docente', 'estudiante'}`) para:
1. Clases de permisos DRF personalizadas (`IsAdmin`, `IsDocente`, `IsEstudiante`, `AdminOrDocente`).
2. Filtrado de `get_queryset()` en cada ViewSet (docente ve sus grupos, estudiante ve sus grupos, admin ve todo).
3. Validaciones en serializers (e.g., `validate_role` en registro de usuarios permite solo `docente` o `estudiante`).

**No existe herencia de grupos de Django (`auth.Group`), ni permisos por objeto, ni sistema de abilities.**

### 2.4 Modelos auxiliares de autenticación (`apps/users/token_models.py`)

| Modelo | Función |
|--------|---------|
| `EmailVerificationToken` | Token de verificación de email (FK → `User`, expires 24h) |
| `PasswordResetAttempt` | Registro de intentos de reset de contraseña |
| `LoginFailureTracker` | Rastrea intentos fallidos de login para sugerir/reset contrasena |

---

## 3. Diccionario de Datos Relacional

### 3.1 `common.BaseModel` (abstracto)

| Campo | Tipo |
|-------|------|
| `creado` | DateTimeField(auto_now_add=True) |
| `actualizado` | DateTimeField(auto_now=True) |
| `Meta.ordering` | `['-creado']` |

---

### 3.2 `users.User`

**Relaciones entrantes (modelos que apuntan a User):**

| Modelo Origen | Campo | Tipo Relación | related_name |
|---------------|-------|---------------|--------------|
| `users.Profile` | `user` | OneToOneField | `profile` |
| `classrooms.Classroom` | `docente` | ForeignKey | `classrooms_docente` |
| `groups.Group` | `estudiantes` | ManyToManyField | `grupos_estudiante` |
| `activities.Submission` | `estudiante` | ForeignKey | `submissions` |
| `grades.Grade` | `student` | ForeignKey | `grades` |
| `tokens.Wallet` | `usuario` | ForeignKey | `wallets` |
| `auctions.Auction` | `creador` | ForeignKey | `auctions` |
| `auctions.Bid` | `estudiante` | ForeignKey | `bids` |
| `auctions.Bid` | `registrado_por` | ForeignKey (nullable) | `bids_registradas` |
| `notifications.Notification` | `usuario` | ForeignKey | `notificaciones` |
| `users.EmailVerificationToken` | `user` | ForeignKey | `email_verification_tokens` |

---

### 3.3 `classrooms.Classroom`

| Campo | Tipo | Relación |
|-------|------|----------|
| `id` | AutoField | PK |
| `nombre` | CharField(255) | |
| `descripcion` | TextField | nullable |
| `docente` | ForeignKey → `User` | **CASCADE**, `related_name="classrooms_docente"` |

**Relaciones salientes:**
- `Classroom.docente` → **User** (M:1)

**Relaciones entrantes:**
- **Group** → `Group.classroom` → **Classroom** (M:1)

---

### 3.4 `groups.Group`

| Campo | Tipo | Relación |
|-------|------|----------|
| `id` | AutoField | PK |
| `nombre` | CharField(255) | |
| `descripcion` | TextField | nullable |
| `classroom` | ForeignKey → `Classroom` | **CASCADE**, `related_name="grupos_clases"` |
| `estudiantes` | ManyToManyField → `User` | `related_name="grupos_estudiante"`, blank |
| `codigo` | CharField(20) | unique, nullable, auto-generado (UUID6) |
| `activo` | BooleanField | default=True |
| `codigo_generado_en` | DateTimeField | auto_now_add |
| `codigo_expira_en` | DateTimeField | default: +30 días |

**Relaciones salientes:**
- `Group.classroom` → **Classroom** (M:1)
- `Group.estudiantes` → **User** (M:N)

**Relaciones entrantes:**
- **Activity** → `Activity.group` → **Group** (M:1)
- **Period** → `Period.grupo` → **Group** (M:1)
- **Wallet** → `Wallet.grupo` → **Group** (M:1)
- **Auction** → `Auction.grupo` → **Group** (M:1)

**Señal:** `post_save` ejecuta `Period.crear_periodos_para_grupo()` (crea 3 periodos automáticos).

---

### 3.5 `activities.Activity`

| Campo | Tipo | Relación |
|-------|------|----------|
| `id` | AutoField | PK |
| `group` | ForeignKey → `Group` | **CASCADE**, `related_name="activities"` |
| `tipo` | CharField(20) | choices: tarea, examen, proyecto, quiz, exposicion |
| `nombre` | CharField(255) | |
| `descripcion` | TextField | blank |
| `valor_educoins` | PositiveIntegerField | default=100 |
| `valor_notas` | PositiveIntegerField | default=10 |
| `fecha_entrega` | DateTimeField | |
| `habilitada` | BooleanField | default=True |
| `archivo_adjunto` | FileField | nullable, `upload_to='activities/attachments/'` |

**Relaciones salientes:**
- `Activity.group` → **Group** (M:1)

**Relaciones entrantes:**
- **Submission** → `Submission.activity` → **Activity** (M:1)
- **Grade** → `Grade.activity` → **Activity** (M:1)

---

### 3.6 `activities.Submission`

| Campo | Tipo | Relación |
|-------|------|----------|
| `id` | AutoField | PK |
| `activity` | ForeignKey → `Activity` | **CASCADE**, `related_name="submissions"` |
| `estudiante` | ForeignKey → `User` | **CASCADE**, `related_name="submissions"` |
| `contenido` | TextField | blank |
| `archivo` | FileField | nullable, `upload_to='submissions/'` |
| `calificacion` | DecimalField(5,2) | nullable |
| `retroalimentacion` | TextField | blank |

**Constraints únicos:** `(activity, estudiante)`

**Relaciones salientes:**
- `Submission.activity` → **Activity** (M:1)
- `Submission.estudiante` → **User** (M:1)

---

### 3.7 `grades.Grade`

| Campo | Tipo | Relación |
|-------|------|----------|
| `id` | AutoField | PK |
| `activity` | ForeignKey → `Activity` | **CASCADE**, `related_name="grades"` |
| `student` | ForeignKey → `User` | **CASCADE**, `related_name="grades"` |
| `nota` | DecimalField(5,2) | |
| `retroalimentacion` | TextField | nullable |

**Constraints únicos:** `(activity, student)`

**Relaciones salientes:**
- `Grade.activity` → **Activity** (M:1)
- `Grade.student` → **User** (M:1)

**Señal:** `post_save` ejecuta `Grade.aplicar_recompensa()` que deposita EduCoins en la `Wallet` del estudiante.

---

### 3.8 `tokens.Period`

| Campo | Tipo | Relación |
|-------|------|----------|
| `id` | AutoField | PK |
| `grupo` | ForeignKey → `Group` | **CASCADE**, `related_name="periodos"` |
| `nombre` | CharField(100) | |
| `descripcion` | TextField | nullable |
| `fecha_inicio` | DateField | |
| `fecha_fin` | DateField | |
| `activo` | BooleanField | default=False |

**Relaciones salientes:**
- `Period.grupo` → **Group** (M:1)

**Relaciones entrantes:**
- **Wallet** → `Wallet.periodo` → **Period** (M:1)

---

### 3.9 `tokens.Wallet`

| Campo | Tipo | Relación |
|-------|------|----------|
| `id` | AutoField | PK |
| `usuario` | ForeignKey → `User` | **CASCADE**, `related_name="wallets"` |
| `grupo` | ForeignKey → `Group` | **CASCADE**, `related_name="wallets"` |
| `periodo` | ForeignKey → `Period` | **CASCADE**, `related_name="wallets"` |
| `saldo` | PositiveIntegerField | default=0 |
| `bloqueado` | PositiveIntegerField | default=0 |

**Constraints únicos:** `(usuario, grupo, periodo)`

**Relaciones salientes:**
- `Wallet.usuario` → **User** (M:1)
- `Wallet.grupo` → **Group** (M:1)
- `Wallet.periodo` → **Period** (M:1)

**Relaciones entrantes:**
- **CoinTransaction** → `CoinTransaction.wallet` → **Wallet** (M:1)

---

### 3.10 `tokens.CoinTransaction`

| Campo | Tipo | Relación |
|-------|------|----------|
| `id` | AutoField | PK |
| `wallet` | ForeignKey → `Wallet` | **CASCADE**, `related_name="transacciones"` |
| `tipo` | CharField(10) | choices: earn, spend, reset |
| `cantidad` | PositiveIntegerField | |
| `descripcion` | TextField | nullable |

**Relaciones salientes:**
- `CoinTransaction.wallet` → **Wallet** (M:1)

---

### 3.11 `auctions.Auction`

| Campo | Tipo | Relación |
|-------|------|----------|
| `id` | AutoField | PK |
| `titulo` | CharField(255) | |
| `descripcion` | TextField | nullable |
| `creador` | ForeignKey → `User` | **CASCADE**, `related_name="auctions"` |
| `grupo` | ForeignKey → `Group` | **CASCADE**, `related_name="auctions"` |
| `estado` | CharField(10) | choices: active, closed |
| `fecha_fin` | DateTimeField | |
| `valor_minimo` | PositiveIntegerField | default=1 |
| `incremento_minimo` | PositiveIntegerField | default=10 |

**Relaciones salientes:**
- `Auction.creador` → **User** (M:1)
- `Auction.grupo` → **Group** (M:1)

**Relaciones entrantes:**
- **Bid** → `Bid.auction` → **Auction** (M:1)

---

### 3.12 `auctions.Bid`

| Campo | Tipo | Relación |
|-------|------|----------|
| `id` | AutoField | PK |
| `auction` | ForeignKey → `Auction` | **CASCADE**, `related_name="bids"` |
| `estudiante` | ForeignKey → `User` | **CASCADE**, `related_name="bids"` |
| `cantidad` | PositiveIntegerField | |
| `registrado_por` | ForeignKey → `User` | **SET_NULL**, nullable, `related_name="bids_registradas"` |

**Relaciones salientes:**
- `Bid.auction` → **Auction** (M:1)
- `Bid.estudiante` → **User** (M:1)
- `Bid.registrado_por` → **User** (M:1, nullable)

---

### 3.13 `notifications.Notification`

| Campo | Tipo | Relación |
|-------|------|----------|
| `id` | AutoField | PK |
| `usuario` | ForeignKey → `User` | **CASCADE**, `related_name="notificaciones"` |
| `tipo` | CharField(20) | choices: 11 tipos predefinidos |
| `titulo` | CharField(255) | |
| `mensaje` | TextField | |
| `leida` | BooleanField | default=False |
| `activity_id` | PositiveIntegerField | nullable — **sin FK real** |
| `grade_id` | PositiveIntegerField | nullable — **sin FK real** |
| `auction_id` | PositiveIntegerField | nullable — **sin FK real** |
| `metadata` | JSONField | nullable |

**Relaciones salientes:**
- `Notification.usuario` → **User** (M:1)

**Índices:** `(usuario, leida)`, `(-creado)`

---

### 3.14 Diagrama simplificado de dependencias

```
User
 ├── Profile (1:1)
 ├── Classroom.docente (1:N)
 ├── Group.estudiantes (M:N)
 ├── Submission.estudiante (1:N)
 ├── Grade.student (1:N)
 ├── Wallet.usuario (1:N)
 ├── Auction.creador (1:N)
 ├── Bid.estudiante (1:N)
 ├── Bid.registrado_por (1:N, nullable)
 └── Notification.usuario (1:N)

Classroom
 └── Group.classroom (1:N)

Group
 ├── Activity.group (1:N)
 ├── Period.grupo (1:N)
 ├── Wallet.grupo (1:N)
 └── Auction.grupo (1:N)

Activity
 ├── Submission.activity (1:N)
 └── Grade.activity (1:N)

Period
 └── Wallet.periodo (1:N)

Wallet
 └── CoinTransaction.wallet (1:N)

Auction
 └── Bid.auction (1:N)
```

---

## 4. Gestión de Permisos

### 4.1 Clases de permisos globales (`apps/users/permissions.py`)

| Clase | Lógica |
|-------|--------|
| `IsAdmin` | `request.user.role == 'admin'` |
| `IsDocente` | `request.user.role == 'docente'` |
| `IsEstudiante` | `request.user.role == 'estudiante'` |
| `AdminOrDocente` | `role in {'admin', 'docente'}` |
| `AdminOrReadOnly` | Escritura solo admin, lectura cualquiera autenticado |

**⚠️ Nota:** `IsAdmin` está definido dos veces (líneas 3 y 48). Python usa la segunda definición.

### 4.2 Default global

```python
REST_FRAMEWORK = {
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
}
```

Todas las vistas requieren autenticación por defecto. Vistas públicas (`AllowAny`) son explícitas.

### 4.3 Patrón de filtrado por ViewSet (`get_queryset`)

Cada ViewSet filtra el queryset según `request.user.role`:

| App | ViewSet | Lógica de filtrado |
|-----|---------|--------------------|
| `classrooms` | `ClassroomViewSet` | Docente: `docente=request.user`. Estudiante: aulas de sus grupos. |
| `groups` | `GroupViewSet` | Docente: grupos donde `classroom.docente=user`. Estudiante: `estudiantes__in=[user]`. |
| `activities` | `ActivityViewSet` | Docente: actividades de sus grupos. Estudiante: actividades de sus grupos (solo habilitadas). |
| `grades` | `GradeViewSet` | Docente: calificaciones de actividades de sus grupos. Estudiante: solo sus calificaciones. |
| `tokens` | `WalletViewSet` | Estudiante: solo sus wallets. |
| `tokens` | `CoinTransactionViewSet` | Estudiante: solo sus transacciones. |
| `auctions` | `AuctionViewSet` | Docente: sus grupos. Estudiante: sus grupos. Admin: todo. |
| `auctions` | `BidViewSet` | Docente: pujas de sus grupos. Estudiante: solo sus pujas. |
| `notifications` | `NotificationViewSet` | Solo usuario autenticado (filtro por `usuario=request.user`). |

### 4.4 Control de escritura

| Operación | Permiso requerido |
|-----------|-------------------|
| Crear/Editar/Eliminar Classroom | `IsDocente` |
| Crear/Editar/Eliminar Group | `IsDocente` |
| Crear/Editar/Eliminar Activity | `IsDocente` |
| Crear Grade (calificar) | `AdminOrDocente` |
| Crear/Editar/Eliminar Auction | `AdminOrDocente` |
| Crear Bid (pujar) | `IsAuthenticated` (estudiante puja por sí mismo, docente por cualquiera) |
| Enviar Submission | Solo `estudiante` (validado en perform_create) |
| Crear/Activar Period | `AdminOrDocente` |
| Listar/Ver usuarios | `IsAdmin` |
| Administrar usuarios (CRUD) | `IsAdmin` |

### 4.5 Validaciones adicionales en serializers

- `AuctionSerializer.validate_grupo()`: docente solo puede crear subastas en sus grupos.
- `GroupSerializer.validate_classroom()`: docente solo puede crear grupos en sus aulas.
- `BidCreateSerializer.validate()`: verifica membresía al grupo, estado de subasta, saldo de wallet, incremento mínimo.
- `GradeCreateSerializer.validate()`: el estudiante debe pertenecer al grupo de la actividad.
- `ActivitySerializer.get_submissions()`: retorna entregas solo si el usuario es docente.

---

## 5. Puntos de Refactorización Crítica para Multi-Tenant (Institución Educativa)

### 5.1 Ausencia total de entidad "Institución"

No existe un modelo `Institution` o `Organization`. El campo `Profile.institucion` es un `CharField` de texto libre — no es relacional, no se usa para filtrar, no tiene restricciones de integridad.

### 5.2 Modelos con acoplamiento directo a `User` que deben modificarse

Estos modelos actualmente apuntan directamente a `User` sin intermediación de institución:

| Modelo | Campo usuario | Impacto |
|--------|---------------|---------|
| `Classroom` | `docente` (FK) | Un docente debe pertenecer a una institución. `Classroom` debe heredar o referenciar la institución. |
| `Group` | `estudiantes` (M2M) | Los estudiantes enrolados deben estar en la misma institución que el aula/grupo. |
| `Submission` | `estudiante` (FK) | Debe validarse que estudiante e institución coincidan. |
| `Grade` | `student` (FK) | Igual que Submission. |
| `Wallet` | `usuario` (FK) | Wallet acoplado a User + Group + Period; la institución debe ser inferible. |
| `Auction` | `creador` (FK) | Creador debe pertenecer a la institución del grupo. |
| `Bid` | `estudiante`, `registrado_por` (FKs) | Pujante y registrador deben estar en la institución del grupo. |
| `Notification` | `usuario` (FK) | Debe poder filtrarse por institución. |

### 5.3 Cadena de dependencia actual (sin institución)

```
User
 └── Classroom.docente [acoplado directamente]
       └── Group.classroom [hereda contexto vía FK]
             ├── Activity.group
             ├── Period.grupo
             ├── Wallet.grupo
             └── Auction.grupo
```

Toda la autoridad y contexto se resuelve por:
1. **Propiedad** (docente es dueño de Classroom/Group).
2. **Membresía** (estudiante está en Group.estudiantes).
3. **Rol** (admin/docente/estudiante).

**No existe una institución como raíz de la jerarquía.**

### 5.4 Modelos que NO requieren cambios estructurales profundos

| Modelo | Razón |
|--------|-------|
| `CoinTransaction` | Ya depende de Wallet, que será adaptado. |
| `Profile` | Su `institucion` debe migrarse de CharField a FK → Institution. |
| `Period` | Depende de Group, heredará institución. |

### 5.5 Patrón de acceso a datos actual (problemático para multi-tenant)

Actualmente cada ViewSet filtra así:

```python
# Docente: filtra por "mío"
queryset = Model.objects.filter(docente=request.user)

# Estudiante: filtra por "mis grupos"
queryset = Model.objects.filter(group__estudiantes=request.user)

# Admin: sin filtro (ve todo)
queryset = Model.objects.all()
```

**Problema:** No hay ningún filtro por institución. Si dos instituciones comparten base de datos, un admin de la institución A podría ver datos de la institución B.

### 5.6 Resumen de cambios necesarios

| Componente | Cambio requerido |
|------------|------------------|
| Modelo nuevo | `Institution` con campos: nombre, dominio, logo, config (JSON), activo, creado, actualizado |
| `User` | Agregar `institucion` FK → Institution (nullable inicialmente para migración) |
| `Profile.institucion` | Eliminar campo CharField; migrar datos a `User.institucion` |
| `Classroom` | Agregar `institucion` FK → Institution (o heredar vía docente) |
| `Group` | Agregar `institucion` FK → Institution (o heredar vía classroom) |
| `Activity` | Heredar institución vía group |
| `Submission` | Heredar institución vía activity |
| `Grade` | Heredar institución vía activity |
| `Period` | Heredar institución vía group |
| `Wallet` | Heredar institución vía group |
| `Auction` | Heredar institución vía group |
| `Bid` | Heredar institución vía auction |
| `Notification` | Heredar institución vía usuario |
| Todos los ViewSet | Agregar `queryset = queryset.filter(institucion=request.user.institucion)` como filtro base |
| Sistema de permisos | Crear `IsInstitutionMember` o similar como permiso base |

### 5.7 Bug conocido

`apps/users/permissions.py` contiene dos definiciones de `IsAdmin` (línea 3 y línea 48). La segunda sobrescribe la primera. Se debe eliminar la duplicada.

### 5.8 Apps y archivos fuera de `INSTALLED_APPS`

`apps.reports` tiene estructura de app (`models.py`, `admin.py`, `views.py`, `apps.py`) pero **no está registrada** en `INSTALLED_APPS`. Sus modelos no existen en la base de datos. Puede ser un indicador de funcionalidad planificada o código legacy.
