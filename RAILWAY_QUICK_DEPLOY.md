# Railway Quick Deployment Guide

## 🚀 Quick Start

You have two options for deploying to Railway:

### Option 1: Using Railway Dashboard (Recommended)

1. **Go to Railway Dashboard**: https://railway.app/project/cvety-kz

2. **Create Two Services**:
   - Click "New Service" → "Empty Service" → Name it "backend"
   - Click "New Service" → "Empty Service" → Name it "frontend"
   - Click "New Service" → "Database" → "PostgreSQL" (if not already added)

3. **Configure Backend Service**:
   - Click on "backend" service
   - Go to "Settings" tab
   - Under "Service", set:
     - Root Directory: `/backend`
   - Go to "Variables" tab, add:
     ```
     DATABASE_URL=<copy from PostgreSQL service>
     SECRET_KEY=<generate random string>
     ENVIRONMENT=production
     PORT=8000
     ```
   - Go to "Deploy" tab
   - Connect your GitHub repo
   - It will auto-detect `railway-backend.json` and deploy

4. **Configure Frontend Service**:
   - Click on "frontend" service
   - Go to "Settings" tab
   - Under "Service", leave Root Directory empty
   - Go to "Variables" tab, add:
     ```
     VITE_API_URL=https://<your-backend-url>.up.railway.app/api
     PORT=3000
     ```
   - Go to "Deploy" tab
   - Connect your GitHub repo
   - It will auto-detect `railway-frontend.json` and deploy

### Option 2: Using CLI Scripts

1. **First, create services in Railway Dashboard** (steps 1-2 above)

2. **Deploy Backend**:
   ```bash
   ./deploy-backend.sh
   ```
   Follow the prompts to select your backend service.

3. **Deploy Frontend**:
   ```bash
   ./deploy-frontend.sh
   ```
   Enter your backend URL when prompted.

## 📝 Important Notes

- **Deploy backend first**, wait for it to be running
- **Copy the backend URL** before deploying frontend
- The Nixpacks configuration files (`railway-backend.json` and `railway-frontend.json`) must be in the root directory
- Each service gets its own memory allocation on Railway free tier

## 🔍 Monitoring

Check deployment status:
```bash
# For backend
railway link  # Select backend service
railway logs

# For frontend
railway link  # Select frontend service
railway logs
```

## 🚨 Troubleshooting

If deployment fails:
1. Check logs: `railway logs`
2. Verify environment variables are set correctly
3. Ensure PostgreSQL database is created and `DATABASE_URL` is correct
4. Make sure both JSON config files are in root directory

## 🎯 Success Checklist

- [ ] Backend service deployed and running
- [ ] Frontend service deployed and running
- [ ] Frontend can connect to backend API
- [ ] Database migrations completed
- [ ] Both services accessible via their Railway URLs