# Unichain Integration Guide

## Overview

Crossify.io is preparing to support **Unichain**, Uniswap Labs' Layer 2 blockchain built specifically for Uniswap v4. Unichain offers native v4 support, ultra-low fees, and lightning-fast transactions - making it perfect for token launches.

---

## What is Unichain?

**Unichain** is an official Layer 2 blockchain developed by **Uniswap Labs**, designed specifically for DeFi applications with a focus on Uniswap v4.

### Key Features

- **Block Time**: 1 second (planning 200-250ms) - Faster than most chains!
- **Gas Fees**: ~95% lower than Ethereum - Like Hedera!
- **Security**: TEE (Trusted Execution Environment)
- **Technology**: OP Stack (Optimism Superchain)
- **Native v4**: Built specifically for Uniswap v4
- **EVM Compatible**: ✅ Yes - Our contracts work as-is

---

## Why Unichain for Crossify?

### Perfect Strategic Fit

1. **Native Uniswap v4 Support**
   - Unichain is built specifically for Uniswap v4
   - Best possible v4 experience
   - No compromises or workarounds

2. **Ultra-Low Fees**
   - ~95% lower than Ethereum
   - Perfect for token launches
   - Attracts more users

3. **Fast Transactions**
   - 1-second block times
   - Better user experience
   - Competitive with Hedera

4. **First Mover Advantage**
   - First token launch platform on Unichain
   - Strong marketing angle
   - Partnership potential with Uniswap Labs

---

## Current Status

### ✅ LIVE ON TESTNET!

**Unichain Sepolia Testnet is now fully integrated and operational!**

- ✅ Contracts deployed to Unichain Sepolia
- ✅ Frontend integration complete
- ✅ Backend integration complete
- ✅ Native Uniswap v4 support configured
- ✅ Ready for users to deploy tokens

### 📋 Deployed Contracts

**Unichain Sepolia Testnet (Chain ID: 1301):**
- **TokenFactory**: `0x4f3854445c33E9cf42b40B0AB36f4Dd58c23331f`
- **GlobalSupplyTracker**: `0x0D5f52088E30802DC8d5c67Bc5E2231f7ad36569`
- **CrossChainSync**: `0xa5B144683Db8fE4402B06dbb774cacD95FD1A93e`

**Explorer**: https://sepolia.uniscan.xyz

### ⏳ Coming Soon

- ⏳ Unichain mainnet launch (when available)
- ⏳ Production contracts deployment

---

## Implementation Plan

### Phase 1: Preparation (COMPLETE ✅)

**What's Done:**
- ✅ Research and analysis
- ✅ Code structure prepared
- ✅ Configuration templates ready
- ✅ Documentation created

**Files Prepared:**
- `contracts/hardhat.config.ts` - Unichain network config (placeholder)
- `frontend/src/services/blockchain.ts` - Chain config ready
- `frontend/src/pages/Builder.tsx` - Helper function updated

### Phase 2: Testnet Integration (When Available)

**What to Do:**
1. Get testnet access
2. Update configs with real values:
   - RPC endpoint URL
   - Chain ID
   - Block explorer URL
3. Deploy contracts:
   - TokenFactory
   - GlobalSupplyTracker
   - CrossChainSync
4. Test all features:
   - Token creation
   - Price sync
   - v4 graduation
   - Cross-chain messaging

**Timeline**: 1-2 weeks after testnet launch

### Phase 3: Mainnet Integration (When Live)

**What to Do:**
1. Deploy contracts to mainnet
2. Enable in UI (chain selector)
3. Update marketing materials
4. Launch and monitor

**Timeline**: 1 week after mainnet launch

---

## Configuration

### Hardhat Config (contracts/hardhat.config.ts)

```typescript
// Unichain - Uniswap Labs L2 (Native Uniswap v4 support)
unichain: {
  url: process.env.UNICHAIN_RPC_URL || "https://rpc.unichain.org",
  accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
  chainId: parseInt(process.env.UNICHAIN_CHAIN_ID || "0"), // Update when available
},
unichainTestnet: {
  url: process.env.UNICHAIN_TESTNET_RPC_URL || "https://testnet-rpc.unichain.org",
  accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
  chainId: parseInt(process.env.UNICHAIN_TESTNET_CHAIN_ID || "0"), // Update when available
},
```

### Frontend Config (frontend/src/services/blockchain.ts)

```typescript
unichain: {
  chainId: '0x...', // Update when available
  chainName: 'Unichain',
  nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
  rpcUrls: ['https://rpc.unichain.org'], // Update when available
  blockExplorerUrls: ['https://explorer.unichain.org'], // Update when available
},
```

### Environment Variables

```env
# Backend
UNICHAIN_RPC_URL=https://rpc.unichain.org
UNICHAIN_TESTNET_RPC_URL=https://testnet-rpc.unichain.org
UNICHAIN_CHAIN_ID=...
UNICHAIN_TESTNET_CHAIN_ID=...
UNICHAIN_FACTORY_ADDRESS=0x...
UNICHAIN_GLOBAL_SUPPLY_TRACKER=0x...
UNICHAIN_CROSS_CHAIN_SYNC=0x...

# Frontend
VITE_UNICHAIN_FACTORY=0x...
```

---

## DEX Integration

### Uniswap v4 on Unichain

**Native Support**: Unichain has native Uniswap v4 support, making it the perfect chain for v4 graduations.

**Benefits:**
- ✅ No fallback needed (v4 is native)
- ✅ Best v4 experience
- ✅ Lowest gas costs
- ✅ Fastest transactions

