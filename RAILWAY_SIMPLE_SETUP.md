# Simple Railway Migration Setup

## The Issue
Railway's root directory field might be showing branch options. Here's the simpler approach:

## Solution: Use Backend Directory

Since your migration files are already in the `backend` folder:

### Step 1: Set Root Directory
1. In Railway `migration-temp` service → **Settings** tab
2. Find **"Root Directory"** field
3. Enter: `backend`
   - (Just the word "backend", not a path)
4. Save

### Step 2: Set Start Command
1. Still in **Settings** tab
2. Find **"Start Command"** or **"Build Command"** section
3. Look for **"Start Command"** field
4. Enter: `node railway-migration.js`
5. Save

### Step 3: Add Environment Variable
1. Go to **Variables** tab
2. Click **"+ New Variable"**
3. Add:
   - **Name:** `CLOUD_SQL_DATABASE_URL`
   - **Value:** `postgresql://postgres:YOUR_PASSWORD@34.147.140.176:5432/crossify-db`
4. Save

### Step 4: Make Sure Files Are in GitHub
The files need to be committed and pushed to GitHub:

```bash
# In your local project
git add backend/railway-migration.js
git add backend/railway-migration-package.json
git commit -m "Add Railway migration script"
git push
```

### Step 5: Deploy
1. Click **"Deploy"** button
2. Railway will:
   - Pull from GitHub
   - Install dependencies from `backend/package.json`
   - Run `node railway-migration.js`
3. Watch the **Logs** tab for progress

## Alternative: If Root Directory Still Doesn't Work

If Railway won't accept "backend" as root directory:

1. **Create a simple `package.json` in the repo root:**
   ```json
   {
     "name": "migration",
     "scripts": {
       "start": "cd backend && node railway-migration.js"
     },
     "dependencies": {
       "pg": "^8.16.3",
       "dotenv": "^16.3.1"
     }
   }
   ```

2. **Set Root Directory to:** (leave empty or `/`)
3. **Set Start Command to:** `npm start`

---

**The key:** Railway needs the files to be in your GitHub repo, then it can access them!



