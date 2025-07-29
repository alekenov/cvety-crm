#!/bin/bash
set -e

echo "🚀 Starting Cvety.kz application..."

# Ensure we're in the correct directory
cd /app

# Run database migrations
echo "📋 Running database migrations..."
cd backend && alembic upgrade head && cd ..

# Initialize data if needed (only in development or if DB is empty)
if [ "$RAILWAY_ENVIRONMENT" != "production" ] || [ "$INIT_DATA" = "true" ]; then
    echo "📦 Initializing test data..."
    cd backend && python init_test_data.py || echo "⚠️  Data initialization skipped (may already exist)" && cd ..
fi

# Start the application
# Railway provides PORT environment variable
PORT=${PORT:-8000}
echo "🌐 Starting FastAPI server on port $PORT..."

# Use exec to ensure proper signal handling
cd backend && exec uvicorn app.main:app --host 0.0.0.0 --port $PORT --workers 1