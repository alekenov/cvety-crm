#!/bin/bash

echo "🚀 Running database migrations on Railway..."

# Run alembic migrations
echo "📋 Running Alembic migrations..."
railway run --service cvety-kz "cd backend && alembic upgrade head"

if [ $? -eq 0 ]; then
    echo "✅ Migrations completed successfully!"
else
    echo "❌ Migration failed!"
    exit 1
fi

# Check migration status
echo ""
echo "📊 Checking migration status..."
railway run --service cvety-kz "cd backend && alembic current"

echo ""
echo "🏁 Migration process complete!"