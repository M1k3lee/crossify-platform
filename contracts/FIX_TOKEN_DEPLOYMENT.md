# Fix Token Deployment Issue

## Problem
Token deployment is failing with error: "Failed to authorize token in CrossChainSync"

This happens because the deployed TokenFactory contracts are trying to authorize tokens in CrossChainSync, but they don't have permission to do so.

## Root Cause
The TokenFactory contract was trying to authorize tokens in CrossChainSync during token creation, but:
1. The `authorizeToken` function in CrossChainSync is `onlyOwner`
2. TokenFactory is not the owner of CrossChainSync
3. Tokens don't actually need to be authorized - only GlobalSupplyTracker needs to be authorized (which it already is)

## Solution
The TokenFactory contract code has been updated to remove the unnecessary authorization call. However, the **deployed contracts still have the old code**.

### Option 1: Redeploy TokenFactory (Recommended for New Deployments)
Redeploy the TokenFactory contracts with the new code:

```bash
cd contracts
npx hardhat run scripts/deploy.ts --network sepolia
npx hardhat run scripts/deploy.ts --network bscTestnet
npx hardhat run scripts/deploy.ts --network baseSepolia
```

**⚠️ Important:** After redeployment, update your frontend environment variables:
- `VITE_ETH_FACTORY` (for Sepolia)
- `VITE_BSC_FACTORY` (for BSC Testnet)
- `VITE_BASE_FACTORY` (for Base Sepolia)

**Note:** Redeploying will create new factory addresses. Existing tokens created with the old factory will still work, but new tokens must be created with the new factory.

### Option 2: Temporary Workaround (For Existing Deployments)
If you can't redeploy immediately, you can temporarily work around this by:

1. Making TokenFactory the owner of CrossChainSync (not recommended - security risk)
2. Or, manually authorizing tokens after creation (not practical)

**Recommendation:** Use Option 1 and redeploy the TokenFactory contracts.

## Verification
After redeployment, test token creation:
1. Go to the Builder page
2. Create a new token
3. Verify it deploys without errors

## Current Factory Addresses (Old - Need Redeployment)
- **Sepolia**: `0x39fB28323572610eC0Df1EF075f4acDD51f77e2E`
- **BSC Testnet**: `0x39fB28323572610eC0Df1EF075f4acDD51f77e2E`
- **Base Sepolia**: `0x314DFf75620f1CFB09B5aD88892Dded0A13A6c58`

## Code Changes
The fix removes the authorization attempt from TokenFactory:
- **Before:** TokenFactory tried to authorize tokens in CrossChainSync (failed)
- **After:** TokenFactory skips authorization (not needed - GlobalSupplyTracker handles it)

See `contracts/contracts/TokenFactory.sol` lines 143-146 for the updated code.

