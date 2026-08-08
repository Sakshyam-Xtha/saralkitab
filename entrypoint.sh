#!/bin/sh

set -e

echo "Waiting for PostgreSQL..."

until python -c "
import os
import psycopg
conn = psycopg.connect(
    host=os.environ['DB_HOST'],
    port=os.environ.get('DB_PORT', '5432'),
    dbname=os.environ['DB_NAME'],
    user=os.environ['DB_USER'],
    password=os.environ['DB_PASSWORD']
)
conn.close()
"; do
    echo "PostgreSQL is unavailable - waiting..."
    sleep 2
done

echo "PostgreSQL is ready!"

echo "Running migrations..."
python manage.py migrate

echo "Starting Gunicorn..."
exec gunicorn app.wsgi:application --bind 0.0.0.0:8000