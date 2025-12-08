# Fix Database Connection - Backend Finding 0 Tokens

## The Problem
Your backend is running but finding **0 tokens** (should be 33). This means it's either:
1. Not connected to Cloud SQL
2. Connected to the wrong database
3. DATABASE_URL is pointing to Railway or SQLite

## Solution: Connect Cloud SQL & Update DATABASE_URL

### Step 1: Check Current Configuration

1. **Go to Cloud Run**: https://console.cloud.google.com/run/detail/europe-west1/crossify-backend?project=voltaic-wall-480423-u9
2. **Click "Edit & deploy new revision"** (pencil icon)
3. **Check "Connections" tab** - Is `crossify-db` listed?
4. **Check "Variables & Secrets" tab** - What is `DATABASE_URL` set to?

### Step 2: Connect Cloud SQL (If Not Connected)

1. **In the edit page**, go to **"Connections" tab**
2. **Under "Cloud SQL connections"**, click **"Add connection"**
3. **Select `crossify-db`**
4. **Click "Deploy"** (wait for deployment to complete)

### Step 3: Update DATABASE_URL

After Cloud SQL is connected:

1. **Go back to edit page** → **"Variables & Secrets" tab**
2. **Find `DATABASE_URL`** (or add it if missing)
3. **Update to use Cloud SQL connection:**
   ```
   postgresql://postgres:@@Mixmaster@20@/crossify-db?host=/cloudsql/voltaic-wall-480423-u9:europe-west1:crossify-db
   ```
   
   **Important:** 
   - Use `/cloudsql/` format (Unix socket) - this is the secure way
   - The connection name is: `voltaic-wall-480423-u9:europe-west1:crossify-db`
   - Database name: `crossify-db`
   - User: `postgres`
   - Password: `@@Mixmaster@20`

4. **Click "Deploy"**

### Step 4: Verify Connection

After deployment (wait 1-2 minutes):

1. **Check logs** - Look for:
   - `✅ PostgreSQL database initialized successfully`
   - `✅ Database initialized`
   - `🔄 Syncing prices for 33 tokens...` (should show 33, not 0)

2. **Test endpoint**: https://crossify-backend-88917802850.europe-west1.run.app/api/tokens
   - Should return JSON with your 33 tokens
   - Should NOT return 404

### Alternative: Use Public IP (If Unix Socket Doesn't Work)

If the `/cloudsql/` format doesn't work, try the public IP format:

```
postgresql://postgres:@@Mixmaster@20@34.147.140.176:5432/crossify-db?sslmode=require
```

But the Unix socket format (`/cloudsql/`) is preferred and more secure.

---

## Quick Checklist

- [ ] Cloud SQL `crossify-db` connected in Cloud Run "Connections" tab
- [ ] DATABASE_URL updated to use Cloud SQL connection string
- [ ] All environment variables from Railway copied to Cloud Run
- [ ] Deployment completed successfully
- [ ] Logs show "33 tokens" instead of "0 tokens"
- [ ] `/api/tokens` endpoint returns data (not 404)



