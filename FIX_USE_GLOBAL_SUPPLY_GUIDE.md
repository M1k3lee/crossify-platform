# Fix useGlobalSupply for Existing Tokens

## Current Status

The bonding curves for existing tokens have `useGlobalSupply` disabled. To enable cross-chain price synchronization, we need to enable this setting.

## Required Private Key

The bonding curve owner is: **`0x097b70CfE0007915249D31dF96a5B582bAb96D75`**

This is the address that created the tokens. You need the private key for this address to enable `useGlobalSupply`.

## Solution

### Option 1: Add Private Key to Environment (Recommended)

Add the private key for `0x097b70CfE0007915249D31dF96a5B582bAb96D75` to your `contracts/.env` file:

```env
TOKEN_CREATOR_PRIVATE_KEY=your_private_key_here
```

Then run the fix script:

```bash
cd contracts
TOKEN_ID=9ed6d4f6-02bc-4c3e-8b48-dab785d4d9af npx ts-node --project tsconfig.json scripts/fix-use-global-supply.ts
```

### Option 2: Use MetaMask/Wallet

If you have access to this wallet in MetaMask or another wallet:

1. Connect to the wallet
2. For each bonding curve contract, call:
   - `setUseGlobalSupply(true)`
   - Optionally verify: `setGlobalSupplyTracker(<tracker_address>)`

### Option 3: Update TokenFactory for New Tokens

For future tokens, ensure the TokenFactory has `useGlobalSupply = true` when deploying. This will automatically enable it for new tokens.

## Verification

After fixing, verify with:

```bash
cd contracts
npx ts-node --project tsconfig.json scripts/verify-all-tokens-standalone.ts
```

You should see:
- ✅ `useGlobalSupply: true` for all chains
- ✅ Prices syncing across chains

## What This Fixes

- Enables cross-chain price synchronization
- Prices will be calculated using global supply instead of local supply
- All chains will show the same price for the same token


