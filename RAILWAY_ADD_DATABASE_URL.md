# Add DATABASE_URL to Railway Migration Service

## The Problem
The migration service needs `DATABASE_URL` to connect to Railway's database, but Railway isn't automatically providing it.

## Solution: Add DATABASE_URL Manually

### Step 1: Get DATABASE_URL from Postgres Service

1. In Railway, click on your **Postgres** service
2. Go to **Variables** tab
3. Find **`DATABASE_URL`** 
4. Click the **eye icon** 👁️ to reveal the value
5. Copy the entire value

It should look like:
```
postgresql://postgres:PASSWORD@postgres.railway.internal:5432/railway
```

### Step 2: Add to Migration Service

1. In Railway, click on **`migration-temp`** service
2. Go to **Variables** tab
3. Click **"+ New Variable"**
4. Add:
   - **Name:** `DATABASE_URL`
   - **Value:** (paste the value you copied from Postgres service)
5. **Save**

### Step 3: Redeploy

1. Railway should auto-redeploy, or
2. Click **"Deploy"** button manually
3. Watch the **Logs** tab

## Important Notes

- ✅ Use the **internal** DATABASE_URL (with `postgres.railway.internal`) - it works inside Railway's network
- ✅ The migration service is running INSIDE Railway, so internal URLs work fine
- ✅ You should already have `CLOUD_SQL_DATABASE_URL` set (the public one for Cloud SQL)

## After Adding DATABASE_URL

The migration should now:
1. ✅ Connect to Railway database (using internal URL)
2. ✅ Connect to Cloud SQL (using public URL)
3. ✅ Export and import all data
4. ✅ Show completion message

---

**Quick Fix**: Copy DATABASE_URL from Postgres service → Add to migration-temp service → Redeploy!



