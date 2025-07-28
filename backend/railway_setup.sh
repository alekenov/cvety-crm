#!/bin/bash
# Railway CLI setup script for Cvety.kz

echo "🚀 Railway Setup for Cvety.kz"
echo "============================"

# Check if railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    echo "Run: brew install railway"
    exit 1
fi

echo "✅ Railway CLI found"

# Login to Railway
echo "\n📝 Logging into Railway..."
railway login

# Link to project
echo "\n🔗 Linking to Railway project..."
echo "If you haven't created a project yet, create one at railway.app"
railway link

# Get environment variables
echo "\n📥 Pulling environment variables..."
railway env > .env.railway

# Check if PostgreSQL is added
if grep -q "DATABASE_URL" .env.railway; then
    echo "✅ PostgreSQL found in project"
else
    echo "⚠️  No DATABASE_URL found. Add PostgreSQL service in Railway dashboard"
    echo "Then run this script again"
    exit 1
fi

# Run migrations
echo "\n🗄️  Running database migrations..."
railway run alembic upgrade head

# Check current data
echo "\n📊 Checking database status..."
railway run python check_railway_db.py

# Ask about data import
echo "\n❓ Do you want to import data? (y/n)"
read -r response

if [[ "$response" =~ ^[Yy]$ ]]; then
    if [ -f "sqlite_export.json" ]; then
        echo "📥 Importing data from sqlite_export.json..."
        railway run python import_to_postgres.py
    else
        echo "🆕 Creating sample data..."
        railway run python init_database.py
    fi
fi

# Deploy
echo "\n🚀 Ready to deploy? (y/n)"
read -r deploy_response

if [[ "$deploy_response" =~ ^[Yy]$ ]]; then
    echo "🚂 Deploying to Railway..."
    railway up
fi

echo "\n✅ Setup complete!"
echo "Your app will be available at your Railway domain once deployed"