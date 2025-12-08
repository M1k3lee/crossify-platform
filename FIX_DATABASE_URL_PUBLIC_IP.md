# Fix DATABASE_URL - Use Public IP Format

## The Problem
The Unix socket format is causing `ERR_INVALID_URL` error. The URL parser is having trouble with the `@/crossify-db?host=/cloudsql/...` format.

## Solution: Use Public IP Format

The public IP format is simpler and more reliable:

### Update DATABASE_URL

1. **Go to Cloud Run** → `crossify-backend` → **"Edit & deploy new revision"**
2. **Go to "Variables & Secrets" tab**
3. **Find `DATABASE_URL`**
4. **Change it to (Public IP format with URL-encoded password):**
   ```
   postgresql://postgres:%40%40Mixmaster%4020@34.147.140.176:5432/crossify-db?sslmode=require
   ```

   **Breakdown:**
   - `postgres` = username
   - `%40%40Mixmaster%4020` = URL-encoded password (`@@Mixmaster@20`)
   - `34.147.140.176` = Cloud SQL public IP
   - `5432` = PostgreSQL port
   - `crossify-db` = database name
   - `?sslmode=require` = Required SSL mode

5. **Click "Deploy"**

## Why This Works

- Public IP format is simpler: `postgresql://user:pass@host:port/db`
- No Unix socket path parsing issues
- Direct connection to Cloud SQL
- SSL is required and properly configured

## After Deployment

Check logs for:
- `🗄️ Using PostgreSQL database` ✅
- `✅ PostgreSQL database initialized successfully` ✅
- `🔄 Syncing prices for 33 tokens...` ✅ (not 0!)

Then test: https://crossify-backend-88917802850.europe-west1.run.app/api/tokens



