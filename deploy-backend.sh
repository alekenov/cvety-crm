#!/bin/bash

echo "🚀 Deploying Backend Service to Railway"
echo "======================================="
echo ""
echo "This script will deploy the backend service using Nixpacks configuration."
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI is not installed. Please install it first:"
    echo "   npm install -g @railway/cli"
    exit 1
fi

# Check if logged in
if ! railway whoami &> /dev/null; then
    echo "❌ Not logged in to Railway. Please run: railway login"
    exit 1
fi

echo "📋 Prerequisites:"
echo "1. Create two services in your Railway project dashboard:"
echo "   - Backend Service (e.g., 'cvety-backend')"
echo "   - Frontend Service (e.g., 'cvety-frontend')"
echo ""
echo "2. Add a PostgreSQL database to your project"
echo ""
echo "Press Enter to continue after creating the services..."
read

echo ""
echo "🔧 Configuring Backend Service"
echo ""

# Link to the backend service
echo "Select your BACKEND service from the list:"
railway link

echo ""
echo "📝 Setting Backend Environment Variables"
echo ""

# Set environment variables
railway variables set DATABASE_URL="postgresql://postgres:password@postgres.railway.internal:5432/railway"
railway variables set SECRET_KEY="$(openssl rand -hex 32)"
railway variables set ENVIRONMENT="production"
railway variables set PORT="8000"
railway variables set RAILWAY_SERVICE_NAME="backend"

echo ""
echo "🚀 Deploying Backend with Nixpacks configuration"
echo ""

# Deploy backend (using CI mode)
railway up -c --service backend

echo ""
echo "✅ Backend deployment initiated!"
echo ""
echo "📊 To check deployment status:"
echo "   railway logs"
echo ""
echo "🌐 Your backend URL will be available at:"
echo "   https://[your-backend-service].up.railway.app"
echo ""
echo "Next steps:"
echo "1. Wait for backend to be fully deployed"
echo "2. Copy the backend URL"
echo "3. Run ./deploy-frontend.sh"