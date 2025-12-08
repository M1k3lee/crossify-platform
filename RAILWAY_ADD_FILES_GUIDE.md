# How to Add Files to Railway Service

## Option 1: Connect to GitHub Repo (Easiest)

Since you already have your code on GitHub:

1. **In Railway, click on `migration-temp` service**
2. **Go to "Settings" tab**
3. **Find "Source" or "Connect Repo" section**
4. **Click "Connect GitHub Repo"**
5. **Select your `crossify-platform` repository**
6. **Set "Root Directory" to: `backend`**
7. **Set "Start Command" to: `node railway-migration.js`**

Railway will automatically:
- Pull your code from GitHub
- Install dependencies from `package.json`
- Run the migration script

## Option 2: Use Railway's Web Editor

If Railway has a code editor:

1. **Click on `migration-temp` service**
2. **Look for "Code" or "Files" tab**
3. **Click "Add File" or use the editor**
4. **Create these files:**

### File 1: `railway-migration.js`
Copy the entire content from `backend/railway-migration.js`

### File 2: `package.json`
```json
{
  "name": "railway-migration",
  "version": "1.0.0",
  "description": "One-time migration service",
  "main": "railway-migration.js",
  "scripts": {
    "start": "node railway-migration.js"
  },
  "dependencies": {
    "pg": "^8.16.3",
    "dotenv": "^16.3.1"
  }
}
```

## Option 3: Use Railway CLI

If you have Railway CLI installed:

```bash
# Install Railway CLI (if not installed)
npm i -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Navigate to service directory
cd backend

# Deploy files
railway up
```

## Step 3: Add Environment Variable

**Important:** After adding files, add the Cloud SQL URL:

1. **In Railway, click on `migration-temp` service**
2. **Go to "Variables" tab**
3. **Click "+ New Variable"**
4. **Add:**
   - **Name:** `CLOUD_SQL_DATABASE_URL`
   - **Value:** `postgresql://postgres:YOUR_PASSWORD@34.147.140.176:5432/crossify-db`
5. **Save**

**Note:** Railway will automatically provide `DATABASE_URL` - you don't need to add it!

## Step 4: Deploy

1. **Click "Deploy" button** (top right, or in the service)
2. **Watch the logs** - you'll see the migration progress
3. **Wait for "✅ Migration completed!"**

## Quick Checklist

- [ ] Files added to service (via GitHub or web editor)
- [ ] `package.json` with dependencies
- [ ] `railway-migration.js` script
- [ ] `CLOUD_SQL_DATABASE_URL` environment variable set
- [ ] Service deployed
- [ ] Migration completed in logs

---

**Recommended:** Use Option 1 (Connect to GitHub) - it's the easiest and most reliable!



