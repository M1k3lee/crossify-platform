# Fix Duplicate Railway Project Issue

## Problem
- **passionate-spirit** project: Has Postgres + crossify-platform (ACTIVE)
- **disciplined-stillness** project: Still receiving deployments (DUPLICATE/OLD)

## Root Cause
The "disciplined-stillness" project is still connected to your GitHub repository, so it's automatically deploying on every push.

## Solution: Disconnect GitHub from Old Project

### Step 1: Check GitHub Connection

1. Go to **disciplined-stillness** project in Railway
2. Click on the service (the one that's deploying)
3. Go to **Settings** tab
4. Look for **"Source"** or **"GitHub"** section
5. Check if it's connected to your GitHub repository

### Step 2: Disconnect GitHub (Option 1 - Recommended)

1. In **disciplined-stillness** project → Service → **Settings**
2. Find **"Source"** or **"GitHub Repository"** section
3. Click **"Disconnect"** or **"Remove"** GitHub connection
4. Confirm the disconnection

This will stop automatic deployments but keep the project (in case you need it later).

### Step 3: Delete Project (Option 2 - If Not Needed)

If you're sure you don't need "disciplined-stillness":

1. Go to **disciplined-stillness** project
2. Click **Settings** tab
3. Scroll down to **"Danger Zone"**
4. Click **"Delete Project"**
5. Type the project name to confirm
6. Click **"Delete"**

⚠️ **Warning:** This will permanently delete the project and all its services. Make sure you don't need it first!

### Step 4: Verify Active Project

1. Go to **passionate-spirit** project
2. Click on **crossify-platform** service
3. Go to **Settings** tab
4. Verify it's connected to your GitHub repository
5. Verify it has **Postgres** service linked

### Step 5: Set DATABASE_URL in Active Project

Now that we know "passionate-spirit" is the active one:

1. Go to **passionate-spirit** project
2. Click on **crossify-platform** service
3. Go to **Variables** tab
4. Add **DATABASE_URL** variable:
   - Get the value from **Postgres** service → **Variables** tab
   - Copy the `DATABASE_URL` value
   - Add it to **crossify-platform** service → **Variables** tab

## How to Prevent This in the Future

### Check GitHub Connections
1. In Railway, go to **Settings** → **GitHub**
2. Review all connected repositories
3. Remove any unwanted connections

### Use Project Naming
- Use clear naming: `crossify-platform-prod`, `crossify-platform-staging`
- Add descriptions to projects
- Use tags/labels to organize

## Verification Checklist

After fixing:
- [ ] Only "passionate-spirit" is connected to GitHub
- [ ] "disciplined-stillness" is disconnected or deleted
- [ ] "passionate-spirit" has Postgres service
- [ ] "passionate-spirit" crossify-platform service has DATABASE_URL set
- [ ] Only one project is receiving deployments
- [ ] Production URL matches "passionate-spirit" project

## Next Steps

1. **Disconnect/Delete** "disciplined-stillness" project
2. **Verify** "passionate-spirit" is the only one deploying
3. **Add DATABASE_URL** to "passionate-spirit" crossify-platform service
4. **Redeploy** and verify PostgreSQL is being used
5. **Check logs** to confirm tokens are syncing correctly

