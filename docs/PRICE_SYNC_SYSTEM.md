# Cross-Chain Price Synchronization System

**Last Updated**: January 2025  
**Author**: MikeLee

## Overview

Crossify implements a sophisticated cross-chain price synchronization system that maintains unified pricing across all deployed chains. This document explains how the system works, how to configure it, and how to troubleshoot issues.

## Architecture

### Core Components

1. **GlobalSupplyTracker** - Smart contract that tracks total supply across all chains
2. **BondingCurve** - Uses global supply for price calculation instead of local supply
3. **Auto-Configuration Service** - Automatically configures bonding curves to use global supply
4. **Price Sync Service** - Backend service that monitors and syncs prices
5. **Unified Price Display** - Frontend system that ensures consistent price display across all UI elements

### Price Display System

The platform uses a **unified price display system** that:
- Calculates expected prices based on global supply and token parameters
- Displays consistent prices across buy widget, cross-chain sync, and charts
- Handles parameter mismatches gracefully (shows info, not errors)
- Provides fallback data for charts when no transactions exist

### How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                    User Buys Tokens                          │
│                    (Any Chain)                               │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              BondingCurve Contract                          │
│  - Calculates price using: basePrice + (slope * globalSupply)│
│  - Updates local supply                                      │
│  - Calls GlobalSupplyTracker.updateSupply()                  │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│          GlobalSupplyTracker Contract                       │
│  - Updates chain-specific supply                             │
│  - Updates global supply (sum of all chains)                 │
│  - Sends LayerZero message to other chains                   │
└───────────────────────┬─────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
        ▼               ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  Chain 1     │ │  Chain 2     │ │  Chain 3     │
│  Tracker     │ │  Tracker     │ │  Tracker     │
│  Updates     │ │  Updates     │ │  Updates     │
└──────────────┘ └──────────────┘ └──────────────┘
        │               │               │
        └───────────────┼───────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│          All BondingCurves See Updated Global Supply         │
│          Prices Synchronize Across All Chains                │
└─────────────────────────────────────────────────────────────┘
```

## Bonding Curve Configuration

### Automatic Configuration

The system automatically configures bonding curves when:
1. A new token is deployed
2. The "Sync Now" button is clicked on a token page
3. The backend detects misconfiguration

### Configuration Steps

For each bonding curve, the system:

1. **Checks Current Configuration**:
   - Is `globalSupplyTracker` address set correctly?
   - Is `useGlobalSupply` flag enabled?
   - Is the curve authorized in GlobalSupplyTracker?

2. **Authorizes Curve** (if needed):
   - If wallet is tracker owner, authorizes curve automatically
   - If wallet is curve owner, authorizes via owner's key

3. **Configures Settings**:
   - Sets `globalSupplyTracker` address
   - Enables `useGlobalSupply` flag

### Manual Configuration

If automatic configuration fails, you can manually configure:

```typescript
// 1. Authorize bonding curve in GlobalSupplyTracker
await trackerContract.authorizeUpdater(curveAddress);

// 2. Set tracker address on bonding curve
await curveContract.setGlobalSupplyTracker(trackerAddress);

// 3. Enable global supply usage
await curveContract.setUseGlobalSupply(true);
```

## GlobalSupplyTracker Contract

### Key Functions

#### `updateSupply(tokenId, chain, newSupply)`
Called by bonding curves to update supply. Only authorized updaters can call this.

```solidity
function updateSupply(
    address tokenId,
    string memory chain,
    uint256 newSupply
) external payable onlyAuthorized;
```

#### `authorizeUpdater(updater)`
Authorizes a bonding curve to update supply. Only owner can call.

```solidity
function authorizeUpdater(address updater) external onlyOwner;
```

#### `getGlobalSupply(tokenId)`
Returns the total supply across all chains.

```solidity
function getGlobalSupply(address tokenId) external view returns (uint256);
```

### Authorization System

- **Owner**: Can call `updateSupply` directly and authorize updaters
- **Authorized Updaters**: Bonding curves that have been explicitly authorized
- **Security**: Only authorized contracts can update supply, preventing manipulation

## Backend Services

### Auto-Configuration Service

**Location**: `backend/src/services/autoConfigureBondingCurves.ts`

**Purpose**: Automatically configures bonding curves to use global supply.

**How It Works**:
1. Fetches all deployments for a token
2. For each deployment, checks configuration status
3. If misconfigured, attempts to fix:
   - Authorizes curve if wallet is tracker owner
   - Sets tracker address if missing
   - Enables global supply if disabled

**Key Function**:
```typescript
export async function configureBondingCurve(
  chain: string,
  curveAddress: string,
  tokenAddress: string
): Promise<ConfigurationResult>
```

### Price Sync Service

**Location**: `backend/src/services/activePriceSync.ts`

**Purpose**: Monitors actual supply from bonding curves and updates GlobalSupplyTracker.

**How It Works**:
1. Queries actual supply from each bonding curve
2. Compares with supply in GlobalSupplyTracker
3. If different, calls `updateSupply` to sync
4. Handles authorization checks and errors gracefully

**Key Function**:
```typescript
export async function syncTokenPrices(tokenId: string): Promise<SyncResult>
```

## API Endpoints

### `POST /api/tokens/:id/sync-prices`

Triggers full price synchronization:
1. Auto-configures bonding curves
2. Syncs supply to GlobalSupplyTracker
3. Returns detailed results

**Response**:
```json
{
  "success": true,
  "message": "Configuration: Configured 3/3 chains. Sync: Synced 3/3 chains",
  "configuration": {
    "success": true,
    "results": [...]
  },
  "sync": {
    "success": true,
    "results": [...]
  },
  "diagnostics": [...]
}
```

### `GET /api/tokens/:id/price-sync`

Returns current price sync status:
- Expected price (based on global supply)
- Actual prices on each chain
- Price variance percentage

### `GET /api/tokens/:id/sync-diagnostics`

Returns detailed diagnostics:
- Configuration status per chain
- Authorization status
- Supply discrepancies
- Error messages

### `POST /api/tokens/:id/configure-bonding-curves`

Only runs configuration (no sync):
- Useful for fixing configuration issues
- Doesn't trigger supply updates

### `POST /api/tokens/:id/authorize-backend-wallet`

Authorizes the backend wallet in GlobalSupplyTracker:
- Required for backend to sync prices
- Uses owner's private key to authorize

## Environment Variables

### Required for Price Sync

```bash
# GlobalSupplyTracker addresses (one per chain)
GLOBAL_SUPPLY_TRACKER_SEPOLIA=0x...
GLOBAL_SUPPLY_TRACKER_BSC_TESTNET=0x...
GLOBAL_SUPPLY_TRACKER_BASE_SEPOLIA=0x...
GLOBAL_SUPPLY_TRACKER_HEDERA_TESTNET=0x...

