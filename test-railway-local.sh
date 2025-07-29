#!/bin/bash

# Script to test Railway deployment locally
# This simulates Railway environment variables and builds

echo "🚂 Testing Railway deployment locally..."
echo "======================================="

# Set test environment variables (update these with your actual values)
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/flower_shop"
export SECRET_KEY="test-secret-key-for-local-testing"
export PORT=8000
export RAILWAY_ENVIRONMENT="development"

echo "📋 Environment variables set:"
echo "DATABASE_URL: ${DATABASE_URL:0:50}..."
echo "SECRET_KEY: ${SECRET_KEY:0:20}..."
echo "PORT: $PORT"
echo "RAILWAY_ENVIRONMENT: $RAILWAY_ENVIRONMENT"
echo ""

# Build Docker image
echo "🔨 Building Docker image..."
docker build -t cvety-test .

if [ $? -ne 0 ]; then
    echo "❌ Docker build failed!"
    exit 1
fi

echo "✅ Docker build successful!"
echo ""

# Run container
echo "🚀 Running container..."
docker run --rm \
    -e DATABASE_URL="$DATABASE_URL" \
    -e SECRET_KEY="$SECRET_KEY" \
    -e PORT="$PORT" \
    -e RAILWAY_ENVIRONMENT="$RAILWAY_ENVIRONMENT" \
    -p $PORT:$PORT \
    --name cvety-test-container \
    cvety-test &

# Wait for container to start
echo "⏳ Waiting for container to start..."
sleep 10

# Test health endpoint
echo "🏥 Testing health endpoint..."
curl -f http://localhost:$PORT/health

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Health check passed!"
else
    echo ""
    echo "❌ Health check failed!"
fi

# Test API health
echo "🔍 Testing API database health..."
curl -f http://localhost:$PORT/api/health/db

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ API database health check passed!"
else
    echo ""
    echo "❌ API database health check failed!"
fi

# Show container logs
echo ""
echo "📜 Container logs:"
docker logs cvety-test-container

# Stop container
echo ""
echo "🛑 Stopping container..."
docker stop cvety-test-container

echo ""
echo "🏁 Test complete!"