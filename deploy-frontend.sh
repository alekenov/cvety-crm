#!/bin/bash

echo "🚀 Deploying Frontend Service to Railway"
echo "========================================"
echo ""
echo "This script will deploy the frontend service using Nixpacks configuration."
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
echo "1. Backend service must be deployed and running"
echo "2. You need the backend service URL"
echo ""
echo "Enter your backend URL (e.g., https://cvety-backend.up.railway.app):"
read BACKEND_URL

if [ -z "$BACKEND_URL" ]; then
    echo "❌ Backend URL is required!"
    exit 1
fi

echo ""
echo "🔧 Configuring Frontend Service"
echo ""

# Unlink any current service
railway unlink

# Link to the frontend service
echo "Select your FRONTEND service from the list:"
railway link

echo ""
echo "📝 Setting Frontend Environment Variables"
echo ""

# Set environment variables
railway variables set VITE_API_URL="${BACKEND_URL}/api"
railway variables set PORT="3000"
railway variables set RAILWAY_SERVICE_NAME="frontend"

echo ""
echo "🚀 Deploying Frontend with Nixpacks configuration"
echo ""

# Deploy frontend
railway up --service frontend

echo ""
echo "✅ Frontend deployment initiated!"
echo ""
echo "📊 To check deployment status:"
echo "   railway logs"
echo ""
echo "🌐 Your frontend URL will be available at:"
echo "   https://[your-frontend-service].up.railway.app"
echo ""
echo "🎉 Deployment complete!"
echo ""
echo "Important:"
echo "- Backend: ${BACKEND_URL}"
echo "- Frontend API URL: ${BACKEND_URL}/api"
echo "- Check both services are running: railway logs"