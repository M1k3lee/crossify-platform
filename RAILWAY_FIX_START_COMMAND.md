# Fix Railway Start Command

## The Problem
Railway is looking for a "start" script but can't find it because it's using `backend/package.json`.

## Solution: Update Start Command in Railway

### Option 1: Use Direct Node Command (Easiest)

In Railway `migration-temp` service → **Settings** tab:

1. **Start Command:** Change from `npm start` to:
   ```
   node backend/railway-migration.js
   ```

2. **Save** and **Deploy**

### Option 2: Use the Migrate Script

I've added a "migrate" script to `backend/package.json`. 

In Railway **Settings**:

1. **Start Command:** Change to:
   ```
   npm run migrate
   ```

2. **Save** and **Deploy**

### Option 3: Set Root Directory to Backend

If you want to use `npm start`:

1. **Root Directory:** Set to `backend`
2. **Start Command:** Set to `npm run migrate`
3. **Save** and **Deploy**

---

**Recommended:** Use **Option 1** - it's the simplest and most direct!



