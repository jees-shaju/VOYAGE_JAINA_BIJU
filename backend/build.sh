#!/usr/bin/env bash
# Exit on error
set -o errexit

echo "==> Python environment:"
python --version

echo "==> Upgrading pip..."
python -m pip install --upgrade pip

echo "==> Installing backend dependencies..."
pip install -r requirements.txt

echo "==> Collecting static files..."
python manage.py collectstatic --noinput

echo "==> Running database migrations..."
python manage.py migrate

# Optional auto-seeding if enabled via Render environment variable AUTO_SEED_DATA=true
if [ "${AUTO_SEED_DATA:-false}" = "true" ]; then
    echo "==> Seeding database with initial data..."
    python manage.py seed_data
fi

# Reset admin password if DJANGO_ADMIN_PASSWORD environment variable is provided
if [ -n "$DJANGO_ADMIN_PASSWORD" ]; then
    echo "==> Updating admin password from DJANGO_ADMIN_PASSWORD..."
    python -c "import django, os; os.environ['DJANGO_SETTINGS_MODULE']='samarth_project.settings'; django.setup(); from django.contrib.auth import get_user_model; U = get_user_model(); u = U.objects.filter(username='admin').first(); (u.set_password(os.environ['DJANGO_ADMIN_PASSWORD']), u.save()) if u else None; print('==> Admin password updated successfully!')"
fi

echo "==> Backend build completed successfully!"

