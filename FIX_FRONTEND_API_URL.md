# Fix Frontend API URL Configuration

## Problem
The frontend is hardcoded to use `https://crossify-platform-production.up.railway.app/api`, which might be pointing to the old Railway project.

## Solution: Set VITE_API_BASE in Vercel

### Step 1: Get the Correct Railway URL

1. Go to Railway → **passionate-spirit** project
2. Click on **crossify-platform** service
3. Go to **Settings** tab
4. Find the **Domains** section
5. Copy the **Public Domain** URL (should look like: `https://crossify-platform-production.up.railway.app`)
   - OR check the **Variables** tab for `RAILWAY_PUBLIC_DOMAIN`

### Step 2: Set VITE_API_BASE in Vercel

1. Go to your Vercel project dashboard
2. Go to **Settings** → **Environment Variables**
3. Add a new variable:
   - **Name:** `VITE_API_BASE`
   - **Value:** `https://crossify-platform-production.up.railway.app` (or your actual Railway URL)
   - **Environment:** Production (and Preview if needed)
4. Click **Save**

### Step 3: Redeploy Frontend

After adding the environment variable:
1. Go to Vercel → **Deployments** tab
2. Click the three dots (⋯) on the latest deployment
3. Click **Redeploy**
4. Or push a new commit to trigger automatic deployment

### Step 4: Verify

After redeployment:
1. Open browser console on your site
2. Look for: `🔗 API Base URL: https://your-railway-url.railway.app/api`
3. Check if the marketplace loads
4. Check if token detail pages work

## Alternative: Check Current Railway URL

If you're not sure which Railway URL is correct:

1. Go to **passionate-spirit** project → **crossify-platform** service
2. Check **Variables** tab for `RAILWAY_PUBLIC_DOMAIN`
3. This is the correct URL to use

## Troubleshooting

### If marketplace still shows "no tokens found":
1. Check browser console for API errors
2. Verify the API URL in console logs matches your Railway URL
3. Check Railway backend logs for marketplace query errors
4. Verify tokens exist in PostgreSQL database

### If token detail page shows 404:
1. Check the token ID exists in the database
2. Verify the API endpoint is correct: `/api/tokens/:id/status`
3. Check Railway backend logs for 404 errors
4. Verify the token was created successfully

### If frontend still uses old URL:
1. Clear browser cache
2. Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
3. Check Vercel deployment logs to verify VITE_API_BASE is set
4. Verify the environment variable is set for the correct environment (Production)

## Quick Check

To verify which backend the frontend is using:
1. Open browser console on your site
2. Look for the `🔗 API Base URL:` log message
3. Compare it to your Railway project URL
4. If they don't match, the environment variable isn't set correctly

