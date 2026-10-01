from pathlib import Path
from datetime import timedelta
from decouple import config, Csv
import os
import sys
# Configurar pymysql como driver de MySQL si está disponible
try:
    import pymysql
    pymysql.install_as_MySQLdb()
except Exception:
    pass

# ─────────────────────────────────────────────
# BASE DIR & ENV
# ─────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent.parent

# Configuración que funciona tanto con archivo .env como con variables de entorno
# En Railway, las variables se leen directamente del sistema

# ─────────────────────────────────────────────
# Configuración principal
# ─────────────────────────────────────────────
SECRET_KEY = config('SECRET_KEY')
DEBUG = config('DEBUG', default=False, cast=bool)

# ALLOWED_HOSTS dinámico
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='localhost,127.0.0.1,.railway.app').split(',')

# ─────────────────────────────────────────────
# CSRF & SESSION CONFIGURATION
# ─────────────────────────────────────────────
CSRF_TRUSTED_ORIGINS = [
    'https://*.railway.app',
    'https://*.netlify.app',
    'http://localhost:4200',
    'http://127.0.0.1:4200',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:8000',
]

CSRF_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SAMESITE = 'Lax'
CSRF_USE_SESSIONS = False

SESSION_COOKIE_SECURE = not DEBUG
SESSION_COOKIE_SAMESITE = 'Lax'

# Para el admin de Django
CSRF_COOKIE_HTTPONLY = False

# ─────────────────────────────────────────────
# Apps instaladas
# ─────────────────────────────────────────────
INSTALLED_APPS = [
    'daphne',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.sites',
    'django.contrib.staticfiles',
    'channels',
    'allauth',
    'allauth.account',
    'allauth.socialaccount',
    'allauth.socialaccount.providers.google',
    'corsheaders',
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'apps.users',
    'apps.classrooms',
    'apps.groups',
    'apps.activities',
    'apps.grades',
    'apps.tokens',
    'apps.auctions',
    'apps.institutions',
    'apps.common',
    'apps.notifications',
]

SITE_ID = 1

# ─────────────────────────────────────────────
# Middlewares
# ─────────────────────────────────────────────
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'allauth.account.middleware.AccountMiddleware',
]

# ─────────────────────────────────────────────
# CORS
# ─────────────────────────────────────────────
CORS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in config(
        'CORS_ALLOWED_ORIGINS',
        default='http://localhost:4200,http://127.0.0.1:4200,http://localhost:5173,http://127.0.0.1:5173'
    ).split(',')
    if origin.strip()
]

CORS_ALLOW_CREDENTIALS = True

CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
    'x-skip-error-toast',
]

CORS_EXPOSE_HEADERS = ['Content-Type', 'X-CSRFToken']

# ─────────────────────────────────────────────
# URLs y plantillas
# ─────────────────────────────────────────────
ROOT_URLCONF = 'edubid_core.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'edubid_core.wsgi.application'
ASGI_APPLICATION = 'edubid_core.asgi.application'

# ─────────────────────────────────────────────
# Channels & WebSockets (Real-Time)
# ─────────────────────────────────────────────
REDIS_URL = config('REDIS_URL', default=None)
if REDIS_URL:
    CHANNEL_LAYERS = {
        "default": {
            "BACKEND": "channels_redis.core.RedisChannelLayer",
            "CONFIG": {
                "hosts": [REDIS_URL],
            },
        },
    }
else:
    CHANNEL_LAYERS = {
        "default": {
            "BACKEND": "channels.layers.InMemoryChannelLayer"
        }
    }

# ─────────────────────────────────────────────
# Base de datos
# ─────────────────────────────────────────────
db_engine = config('DB_ENGINE', default='django.db.backends.mysql')
db_host = config('DB_HOST', default='localhost')

db_options = {}
if 'mysql' in db_engine:
    db_options['charset'] = 'utf8mb4'
