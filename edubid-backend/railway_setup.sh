#!/bin/bash
echo "🚀 Starting Railway deployment setup..."

# Aplicar migraciones
echo "📦 Applying database migrations..."
python manage.py migrate

# Crear superusuario
echo "👤 Creating superuser..."
python create_superuser.py

# Colectar archivos estáticos
echo "📁 Collecting static files..."
python manage.py collectstatic --noinput

echo "✅ Setup completed!"