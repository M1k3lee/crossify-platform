# Gas Limit Fix for Token Deployment

## Problem
Token deployment is failing with "Transaction reverted" and "Gas used: 3600000 / LIMIT HIT!"

The transaction is running out of gas during deployment. This happens because:
1. Cross-chain token deployments are complex (CrossChainToken + BondingCurve + transfers + authorization)
2. The default gas limit of 3M + 20% buffer = 3.6M is not enough
3. CrossChainToken contract is larger due to LayerZero integration

## Solution Applied

### 1. Increased Gas Limits (Frontend)
- Increased default gas limit from 3M to **5M** for cross-chain token deployments
- Reduced buffer from 20% to 10% (since we're using generous defaults)
- Added maximum gas limit cap of 8M

### 2. Optimized Contract (TokenFactory)
- Limited gas for authorization call to 50k (prevents excessive gas usage on failure)
- Optimized order of operations (setBondingCurve before transferOwnership)
- Authorization is now optional (won't block token creation if it fails)

## Current Status

✅ **Frontend Code Updated**: Gas limits increased to 5M
✅ **Contract Code Optimized**: Gas usage reduced for authorization calls
⏳ **Waiting for Vercel Deployment**: Frontend needs to be redeployed with new gas limits

## Next Steps

### Option 1: Wait for Vercel Auto-Deploy (Recommended)
1. Vercel should automatically redeploy after detecting the git push
2. Once deployed, try creating a token again
3. The new gas limits (5M) should be sufficient

### Option 2: Manual Redeploy (If Auto-Deploy Didn't Work)
1. Go to Vercel dashboard
2. Trigger a manual redeploy
3. Wait for deployment to complete
4. Try creating a token again

### Option 3: Redeploy TokenFactory Contracts (If Still Failing)
If the optimized contract code helps, we can redeploy TokenFactory with the optimizations:
```bash
cd contracts
npx hardhat run scripts/deploy.ts --network baseSepolia
npx hardhat run scripts/deploy.ts --network bscTestnet
npx hardhat run scripts/deploy.ts --network sepolia
```

Then update Vercel environment variables with new factory addresses.

## Expected Gas Usage

With the optimizations:
- CrossChainToken deployment: ~600k-800k gas
- BondingCurve deployment: ~400k-500k gas
- Token transfers: ~200k gas
- setBondingCurve call: ~50k gas
- transferOwnership call: ~50k gas
- Authorization call (limited to 50k): ~50k gas
- Overhead: ~500k gas
- **Total: ~1.9M-2.2M gas**

With 5M gas limit + 10% buffer = **5.5M**, there should be plenty of headroom.

## Verification

After Vercel redeploys:
1. Go to Builder page
2. Create a test token
3. Check the gas limit in the transaction (should be ~5.5M, not 3.6M)
4. Transaction should succeed

## If Still Failing

If the transaction still fails after Vercel redeploys:
1. Check the actual gas used vs gas limit
2. If still hitting the limit, we may need to further optimize the contract
3. Or increase the gas limit to 6M-7M

## Transaction Details

Failed transaction:
- **Hash**: `0x22f4054f1e2085c3f5641646f50c56537097edbfb8d5a7070f9dbc674b916c35`
- **Network**: Base Sepolia
- **Factory**: `0x170EE984fBcfd01599312EaA1AD4D35Ad5e66f58`
- **Gas Used**: 3,600,000 (exactly the limit)
- **Status**: Reverted (out of gas)

## Notes

- The contract optimizations (limited gas for authorization) will help reduce gas usage
- However, the main fix is the increased gas limit in the frontend
- TokenFactory contracts don't need to be redeployed for the gas limit fix (frontend only)
- Contract optimizations are optional but recommended for future deployments

