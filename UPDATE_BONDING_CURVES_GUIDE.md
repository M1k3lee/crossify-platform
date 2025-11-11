# Update Existing Bonding Curves - Guide

## Overview

To enable automatic bridge requests for existing bonding curves, you need to update them with:
- Bridge contract address
- Chain EID
- Enable bridge usage

## Step 1: Find Bonding Curve Addresses

### Option A: From Database

Query your database:
```sql
SELECT chain, curve_address, token_id 
FROM token_deployments 
WHERE curve_address IS NOT NULL 
AND status = 'deployed';
```

### Option B: From Blockchain

Query TokenFactory events:
```bash
# Use the startupSync service or query events directly
# All tokens created through TokenFactory have their curve addresses in TokenCreated events
```

### Option C: From Frontend/API

Use the tokens API:
```bash
curl http://localhost:3000/api/tokens/my-tokens?address=YOUR_ADDRESS
```

Look for `curve_addresses` in the response.

## Step 2: Update Curves

### Method A: Batch Update Script

1. **Create list of curve addresses** (comma-separated):
   ```bash
   # In contracts/.env
   BONDING_CURVE_ADDRESSES=0x...,0x...,0x...
   ```

2. **Run update script**:
   ```bash
   cd contracts
   
   # Sepolia
   npx hardhat run scripts/update-bonding-curves-bridge.ts --network sepolia
   
   # BSC Testnet
   npx hardhat run scripts/update-bonding-curves-bridge.ts --network bscTestnet
   
   # Base Sepolia
   npx hardhat run scripts/update-bonding-curves-bridge.ts --network baseSepolia
   ```

### Method B: Manual Update (One by One)

For each curve, call these functions:

**Sepolia:**
```solidity
bondingCurve.setLiquidityBridge(0x7005c0A2c9Cd108af213c717cA6d7232AcBD1b29);
bondingCurve.setChainEID(40161);
bondingCurve.setUseLiquidityBridge(true);
```

**BSC Testnet:**
```solidity
bondingCurve.setLiquidityBridge(0x08BA4231c0843375714Ef89999C9F908735E0Ec2);
bondingCurve.setChainEID(40102);
bondingCurve.setUseLiquidityBridge(true);
```

**Base Sepolia:**
```solidity
bondingCurve.setLiquidityBridge(0xDeFC8B749e68b5e21b3873928e68Aaf56031C6EA);
bondingCurve.setChainEID(40245);
bondingCurve.setUseLiquidityBridge(true);
```

## Step 3: Verify Updates

Check that curves are configured:

```solidity
// Check bridge address
await bondingCurve.liquidityBridge(); // Should return bridge address

// Check chain EID
await bondingCurve.chainEID(); // Should return 40161, 40102, or 40245

// Check if enabled
await bondingCurve.useLiquidityBridge(); // Should return true
```

## Bridge Addresses Reference

| Chain | Bridge Address | Chain EID |
|-------|---------------|-----------|
| Sepolia | `0x7005c0A2c9Cd108af213c717cA6d7232AcBD1b29` | 40161 |
| BSC Testnet | `0x08BA4231c0843375714Ef89999C9F908735E0Ec2` | 40102 |
| Base Sepolia | `0xDeFC8B749e68b5e21b3873928e68Aaf56031C6EA` | 40245 |

## What Happens After Update

Once curves are updated:

1. **Automatic Bridge Requests**: When a user tries to sell and reserves are low, the curve automatically requests liquidity
2. **Backend Processing**: Backend monitoring service detects the request and executes the bridge
3. **User Experience**: User can retry the transaction after bridge completes (~30 seconds)

## Priority

- **HIGH**: Update curves for tokens with active trading
- **MEDIUM**: Update curves for tokens with potential trading
- **LOW**: Update curves for inactive tokens (can be done later)

## Notes

- Curves must be updated by the **owner** (usually the token creator)
- If you don't have owner access, you'll need to coordinate with token creators
- The bridge system works even without updating curves (via backend monitoring), but updating enables automatic requests

