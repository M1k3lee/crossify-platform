# 🚀 Quick Railway Migration - 3 Steps

## The Problem
Railway uses internal networking (`postgres.railway.internal`) which we can't access from outside. We need to run the migration **inside Railway**.

## ✅ Solution: Deploy Migration as Railway Service

### Step 1: Create New Service in Railway (2 minutes)

1. Go to: https://railway.app
2. Open your **crossify-platform** project
3. Click **"+ New"** → **"Empty Service"**
4. Name it: `migration-temp` (we'll delete it after)

### Step 2: Add Files to Service (1 minute)

In the new service, Railway will create a directory. Add these files:

**File 1: `railway-migration.js`** (copy from `backend/railway-migration.js`)

**File 2: `package.json`** (copy from `backend/railway-migration-package.json`)

**File 3: `.env` or set environment variables:**
```
CLOUD_SQL_DATABASE_URL=postgresql://postgres:@@Mixmaster@20@34.147.140.176:5432/crossify-db
```

**Note:** Railway will automatically provide `DATABASE_URL` to the service!

### Step 3: Deploy and Run (1 minute)

1. Railway will auto-detect `package.json` and install dependencies
2. It will run `npm start` which executes the migration
3. Check the **Logs** tab to see progress
4. Wait for "✅ Migration completed!"

### Step 4: Clean Up

Once migration is complete:
1. Delete the `migration-temp` service
2. Done! ✅

## Alternative: Use Railway CLI

If you have Railway CLI:

```bash
railway login
railway link
railway run node backend/railway-migration.js
```

## What Gets Migrated

✅ All tokens
✅ Token deployments  
✅ Transactions
✅ Presale data
✅ Staking/vesting data
✅ Everything else

---

**Total Time: ~5 minutes**

The migration script will:
1. Connect to Railway database (using internal network)
2. Export all data
3. Connect to Cloud SQL (using public IP)
4. Import all data
5. Show summary



