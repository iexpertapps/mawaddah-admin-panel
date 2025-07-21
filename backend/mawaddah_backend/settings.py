"""
Django settings for mawaddah_backend project.
"""
import os
from pathlib import Path
from decouple import config
import dj_database_url

# --- Core Paths and Debug Configuration ---
BASE_DIR = Path(__file__).resolve().parent.parent

# DEBUG is False by default. Set to True only in local development via .env file.
# Railway and other production environments will not have this env var, defaulting to False.
DEBUG = config('DEBUG', default=False, cast=bool)

# --- Security Settings ---
SECRET_KEY = config('SECRET_KEY')

allowed_hosts_str = config('ALLOWED_HOSTS', default='localhost,127.0.0.1')
ALLOWED_HOSTS = allowed_hosts_str.split(',') if isinstance(allowed_hosts_str, str) else []

# In production, trust the Railway-provided domain.
if not DEBUG:
    RAILWAY_HOSTNAME = config('RAILWAY_STATIC_URL', default='')
    if RAILWAY_HOSTNAME:
        ALLOWED_HOSTS.append(f".{RAILWAY_HOSTNAME}")

# --- Application Definition ---
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third party apps
    'rest_framework',
    'drf_spectacular',
    'corsheaders',
    'rest_framework.authtoken',
    
    # Local apps
    'core',
    'users',
    'appeals',
    'donations',
    'wallet',
    'settings',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware', # Must be high up
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'mawaddah_backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'mawaddah_backend.wsgi.application'

# --- Database Configuration ---
# Uses DATABASE_URL from environment variables (e.g., provided by Railway)
DATABASES = {
    'default': dj_database_url.config(
        default=f"sqlite:///{BASE_DIR / 'db.sqlite3'}",
        conn_max_age=600,
        ssl_require=not DEBUG  # Require SSL only in production
    )
}

# --- Password Validation ---
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# --- Internationalization ---
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# --- Static and Media Files ---
STATIC_URL = 'static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# --- General Settings ---
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
AUTH_USER_MODEL = 'users.User'
AUTHENTICATION_BACKENDS = [
    'users.auth_backend.EmailBackend',
    'django.contrib.auth.backends.ModelBackend',
]
APPEND_SLASH = False

# --- Django REST Framework ---
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': ['rest_framework.authentication.TokenAuthentication'],
    'DEFAULT_PERMISSION_CLASSES': ['rest_framework.permissions.IsAuthenticated'],
    'UNAUTHENTICATED_USER': None,
    'UNAUTHENTICATED_TOKEN': None,
    'DEFAULT_PAGINATION_CLASS': 'core.pagination.FlexiblePageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
        'rest_framework.renderers.BrowsableAPIRenderer',
    ],
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}

# --- CORS and CSRF Settings ---
CORS_ALLOWED_ORIGINS = [
    "https://mawaddahapp.vercel.app",
    "https://mawaddahapp.up.railway.app",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
CORS_ALLOW_CREDENTIALS = True

CSRF_TRUSTED_ORIGINS = [
    "https://mawaddahapp.vercel.app",
    "https://mawaddahapp.up.railway.app",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

# --- Production Security Settings (Enabled when DEBUG is False) ---
if not DEBUG:
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    SECURE_BROWSER_XSS_FILTER = True
    X_FRAME_OPTIONS = 'DENY'
    SECURE_REFERRER_POLICY = 'strict-origin-when-cross-origin'
