# Railway Deployment Fix Guide

## Issues Identified

1. **Memory constraints causing pip install to fail (exit code 137)**
2. **Frontend build failures**
3. **Conflicting Railway configurations**

## Solutions Applied

### 1. Optimized Dockerfile

Created two Dockerfiles:
- `Dockerfile` - Updated with memory optimizations
- `Dockerfile.optimized` - Alternative with multi-stage build for wheels

Key optimizations:
- Added `NODE_OPTIONS="--max-old-space-size=512"` for frontend build
- Split pip install into chunks to reduce memory usage
- Added `--no-compile` flag to pip install
- Used `--maxsockets 1` for npm to reduce concurrent connections

### 2. Fixed Configuration Conflicts

- Removed `nixpacks.toml` (was conflicting with Dockerfile)
- Updated `railway.json` to explicitly use DOCKERFILE builder
- Kept `railway.toml` as backup configuration

### 3. Deployment Steps

1. **Try the optimized Dockerfile first:**
   ```bash
   # Rename the optimized version
   mv Dockerfile Dockerfile.original
   mv Dockerfile.optimized Dockerfile
   ```

2. **If still getting memory errors, increase Railway plan:**
   - Go to Railway dashboard → Settings → Usage
   - Upgrade to at least Hobby plan ($5/month) for more memory

3. **Alternative: Use Railway's build cache:**
   ```toml
   # In railway.toml
   [build]
   builder = "DOCKERFILE"
   dockerfilePath = "./Dockerfile"
   buildCommand = "docker build --compress ."
   ```

4. **Environment variables to set in Railway:**
   ```
   NODE_OPTIONS=--max-old-space-size=512
   PYTHONUNBUFFERED=1
   PYTHONDONTWRITEBYTECODE=1
   ```

## Testing Locally

```bash
# Test the build locally
./test-docker-build.sh

# Or manually:
docker build -t cvety-test .
docker run -p 8000:8000 cvety-test
```

## If Build Still Fails

1. **Check Railway logs:**
   ```bash
   railway logs
   ```

2. **Try Nixpacks instead:**
   ```bash
   # Create nixpacks.toml
   cat > nixpacks.toml << 'EOF'
   [phases.setup]
   nixPkgs = ["nodejs-18_x", "python39", "postgresql"]
   
   [phases.install]
   cmds = [
       "npm ci --omit=dev",
       "pip install -r backend/requirements.txt"
   ]
   
   [phases.build]
   cmds = ["npm run build"]
   
   [start]
   cmd = "./docker-entrypoint.sh"
   EOF
   
   # Update railway.json
   sed -i 's/"builder": "DOCKERFILE"/"builder": "NIXPACKS"/' railway.json
   ```

3. **Split services (if necessary):**
   - Deploy frontend to Vercel/Netlify
   - Keep only backend on Railway

## Monitoring

After successful deployment:
1. Check health endpoint: `https://your-app.railway.app/health`
2. Monitor memory usage in Railway dashboard
3. Set up alerts for failures

## Commit Message

```
fix: optimize Railway deployment for memory constraints

- Split pip install into chunks to reduce memory usage
- Add NODE_OPTIONS for frontend build memory limit
- Remove conflicting nixpacks.toml configuration
- Update Dockerfile with --no-compile flags
- Fix railway.json to use DOCKERFILE builder
```