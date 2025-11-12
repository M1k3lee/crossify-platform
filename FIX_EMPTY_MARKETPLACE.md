# Fix Empty Marketplace - PostgreSQL Connection Issue

## 🔍 Problem
The marketplace is showing empty even though PostgreSQL was set up in Railway previously.

## 🎯 Root Cause
The most likely cause is that the `DATABASE_URL` environment variable is missing or not properly configured in Railway, causing the backend to fall back to SQLite (which is ephemeral and loses data on redeploy).

## ✅ Step-by-Step Fix

### Step 1: Verify DATABASE_URL in Railway

1. Go to [Railway Dashboard](https://railway.app)
2. Open your **crossify-platform** project
3. Click on your **backend service** (the main service)
4. Click on the **"Variables"** tab
5. Look for `DATABASE_URL` in the list

**What to check:**
- ✅ `DATABASE_URL` should exist
- ✅ Value should start with `postgresql://` or `postgres://`
- ✅ Should NOT be empty

### Step 2: If DATABASE_URL is Missing

If `DATABASE_URL` is missing, you need to add PostgreSQL to your Railway project:

1. In Railway dashboard, click **"+ New"** → **"Database"** → **"Add PostgreSQL"**
2. Railway will automatically:
   - Create a PostgreSQL database
   - Add `DATABASE_URL` to your backend service
   - Configure SSL and connection pooling

3. **Important:** After adding PostgreSQL, Railway will automatically redeploy your backend

### Step 3: Verify Database Connection

After Railway redeploys, check the logs:

1. Go to Railway → Your Service → **"Logs"** tab
2. Look for these messages:
   ```
   🗄️  Using PostgreSQL database
   📋 DATABASE_URL is set: Yes
   📋 Connecting to: postgresql://...
   ✅ PostgreSQL connection pool initialized
   ✅ PostgreSQL database schema initialized
   ✅ PostgreSQL database initialized successfully
   ```

**If you see:**
```
🗄️  Using SQLite database
ℹ️  DATABASE_URL not set or not a PostgreSQL URL
```
**Then `DATABASE_URL` is still missing or incorrect!**

### Step 4: Test Database Connection

Use the diagnostic endpoint to check database status:

```bash
curl https://crossify-platform-production.up.railway.app/api/health/database-diagnostic
```

This will show:
- Whether `DATABASE_URL` is set
- Database type (PostgreSQL vs SQLite)
- Connection status
- Token counts
- Sample tokens

### Step 5: Check Database Contents

If PostgreSQL is connected but marketplace is empty:

1. Check if tokens exist in database:
   ```bash
   curl https://crossify-platform-production.up.railway.app/api/health/tokens
   ```

2. If token count is 0, the database is empty. This could mean:
   - Data was lost (if you were using SQLite before)
   - Tokens need to be re-synced from blockchain

### Step 6: Re-sync Tokens from Blockchain

If the database is empty, tokens will be automatically re-discovered when:
- Users visit their dashboard (triggers blockchain sync)
- The startup sync service runs (runs on backend startup)

To manually trigger sync, visit:
```
https://your-frontend-url/tokens?creator=YOUR_WALLET_ADDRESS
```

## 🔧 Troubleshooting

### Issue: DATABASE_URL exists but backend still uses SQLite

**Check:**
1. `DATABASE_URL` must start with `postgres` (not `postgresql://` is fine, but must start with `postgres`)
2. No extra spaces or quotes in the value
3. Railway service was redeployed after adding `DATABASE_URL`

**Fix:**
1. Edit `DATABASE_URL` in Railway
2. Make sure it starts with `postgresql://` or `postgres://`
3. Save and wait for redeploy

### Issue: PostgreSQL connected but no tokens

**Possible causes:**
1. Database was reset (new PostgreSQL instance)
2. Tokens were never synced from blockchain
3. Tokens are marked as deleted or hidden

**Fix:**
1. Check token visibility:
   ```bash
   curl https://crossify-platform-production.up.railway.app/api/health/tokens
   ```
2. If `visibleTokens` is 0, check if tokens are hidden:
   - Look at `hiddenTokens` count
   - Check `sampleTokens` to see token status
3. Re-sync tokens from blockchain (see Step 6)

### Issue: Connection errors in logs

**Check Railway logs for:**
```
❌ Failed to connect to PostgreSQL: ...
❌ Failed to initialize PostgreSQL: ...
```

**Possible fixes:**
1. Verify PostgreSQL service is running in Railway
2. Check if `DATABASE_URL` is correct (Railway auto-generates it)
3. Ensure backend service is linked to PostgreSQL service in Railway

## 📊 Diagnostic Endpoints

Use these endpoints to diagnose the issue:

1. **Database Status:**
   ```
   GET /api/health/database
   ```
   Shows: Database type, connection status, token/deployment counts

2. **Token Details:**
   ```
   GET /api/health/tokens
   ```
   Shows: Total tokens, visible tokens, deleted tokens, hidden tokens, sample tokens

3. **Full Diagnostic:**
   ```
   GET /api/health/database-diagnostic
   ```
   Shows: Complete database connection info, environment variables, token counts, sample data

## ✅ Verification Checklist

After fixing, verify:

- [ ] `DATABASE_URL` exists in Railway Variables
- [ ] `DATABASE_URL` starts with `postgres`
- [ ] Backend logs show "Using PostgreSQL database"
- [ ] Backend logs show "PostgreSQL database initialized successfully"
- [ ] `/api/health/database-diagnostic` shows `"type": "PostgreSQL"`
- [ ] `/api/health/database-diagnostic` shows `"connected": true`
- [ ] Token count > 0 (if you had tokens before)
- [ ] Marketplace shows tokens

## 🚨 Important Notes

1. **SQLite is Ephemeral:** If you're using SQLite (no `DATABASE_URL`), all data is lost on every redeploy
2. **PostgreSQL is Persistent:** Data survives redeploys, restarts, and container updates
3. **Railway Auto-Links:** When you add PostgreSQL, Railway automatically links it to your backend service
4. **Auto-Redeploy:** Railway automatically redeploys when you add/modify environment variables

## 📝 Next Steps

1. Verify `DATABASE_URL` in Railway
2. Check backend logs for PostgreSQL connection
3. Use diagnostic endpoints to verify connection
4. Re-sync tokens if database is empty
5. Test marketplace to confirm tokens appear

---

**Need Help?** Check Railway logs or use the diagnostic endpoints to get detailed information about the database connection status.

