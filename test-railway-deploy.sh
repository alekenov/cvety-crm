#!/bin/bash
# Test Railway-like deployment locally

echo "🚂 Testing Railway deployment locally..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
    exit 1
fi

echo -e "${YELLOW}📦 Building Docker image (simulating Railway build)...${NC}"

# Build with no cache to simulate Railway fresh build
time docker build -t cvety-railway-test . --no-cache

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build successful!${NC}"

# Test with Railway-like environment variables
echo -e "${YELLOW}🚀 Starting container with Railway-like environment...${NC}"

# Stop any existing test container
docker stop cvety-railway-test 2>/dev/null || true
docker rm cvety-railway-test 2>/dev/null || true

# Run with Railway-like settings
docker run -d \
    --name cvety-railway-test \
    -p 3000:3000 \
    -e PORT=3000 \
    -e RAILWAY_ENVIRONMENT=production \
    -e DATABASE_URL="postgresql://test:test@host.docker.internal:5432/test" \
    -e SECRET_KEY="test-secret-key-$(openssl rand -hex 16)" \
    cvety-railway-test

# Wait for container to start
echo -e "${YELLOW}⏳ Waiting for application to start...${NC}"
sleep 5

# Check if container is running
if [ "$(docker ps -q -f name=cvety-railway-test)" ]; then
    echo -e "${GREEN}✅ Container is running!${NC}"
    
    # Test health endpoint
    echo -e "${YELLOW}🏥 Testing health endpoint...${NC}"
    if curl -f http://localhost:3000/health 2>/dev/null; then
        echo -e "\n${GREEN}✅ Health check passed!${NC}"
    else
        echo -e "${RED}❌ Health check failed!${NC}"
        echo "Container logs:"
        docker logs cvety-railway-test
    fi
    
    # Show container info
    echo -e "\n${YELLOW}📊 Container info:${NC}"
    docker ps --filter name=cvety-railway-test --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    
    echo -e "\n${YELLOW}📝 View logs with:${NC} docker logs -f cvety-railway-test"
    echo -e "${YELLOW}🛑 Stop with:${NC} docker stop cvety-railway-test && docker rm cvety-railway-test"
else
    echo -e "${RED}❌ Container failed to start!${NC}"
    echo "Container logs:"
    docker logs cvety-railway-test
    exit 1
fi

echo -e "\n${GREEN}✨ Railway deployment test complete!${NC}"
echo -e "${YELLOW}💡 Tips:${NC}"
echo "  - Check image size: docker images cvety-railway-test"
echo "  - Enter container: docker exec -it cvety-railway-test bash"
echo "  - Test API: curl http://localhost:3000/api/v1/health"