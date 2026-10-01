# 🐘 Guía de Migración de MySQL a Supabase (PostgreSQL) — EduBid Backend

> **ESTADO ACTUAL:** ✅ **MIGRACIÓN COMPLETADA Y EN PRODUCCIÓN**  
> El clúster de Supabase ya se encuentra configurado, las 37 tablas del modelo relacional han sido migradas exitosamente y los 76 tests de Django pasan al 100%.  
> Este documento se conserva como manual de referencia técnica, administración del Table Editor y guía de rollback o transferencia de datos.

---

## 📌 ¿Por qué es tan sencillo migrar a Supabase?

En **EduBid**, toda la interacción con la base de datos se realiza a través del **ORM de Django** (`models.Model`, `select_for_update()`, `@transaction.atomic`, etc.). No existe ninguna consulta SQL escrita a mano con sintaxis dependiente de MySQL. 

Además, **PostgreSQL es el motor preferido y mejor soportado por Django**, por lo que al pasar a Supabase obtienes:
1. **Base de datos en la nube 24/7:** No requieres tener Docker ni MySQL corriendo en tu máquina local.
2. **Table Editor Visual:** Un panel web tipo hoja de cálculo interactiva para ver y editar usuarios, notas, subastas y billeteras en vivo.
3. **Colaboración instantánea:** Todo el equipo y el servidor de despliegue (Railway) se conectan a la misma base de datos.
4. **Mejor soporte para concurrencia:** Bloqueos de saldo en subastas (`select_for_update`) más rápidos y confiables.

---

## 📋 Prerrequisitos

