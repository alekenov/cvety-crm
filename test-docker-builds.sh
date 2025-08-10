#!/bin/bash

# Test Docker builds for all services
# This script builds each service and measures build time

set -e

echo "🚀 Testing Docker builds for Railway deployment optimization"
echo "============================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to build and time a Docker image
build_and_time() {
    local service=$1
    local dockerfile=$2
    local context=$3
    
    echo ""
    echo -e "${YELLOW}Building $service...${NC}"
    echo "Dockerfile: $dockerfile"
    echo "Context: $context"
    echo "-----------------------------------"
    
    # Build and measure time
    start_time=$(date +%s)
    
    if docker build -f "$dockerfile" -t "cvety-$service:test" "$context" > /tmp/docker-build-$service.log 2>&1; then
        end_time=$(date +%s)
        build_time=$((end_time - start_time))
        
        # Get image size
        image_size=$(docker images "cvety-$service:test" --format "{{.Size}}")
        
        echo -e "${GREEN}✅ $service built successfully${NC}"
        echo "   Build time: ${build_time}s"
        echo "   Image size: $image_size"
        
        # Show layer count
        layer_count=$(docker history "cvety-$service:test" | wc -l)
        echo "   Layers: $((layer_count - 1))"
    else
        echo -e "${RED}❌ $service build failed${NC}"
        echo "Error log:"
        tail -20 /tmp/docker-build-$service.log
        return 1
    fi
}

# Test main app build
echo "1. Testing main app (frontend + backend)"
build_and_time "main" "Dockerfile" "."

# Test backend service build
echo ""
echo "2. Testing backend service"
build_and_time "backend" "backend/Dockerfile" "backend"

# Test telegram-miniapp build
echo ""
echo "3. Testing telegram-miniapp"
build_and_time "telegram-miniapp" "telegram-miniapp/Dockerfile" "telegram-miniapp"

# Summary
echo ""
echo "============================================================"
echo -e "${GREEN}Build tests completed!${NC}"
echo ""
echo "To test a specific service locally:"
echo "  docker run -p 8000:8000 -e PORT=8000 cvety-main:test"
echo "  docker run -p 8001:8001 -e PORT=8001 cvety-backend:test"
echo "  docker run -p 3000:3000 -e PORT=3000 cvety-telegram-miniapp:test"
echo ""
echo "To check health endpoints:"
echo "  curl http://localhost:8000/health"
echo "  curl http://localhost:8001/health"
echo "  curl http://localhost:3000/health"