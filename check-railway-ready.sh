#!/bin/bash
# Check if project is ready for Railway deployment

echo "========================================="
echo "Railway Deployment Readiness Check"
echo "========================================="

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check functions
check_pass() {
    echo -e "${GREEN}✓${NC} $1"
}

check_fail() {
    echo -e "${RED}✗${NC} $1"
    return 1
}

check_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

errors=0

echo ""
echo "Checking required files..."
echo "--------------------------"

# Check Docker files
if [ -f "Dockerfile" ]; then
    check_pass "Dockerfile exists"
else
    check_fail "Dockerfile missing"
    ((errors++))
fi

if [ -f "docker-entrypoint.sh" ]; then
    check_pass "docker-entrypoint.sh exists"
else
    check_fail "docker-entrypoint.sh missing"
    ((errors++))
fi

if [ -f "railway.json" ]; then
    check_pass "railway.json exists"
else
    check_fail "railway.json missing"
    ((errors++))
fi

if [ -f ".dockerignore" ]; then
    check_pass ".dockerignore exists"
else
    check_warn ".dockerignore missing (recommended)"
fi

echo ""
echo "Checking environment templates..."
echo "---------------------------------"

if [ -f ".env.example" ] || [ -f "backend/.env.example" ]; then
    check_pass "Environment template exists"
else
    check_warn "No .env.example found"
fi

if [ -f ".env.railway.example" ]; then
    check_pass "Railway environment template exists"
else
    check_warn "No .env.railway.example found"
fi

echo ""
echo "Checking database setup..."
echo "--------------------------"

if [ -d "backend/alembic" ]; then
    check_pass "Alembic migrations configured"
else
    check_fail "Alembic not configured"
    ((errors++))
fi

if grep -q "alembic upgrade head" docker-entrypoint.sh 2>/dev/null; then
    check_pass "Auto-migration in entrypoint"
else
    check_warn "No auto-migration in entrypoint"
fi

echo ""
echo "Checking Python dependencies..."
echo "-------------------------------"

if [ -f "backend/requirements.txt" ]; then
    check_pass "requirements.txt exists"
    
    # Check for critical packages
    if grep -q "fastapi" backend/requirements.txt; then
        check_pass "FastAPI included"
    else
        check_fail "FastAPI missing"
        ((errors++))
    fi
    
    if grep -q "uvicorn" backend/requirements.txt; then
        check_pass "Uvicorn included"
    else
        check_fail "Uvicorn missing"
        ((errors++))
    fi
    
    if grep -q "redis" backend/requirements.txt; then
        check_pass "Redis client included"
    else
        check_warn "Redis client missing (needed for OTP)"
    fi
    
    if grep -q "aiogram" backend/requirements.txt; then
        check_pass "Telegram bot library included"
    else
        check_warn "Aiogram missing (needed for Telegram bot)"
    fi
else
    check_fail "requirements.txt missing"
    ((errors++))
fi

echo ""
echo "Checking frontend build..."
echo "--------------------------"

if [ -f "package.json" ]; then
    check_pass "package.json exists"
    
    if [ -f "package-lock.json" ] || [ -f "yarn.lock" ] || [ -f "pnpm-lock.yaml" ]; then
        check_pass "Lock file exists"
    else
        check_warn "No lock file (npm/yarn/pnpm)"
    fi
else
    check_fail "package.json missing"
    ((errors++))
fi

if [ -f "vite.config.ts" ] || [ -f "vite.config.js" ]; then
    check_pass "Vite configuration exists"
else
    check_warn "No Vite config found"
fi

echo ""
echo "Checking Docker build..."
echo "------------------------"

echo "Testing Docker build (this may take a moment)..."
if docker build -t railway-test . > /dev/null 2>&1; then
    check_pass "Docker build successful"
    
    # Cleanup
    docker rmi railway-test > /dev/null 2>&1
else
    check_fail "Docker build failed"
    ((errors++))
    echo "  Run 'docker build .' to see error details"
fi

echo ""
echo "Checking Railway CLI..."
echo "-----------------------"

if command -v railway &> /dev/null; then
    check_pass "Railway CLI installed"
    
    # Check if logged in
    if railway whoami &> /dev/null; then
        check_pass "Railway CLI authenticated"
    else
        check_warn "Not logged in to Railway (run: railway login)"
    fi
else
    check_warn "Railway CLI not installed"
    echo "  Install with: npm install -g @railway/cli"
fi

echo ""
echo "Checking Git status..."
echo "----------------------"

if [ -d ".git" ]; then
    check_pass "Git repository initialized"
    
    # Check for uncommitted changes
    if [ -z "$(git status --porcelain)" ]; then
        check_pass "No uncommitted changes"
    else
        check_warn "Uncommitted changes detected"
        echo "  Consider committing before deploy"
    fi
    
    # Check remote
    if git remote get-url origin &> /dev/null; then
        check_pass "Git remote configured"
    else
        check_warn "No git remote configured"
    fi
else
    check_fail "Not a git repository"
    ((errors++))
fi

echo ""
echo "========================================="
if [ $errors -eq 0 ]; then
    echo -e "${GREEN}✓ Project is ready for Railway deployment!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. railway login"
    echo "2. railway link (or railway init)"
    echo "3. Add PostgreSQL: railway add"
    echo "4. Add Redis: railway add"
    echo "5. Set environment variables in Railway dashboard"
    echo "6. Deploy: railway up -c"
else
    echo -e "${RED}✗ Found $errors critical issues${NC}"
    echo ""
    echo "Please fix the issues above before deploying."
fi
echo "========================================="

exit $errors