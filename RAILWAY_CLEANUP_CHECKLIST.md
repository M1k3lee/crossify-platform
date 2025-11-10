# Railway Project Cleanup Checklist

## Current Situation
- ✅ **passionate-spirit**: Active project with Postgres + crossify-platform
- ❌ **disciplined-stillness**: Old project still deploying (needs cleanup)

## Steps to Fix

### 1. Disconnect GitHub from Old Project
- [ ] Go to "disciplined-stillness" project
- [ ] Open the service
- [ ] Go to Settings → Source
- [ ] Click "Disconnect" from GitHub
- [ ] Confirm disconnection

### 2. Verify Active Project
- [ ] Go to "passionate-spirit" project
- [ ] Verify crossify-platform service is connected to GitHub
- [ ] Verify Postgres service exists
- [ ] Check recent deployments are happening here

### 3. Set DATABASE_URL
- [ ] Go to "passionate-spirit" → Postgres service → Variables
- [ ] Copy DATABASE_URL value
- [ ] Go to "passionate-spirit" → crossify-platform service → Variables
- [ ] Add DATABASE_URL variable with copied value
- [ ] Verify it's saved

### 4. Delete Old Project (Optional)
- [ ] Go to "disciplined-stillness" project
- [ ] Go to Settings → Danger Zone
- [ ] Click "Delete Project"
- [ ] Type project name to confirm
- [ ] Click "Delete"

### 5. Verify Setup
- [ ] Only "passionate-spirit" is deploying
- [ ] DATABASE_URL is set in crossify-platform service
- [ ] Backend logs show "Using PostgreSQL database"
- [ ] Tokens are syncing correctly

## After Cleanup

### Expected Logs
```
🗄️  Using PostgreSQL database
📋 DATABASE_URL is set: Yes
✅ PostgreSQL connection pool initialized
✅ PostgreSQL database schema initialized
✅ Startup sync complete: X tokens synced from Y chains
```

### Verification
- Check backend logs for PostgreSQL initialization
- Verify tokens are being synced
- Check database has tables created
- Verify marketplace shows tokens

## Notes
- Railway may auto-redeploy after adding DATABASE_URL
- Check logs after deployment to verify PostgreSQL is being used
- Old project can be kept for reference, but should be disconnected