***REMOVED*** (for authorization and sync)
ETHEREUM_PRIVATE_KEY=0x...  # Owner's key (for authorization)
BASE_PRIVATE_KEY=0x...      # Optional: chain-specific key
BSC_PRIVATE_KEY=0x...       # Optional: chain-specific key
HEDERA_PRIVATE_KEY=0x...    # Optional: Hedera-specific key

# RPC URLs
ETHEREUM_RPC_URL=https://...
BASE_RPC_URL=https://...
BSC_RPC_URL=https://...
HEDERA_RPC_URL=https://...
```

## Troubleshooting

### Issue: "Cannot configure: wallet is not the owner"

**Cause**: The wallet used for configuration is not the owner of the bonding curve.

**Solutions**:
1. **If wallet is tracker owner**: The system will automatically authorize the curve
2. **If wallet is curve owner**: Configuration should work automatically
3. **If neither**: You need the curve owner's private key

**Check**:
```typescript
// Check curve owner
const curveOwner = await curveContract.owner();

// Check tracker owner
const trackerOwner = await trackerContract.owner();

// Check if wallet is tracker owner
const isTrackerOwner = trackerOwner.toLowerCase() === wallet.address.toLowerCase();
```

### Issue: "Not authorized" when syncing

**Cause**: The bonding curve is not authorized in GlobalSupplyTracker.

**Solution**: Run the authorization endpoint or use the authorization script:

```bash
node backend/scripts/authorize-token-curves.js <token-id>
```

### Issue: Prices still out of sync after sync

**Possible Causes**:
1. **Bonding curves not configured**: Check if `useGlobalSupply` is enabled
2. **Different basePrice/slope**: Contracts deployed with different parameters can't sync
3. **GlobalSupplyTracker out of sync**: Run sync multiple times or use fix script

**Check Configuration**:
```typescript
// Check if using global supply
const useGlobalSupply = await curveContract.useGlobalSupply();

// Check tracker address
const trackerAddress = await curveContract.globalSupplyTracker();

// Check authorization
const isAuthorized = await trackerContract.authorizedUpdaters(curveAddress);
```

### Issue: "Chain configuration not found"

**Cause**: Missing environment variable for that chain.

**Solution**: Add the missing environment variable:
```bash
GLOBAL_SUPPLY_TRACKER_<CHAIN>=0x...
```

### Issue: Analytics endpoint returns 500

**Cause**: Database query error or missing transactions table.

**Solution**: The endpoint now returns empty data instead of 500. Check backend logs for the actual error.

## Best Practices

1. **Always authorize curves after deployment**: Use the auto-configuration or manual authorization
2. **Monitor price variance**: Keep it below 0.5% for optimal sync
3. **Use consistent parameters**: Deploy tokens with same `basePrice` and `slope` on all chains
4. **Check diagnostics regularly**: Use `/sync-diagnostics` endpoint to monitor health
5. **Keep environment variables updated**: Ensure all tracker addresses are correct

## Scripts

### Authorization Script

```bash
# Authorize curves for a specific token
node backend/scripts/authorize-token-curves.js <token-id>
```

### Diagnostic Script

```bash
# Check sync status
node backend/scripts/check-sync-status.js <token-id>
```

### Test Sync Script

```bash
# Test full sync process
node backend/scripts/test-sync-prices.js <token-id>
```

## Future Improvements

- [ ] Automatic retry on failed syncs
- [ ] Price variance alerts
- [ ] Historical sync logs
- [ ] Multi-chain batch updates
- [ ] Oracle price verification

## Related Documentation

- [Architecture Overview](../crossify-platform.wiki/Architecture.md)
- [Contracts Documentation](../crossify-platform.wiki/Contracts.md)
- [API Reference](./API_REFERENCE.md)

