# Vercel Environment Variables Setup

## ⚠️ IMPORTANT: Backend API Configuration

The frontend needs to know where the backend is located. Since the frontend is on Vercel and the backend is on Railway, you need to set the `VITE_API_BASE` environment variable in Vercel.

## Steps to Fix 405 Errors

### 1. Go to Vercel Dashboard
1. Navigate to your project: https://vercel.com/dashboard
2. Click on your **crossify-platform** project
3. Go to **Settings** → **Environment Variables**

### 2. Add Environment Variable
Add the following environment variable:

**Key**: `VITE_API_BASE`  
**Value**: `https://crossify-platform-production.up.railway.app`  
**Environment**: Production, Preview, Development (select all)

**Important Notes**:
- Do NOT include `/api` at the end - the code will add it automatically
- Make sure to select all environments (Production, Preview, Development)
- After adding, you MUST redeploy for changes to take effect

### 3. Redeploy
After adding the environment variable:
1. Go to **Deployments** tab
2. Click the **⋯** (three dots) on the latest deployment
3. Click **Redeploy**
4. Or simply push a new commit to trigger a redeploy

## Verification

After redeploying, check the browser console (F12). You should see:
- ✅ API calls going to: `https://crossify-platform-production.up.railway.app/api/...`
- ❌ NOT: `/api/...` (this would be wrong - hitting Vercel instead of Railway)

## Troubleshooting

### Still getting 405 errors?
1. **Check environment variable is set**: Go to Vercel Settings → Environment Variables
2. **Check it's in the right format**: Should be `https://crossify-platform-production.up.railway.app` (no trailing slash, no /api)
3. **Redeploy after adding**: Environment variables only apply to new deployments
4. **Check Railway backend is running**: Visit `https://crossify-platform-production.up.railway.app/api/health` - should return `{"status":"ok"}`

### Test Backend Health
Visit this URL in your browser:
```
https://crossify-platform-production.up.railway.app/api/health
```

You should see:
```json
{"status":"ok","service":"crossify-backend","timestamp":"..."}
```

If you get an error, the backend might not be running or the URL is wrong.

## Current Configuration

The frontend code now uses a centralized API configuration:
- **File**: `frontend/src/config/api.ts`
- **Production**: Uses `VITE_API_BASE` env var or defaults to Railway URL
- **Development**: Uses `VITE_API_BASE` env var or defaults to `http://localhost:3001`

All API calls throughout the app now use this centralized configuration.

