# Fix Startup Sync - Tokens Not Being Discovered

## Problem

- Database shows 0 tokens and 0 deployments
- Tokens exist on testnet but aren't being synced
- Database gets wiped on each Railway deployment (expected)
- Startup sync should re-discover tokens but isn't working

## Root Causes to Check

### 1. Startup Sync Not Running

**Check Railway logs for:**
```
🚀 Starting startup token sync...
```

If you don't see this, the startup sync isn't running.

**Fix:** Verify `startStartupSync()` is called in `backend/src/index.ts`

### 2. Block Range Too Small

**Current code queries last 50,000 blocks:**
```typescript
const startBlock = Math.max(fromBlock, currentBlock - 50000);
```

If tokens were created more than 50,000 blocks ago, they won't be found.

**Fix:** Query from block 0 or deployment block

### 3. Factory Address Mismatch

Tokens might have been created with a different factory address than what's configured.

**Fix:** Verify factory addresses match

### 4. RPC Connection Issues

RPC might be failing silently.

**Fix:** Check for connection errors in logs

## Immediate Fixes

### Fix 1: Query From Block 0

Change the block range to query from the beginning:

```typescript
// In startupSync.ts, queryAllTokens function
const startBlock = 0; // Query from genesis instead of last 50k blocks
```

### Fix 2: Add More Logging

Add detailed logging to see what's happening:

```typescript
console.log(`  📊 Current block: ${currentBlock}`);
console.log(`  📊 Querying from block ${startBlock} to ${currentBlock}`);
console.log(`  📊 Block range: ${currentBlock - startBlock} blocks`);
```

### Fix 3: Verify Factory Addresses

Check if tokens were created with the configured factory addresses.

### Fix 4: Add Manual Sync Endpoint

Create an endpoint to manually trigger sync for debugging.

## Next Steps

1. Check Railway logs for startup sync messages
2. Verify factory addresses match tokens
3. Increase block range or query from block 0
4. Add more detailed logging
5. Test manual sync endpoint


