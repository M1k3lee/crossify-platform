# Token Visibility Safeguard

## ✅ Good News: Latest Push Won't Affect Visibility

The latest push **only changed the frontend** (`CreatorDashboard.tsx` - chain name mapping fix). It does **NOT** touch:
- ❌ Backend code
- ❌ Database schema
- ❌ Startup sync service
- ❌ Token creation logic

**Therefore, this push should NOT cause tokens to become hidden.**

## 🔍 Current Safeguards

The startup sync service already has multiple safeguards to keep tokens visible:

1. **On Insert**: Sets `visible_in_marketplace = 1` explicitly (lines 398, 459)
2. **On Update**: Updates existing tokens to be visible (lines 232, 496, 534)
3. **After Deployment**: Ensures visibility even if deployment already exists (line 534)

## ⚠️ Potential Issue

If tokens become hidden after deployments, it might be because:

1. **Database Reset**: Railway's ephemeral filesystem resets the database
2. **Startup Sync Timing**: Sync runs before tokens are created
3. **INSERT OR IGNORE**: If a token already exists but was hidden, `INSERT OR IGNORE` won't update it

## 🛡️ Additional Safeguard (Optional)

If you want extra protection, we can add a startup check that ensures all tokens are visible:

```typescript
// In backend/src/index.ts after database initialization
async function ensureAllTokensVisible() {
  try {
    const result = await dbRun(
      'UPDATE tokens SET visible_in_marketplace = 1 WHERE visible_in_marketplace = 0 OR visible_in_marketplace IS NULL'
    );
    const updated = (result as any)?.changes ?? (result as any)?.rowCount ?? 0;
    if (updated > 0) {
      console.log(`✅ Made ${updated} hidden tokens visible on startup`);
    }
  } catch (error) {
    console.warn('⚠️ Could not ensure token visibility:', error);
  }
}
```

## 📊 Monitoring

After deployment, check:
1. **Startup logs**: Look for "Made token X visible in marketplace"
2. **Fix-visibility endpoint**: Call `/api/tokens/fix-visibility` if needed
3. **Marketplace**: Verify tokens appear

## 🎯 Recommendation

**For this specific push**: No action needed - it's frontend-only.

**For future deployments**: If tokens become hidden, call:
```bash
POST https://crossify-platform-production.up.railway.app/api/tokens/fix-visibility
```

This will make all hidden tokens visible immediately.

