# Add DATABASE_URL to crossify-platform Service

## Option 1: Use Variable Reference (Recommended)

Railway's Variable Reference feature automatically shares the DATABASE_URL from the Postgres service to your backend service.

### Steps:

1. **Go to crossify-platform service:**
   - Click on **crossify-platform** service in Railway
   - Click on **Variables** tab

2. **Add Variable Reference:**
   - Click **"+ New Variable"** button
   - Look for **"Reference"** or **"Add Reference"** option
   - Select **Postgres** service
   - Select **DATABASE_URL** variable
   - Click **"Add"** or **"Save"**

3. **Verify:**
   - You should see `DATABASE_URL` in the variables list
   - It should show it's a reference to the Postgres service
   - The value will automatically update if Postgres DATABASE_URL changes

## Option 2: Copy DATABASE_URL Manually

If Variable Reference is not available:

### Steps:

1. **Get DATABASE_URL from Postgres:**
   - Go to **Postgres** service → **Variables** tab
   - Find **DATABASE_URL** variable
   - Click the **eye icon** (👁️) to reveal the value
   - Click the **copy icon** (📋) to copy the value
   - The value should look like: `postgresql://postgres:password@hostname:port/railway`

2. **Add to crossify-platform:**
   - Go to **crossify-platform** service → **Variables** tab
   - Click **"+ New Variable"** button
   - Enter:
     - **Name:** `DATABASE_URL`
     - **Value:** (paste the copied value)
   - Click **"Add"** or **"Save"**

3. **Verify:**
   - `DATABASE_URL` should appear in the variables list
   - The value should be set (may be masked for security)

## Important Notes

### Use DATABASE_URL, Not DATABASE_PUBLIC_URL

- ✅ **DATABASE_URL**: Internal connection (use this)
- ❌ **DATABASE_PUBLIC_URL**: External/public connection (don't use this for internal services)

### Why Variable Reference is Better

- Automatically syncs if Postgres URL changes
- More secure (no manual copying)
- Railway's recommended approach
- Easier to manage

## After Adding DATABASE_URL

1. **Redeploy:**
   - Railway should automatically redeploy the service
   - Or manually trigger a redeploy if needed

2. **Verify in Logs:**
   - Check backend logs for:
     ```
     🗄️  Using PostgreSQL database
     📋 DATABASE_URL is set: Yes
     ✅ PostgreSQL connection pool initialized
     ✅ PostgreSQL database schema initialized
     ```

3. **Check Database:**
   - Go to **Postgres** service → **Database** tab → **Data**
   - Verify tables are created: `tokens`, `token_deployments`, etc.

## Troubleshooting

### If DATABASE_URL is not visible:
- Click the eye icon (👁️) to reveal masked values
- Check that you're looking at the Postgres service Variables tab

### If Variable Reference is not available:
- Use manual copy method (Option 2)
- Make sure you copy the exact value (it's case-sensitive)

### If backend still uses SQLite:
- Verify DATABASE_URL is set in crossify-platform service
- Check that the value starts with `postgresql://`
- Verify the service has been redeployed
- Check backend logs for database initialization messages

