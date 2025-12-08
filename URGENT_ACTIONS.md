# 🚨 URGENT: Update GitHub Secret Before Railway Expires Tonight

## Quick Steps (5 minutes)

### 1. Update GitHub Secret

1. Go to: https://github.com/M1k3lee/crossify-platform/settings/secrets/actions
2. Find or create secret: `VITE_API_BASE`
3. Set value to: `https://crossify-backend-88917802850.europe-west1.run.app`
4. Click **Update secret**

### 2. Trigger Deployment

**Option A: Manual Trigger**
1. Go to: https://github.com/M1k3lee/crossify-platform/actions
2. Click **"Deploy to GitHub Pages"** workflow
3. Click **"Run workflow"** → **"Run workflow"**

**Option B: Auto Deploy**
- Just push any commit to `main` branch (it will auto-deploy)

### 3. Verify (After 2-3 minutes)

1. Visit your site: `https://M1k3lee.github.io/crossify-platform` (or crossify.io if configured)
2. Open browser console (F12)
3. Look for: `🔗 API Base URL: https://crossify-backend-88917802850.europe-west1.run.app/api`
4. Test the marketplace - should load tokens

## ✅ Current Status

- ✅ Backend deployed to Cloud Run
- ✅ Backend is publicly accessible
- ✅ Database created
- ⚠️ **Frontend still pointing to Railway** ← Fix this NOW!

## Why This Is Urgent

Railway expires **tonight**. If you don't update the GitHub secret, your frontend will try to connect to Railway and fail, breaking your entire site.

## What Happens After

Once you update the secret and redeploy:
- Frontend will connect to Cloud Run backend ✅
- Site will continue working after Railway expires ✅
- You'll have time to configure environment variables and database connection ✅



