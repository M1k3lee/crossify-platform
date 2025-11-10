# Verify PostgreSQL Setup on Railway

## Step 1: Verify DATABASE_URL is Set

1. In Railway, click on the **crossify-platform** service (not Postgres)
2. Go to the **Variables** tab
3. Verify that `DATABASE_URL` environment variable exists
4. It should look like: `postgresql://postgres:password@hostname:5432/railway`

## Step 2: Check Backend Logs

1. Go to the **crossify-platform** service
2. Click on the **Logs** tab
3. Look for these log messages:
   ```
   🗄️  Using PostgreSQL database
   ✅ PostgreSQL connection pool initialized
   ✅ PostgreSQL database schema initialized
   ```

## Step 3: Verify Tables Created

1. Go to the **Postgres** service
2. Click on the **Database** tab → **Data** sub-tab
3. You should see tables created:
   - `tokens`
   - `token_deployments`
   - `transactions`
   - `shared_liquidity_pools`
   - `platform_fees`
   - `fee_statistics`

## Step 4: Check Token Sync

1. In the **crossify-platform** service logs
2. Look for token sync messages:
   ```
   🚀 Starting startup token sync...
   ✅ Found X TokenCreated events total
   ✅ Synced X new tokens from Y chains
   ```

## Troubleshooting

### If DATABASE_URL is not set:
1. Go to **Postgres** service → **Variables** tab
2. Copy the `DATABASE_URL` value
3. Go to **crossify-platform** service → **Variables** tab
4. Add `DATABASE_URL` variable with the copied value

### If tables are not created:
1. Check backend logs for errors
2. Verify DATABASE_URL is correct
3. Check PostgreSQL connection in logs
4. Verify backend service has permission to connect

### If sync is not working:
1. Check factory addresses are set in environment variables
2. Verify RPC URLs are accessible
3. Check for blockchain connection errors in logs