1. Tener una cuenta en [supabase.com](https://supabase.com/) (es gratuita).
2. Tener tu entorno virtual de Python activo en la terminal (`edubid-backend/.venv`).

---

## 🚀 Paso a Paso de la Migración

---

### Paso 1: Crear el Proyecto en Supabase

1. Entra a tu cuenta en [supabase.com](https://supabase.com/) y haz clic en **"New Project"**.
2. Completa los datos:
   * **Name:** `edubid-db` (o el nombre que prefieras).
   * **Database Password:** Define una contraseña segura y **guárdala bien**.
   * **Region:** Elige la más cercana (ej. *East US / North Virginia* para mínima latencia con Colombia/Latam).
3. Espera ~1 minuto mientras Supabase provisiona el clúster PostgreSQL.
4. Ve a **Project Settings** (ícono de engranaje abajo a la izquierda) -> **Database**.
5. Desplázate hasta la sección **Connection parameters** (o Connection String):
   * **Host:** `aws-0-[region].pooler.supabase.com` (Usa el modo **Session** o **Transaction**, puerto `6543` o `5432`).
   * **Database name:** `postgres`
   * **Port:** `6543` (recomendado con Pooler) o `5432` (conexión directa).
   * **User:** `postgres.[tu-id-de-proyecto]` o `postgres`
   * **Password:** La que definiste en el paso 2.

---

### Paso 2: Instalar el Conector de Postgres en Python

Abre la terminal en la carpeta `edubid-backend` con tu entorno virtual activo:

```bash
# Windows
.venv\Scripts\activate

# Linux / Mac
source .venv/bin/activate
```

Instala `psycopg2-binary`:

```bash
pip install psycopg2-binary
```

Actualiza el archivo [requirements.txt](file:///C:/Proyectos/Web/edubid/edubid-backend/requirements.txt):
* Puedes retirar o comentar `PyMySQL==1.1.1`
* Añadir `psycopg2-binary>=2.9.9`

---

### Paso 3: Ajustar `edubid_core/settings.py`

Abre el archivo [edubid-backend/edubid_core/settings.py](file:///C:/Proyectos/Web/edubid/edubid-backend/edubid_core/settings.py):

#### 1. Eliminar o comentar la carga de PyMySQL (Líneas 6-8):
```python
# ANTES:
# import pymysql
# pymysql.install_as_MySQLdb()
```
*(Ya no se necesita porque PostgreSQL se comunica directamente vía `psycopg2`).*

#### 2. Actualizar el bloque `DATABASES`:
Reemplaza la configuración de base de datos por:

```python
DATABASES = {
    'default': {
        'ENGINE': os.getenv('DB_ENGINE', 'django.db.backends.postgresql'),
        'NAME': os.getenv('DB_NAME', 'postgres'),
        'USER': os.getenv('DB_USER', 'postgres'),
        'PASSWORD': os.getenv('DB_PASSWORD', ''),
        'HOST': os.getenv('DB_HOST', 'localhost'),
        'PORT': os.getenv('DB_PORT', '5432'),
        'OPTIONS': {
            'sslmode': os.getenv('DB_SSLMODE', 'require'),
        } if os.getenv('DB_ENGINE', '') == 'django.db.backends.postgresql' or 'supabase' in os.getenv('DB_HOST', '') else {},
    }
}
```

> **Nota:** Esta configuración es inteligente: si detecta Supabase o Postgres, activa `sslmode: require` automáticamente. Si alguna vez vuelves a MySQL local, no interferirá.

---

### Paso 4: Actualizar el archivo `.env`

Abre tu archivo `.env` en `edubid-backend/` y reemplaza la sección de base de datos:

```env
# === Base de Datos Supabase (PostgreSQL) ===
DB_ENGINE=django.db.backends.postgresql
DB_NAME=postgres
DB_USER=postgres.tu_id_de_proyecto
DB_PASSWORD=TuContraseñaSegura123
DB_HOST=aws-0-us-east-1.pooler.supabase.com
DB_PORT=6543
DB_SSLMODE=require
```

---

### Paso 5: Crear las Tablas en Supabase

Ejecuta las migraciones de Django en tu terminal:

```bash
python manage.py migrate
```

Verás cómo Django aplica todas las migraciones en Supabase en cuestión de segundos:
```
Operations to perform:
  Apply all migrations: activities, admin, auctions, auth, classrooms, common, contenttypes, grades, groups, institutions, notifications, sessions, tokens, users
Running migrations:
  Applying contenttypes.0001_initial... OK
  Applying auth.0001_initial... OK
  ...
  Applying tokens.0001_initial... OK
  Applying auctions.0001_initial... OK
  Applying notifications.0001_initial... OK
```

Crea tu usuario SuperAdmin:
```bash
python manage.py createsuperuser
```

---

### Paso 6 (Opcional): ¿Quieres pasar los datos que ya tenías en MySQL?

Si ya tienes colegios, profesores o aulas creadas en tu MySQL local y no quieres volver a escribirlas, puedes transferirlos con 2 comandos:

#### 1. Con el `.env` apuntando a MySQL, exporta los datos:
```bash
python manage.py dumpdata --natural-foreign --natural-primary -e contenttypes -e auth.Permission --indent 2 > datos_edubid.json
```

#### 2. Cambias el `.env` a Supabase y ejecutas:
```bash
python manage.py migrate
python manage.py loaddata datos_edubid.json
```
¡Y listo! Todos tus registros estarán intactos en la nube.

---

## 🧪 Paso 7: Validación y Pruebas

Para asegurarte de que el 100% de la lógica (EduCoins, subastas, multi-tenant y notas) funciona a la perfección en Supabase:

```bash
# Correr suite de 76 tests del backend
python manage.py test apps
```
Debe finalizar con:
```
Ran 76 tests in XX.XXs
OK
```

Inicia el servidor:
```bash
python manage.py runserver
```
Abre tu navegador, inicia el frontend Angular con `npm start` y navega normalmente. ¡Todo estará conectado a Supabase!

---

## 📊 Explorar datos en el Table Editor de Supabase

Una de las mayores ventajas de Supabase para presentaciones y ferias:
1. Abre tu panel en [supabase.com](https://supabase.com/).
2. Haz clic en el ícono de **Table Editor** (hoja de cálculo en la barra izquierda).
3. Podrás ver en tiempo real tablas como:
   * `tokens_wallet`: Ver saldos de EduCoins y monedas bloqueadas.
   * `auctions_auction` y `auctions_bid`: Ver las subastas y cada puja entrante.
   * `grades_grade`: Ver notas y bonificaciones asignadas.
   * `institutions_institution`: Ver los colegios registrados y sus colores.

---

## 💡 Consejos para la Sustentación en la Feria Escolar

* **Pausa automática de Supabase (Free Tier):** Si dejas el proyecto inactivo por más de 7 días seguidos, Supabase pone la base de datos en pausa para ahorrar recursos. El día antes de la feria, abre Supabase y verifica que esté en estado **Active** (si está pausada, hay un botón verde que dice *Restore* y tarda 30 segundos).
* **Demostración en vivo:** Puedes tener en una pestaña de tu navegador el Table Editor de Supabase y mostrarle a los evaluadores cómo, cuando un estudiante hace una puja en Angular, la fila de `auctions_bid` y el saldo en `tokens_wallet` se actualizan instantáneamente en la nube.

---

## 📦 Supabase Storage (Almacenamiento de Archivos y Medios)

Además de la base de datos PostgreSQL, Supabase ofrece almacenamiento tipo S3 para archivos estáticos y subidos por usuarios.

### 1. Buckets Recomendados para EduBid:
* `edubid-avatars`: **Público** — Fotos de perfil y logotipos institucionales (PNG, JPG, SVG, WebP).
* `edubid-submissions`: **Privado** — Archivos de tareas y entregas adjuntadas por estudiantes (PDF, DOCX, ZIP, imágenes).
* `edubid-reports`: **Privado** — Informes oficiales generados en PDF y planillas Excel DANE.

### 2. Configuración en Django (`django-storages` opcional):
Para conectar Django con Supabase Storage como backend de archivos `MEDIA_ROOT`:
```bash
pip install django-storages boto3
```
En `settings.py`:
```python
# Conexión S3-Compatible con Supabase Storage
AWS_ACCESS_KEY_ID = os.getenv('SUPABASE_S3_ACCESS_KEY_ID')
AWS_SECRET_ACCESS_KEY = os.getenv('SUPABASE_S3_SECRET_KEY')
AWS_STORAGE_BUCKET_NAME = os.getenv('SUPABASE_STORAGE_BUCKET', 'edubid-media')
AWS_S3_ENDPOINT_URL = f"https://{os.getenv('SUPABASE_PROJECT_REF')}.supabase.co/storage/v1/s3"
AWS_S3_REGION_NAME = os.getenv('SUPABASE_REGION', 'us-east-1')
DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
```

---

## 🔄 ¿Cómo volver a MySQL si fuera necesario? (Rollback en 1 minuto)

Si por alguna razón necesitas volver a tu base de datos MySQL local:
1. En `.env`, vuelve a poner:
   ```env
   DB_ENGINE=django.db.backends.mysql
   DB_NAME=edubid_db
   DB_USER=edubid_user
   DB_PASSWORD=edubid_password
   DB_HOST=127.0.0.1
   DB_PORT=3306
   ```
2. En `settings.py`, descomenta `import pymysql; pymysql.install_as_MySQLdb()`.
3. Levanta el contenedor de Docker con `docker compose up -d`.
4. ¡Listo! Vuelves a MySQL sin perder nada.
