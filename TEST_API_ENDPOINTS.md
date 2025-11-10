# Test API Endpoints Directly

## Backend URL
```
https://crossify-platform-production.up.railway.app
```

## Test These Endpoints

### 1. Health Check
```
https://crossify-platform-production.up.railway.app/api/health
```
**Expected:** `{"status":"ok","timestamp":"..."}`

### 2. Database Health
```
https://crossify-platform-production.up.railway.app/api/health/database
```
**Expected:** Database status with token and deployment counts

### 3. Token Health (New Diagnostic Endpoint)
```
https://crossify-platform-production.up.railway.app/api/health/tokens
```
**Expected:** Token counts and sample tokens

### 4. Marketplace
```
https://crossify-platform-production.up.railway.app/api/tokens/marketplace
```
**Expected:** `{"tokens":[...], "count": X}`

### 5. Token Status
```
https://crossify-platform-production.up.railway.app/api/tokens/a5f63a2d-364c-4450-b84e-4a6dd5abdb98/status
```
**Expected:** Token data or 404 error

## What to Look For

### If `/api/health/tokens` shows 0 tokens:
- Tokens aren't in the database
- Check Railway logs for sync errors
- Verify PostgreSQL is working

### If `/api/health/tokens` shows tokens but `/api/tokens/marketplace` returns empty:
- Marketplace query is failing
- Check Railway logs for query errors
- May be a GROUP_CONCAT/STRING_AGG issue

### If `/api/tokens/marketplace` returns tokens but frontend shows "no tokens found":
- Frontend caching issue
- Frontend using wrong API URL
- CORS issue
- Network request failing

## Next Steps

1. **Test all endpoints** in your browser
2. **Check Railway logs** after making requests
3. **Share the results** so we can diagnose the issue

