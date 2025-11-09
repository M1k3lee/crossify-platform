# Marketplace Troubleshooting Guide

## Problem: Marketplace shows no tokens

If the marketplace is showing "No tokens found" after deployment, follow these steps to diagnose and fix the issue.

## Step 1: Check Railway Logs

After deployment, check Railway logs for:

### Startup Sync Messages

Look for these messages:
```
🚀 Starting startup token sync...
📋 Found X configured chains
🔍 Syncing tokens from base-sepolia...
✅ Connected to base-sepolia (block: XXXX)
📦 Found X tokens, syncing to database...
✅ Synced X new tokens from base-sepolia
```

### If You See "No chain configurations found"

```
⚠️  No chain configurations found. Please set factory addresses in environment variables.
```

**Solution**: Factory addresses are not configured in Railway.

**Fix**:
1. Go to Railway project → Variables
2. Add these environment variables:
   ```
   BASE_FACTORY_ADDRESS=0x314DFf75620f1CFB09B5aD88892Dded0A13A6c58
   BASE_SEPOLIA_FACTORY_ADDRESS=0x314DFf75620f1CFB09B5aD88892Dded0A13A6c58
   BSC_FACTORY_ADDRESS=0x39fB28323572610eC0Df1EF075f4acDD51f77e2E
   BSC_TESTNET_FACTORY_ADDRESS=0x39fB28323572610eC0Df1EF075f4acDD51f77e2E
   ```
3. Redeploy

### If You See "No tokens found on [chain]"

```
ℹ️  No tokens found on base-sepolia
💡 This could mean:
   - No tokens have been created yet
   - Factory address is incorrect
   - Tokens were created before the query range (last 50k blocks)
```

**Possible causes**:
1. **No tokens created yet**: Tokens haven't been created on this chain
2. **Wrong factory address**: Factory address doesn't match the one used to create tokens
3. **Tokens too old**: Tokens were created more than 50,000 blocks ago

**Solutions**:
- Verify factory address is correct
- Check block explorer to see if tokens exist
- Increase block range in `startupSync.ts` if needed

### If You See Connection Errors

```
❌ Error syncing base-sepolia: [error message]
💡 Check:
   - RPC URL is correct and accessible
   - Factory address is correct
   - Network is available
```

**Solution**: Check RPC URL and network connectivity.

## Step 2: Check Database Contents

Use the debug endpoint to check if tokens are in the database:

### Check Database Stats

```bash
curl https://your-backend-url/api/debug/database-stats
```

Or visit in browser: `https://your-backend-url/api/debug/database-stats`

**Expected response**:
```json
{
  "tokens": {
    "total": 5,
    "withDeployments": 5,
    "sample": [
      {
        "id": "...",
        "name": "My Token",
        "symbol": "TOKEN",
        "chains": "base-sepolia,bsc-testnet",
        "statuses": "deployed,deployed"
      }
    ]
  },
  "deployments": {
    "total": 10,
    "byChain": [
      { "chain": "base-sepolia", "count": 5 },
      { "chain": "bsc-testnet", "count": 5 }
    ]
  }
}
```

### If Database is Empty

If `tokens.total` is 0, tokens weren't synced. Check:
1. Factory addresses are configured
2. RPC URLs are accessible
3. Tokens exist on the blockchain
4. Startup sync ran successfully

### If Database Has Tokens But Marketplace Shows None

If `tokens.total` > 0 but marketplace shows 0 tokens, check:
1. Tokens have deployments (`withDeployments` should match `total`)
2. Tokens are not deleted (`deleted = 0`)
3. Tokens are visible in marketplace (`visible_in_marketplace = 1`)

## Step 3: Check Factory Configuration

Use the factory-info debug endpoint:

```bash
curl https://your-backend-url/api/debug/factory-info
```

**Check**:
- Factory addresses are configured (not "NOT CONFIGURED")
- RPC URLs are configured
- Factory contracts exist and are accessible

## Step 4: Check Marketplace Endpoint

Check Railway logs when accessing the marketplace:

