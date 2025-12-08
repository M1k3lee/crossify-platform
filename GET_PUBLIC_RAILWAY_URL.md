# Get Public Railway DATABASE_URL

## ⚠️ Problem

The DATABASE_URL you provided uses `postgres.railway.internal` which only works **inside Railway's network**. We need the **public** connection URL.

## ✅ Solution: Get Public DATABASE_URL

### Option 1: Check for DATABASE_PUBLIC_URL

1. Go to Railway: https://railway.app
2. Open your project
3. Click on **PostgreSQL** service
4. Click on **Variables** tab
5. Look for **`DATABASE_PUBLIC_URL`** (not just DATABASE_URL)
6. Copy that value - it should have a real IP or domain name

### Option 2: Enable Public Networking

If `DATABASE_PUBLIC_URL` doesn't exist:

1. In Railway, click on your **PostgreSQL** service
2. Go to **Settings** tab
3. Look for **"Public Networking"** or **"Public Access"**
4. Enable it if available
5. Railway will generate a public URL

### Option 3: Use Railway's Public Proxy

Some Railway databases have a public proxy. Check:
- Railway dashboard → PostgreSQL → Settings
- Look for "Public Proxy" or "External Access"

## What the Public URL Should Look Like

✅ **Good (Public):**
```
postgresql://postgres:password@containers-us-west-XXX.railway.app:5432/railway
postgresql://postgres:password@34.XXX.XXX.XXX:5432/railway
```

❌ **Bad (Internal only):**
```
postgresql://postgres:password@postgres.railway.internal:5432/railway
```

## Once You Have the Public URL

Run the migration again with the public URL:

```powershell
$env:RAILWAY_DATABASE_URL = "postgresql://postgres:PASSWORD@PUBLIC_HOST:5432/railway"
$env:CLOUD_SQL_DATABASE_URL = "postgresql://postgres:YOUR_PASSWORD@34.147.140.176:5432/crossify-db"
cd backend
npx ts-node scripts/migrate-railway-to-cloudsql.ts
```

---

**Note:** If Railway doesn't provide public access, we may need to:
1. Use Railway's CLI to export data
2. Or wait until we can access Railway from within their network
3. Or use a Railway service to run the migration script



