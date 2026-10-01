#!/bin/bash
echo "🚀 Starting Railway deployment setup..."

# Aplicar migraciones
echo "📦 Applying database migrations..."
python manage.py migrate

# Colectar archivos estáticos
echo "📁 Collecting static files..."
python manage.py collectstatic --noinput

echo "✅ Setup completed!"