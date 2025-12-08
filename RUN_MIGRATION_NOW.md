# 🚀 Run Migration NOW - Quick Guide

## Step 1: Get Your Railway DATABASE_URL

**You need to provide this from Railway:**

1. Go to: https://railway.app
2. Open your project
3. Click **PostgreSQL** service
4. Click **Variables** tab  
5. Copy the **DATABASE_URL** value

## Step 2: Get Cloud SQL Public IP

I'll help you get this, but you can also find it at:
https://console.cloud.google.com/sql/instances/crossify-db?project=voltaic-wall-480423-u9

## Step 3: Run This Command

Once you have both URLs, run:

```powershell
# Set Railway URL (replace with your actual URL)
$env:RAILWAY_DATABASE_URL = "postgresql://postgres:PASSWORD@HOST:PORT/railway"

# Set Cloud SQL URL (replace XXX.XXX with actual IP)
$env:CLOUD_SQL_DATABASE_URL = "postgresql://postgres:@@Mixmaster@20@34.142.XXX.XXX:5432/crossify-db"

# Run migration
cd backend
npx ts-node ../scripts/migrate-railway-to-cloudsql.ts
```

## Or Use the Helper Script

```powershell
.\scripts\run-migration.ps1
```

This will prompt you for the URLs interactively.

---

**⚠️ IMPORTANT**: Do this before Railway expires to save all your tokens!



