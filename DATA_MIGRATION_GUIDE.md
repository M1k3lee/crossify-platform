# 🚨 CRITICAL: Data Migration from Railway to Cloud SQL

## ⚠️ IMPORTANT: Do This BEFORE Railway Trial Expires!

Your Railway database contains all your tokens, transactions, and platform data. We need to migrate it to Cloud SQL **before Railway expires**.

## 📋 Quick Migration Steps

### Step 1: Get Railway Database URL

1. Go to your Railway project: https://railway.app
2. Click on your PostgreSQL database service
3. Go to **"Variables"** tab
4. Copy the `DATABASE_URL` value
5. It should look like: `postgresql://postgres:PASSWORD@HOST:PORT/railway`

### Step 2: Get Cloud SQL Connection String

1. Go to Cloud SQL: https://console.cloud.google.com/sql/instances/crossify-db?project=voltaic-wall-480423-u9
2. Click on **"Connections"** tab
3. Under **"Public IP"**, you'll see connection instructions
4. The connection string format is:
   ```
   postgresql://postgres:@@Mixmaster@20@34.142.XXX.XXX:5432/crossify-db
   ```
   (Replace XXX.XXX with your actual IP address)

### Step 3: Run Migration Script

**Option A: Using Environment Variables (Recommended)**

1. Create a `.env.migration` file in the project root:
   ```bash
   RAILWAY_DATABASE_URL=postgresql://postgres:PASSWORD@HOST:PORT/railway
   CLOUD_SQL_DATABASE_URL=postgresql://postgres:@@Mixmaster@20@34.142.XXX.XXX:5432/crossify-db
   ```

2. Run the migration:
   ```bash
   cd backend
   npm install  # Make sure pg is installed
   npx ts-node ../scripts/migrate-railway-to-cloudsql.ts
   ```

**Option B: Using Command Line**

```bash
RAILWAY_DATABASE_URL="postgresql://..." \
CLOUD_SQL_DATABASE_URL="postgresql://..." \
npx ts-node scripts/migrate-railway-to-cloudsql.ts
```

### Step 4: Verify Migration

After migration completes, verify the data:

1. Check token count:
   ```bash
   # Connect to Cloud SQL and run:
   SELECT COUNT(*) FROM tokens;
   ```

2. Test the API:
   ```bash
   curl https://crossify-backend-88917802850.europe-west1.run.app/api/tokens/marketplace
   ```

## 📊 What Gets Migrated

The script migrates all these tables:
- ✅ `tokens` - All your created tokens
- ✅ `token_deployments` - Chain deployments
- ✅ `transactions` - Transaction history
- ✅ `shared_liquidity_pools` - Liquidity pool data
- ✅ `platform_fees` - Fee tracking
- ✅ `fee_statistics` - Fee statistics
- ✅ `presale_config` - Presale configurations
- ✅ `presale_transactions` - Presale transactions
- ✅ `presale_allocations` - Presale allocations
- ✅ `presale_affiliates` - Presale affiliates
- ✅ `presale_referrals` - Presale referrals
- ✅ `liquidity_requests` - Liquidity requests
- ✅ `cfy_vesting_schedules` - CFY vesting
- ✅ `cfy_staking_pools` - CFY staking pools
- ✅ `cfy_staking_positions` - Staking positions
- ✅ `cfy_staking_rewards` - Staking rewards
- ✅ `token_custom_sections` - Custom token sections

## 🔒 Safety Features

- ✅ **Duplicate Protection**: Uses `ON CONFLICT DO NOTHING` to skip existing rows
- ✅ **Transaction Safety**: Each table is migrated independently
- ✅ **Error Handling**: Continues even if one table fails
- ✅ **Verification**: Shows row counts before and after

## ⚠️ Important Notes

1. **Timing**: Do this migration **BEFORE** Railway trial expires
2. **Backup**: The script doesn't delete Railway data (it's read-only)
3. **Duplicates**: If you run it twice, it won't create duplicates
4. **Cloud SQL IP**: Make sure Cloud SQL has a public IP enabled for migration

## 🆘 Troubleshooting

### "Connection refused" to Cloud SQL
- Enable public IP in Cloud SQL settings
- Add your IP to authorized networks (or use 0.0.0.0/0 temporarily)

### "Table doesn't exist"
- Make sure Cloud SQL schema is initialized (backend should do this on first run)
- Or run the backend once to create tables

### "Duplicate key error"
- This is normal - the script skips duplicates automatically

## ✅ After Migration

1. ✅ Verify all tokens appear in marketplace
2. ✅ Test creating a new token (to ensure Cloud SQL works)
3. ✅ Check transaction history
4. ✅ Verify presale data (if you have presales)

## 📞 Need Help?

If migration fails:
1. Check the error message
2. Verify both database URLs are correct
3. Make sure Cloud SQL is accessible from your IP
4. Check that tables exist in Cloud SQL (run backend once to initialize)

---

**🎯 Goal**: Migrate all data from Railway to Cloud SQL before Railway expires!



