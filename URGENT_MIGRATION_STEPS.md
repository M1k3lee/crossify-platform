# 🚨 URGENT: Data Migration Steps

## ⚠️ CRITICAL: Do This NOW Before Railway Expires!

Your tokens and all platform data are in Railway's database. We need to migrate them to Cloud SQL **immediately**.

## Quick Steps (5 minutes)

### Step 1: Get Railway DATABASE_URL (2 minutes)

1. Go to: https://railway.app
2. Log in to your account
3. Open your **crossify-platform** project
4. Click on the **PostgreSQL** service (database icon)
5. Click on **"Variables"** tab
6. Find **`DATABASE_URL`** in the list
7. Click the **eye icon** 👁️ to reveal the value
8. Click **copy icon** 📋 to copy it
9. It should look like: `postgresql://postgres:password@hostname:5432/railway`

### Step 2: Get Cloud SQL Public IP (1 minute)

1. Go to: https://console.cloud.google.com/sql/instances/crossify-db?project=voltaic-wall-480423-u9
2. Click on **"Connections"** tab
3. Under **"Public IP"**, you'll see an IP address like: `34.142.XXX.XXX`
4. Copy this IP address

### Step 3: Run Migration (2 minutes)

**Option A: Using PowerShell Script (Easiest)**

```powershell
# Run the setup script - it will prompt you for the URLs
.\scripts\run-migration.ps1
```

**Option B: Manual (If script doesn't work)**

```powershell
# Set environment variables
$env:RAILWAY_DATABASE_URL = "postgresql://postgres:password@hostname:5432/railway"
$env:CLOUD_SQL_DATABASE_URL = "postgresql://postgres:@@Mixmaster@20@34.142.XXX.XXX:5432/crossify-db"

# Run migration
cd backend
npx ts-node ../scripts/migrate-railway-to-cloudsql.ts
```

**Replace:**
- `postgresql://postgres:password@hostname:5432/railway` with your actual Railway DATABASE_URL
- `34.142.XXX.XXX` with your actual Cloud SQL public IP

## What Gets Migrated

✅ All tokens you've created
✅ Token deployments (blockchain addresses)
✅ Transaction history
✅ Presale data
✅ Staking/vesting data
✅ Platform fees
✅ Everything else

## Verification

After migration, verify your data:

```bash
# Test the API
curl https://crossify-backend-88917802850.europe-west1.run.app/api/tokens/marketplace
```

You should see your tokens in the response!

## ⚠️ Important Notes

1. **Timing**: Do this **BEFORE** Railway trial expires
2. **Safety**: The script is read-only on Railway (doesn't delete anything)
3. **Duplicates**: Safe to run multiple times (skips duplicates)
4. **Cloud SQL IP**: Make sure Cloud SQL has public IP enabled

## 🆘 Troubleshooting

### "Connection refused" to Cloud SQL
- Enable public IP in Cloud SQL settings
- Add your IP to authorized networks (or use 0.0.0.0/0 temporarily)

### "Table doesn't exist"
- Make sure Cloud SQL schema is initialized
- The backend should create tables on first run

### "Cannot connect to Railway"
- Railway trial might have expired
- Check if Railway service is still running
- Try accessing Railway dashboard

---

**🎯 Goal**: Migrate all data from Railway to Cloud SQL **TODAY**!



