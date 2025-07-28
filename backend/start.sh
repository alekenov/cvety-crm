#!/bin/bash
echo "=== Starting Cvety.kz Backend ==="
echo "DATABASE_URL: ${DATABASE_URL:0:50}..."
echo "SECRET_KEY: ${SECRET_KEY:0:20}..."
echo "PORT: ${PORT:-8000}"
echo "RAILWAY_ENVIRONMENT: ${RAILWAY_ENVIRONMENT}"

# Start the application
exec python -m uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}