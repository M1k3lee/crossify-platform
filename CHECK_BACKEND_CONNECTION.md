# Check Backend Connection to PostgreSQL

## What We Know
✅ PostgreSQL is running and ready to accept connections
❓ Backend may not be connecting yet

## Steps to Verify

### 1. Check Backend Service Logs

In Railway, click on the **crossify-platform** service (not Postgres), then check the **Logs** tab.

Look for these messages:
```
🗄️  Using PostgreSQL database
✅ PostgreSQL connection pool initialized
✅ PostgreSQL database schema initialized
```

### 2. Check if DATABASE_URL is Set

1. Go to **crossify-platform** service
2. Click **Variables** tab
3. Look for `DATABASE_URL` environment variable
4. It should look like: `postgresql://postgres:password@hostname:5432/railway`

**If DATABASE_URL is NOT there:**
1. Go to **Postgres** service
2. Click **Variables** tab
3. Copy the `DATABASE_URL` value
4. Go back to **crossify-platform** service
5. Click **Variables** tab
6. Click **New Variable**
7. Name: `DATABASE_URL`
8. Value: (paste the copied value)
9. Click **Add**

### 3. Force Backend Redeploy

After setting DATABASE_URL:
1. Go to **crossify-platform** service
2. Click **Deployments** tab
3. Click the three dots (⋯) on the latest deployment
4. Click **Redeploy**

Or trigger a new deployment by:
- Making a small commit and push
- Or manually triggering a redeploy

### 4. Check Backend Logs After Redeploy

After redeploy, you should see:
```
🗄️  Using PostgreSQL database
✅ PostgreSQL connection pool initialized
✅ PostgreSQL database schema initialized
Database tables created/verified
✅ Database initialized
🚀 Starting startup token sync...
```

### 5. Verify Tables Are Created

1. Go to **Postgres** service
2. Click **Database** tab → **Data** sub-tab
3. You should see tables:
   - `tokens`
   - `token_deployments`
   - `transactions`
   - `shared_liquidity_pools`
   - `platform_fees`
   - `fee_statistics`

## Troubleshooting

### If backend logs show "Using SQLite database":
- DATABASE_URL is not set or not being detected
- Check environment variables in crossify-platform service
- Make sure DATABASE_URL starts with `postgresql://`

### If backend logs show connection errors:
- Check DATABASE_URL format is correct
- Verify PostgreSQL service is running (it is, based on logs)
- Check network connectivity between services

### If tables are not created:
- Check backend logs for schema creation errors
- Verify backend has permission to create tables
- Check for foreign key constraint errors

