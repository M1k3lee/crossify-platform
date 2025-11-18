# Price Sync Status and Next Steps

## Current Status

### ✅ What's Working
1. **GlobalSupplyTracker Authorization**: All bonding curves are properly authorized in the GlobalSupplyTracker contracts on all chains (Base Sepolia, BSC Testnet, Sepolia).

### ❌ What Needs Fixing
1. **useGlobalSupply Disabled**: All bonding curves have `useGlobalSupply` set to `false`, which means they're not using the global supply for price calculation.
2. **Price Sync Not Active**: Because `useGlobalSupply` is disabled, prices are calculated using local supply only, so prices don't sync across chains.

## Verification Results

Verified 2 tokens with multiple deployments:
- **XDOGE** (9ed6d4f6-02bc-4c3e-8b48-dab785d4d9af)
- **PepeX** (502adbbb-e158-40a4-9347-f6b00018959c)

Both tokens have:
- ✅ Bonding curves authorized in GlobalSupplyTracker
- ❌ `useGlobalSupply` disabled on bonding curves
- ❌ Prices showing $0.000000 (likely due to errors when trying to read global supply)

## Root Cause

The bonding curves need:
1. `setGlobalSupplyTracker(address)` - to set the tracker address (if not already set)
2. `setUseGlobalSupply(true)` - to enable global supply usage

Both of these functions are `onlyOwner`, meaning they can only be called by the bonding curve owner (which is typically the token creator).

## Solution Options

### Option 1: Token Creator Fixes (Recommended)
The token creators need to:
1. Connect with the wallet that created the token
2. Call `setUseGlobalSupply(true)` on each bonding curve contract
3. Optionally verify the `globalSupplyTracker` address is set correctly

### Option 2: Admin Script (If You Have Bonding Curve Owner Keys)
If you have access to the bonding curve owner's private keys, you can run:

```bash
cd contracts
TOKEN_ID=<tokenId> npx hardhat run scripts/fix-all-chains-for-token.ts
```

This script will:
- Set the GlobalSupplyTracker address (if needed)
- Enable `useGlobalSupply` on all bonding curves
- Authorize curves in GlobalSupplyTracker (already done)

### Option 3: Factory-Level Fix
If tokens are created through a TokenFactory, you could modify the factory to automatically enable `useGlobalSupply` when creating new tokens. However, this won't fix existing tokens.

## Next Steps

1. **For Existing Tokens**: Contact token creators to enable `useGlobalSupply` on their bonding curves, or if you have their private keys, run the fix script.

2. **For New Tokens**: Ensure the TokenFactory sets `useGlobalSupply = true` when deploying new bonding curves.

3. **Verification**: After fixes are applied, run:
   ```bash
   cd contracts
   npx ts-node --project tsconfig.json scripts/verify-all-tokens-standalone.ts
   ```

## Scripts Available

- `verify-all-tokens-standalone.ts` - Verify price sync status for all tokens
- `authorize-token-curves.ts` - Authorize bonding curves in GlobalSupplyTracker (already done)
- `fix-all-chains-for-token.ts` - Fix bonding curve configuration (requires bonding curve owner's key)

## Technical Details

The bonding curve contract checks `useGlobalSupply` in the `getCurrentPrice()` function:

```solidity
if (useGlobalSupply && address(globalSupplyTracker) != address(0)) {
    try globalSupplyTracker.getGlobalSupply(address(token)) returns (uint256 globalSupply) {
        // Use global supply for pricing
    } catch {
        // Fall back to local supply
    }
}
```

When `useGlobalSupply` is `false`, the bonding curve uses only `totalSupplySold` (local supply) for price calculation, which means prices won't sync across chains.




