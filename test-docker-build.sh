#!/bin/bash

echo "🧪 Testing Docker build locally..."

# Test the optimized Dockerfile
echo "📦 Building with optimized Dockerfile..."
docker build -f Dockerfile.optimized -t cvety-test-optimized . || {
    echo "❌ Optimized build failed"
    exit 1
}

echo "✅ Optimized build successful!"

# Test memory usage
echo "📊 Checking image size..."
docker images cvety-test-optimized --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"

# Optionally test the original Dockerfile
read -p "Test original Dockerfile? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📦 Building with original Dockerfile..."
    docker build -t cvety-test-original . || {
        echo "❌ Original build failed"
    }
fi

echo "🎉 Build test complete!"