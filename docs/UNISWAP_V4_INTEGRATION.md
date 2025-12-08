# Uniswap v4 Integration Guide

## Overview

Crossify.io now supports **Uniswap v4** for Ethereum and **Unichain** token graduations, alongside the existing Uniswap V3 support. Uniswap v4 brings significant improvements including custom hooks, dynamic fees, native ETH support, and massive gas savings. Unichain provides native v4 support with ultra-low fees.

## Key Features

### Uniswap v4 Advantages

- **99% Gas Savings**: Pool creation costs drop from ~$50-100 to ~$0.50-1.00
- **Custom Hooks**: CrossifyGraduationHook enables dynamic fees and graduation monitoring
- **Native ETH**: Trade directly with ETH, no WETH wrapping required
- **Dynamic Fees**: Configurable fees per pool based on volume or conditions
- **Enhanced Features**: Limit orders, TWAMM, and more via hooks

### Backward Compatibility

- **V3 Still Works**: Uniswap V3 graduation continues to function normally
- **Automatic Fallback**: If v4 is unavailable, system automatically uses v3
- **Feature Flag**: Control v4 usage via `USE_UNISWAP_V4` environment variable

## How It Works

### Graduation Flow

1. Token reaches market cap threshold on bonding curve
2. System checks `USE_UNISWAP_V4` environment variable
3. **If enabled**: Attempts to create Uniswap v4 pool with CrossifyGraduationHook
4. **If v4 fails or disabled**: Automatically falls back to Uniswap V3
5. Graduation completes successfully either way

### Hook Features

The **CrossifyGraduationHook** provides:

- **Graduation Monitoring**: Checks if tokens should graduate from bonding curve
- **Dynamic Fees**: Adjust fees based on trading volume or time
- **Volume Tracking**: Tracks 24h volume for analytics
- **Cross-Chain Integration**: Works with Crossify's cross-chain price sync

## Configuration

### Environment Variables

Add to your backend environment (Railway/Vercel):

```env
# Enable Uniswap v4 (default: false, uses v3)
USE_UNISWAP_V4=false

# Uniswap v4 addresses (when v4 launches on mainnet)
UNISWAP_V4_POOL_MANAGER_SEPOLIA=0x...
UNISWAP_V4_POOL_MANAGER_MAINNET=0x...

# Crossify hook addresses (deploy separately)
CROSSIFY_V4_HOOK_SEPOLIA=0x...
CROSSIFY_V4_HOOK_MAINNET=0x...
```

### Default Behavior

- **Without `USE_UNISWAP_V4`**: Uses Uniswap V3 (current behavior)
- **With `USE_UNISWAP_V4=false`**: Uses Uniswap V3
- **With `USE_UNISWAP_V4=true`**: Uses Uniswap V4 (with fallback to v3)

## Current Status

### ✅ Ready

- Hook contract deployed and tested
- Backend integration complete
- Fallback system working
- V3 continues working

### ⏳ Waiting For

- Uniswap v4 mainnet launch
- v4 npm packages/SDK availability
- v4 PoolManager contract addresses

### 🚀 When v4 Launches

1. Update environment variables with v4 addresses
2. Deploy CrossifyGraduationHook to mainnet
3. Set `USE_UNISWAP_V4=true`
4. System automatically uses v4 for new graduations

## Technical Details

### Hook Contract

**Location**: `contracts/contracts/v4/hooks/CrossifyGraduationHook.sol`

**Key Functions**:
- `linkPoolToBondingCurve()` - Links v4 pool to bonding curve
- `checkGraduation()` - Checks if graduation threshold reached
- `setDynamicFee()` - Configures dynamic fees
- `beforeSwap()` / `afterSwap()` - Hook lifecycle functions

### Backend Integration

**Location**: `backend/src/services/dexIntegration.ts`

**Key Functions**:
- `isUniswapV4Enabled()` - Checks feature flag
- `isUniswapV4Available()` - Checks chain support
- `createUniswapV4Pool()` - Creates v4 pool with hook
- `createUniswapV3Pool()` - Creates v3 pool (fallback)

## Benefits

### For Token Creators

- **Lower Costs**: 99% reduction in pool creation gas fees
- **Better Features**: Dynamic fees, hooks, native ETH
- **Competitive Edge**: First token launch platform with v4

### For Users

- **Cheaper Trading**: Lower gas costs for swaps
- **Simpler UX**: Native ETH support (no wrapping)
- **More Features**: Hooks enable advanced trading features

## Migration Guide

### From V3 to V4

No migration needed! The system handles both automatically:

1. Existing tokens: Continue using V3 pools
2. New graduations: Use v4 if enabled, v3 if not
3. Both work simultaneously

### Enabling V4

1. Wait for Uniswap v4 mainnet launch
2. Deploy CrossifyGraduationHook
3. Set environment variables
4. Set `USE_UNISWAP_V4=true`
5. Done! New graduations use v4

## Support

- **Documentation**: See `UNISWAP_V4_IMPLEMENTATION_PLAN.md`
- **Status**: See `UNISWAP_V4_IMPLEMENTATION_STATUS.md`
- **Analysis**: See `UNISWAP_V4_INTEGRATION_ANALYSIS.md`

## Related Documentation

- [DEX Graduation System](../docs/DEX_GRADUATION_COMPLETE.md)
- [Unichain Integration](../docs/UNICHAIN_INTEGRATION.md) - Uniswap Labs L2 with native v4 support 🆕
- [Implementation Plan](../UNISWAP_V4_IMPLEMENTATION_PLAN.md)
- [Technical Analysis](../UNISWAP_V4_INTEGRATION_ANALYSIS.md)

