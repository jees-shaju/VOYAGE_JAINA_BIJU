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

echo "==> Backend build completed successfully!"