**Graduation Flow:**
1. Token reaches graduation threshold
2. System creates Uniswap v4 pool on Unichain
3. Uses CrossifyGraduationHook
4. Native v4 experience

---

## Cross-Chain Price Sync

### Integration with Existing System

Unichain is EVM-compatible and part of Optimism Superchain, so it integrates seamlessly with our cross-chain price sync system.

**How It Works:**
1. Token deployed on Unichain
2. GlobalSupplyTracker tracks supply
3. CrossChainSync enables cross-chain messaging
4. Prices sync with Ethereum, BSC, Base, Solana, Hedera

**Benefits:**
- ✅ Unified pricing across all chains
- ✅ No arbitrage opportunities
- ✅ Seamless user experience

---

## Monitoring & Updates

### How to Monitor for Launch

1. **Official Sources**
   - Unichain.org - Main website
   - Uniswap Labs Blog - Announcements
   - Unichain Documentation - Technical details

2. **Community Channels**
   - Unichain Discord/Telegram
   - Uniswap Labs social media
   - Developer forums

3. **What to Watch For**
   - Testnet launch announcement
   - Mainnet launch date
   - RPC endpoint URLs
   - Chain ID numbers
   - Documentation updates

See `UNICHAIN_MONITORING_CHECKLIST.md` for detailed monitoring guide.

---

## Benefits

### For Users

- ✅ **Ultra-low fees** - ~95% lower than Ethereum
- ✅ **Fast transactions** - 1-second blocks
- ✅ **Native v4** - Best Uniswap v4 experience
- ✅ **More options** - Another chain choice

### For Crossify

- ✅ **First mover** - First token launch platform on Unichain
- ✅ **Marketing** - "Native Uniswap v4 chain" is powerful
- ✅ **Partnership** - Uniswap Labs connection
- ✅ **Growth** - Attract v4-focused users

---

## Comparison with Other Chains

| Feature | Unichain | Base | Arbitrum | Hedera |
|---------|----------|------|----------|--------|
| **Uniswap v4 Native** | ✅ Yes | ✅ Yes | ✅ Yes | ❌ No |
| **Block Time** | 1s (200ms planned) | ~2s | ~0.25s | 3-5s |
| **Gas Fees** | ~95% lower | Low | Low | Ultra-low |
| **EVM Compatible** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **Cross-Chain** | ✅ Superchain | ✅ Yes | ✅ Yes | ⚠️ Limited |
| **Status** | ✅ Testnet Live | ✅ Live | ✅ Live | ✅ Live |

**Verdict**: Unichain is the **best choice for Uniswap v4**, but we keep Base/Arbitrum as alternatives.

---

## Next Steps

### Immediate (Done ✅)
- ✅ Research complete
- ✅ Code structure prepared
- ✅ Documentation created

### When Testnet Launches
1. Get testnet access
2. Update configs with real values
3. Deploy contracts
4. Test all features

### When Mainnet Launches
1. Deploy to mainnet
2. Enable for users
3. Market aggressively
4. Monitor and optimize

---

## Related Documentation

- [Uniswap v4 Integration](../docs/UNISWAP_V4_INTEGRATION.md)
- [DEX Graduation System](../docs/DEX_GRADUATION_COMPLETE.md)
- [Cross-Chain Price Sync](../docs/PRICE_SYNC_SYSTEM.md)
- [Unichain Research](../UNICHAIN_RESEARCH_AND_RECOMMENDATION.md)
- [Unichain Decision Summary](../UNICHAIN_DECISION_SUMMARY.md)

---

**Status**: ✅ **LIVE ON TESTNET**  
**Priority**: **High**  
**Risk**: **Low** (EVM compatible)  
**Reward**: **High** (first mover, native v4)

---

## 🎉 Benefits for Crossify Users

### Why Choose Unichain?

1. **Native Uniswap v4 Support**
   - Built specifically for Uniswap v4 by Uniswap Labs
   - Best possible v4 experience with custom hooks
   - 99% gas savings on pool creation

2. **Ultra-Low Fees**
   - ~95% lower than Ethereum
   - Perfect for token launches and trading
   - Attracts more users with lower barriers

3. **Fast Transactions**
   - 1-second block times (planning 200-250ms)
   - Better user experience
   - Competitive with Hedera

4. **First Mover Advantage**
   - First token launch platform on Unichain
   - Early access to Uniswap Labs' L2
   - Partnership potential

### How It Works

1. **Token Creation**: Users select Unichain in the chain selector
2. **Bonding Curve**: Tokens trade on bonding curve with automatic pricing
3. **Graduation**: When market cap threshold is reached, token automatically graduates to Uniswap v4 pool
4. **Trading**: Users can trade on native v4 pool with all v4 benefits

### Contract Addresses

**Unichain Sepolia Testnet:**
- TokenFactory: `0x4f3854445c33E9cf42b40B0AB36f4Dd58c23331f`
- GlobalSupplyTracker: `0x0D5f52088E30802DC8d5c67Bc5E2231f7ad36569`
- CrossChainSync: `0xa5B144683Db8fE4402B06dbb774cacD95FD1A93e`

**Network Details:**
- Chain ID: 1301 (0x515 in hex)
- RPC URL: https://sepolia.unichain.org
- Block Explorer: https://sepolia.uniscan.xyz
- Native Currency: ETH

---

*Last Updated: [Current Date]*  
*Next Review: When Unichain testnet launches*

