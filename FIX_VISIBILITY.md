# Fix Token Visibility

## Problem
Tokens synced from the blockchain are being marked as "Hidden" in the dashboard, which prevents them from appearing in the marketplace.

## Solution

### 1. Automatic Fix (Deployed)
The sync service has been updated to automatically make tokens visible when they're synced. This will fix tokens on the next sync.

### 2. Manual Fix (Immediate)
To fix existing hidden tokens immediately, call the fix-visibility endpoint:

```bash
curl -X POST https://crossify-platform-production.up.railway.app/api/tokens/fix-visibility
```

Or use your browser/Postman to POST to:
```
https://crossify-platform-production.up.railway.app/api/tokens/fix-visibility
```

### 3. Verify Fix
After calling the endpoint, check:
1. Dashboard - tokens should no longer show "Hidden" tag
2. Marketplace - tokens should appear in the marketplace
3. Token detail pages - should load without black screen

## Expected Response
```json
{
  "success": true,
  "message": "Updated X tokens to be visible in marketplace",
  "updated": X,
  "totalTokens": Y,
  "visibleTokens": Z,
  "hiddenTokens": 0
}
```

## Next Steps
1. Call the fix-visibility endpoint
2. Verify tokens appear in marketplace
3. Test token detail pages
4. Monitor logs for visibility updates during sync

