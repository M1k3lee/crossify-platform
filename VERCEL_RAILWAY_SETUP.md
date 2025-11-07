# Connecting Vercel Frontend to Railway Backend

## Step 1: Get Railway Backend URL

1. Go to your Railway dashboard
2. Click on your `crossify-platform` service
3. Look for the **"Public Domain"** or **"Networking"** tab
4. Copy the URL (it will look like: `https://crossify-platform-production-xxxx.up.railway.app`)
5. Add `/api` to the end: `https://crossify-platform-production-xxxx.up.railway.app/api`

## Step 2: Add Environment Variable in Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click on your **`crossify-platform`** project
3. Click on **"Settings"** (top navigation)
4. Click on **"Environment Variables"** (left sidebar)
5. Click **"Add New"** button
6. Fill in:
   - **Key:** `VITE_API_BASE`
   - **Value:** `https://your-railway-url.up.railway.app/api` (use your actual Railway URL)
   - **Environment:** Select all (Production, Preview, Development)
7. Click **"Save"**

## Step 3: Redeploy Frontend

After adding the environment variable, you need to redeploy:

### Option A: Automatic Redeploy
- Vercel may automatically trigger a redeploy when you add environment variables
- Check the **"Deployments"** tab to see if a new deployment started

### Option B: Manual Redeploy
1. Go to **"Deployments"** tab
2. Click the **"..."** (three dots) on the latest deployment
3. Click **"Redeploy"**
4. Select **"Use existing Build Cache"** (optional)
5. Click **"Redeploy"**

## Step 4: Verify It Works

1. Wait for deployment to complete
2. Visit your Vercel site
3. Open browser console (F12)
4. Try to create a token or use the contact form
5. Check Network tab - API calls should go to your Railway backend URL
6. Should no longer see 405 errors!

## Quick Checklist

- [ ] Got Railway backend URL
- [ ] Added `/api` to the end
- [ ] Added `VITE_API_BASE` environment variable in Vercel
- [ ] Set to all environments
- [ ] Redeployed frontend
- [ ] Tested API calls (no more 405 errors!)

## Troubleshooting

### Still Getting 405 Errors?
- Check that `VITE_API_BASE` is set correctly in Vercel
- Make sure you included `/api` at the end
- Verify Railway backend is running (check Railway logs)
- Try visiting `https://your-railway-url.up.railway.app/api/health` directly
- Should return: `{"status":"ok","service":"crossify-backend",...}`

### CORS Errors?
- Check Railway environment variables
- Make sure `CORS_ORIGIN` includes your Vercel URL
- Format: `https://your-vercel-app.vercel.app,https://crossify.io`

### Environment Variable Not Working?
- Make sure variable name is exactly: `VITE_API_BASE` (case-sensitive)
- Must start with `VITE_` for Vite to expose it to the frontend
- Redeploy after adding/changing environment variables

---

**After setup, your frontend will communicate with your Railway backend!** 🚀