Look for:
```
🔄 Marketplace: Starting token sync...
✅ Marketplace: Token sync completed (or timed out)
📊 Marketplace: Querying tokens (chain: all, search: none)
📊 Marketplace: Found X tokens in database
```

### If You See "Database has 0 tokens total"

The sync didn't find any tokens. Check:
1. Factory addresses are correct
2. Tokens exist on the blockchain
3. RPC URLs are working
4. Network is accessible

### If You See "Found X tokens in database" but marketplace shows 0

The query might be filtering them out. Check:
1. Tokens have deployments
2. Tokens are not deleted
3. Tokens are visible in marketplace

## Step 5: Manual Sync

If automatic sync isn't working, you can trigger a manual sync:

### Option 1: Visit Marketplace

The marketplace endpoint automatically triggers a sync when accessed.

### Option 2: Use Debug Endpoint

Create a manual sync endpoint (or use the startup sync directly):

```typescript
// In your code or via API call
const { syncAllTokensFromBlockchain } = require('./services/startupSync');
await syncAllTokensFromBlockchain();
```

## Step 6: Verify Tokens on Blockchain

Check if tokens actually exist on the blockchain:

1. Go to block explorer (BaseScan, BSCScan, etc.)
2. Go to the TokenFactory contract
3. Check "TokenCreated" events
4. Verify tokens were created

### Check TokenFactory Events

On BaseScan/BSCScan:
1. Go to TokenFactory contract address
2. Click "Events" tab
3. Look for "TokenCreated" events
4. Verify tokens exist

## Step 7: Common Issues and Fixes

### Issue: Factory Address Not Configured

**Symptoms**: 
- Logs show "No chain configurations found"
- Database is empty

**Fix**: 
- Add factory addresses to Railway environment variables
- Redeploy

### Issue: Wrong Factory Address

**Symptoms**: 
- Sync runs but finds 0 tokens
- Tokens exist on blockchain but not in database

**Fix**: 
- Verify factory address matches the one used to create tokens
- Update environment variable if wrong
- Redeploy

### Issue: RPC URL Not Accessible

**Symptoms**: 
- Connection errors in logs
- Sync fails with network errors

**Fix**: 
- Check RPC URL is correct
- Try a different RPC URL
- Verify network is accessible

### Issue: Tokens Too Old

**Symptoms**: 
- Sync finds 0 tokens
- Tokens exist on blockchain but are older than 50k blocks

**Fix**: 
- Increase block range in `startupSync.ts`
- Change `currentBlock - 50000` to a larger number
- Or query from block 0 (slower but more comprehensive)

### Issue: Database Query Filtering Out Tokens

**Symptoms**: 
- Database has tokens but marketplace shows 0
- `database-stats` shows tokens exist

**Fix**: 
- Check if tokens have deployments
- Check if tokens are deleted
- Check if tokens are visible in marketplace
- Verify query filters are correct

## Step 8: Verify After Fix

After applying fixes:

1. **Redeploy** to Railway
2. **Check logs** for startup sync messages
3. **Wait 10-15 seconds** for sync to complete
4. **Visit marketplace** and check if tokens appear
5. **Check database stats** endpoint to verify tokens are in database
6. **Check Railway logs** for any errors

## Debug Endpoints

Use these endpoints to debug:

### Check Database Stats
```
GET /api/debug/database-stats
```

### Check Factory Configuration
```
GET /api/debug/factory-info
```

### Check Token Info
```
GET /api/debug/token-info?tokenAddress=0x...&chain=bsc-testnet
```

## Next Steps

If tokens still don't appear after following these steps:

1. **Check Railway logs** for specific error messages
2. **Verify factory addresses** are correct
3. **Verify RPC URLs** are accessible
4. **Check block explorer** to confirm tokens exist
5. **Increase block range** if tokens are old
6. **Check database directly** if possible

## Support

If you're still having issues:
1. Share Railway logs
2. Share database-stats endpoint response
3. Share factory-info endpoint response
4. Share token addresses from block explorer

---

**Status**: 🔍 Debugging guide ready
**Last Updated**: After marketplace sync improvements

