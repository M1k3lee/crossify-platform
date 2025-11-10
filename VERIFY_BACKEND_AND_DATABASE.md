# Verify Backend and Database

## Step 1: Wait for Deployment to Complete

The Railway deployment is currently "INITIALIZING". Wait for it to complete (should take 2-3 minutes).

## Step 2: Check Backend Health

Test if the backend is responding:

1. **Health Check:**
   ```
   https://crossify-platform-production.up.railway.app/api/health
   ```
   Should return: `{"status":"ok","timestamp":"..."}`

2. **Database Health:**
   ```
   https://crossify-platform-production.up.railway.app/api/health/database
   ```
   Should return database status and token count

## Step 3: Test Marketplace Endpoint

Test if the marketplace endpoint returns tokens:

```
https://crossify-platform-production.up.railway.app/api/tokens/marketplace
```

**Expected Response:**
- If tokens exist: `{"tokens":[...], "total": X}`
- If no tokens: `{"tokens":[], "total": 0}`

## Step 4: Test Token Status Endpoint

Test if a specific token exists:

```
https://crossify-platform-production.up.railway.app/api/tokens/a5f63a2d-364c-4450-b84e-4a6dd5abdb98/status
```

**Expected Response:**
- If token exists: Token data with deployments
- If token doesn't exist: `{"error": "Token not found"}` or 404

## Step 5: Check Railway Logs

After deployment completes, check Railway logs for:

1. **Database Connection:**
   ```
   ✅ PostgreSQL database initialized successfully
   ```

2. **Token Sync:**
   ```
   ✅ Startup sync complete: X tokens synced from Y chains
   📊 Marketplace: Total tokens in database (not deleted): X
   ```

3. **Marketplace Query:**
   ```
   📊 Marketplace: Found X tokens after query
   ```

## Step 6: Check Browser Console

1. Open https://www.crossify.io
2. Press F12 → Console
3. Look for:
   - `🔗 API Base URL: https://crossify-platform-production.up.railway.app/api`
   - Any API errors
   - Network requests to the backend

## Step 7: Check Network Requests

1. Open https://www.crossify.io
2. Press F12 → Network tab
3. Visit the marketplace page
4. Look for requests to:
   - `/api/tokens/marketplace`
   - Check the response - does it contain tokens?

## Troubleshooting

### If backend returns 0 tokens:

1. Check Railway logs for sync errors
2. Verify tokens exist in PostgreSQL:
   - Go to Railway → Postgres service → Database tab → Data
   - Check if `tokens` table has rows
3. Check if tokens are marked as deleted:
   - Check `deleted` column in tokens table
   - Check `visible_in_marketplace` column

### If backend returns tokens but frontend shows "no tokens found":

1. Check browser console for errors
2. Check network requests for API errors
3. Verify frontend is using correct API URL
4. Clear browser cache and hard refresh

### If token detail page shows 404:

1. Check if token ID exists in database
2. Verify token wasn't deleted
3. Check backend logs for 404 errors
4. Test the API endpoint directly

## Next Steps

After deployment completes:
1. Test all endpoints directly in browser
2. Check Railway logs for any errors
3. Verify tokens are in database
4. Test frontend again

