# Update DATABASE_URL to Use Cloud SQL

## Current Issue
Your `DATABASE_URL` is set, but the backend is finding **0 tokens** instead of **33 tokens**. This means it's not connected to Cloud SQL.

## Solution

### Step 1: Check Cloud SQL Connection

1. **On the edit page**, click the **"Connections" tab** (next to "Variables & Secrets")
2. **Check if `crossify-db` is listed** under "Cloud SQL connections"
3. **If NOT listed:**
   - Click **"Add connection"**
   - Select `crossify-db`
   - This is required before DATABASE_URL will work!

### Step 2: Update DATABASE_URL

Go back to **"Variables & Secrets" tab** and update `DATABASE_URL`:

**Current (probably):**
```
postgresql://postgres:@@Mixmaster@20@/crossify-db
```

**Change to (Cloud SQL Unix socket format):**
```
postgresql://postgres:@@Mixmaster@20@/crossify-db?host=/cloudsql/voltaic-wall-480423-u9:europe-west1:crossify-db
```

**Important parts:**
- `postgres` = username
- `@@Mixmaster@20` = password
- `/crossify-db` = database name
- `?host=/cloudsql/voltaic-wall-480423-u9:europe-west1:crossify-db` = Cloud SQL connection

### Step 3: Deploy

1. **Click "Deploy"** (bottom of page)
2. **Wait 1-2 minutes** for deployment
3. **Check logs** - should see "33 tokens" instead of "0 tokens"

---

## Alternative: If Unix Socket Doesn't Work

If the `/cloudsql/` format doesn't work, try the public IP format:

```
postgresql://postgres:@@Mixmaster@20@34.147.140.176:5432/crossify-db?sslmode=require
```

But the Unix socket format is preferred and more secure.



