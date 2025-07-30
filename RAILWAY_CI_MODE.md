# Railway CI Mode Configuration

## Overview

All Railway deployments for this project are configured to use CI mode (`railway up -c`). This ensures consistent, non-interactive deployments suitable for automated pipelines.

## What is CI Mode?

The `-c` or `--ci` flag in Railway CLI:
- Runs in non-interactive mode (no prompts)
- Exits with proper status codes for CI/CD pipelines
- Provides cleaner output for logging
- Prevents hanging on user input prompts
- Better suited for automated deployments

## Deployment Commands

All deployment scripts and documentation have been updated to use CI mode:

### Direct Deployment
```bash
railway up -c
```

### Service-Specific Deployment
```bash
# Backend
railway up -c --service backend

# Frontend
railway up -c --service frontend
```

### Using Scripts
```bash
# Deploy backend
./deploy-backend.sh

# Deploy frontend
./deploy-frontend.sh

# Using Make
make deploy
```

## Files Updated

The following files have been configured to use `railway up -c`:

1. **Deployment Scripts**:
   - `/deploy-backend.sh` - Backend deployment script
   - `/deploy-frontend.sh` - Frontend deployment script
   - `/backend/railway_setup.sh` - Initial Railway setup script

2. **Build Configuration**:
   - `/Makefile` - Make deploy target

3. **Documentation**:
   - `/DEPLOYMENT.md` - General deployment guide
   - `/RAILWAY_DEPLOYMENT.md` - Railway-specific deployment guide
   - `/RAILWAY_DATABASE_SETUP.md` - Database setup guide

## Why CI Mode?

1. **Consistency**: Ensures all deployments behave the same way
2. **Automation**: Suitable for GitHub Actions and other CI/CD tools
3. **Error Handling**: Proper exit codes for deployment pipelines
4. **No Manual Intervention**: Prevents deployments from hanging on prompts
5. **Better Logging**: Cleaner output for deployment logs

## Troubleshooting

If you encounter issues with CI mode:

1. **Missing Environment Variables**: Ensure all required variables are set in Railway dashboard
2. **Authentication**: Make sure you're logged in with `railway login`
3. **Project Linking**: Verify project is linked with `railway status`
4. **Service Selection**: For multi-service projects, use `--service` flag

## Manual Override

If you need interactive mode for debugging:
```bash
# Use without -c flag (not recommended for production)
railway up
```

But remember to always use `-c` for actual deployments!