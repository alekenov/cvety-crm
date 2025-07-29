#!/bin/bash
set -e

echo "🚀 Starting Cvety.kz application..."

# Run database migrations
echo "📋 Running database migrations..."
cd backend && alembic upgrade head

# Initialize data if needed (only in development or if DB is empty)
if [ "$RAILWAY_ENVIRONMENT" != "production" ] || [ "$INIT_DATA" = "true" ]; then
    echo "📦 Initializing test data..."
    python init_test_data.py || echo "⚠️  Data initialization skipped (may already exist)"
fi

# Start the application
echo "🌐 Starting FastAPI server on port ${PORT:-8000}..."
exec python -m uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}