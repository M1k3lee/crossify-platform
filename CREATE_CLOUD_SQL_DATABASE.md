# Create Database in Cloud SQL

## The Problem
Cloud SQL instance exists, but the database "crossify-db" doesn't exist yet.

## Solution: Create the Database

### Step 1: Go to Databases Tab

1. **Go to Cloud SQL**: https://console.cloud.google.com/sql/instances/crossify-db/databases?project=voltaic-wall-480423-u9
2. **Click "Databases" tab** (in the left sidebar)
3. **You should see a list of databases** (probably empty or just "postgres")

### Step 2: Create New Database

1. **Click "+ Create database" button**
2. **Enter database name:** `crossify-db`
3. **Click "Create"**

### Step 3: Redeploy Migration

After creating the database:
1. **Go back to Railway**
2. **Redeploy the migration service**
3. **It should now connect successfully!**

## Alternative: Use Default "postgres" Database

If you want to use the default "postgres" database instead:

1. **Update CLOUD_SQL_DATABASE_URL in Railway:**
   - Change from: `postgresql://postgres:@@Mixmaster@20@34.147.140.176:5432/crossify-db`
   - To: `postgresql://postgres:@@Mixmaster@20@34.147.140.176:5432/postgres`

2. **Redeploy migration**

---

**Recommended**: Create the `crossify-db` database (keeps things organized)



