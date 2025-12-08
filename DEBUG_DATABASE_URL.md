# Debug DATABASE_URL - Backend Not Recognizing It

## The Problem
Logs show:
- `🗄️ Using SQLite database`
- `ℹ️ DATABASE_URL not set or not a PostgreSQL URL`

This means the backend's `isPostgreSQLConfigured()` function is returning `false`.

## The Check
The backend checks: `process.env.DATABASE_URL.startsWith('postgres')`

So `DATABASE_URL` must start with `postgres` (or `postgresql`).

## Possible Issues

1. **Environment variable not set correctly in Cloud Run**
2. **Whitespace or hidden characters**
3. **Variable name mismatch**
4. **The value isn't being passed to the container**

## Solution: Verify and Fix

### Step 1: Check Current DATABASE_URL Value

1. **Go to Cloud Run** → `crossify-backend` → **"Edit & deploy new revision"**
2. **Go to "Variables & Secrets" tab**
3. **Find `DATABASE_URL`** - what does it show?
4. **Check for:**
   - Does it start with `postgresql://`?
   - Any leading/trailing spaces?
   - Any quotes around it? (shouldn't have quotes)
   - Is the variable name exactly `DATABASE_URL` (case-sensitive)?

### Step 2: Set It Correctly

Make sure `DATABASE_URL` is set to exactly this (no quotes, no spaces):

```
postgresql://postgres:%40%40Mixmaster%4020@34.147.140.176:5432/crossify-db?sslmode=require
```

**Important:**
- No quotes around the value
- No leading/trailing spaces
- Variable name is exactly `DATABASE_URL` (all caps)
- Starts with `postgresql://`

### Step 3: Add Debug Logging (Temporary)

If it still doesn't work, we can add a debug log to see what the backend is actually receiving. But first, let's make sure the environment variable is set correctly in Cloud Run.

---

## Quick Test

After updating, check logs for:
- `🗄️ Using PostgreSQL database` ✅ (not SQLite!)
- `✅ PostgreSQL database initialized successfully` ✅

If you still see "Using SQLite database", the environment variable isn't being read correctly.



