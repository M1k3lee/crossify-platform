# Railway Environment Variable Troubleshooting

## The Problem
Even though `DATABASE_URL` appears in Railway's Variables tab, the container isn't seeing it.

## Possible Causes & Solutions

### 1. Variable Not Saved Properly
- ✅ Make sure you clicked **"Save"** or **"Add"** after entering the variable
- ✅ Check that the variable appears in the list (not just in the input field)

### 2. Service Needs Redeploy
- ✅ After adding variables, Railway may need a **manual redeploy**
- ✅ Go to **Deployments** tab → Click **"Redeploy"** or **"Deploy"**

### 3. Variable Scope Issue
- ✅ Make sure the variable is at the **service level** (migration-temp), not project level
- ✅ Check the Variables tab shows it under "Service Variables"

### 4. Railway Cache
- ✅ Try **deleting and recreating** the variable
- ✅ Or try **restarting** the service

### 5. Check Variable Name
- ✅ Must be exactly: `DATABASE_URL` (case-sensitive, no spaces)
- ✅ Not `database_url` or `DATABASE-URL` or `DATABASE_URL ` (with space)

## Debug Steps

After the next deploy, check logs for:
```
🔍 Debug: Checking environment variables...
   All env vars starting with DATABASE: DATABASE_URL, DATABASE_PUBLIC_URL, ...
   DATABASE_URL exists: true
   DATABASE_URL value (first 50 chars): postgresql://postgres:...
```

If you see `DATABASE_URL exists: false`, then Railway isn't passing it to the container.

## Alternative: Use DATABASE_PUBLIC_URL

I notice you also have `DATABASE_PUBLIC_URL` in the variables. If `DATABASE_URL` still doesn't work, try:

1. **Add a new variable:**
   - Name: `DATABASE_URL`
   - Value: (copy the value from `DATABASE_PUBLIC_URL` if it's different)
   - Or use: `${{Postgres.DATABASE_URL}}` if Railway supports variable references

## Force Redeploy

1. Go to **migration-temp** service
2. **Settings** tab
3. Look for **"Redeploy"** or **"Restart"** option
4. Or trigger a new deployment by making a small change

---

**Next Step**: After redeploying, check the logs for the debug output to see what Railway is actually passing to the container.



