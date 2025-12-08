# Deploy Migration Service to Railway

## Option 1: Quick Deploy (Recommended)

Since we can't connect to Railway's internal database from outside, we'll deploy the migration script as a temporary Railway service.

### Step 1: Create Migration Service in Railway

1. Go to Railway: https://railway.app
2. In your project, click **"+ New"** → **"GitHub Repo"** or **"Empty Service"**
3. Name it: `migration-service` (temporary)

### Step 2: Add Environment Variables

In the migration service, add:
- `DATABASE_URL` - Railway will auto-provide this (it's the resolved value)
- `CLOUD_SQL_DATABASE_URL` = `postgresql://postgres:@@Mixmaster@20@34.147.140.176:5432/crossify-db`

### Step 3: Configure Service

1. Set **Root Directory** to: `backend` (if deploying from repo)
2. Set **Start Command** to: `npx ts-node scripts/railway-migration-service.ts`
3. Or create a simple `package.json` in a new directory with:
   ```json
   {
     "scripts": {
       "start": "node migration.js"
     },
     "dependencies": {
       "pg": "^8.16.3",
       "dotenv": "^16.3.1"
     }
   }
   ```

### Step 4: Deploy and Run

1. Railway will automatically deploy
2. Check the logs - it will export and import all data
3. Once complete, you can delete the migration service

## Option 2: Use Railway CLI

If you have Railway CLI installed:

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Run migration script
railway run npx ts-node scripts/migrate-railway-to-cloudsql.ts
```

## Option 3: Manual Export via Railway Dashboard

1. Go to Railway → PostgreSQL service
2. Check if there's a **"Backup"** or **"Export"** option
3. Export the database
4. Import to Cloud SQL manually

## Option 4: Use pg_dump (If Railway allows)

If Railway provides database access:

```bash
# Export from Railway
pg_dump $RAILWAY_DATABASE_URL > backup.sql

# Import to Cloud SQL
psql $CLOUD_SQL_DATABASE_URL < backup.sql
```

---

**Recommended**: Use Option 1 (deploy as temporary service) - it's the easiest and most reliable.



