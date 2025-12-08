# Railway Variable Reference - The Right Way

## The Problem
Railway services don't automatically get `DATABASE_URL` from Postgres. You need to use Railway's **Variable Reference** feature.

## ✅ Solution: Use Variable Reference (Not Manual Copy)

### Step 1: Add Variable Reference in Migration Service

1. In Railway, click on **`migration-temp`** service
2. Go to **Variables** tab
3. Click **"+ New Variable"**
4. **IMPORTANT:** Look for **"Reference"** or **"Add Reference"** option
5. Select **Postgres** service
6. Select **DATABASE_URL** variable
7. Click **"Add"** or **"Save"**

This creates a **reference** to the Postgres DATABASE_URL, not a copy!

### Step 2: Verify

You should see `DATABASE_URL` in the variables list with an indicator that it's a reference (not a direct value).

### Step 3: Redeploy

Railway should auto-redeploy, or click **"Deploy"** manually.

## Alternative: If Reference Option Not Available

If Railway doesn't show a "Reference" option:

1. Go to **Postgres** service → **Variables** tab
2. Find **DATABASE_URL**
3. Click **eye icon** to reveal
4. Click **copy icon** to copy
5. Go to **migration-temp** service → **Variables** tab
6. Add **DATABASE_URL** with the copied value
7. **Save** and **Redeploy**

## Debug: Check if Variable is Set

After adding, check the logs. If you still see "DATABASE_URL not set", try:

1. Make sure variable name is exactly: `DATABASE_URL` (case-sensitive)
2. Make sure there are no extra spaces
3. Try redeploying manually
4. Check if Railway shows the variable in the Variables tab

---

**Key Point**: Railway's Variable Reference is better than copying because it automatically syncs!



