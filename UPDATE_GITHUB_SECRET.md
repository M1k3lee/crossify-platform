# Update GitHub Secret for Cloud Run (GitHub Pages)

## ✅ Backend Status

**Cloud Run Service:** `crossify-backend`  
**Service URL:** `https://crossify-backend-88917802850.europe-west1.run.app`  
**Region:** `europe-west1`  
**Status:** ✅ Deployed and running

## 🔧 Required Action: Update GitHub Secret

The frontend is deployed on GitHub Pages and needs to be updated to use the new Cloud Run backend URL instead of Railway.

### Step 1: Update GitHub Secret

1. Go to your GitHub repository: https://github.com/M1k3lee/crossify-platform
2. Click **Settings** (top menu)
3. Go to **Secrets and variables** → **Actions** (left sidebar)
4. Find the secret `VITE_API_BASE` (or create it if it doesn't exist)
5. Click **Update** (or **New repository secret**)
6. Set the value to: `https://crossify-backend-88917802850.europe-west1.run.app`
   - **Note:** The workflow will automatically add `/api` to this URL
7. Click **Update secret** (or **Add secret**)

### Step 2: Trigger Deployment

After updating the secret:

1. Go to the **Actions** tab in your repository
2. Click **"Deploy to GitHub Pages"** workflow
3. Click **"Run workflow"** → **"Run workflow"**
4. Wait for the workflow to complete (~2-3 minutes)

**OR** just push a new commit to `main` branch - it will auto-deploy

### Step 3: Verify

After redeployment:

1. Open your site (crossify.io or GitHub Pages URL: `https://M1k3lee.github.io/crossify-platform`)
2. Open browser console (F12)
3. Look for: `🔗 API Base URL: https://crossify-backend-88917802850.europe-west1.run.app/api`
4. Test the marketplace - it should load tokens
5. Test token detail pages

## ⚠️ Important Notes

- **Railway expires tonight** - The old Railway backend will stop working
- **Cloud Run is now active** - Your backend is running on Google Cloud
- **Frontend needs update** - Must set `VITE_API_BASE` in Vercel to point to Cloud Run
- **No code changes needed** - Just update the environment variable in Vercel

## 🔍 Current Status

- ✅ Backend deployed to Cloud Run
- ✅ Database (crossify-db) created
- ⚠️ Frontend still pointing to Railway (needs Vercel env var update)
- ⚠️ Environment variables not yet configured in Cloud Run
- ⚠️ Cloud SQL not yet connected to Cloud Run

## Next Steps After Vercel Update

1. Configure environment variables in Cloud Run
2. Connect Cloud SQL to Cloud Run
3. Test full platform functionality

