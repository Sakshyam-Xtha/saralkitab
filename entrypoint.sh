#!/bin/sh

echo "Running Migration....."

python manage.py migrate

echo "Starting server..."

exec python manage.py runserver 0.0.0.0:8000