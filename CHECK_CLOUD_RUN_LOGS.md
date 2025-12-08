# Check Cloud Run Logs & Fix Database Connection

## The Problem
The `/api/tokens` endpoint returns "Cannot GET /api/tokens", which suggests:
1. The backend might not be fully starting
2. Database connection might be failing
3. Routes might not be registered properly

## Step 1: Check Cloud Run Logs

1. **Go to Cloud Run**: https://console.cloud.google.com/run/detail/europe-west1/crossify-backend?project=voltaic-wall-480423-u9
2. **Click "Logs" tab** (in the left sidebar under "Observability")
3. **Look for errors** like:
   - `DATABASE_URL not set`
   - `Failed to connect to database`
   - `PostgreSQL connection error`
   - Any other error messages

## Step 2: Connect Cloud SQL (If Not Done)

The backend needs Cloud SQL connected:

1. **Click "Edit & deploy new revision"** (pencil icon)
2. **Scroll to "Connections" tab**
3. **Under "Cloud SQL connections"**, click **"Add connection"**
4. **Select `crossify-db`**
5. **Click "Deploy"**

## Step 3: Update DATABASE_URL

After connecting Cloud SQL:

1. **Still in edit page**, go to **"Variables & Secrets" tab**
2. **Find or add `DATABASE_URL`**
3. **Set it to:**
   ```
   postgresql://postgres:@@Mixmaster@20@/crossify-db?host=/cloudsql/voltaic-wall-480423-u9:europe-west1:crossify-db
   ```
4. **Click "Deploy"**

## Step 4: Verify Other Environment Variables

Make sure these are set in Cloud Run:
- `PORT=3001`
- `NODE_ENV=production`
- `CORS_ORIGIN=https://crossify.io,https://www.crossify.io,https://M1k3lee.github.io`
- All your other Railway environment variables

## Step 5: Test Again

After deployment:
1. **Wait 1-2 minutes** for deployment to complete
2. **Check logs** for "✅ PostgreSQL database initialized successfully"
3. **Test**: https://crossify-backend-88917802850.europe-west1.run.app/api/tokens

---

## Quick Checklist

- [ ] Cloud SQL connected to Cloud Run
- [ ] DATABASE_URL environment variable set correctly
- [ ] All other environment variables from Railway added
- [ ] Checked Cloud Run logs for errors
- [ ] Tested `/api/tokens` endpoint



