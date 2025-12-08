# Check Database Connection - Still Finding 0 Tokens

## Current Status
- ✅ Backend is running
- ✅ Cloud SQL is connected in Connections tab
- ❌ Backend finding **0 tokens** (should be 33)
- ⚠️ Backend trying to sync from blockchain (thinks database is empty)

## What to Check

### 1. Look for Database Connection Messages

In the Cloud Run logs, look for:
- `✅ PostgreSQL database initialized successfully` - Should see this
- `🗄️ Using PostgreSQL database` - Should see this
- `❌ Failed to initialize PostgreSQL` - If you see this, connection failed
- `🗄️ Using SQLite database` - If you see this, DATABASE_URL isn't working

### 2. Check DATABASE_URL Format

The DATABASE_URL should be:
```
postgresql://postgres:YOUR_PASSWORD@/crossify-db?host=/cloudsql/voltaic-wall-480423-u9:europe-west2:crossify-db
```

**Common mistakes:**
- Missing `?host=/cloudsql/...` part
- Wrong region (should be `europe-west2`)
- Wrong database name (should be `crossify-db`)
- Password has special characters that need encoding

### 3. Check for Connection Errors

Look in logs for:
- `ECONNREFUSED`
- `Connection timeout`
- `Authentication failed`
- `Database does not exist`
- `relation "tokens" does not exist`

### 4. Verify Database Has Data

You can verify Cloud SQL has the data:
1. Go to Cloud SQL: https://console.cloud.google.com/sql/instances/crossify-db?project=voltaic-wall-480423-u9
2. Click "Databases" tab
3. Click on `crossify-db` database
4. Use Cloud SQL Studio or connect via Cloud Shell to verify tokens exist

---

## Quick Fix: Try Public IP Format

If Unix socket doesn't work, try the public IP format in DATABASE_URL:

```
postgresql://postgres:YOUR_PASSWORD@34.147.140.176:5432/crossify-db?sslmode=require
```

This bypasses the Unix socket and connects directly via public IP.

---

## Next Steps

1. **Check logs** for database initialization messages
2. **Verify DATABASE_URL** is exactly as shown above
3. **Try public IP format** if Unix socket doesn't work
4. **Share the logs** showing database connection messages