elif 'postgresql' in db_engine or 'supabase' in db_host:
    db_options['sslmode'] = config('DB_SSLMODE', default='require')

DATABASES = {
    'default': {
        'ENGINE': db_engine,
        'NAME': config('DB_NAME', default='postgres'),
        'USER': config('DB_USER', default='postgres'),
        'PASSWORD': config('DB_PASSWORD', default=''),
        'HOST': db_host,
        'PORT': config('DB_PORT', default='6543' if 'postgresql' in db_engine else '3306'),
        'OPTIONS': db_options,
    }
}

if 'test' in sys.argv:
    DATABASES['default'] = {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }

# ─────────────────────────────────────────────
# Validación de contraseñas
# ─────────────────────────────────────────────
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# ─────────────────────────────────────────────
# Internacionalización
# ─────────────────────────────────────────────
LANGUAGE_CODE = "es-es"
TIME_ZONE = "America/Bogota"
USE_I18N = True
USE_TZ = True

# ─────────────────────────────────────────────
# Archivos estáticos
# ─────────────────────────────────────────────
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# ─────────────────────────────────────────────
# Configuración de usuarios y REST
# ─────────────────────────────────────────────
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
AUTH_USER_MODEL = 'users.User'

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
    'DEFAULT_PAGINATION_CLASS': 'edubid_core.pagination.EduBidPagination',
    'PAGE_SIZE': config('PAGE_SIZE', default=20, cast=int),
    'EXCEPTION_HANDLER': 'edubid_core.exceptions.custom_exception_handler',
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': config('THROTTLE_ANON_RATE', default='100/day'),
        'user': config('THROTTLE_USER_RATE', default='120/min'),
        'auth': config('THROTTLE_AUTH_RATE', default='10/min'),
        'password_reset': config('THROTTLE_PASSWORD_RESET_RATE', default='5/min'),
    },
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(hours=1),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=1),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "AUTH_HEADER_TYPES": ("Bearer",),
    "AUTH_TOKEN_CLASSES": ("rest_framework_simplejwt.tokens.AccessToken",),
}

AUTHENTICATION_BACKENDS = [
    "django.contrib.auth.backends.ModelBackend",
    "allauth.account.auth_backends.AuthenticationBackend",
]

# Allauth settings
ACCOUNT_LOGIN_METHODS = {"email"}
ACCOUNT_SIGNUP_FIELDS = ["email*", "password1*", "password2*"]
ACCOUNT_EMAIL_VERIFICATION = 'optional'
LOGIN_REDIRECT_URL = "/"
LOGOUT_REDIRECT_URL = "/"

# Google OAuth
GOOGLE_CLIENT_ID = config('GOOGLE_CLIENT_ID')
GOOGLE_CLIENT_SECRET = config('GOOGLE_CLIENT_SECRET')

# ─────────────────────────────────────────────
# EMAIL CONFIGURATION
# ─────────────────────────────────────────────
EMAIL_BACKEND = config('EMAIL_BACKEND', default='django.core.mail.backends.smtp.EmailBackend')
EMAIL_HOST = config('EMAIL_HOST', default='smtp.gmail.com')
EMAIL_PORT = config('EMAIL_PORT', default=587, cast=int)
EMAIL_USE_TLS = config('EMAIL_USE_TLS', default=True, cast=bool)
EMAIL_HOST_USER = config('EMAIL_HOST_USER')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD')
DEFAULT_FROM_EMAIL = config('DEFAULT_FROM_EMAIL', default='EduBid <ivanjmm01@gmail.com>')

FRONTEND_URL = config('FRONTEND_URL', default='http://localhost:5173')
EMAIL_VERIFICATION_REQUIRED = True
PASSWORD_RESET_TIMEOUT = 3600

# ─────────────────────────────────────────────
# CONFIGURACIÓN DE SEGURIDAD PARA PRODUCCIÓN
# ─────────────────────────────────────────────
if not DEBUG:
    # SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = 'DENY'
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
