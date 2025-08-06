#!/bin/bash

# Redis Deployment Script for Railway
# This script helps deploy your application with Redis on Railway

set -e  # Exit on any error

echo "🚀 Redis + FastAPI Deployment to Railway"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo -e "${RED}❌ Railway CLI not found. Please install it first:${NC}"
    echo "npm install -g @railway/cli"
    exit 1
fi

# Check if we're in Railway project
echo -e "${BLUE}🔍 Checking Railway project status...${NC}"
if ! railway status &> /dev/null; then
    echo -e "${RED}❌ Not in a Railway project. Please run 'railway link' first.${NC}"
    exit 1
fi

railway_status=$(railway status)
echo -e "${GREEN}✅ Railway project connected${NC}"
echo "$railway_status"

# Check current variables
echo -e "\n${BLUE}🔍 Checking environment variables...${NC}"
railway variables > /tmp/railway_vars.txt

if grep -q "REDIS_URL" /tmp/railway_vars.txt; then
    echo -e "${GREEN}✅ REDIS_URL found - Redis is already configured${NC}"
    redis_configured=true
else
    echo -e "${YELLOW}⚠️  REDIS_URL not found - Redis needs to be added${NC}"
    redis_configured=false
fi

# Show current variables (hide sensitive data)
echo -e "\n${BLUE}Current environment variables:${NC}"
cat /tmp/railway_vars.txt | grep -E "(REDIS|DATABASE|SECRET)" | head -10
rm /tmp/railway_vars.txt

# If Redis not configured, show instructions
if [ "$redis_configured" = false ]; then
    echo -e "\n${YELLOW}📋 Redis Setup Required:${NC}"
    echo "1. Go to Railway Dashboard: https://railway.app"
    echo "2. Open your project: cvety-kz"
    echo "3. Click '+ New' → 'Database' → 'Add Redis'"
    echo "4. Railway will automatically generate REDIS_URL"
    echo "5. Run this script again after adding Redis"
    echo ""
    echo -e "${BLUE}Alternative: Add Redis via CLI (may require TTY):${NC}"
    echo "railway add"
    echo ""
    read -p "Press Enter when you've added Redis to Railway..."
    
    # Check again after user adds Redis
    echo -e "\n${BLUE}🔍 Checking for Redis again...${NC}"
    railway variables | grep REDIS_URL > /dev/null
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Redis configuration found!${NC}"
    else
        echo -e "${RED}❌ Redis still not found. Please add Redis service first.${NC}"
        exit 1
    fi
fi

# Test Redis connection remotely
echo -e "\n${BLUE}🧪 Testing Redis connection...${NC}"
if railway run python3 backend/scripts/verify_redis.py; then
    echo -e "${GREEN}✅ Redis connection successful!${NC}"
else
    echo -e "${RED}❌ Redis connection failed. Check Railway logs.${NC}"
    echo "Run: railway logs --tail"
    exit 1
fi

# Deploy application
echo -e "\n${BLUE}🚀 Deploying application to Railway...${NC}"
echo "Using: railway up -c"

if railway up -c; then
    echo -e "\n${GREEN}✅ Deployment successful!${NC}"
else
    echo -e "\n${RED}❌ Deployment failed. Check logs:${NC}"
    echo "railway logs --tail"
    exit 1
fi

# Get deployment URL
deployment_url=$(railway status | grep -o 'https://[^[:space:]]*' | head -1)
if [ -z "$deployment_url" ]; then
    deployment_url="https://cvety-kz-production.up.railway.app"
fi

echo -e "\n${GREEN}🎉 Deployment Complete!${NC}"
echo "========================================"
echo "🌐 URL: $deployment_url"
echo ""
echo -e "${BLUE}🧪 Test OTP functionality:${NC}"
echo ""
echo "1. Request OTP:"
echo "curl -X POST $deployment_url/api/auth/request-otp \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"phone\": \"+77771234567\"}'"
echo ""
echo "2. Verify OTP:"
echo "curl -X POST $deployment_url/api/auth/verify-otp \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"phone\": \"+77771234567\", \"otp_code\": \"123456\"}'"
echo ""
echo -e "${BLUE}📊 Monitor deployment:${NC}"
echo "• Logs: railway logs --tail"
echo "• Status: railway status"  
echo "• Variables: railway variables"
echo ""
echo -e "${GREEN}✅ Redis is now handling OTP storage in production!${NC}"