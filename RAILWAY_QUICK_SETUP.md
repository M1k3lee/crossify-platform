# 🚀 Railway Backend Quick Setup

## What You Need to Do

### Option 1: Configure Existing Service (Recommended)

1. **Click on "crossify-platform"** (the purple box in the center)
   - This opens the service details

2. **Click "Settings" tab** (top navigation)

3. **Find "Source" section** and set:
   - **Root Directory:** `backend` ⚠️ **THIS IS CRITICAL**

4. **Scroll to "Build & Deploy" section:**
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`

5. **Click "Save"** or **"Deploy"**

### Option 2: Delete and Recreate (If Option 1 Doesn't Work)

1. **Delete the current service:**
   - Click on "crossify-platform"
   - Go to Settings
   - Scroll to bottom
   - Click "Delete Service"

2. **Create new service:**
   - Click **"+ Create"** (top right)
   - Select **"GitHub Repo"**
   - Choose `crossify-platform`
   - **IMPORTANT:** In the setup form, set:
     - **Root Directory:** `backend`
     - **Build Command:** `npm install && npm run build`
     - **Start Command:** `npm start`
   - Click **"Deploy"**

## Next Steps After Configuration

1. **Add Environment Variables:**
   - Go to **"Variables"** tab
   - Add all variables from `QUICK_BACKEND_DEPLOY.md`

2. **Add Database Volume:**
   - Go to **Settings** → **Volumes**
   - Add volume at `/data`

3. **Get Backend URL:**
   - Railway will show URL like: `https://xxx.up.railway.app`
   - Copy this URL

4. **Update Vercel:**
   - Go to Vercel → Settings → Environment Variables
   - Update `VITE_API_BASE` to: `https://your-railway-url.up.railway.app/api`
   - Redeploy frontend

## 🎯 Key Point

**The most important setting is Root Directory = `backend`**

Without this, Railway tries to deploy the entire monorepo and it fails!

---

**Need help?** Check the logs tab to see what's failing.

