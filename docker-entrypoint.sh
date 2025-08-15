#!/bin/bash

echo "=== Cvety.kz Docker Entrypoint ==="
echo "DATABASE_URL: ${DATABASE_URL:0:50}..."
echo "SECRET_KEY: ${SECRET_KEY:0:20}..."
echo "PORT: ${PORT:-8000}"
echo "RAILWAY_ENVIRONMENT: ${RAILWAY_ENVIRONMENT}"

# Change to backend directory
cd /app/backend

# Wait for database to be ready (if needed)
if [ -n "$DATABASE_URL" ]; then
    echo "🔄 Checking database connection..."
    python -c "
import time
import sys
from sqlalchemy import create_engine
from app.core.config import get_settings

settings = get_settings()
max_retries = 30
retry_count = 0

while retry_count < max_retries:
    try:
        engine = create_engine(settings.DATABASE_URL)
        with engine.connect() as conn:
            conn.execute('SELECT 1')
        print('✅ Database connection successful')
        break
    except Exception as e:
        retry_count += 1
        print(f'⏳ Database not ready (attempt {retry_count}/{max_retries}): {e}')
        if retry_count >= max_retries:
            print('❌ Database connection failed after all retries')
            sys.exit(1)
        time.sleep(2)
" || exit 1
fi

# Run database migrations
echo "🗄️ Running database migrations..."
python -m alembic upgrade head || {
    echo "❌ Migration failed, but continuing..."
}

# Initialize data if needed (for new deployments)
echo "🔄 Checking if initialization is needed..."
python -c "
from app.db.session import get_db_session
from app.models.shop import Shop

SessionLocal = get_db_session()
with SessionLocal() as db:
    shop_count = db.query(Shop).count()
    if shop_count == 0:
        print('🆕 No shops found, running initialization...')
        exit(99)  # Special exit code for initialization needed
    else:
        print(f'✅ Found {shop_count} shops, skipping initialization')
" 
init_exit_code=$?

if [ $init_exit_code -eq 99 ]; then
    echo "🚀 Running initial data setup..."
    python -c "
from app.api.endpoints.init_data import initialize_demo_data
from app.db.session import get_db_session

SessionLocal = get_db_session()
with SessionLocal() as db:
    try:
        initialize_demo_data(db)
        print('✅ Initial data setup completed')
    except Exception as e:
        print(f'⚠️ Initial data setup failed: {e}')
        # Continue anyway - might be due to existing data
"
fi

# Create uploads directory
mkdir -p /app/backend/uploads

# Health check endpoint test
echo "🏥 Testing health endpoint..."
python -c "
import time
from app.main import app
print('✅ App import successful')
" || {
    echo "❌ App import failed"
    exit 1
}

echo "🚀 Starting FastAPI server..."
echo "🌐 Server will be available on port ${PORT:-8000}"

# Start the FastAPI application
exec python -m uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1