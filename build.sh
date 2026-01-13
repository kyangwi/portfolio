#!/usr/bin/env bash
# Exit on error
set -o errexit

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Create superuser if none exists
python manage.py create_superuser_if_none_exists

# Collect static files
python manage.py collectstatic --no-input
