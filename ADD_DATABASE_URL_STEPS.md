# Add DATABASE_URL - Step by Step

## Current Issue
The migration script can't find `DATABASE_URL`. You need to add it to the Railway service.

## ✅ Step-by-Step Instructions

### Method 1: Variable Reference (Best - if available)

1. **In Railway, click `migration-temp` service**
2. **Go to "Variables" tab**
3. **Click "+ New Variable"**
4. **Look for "Reference" or "Add Reference" button/link**
5. **Select "Postgres" service**
6. **Select "DATABASE_URL"**
7. **Click "Add"**

### Method 2: Manual Copy (If Reference not available)

1. **Go to Postgres service → Variables tab**
2. **Find `DATABASE_URL`**
3. **Click 👁️ (eye icon) to reveal the value**
4. **Click 📋 (copy icon) to copy**
5. **Go to `migration-temp` service → Variables tab**
6. **Click "+ New Variable"**
7. **Enter:**
   - **Name:** `DATABASE_URL`
   - **Value:** (paste the copied value)
8. **Click "Add" or "Save"**

### Verify It's Added

After adding, you should see:
- `DATABASE_URL` in the variables list
- `CLOUD_SQL_DATABASE_URL` in the variables list (you should already have this)

### Redeploy

1. Railway should auto-redeploy
2. Or click **"Deploy"** button manually
3. Check **Logs** tab

### What You Should See in Logs

After adding DATABASE_URL and redeploying, logs should show:
```
🔍 Environment Check:
   DATABASE_URL: ✅ Set (postgresql://postgres:...)
   CLOUD_SQL_DATABASE_URL: ✅ Set
✅ Connected to Railway database
✅ Connected to Cloud SQL database
```

## Troubleshooting

**If still showing "not set":**
- ✅ Check variable name is exactly `DATABASE_URL` (case-sensitive, no spaces)
- ✅ Make sure you saved the variable
- ✅ Try manually redeploying
- ✅ Check the Variables tab shows the variable

---

**The key:** Railway needs to know which database to connect to. Add DATABASE_URL and it will work!



