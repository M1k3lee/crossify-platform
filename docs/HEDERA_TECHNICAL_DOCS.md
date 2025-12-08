# Hedera Technical Documentation

## Overview

Hedera is now fully integrated into Crossify.io as the 5th supported blockchain. This document provides technical details for developers and system administrators.

---

## Network Configuration

### Testnet
- **Network Name:** Hedera Testnet
- **Chain ID:** 296
- **RPC URL:** `https://testnet.hashio.io/api`
- **Explorer:** https://hashscan.io/testnet
- **Native Currency:** HBAR
- **Account Format:** `0.0.xxxxx` (Hedera Account ID)
- **EVM Address Format:** `0x...` (EVM-compatible address)

### Mainnet
- **Network Name:** Hedera Mainnet
- **Chain ID:** 295
- **RPC URL:** `https://mainnet.hashio.io/api`
- **Explorer:** https://hashscan.io

---

## Deployed Contracts

### GlobalSupplyTracker
**Address (Testnet):** `0xc443F7e5F0e62C4803030E938d5Cc762F0829A02`  
**HashScan:** https://hashscan.io/testnet/address/0xc443F7e5F0e62C4803030E938d5Cc762F0829A02

**Purpose:** Tracks global token supply across all chains for unified pricing.

**Key Functions:**
- `updateSupply(address tokenId, string chain, uint256 newSupply)` - Update supply for a chain
- `getGlobalSupply(address tokenId)` - Get total supply across all chains
- `setCrossChainSync(address _crossChainSync)` - Configure cross-chain messaging

### TokenFactory
**Address (Testnet):** `0x1f1f75d84CB2Ff86ffe2b8Fb3eb0d2e94438433D`  
**HashScan:** https://hashscan.io/testnet/address/0x1f1f75d84CB2Ff86ffe2b8Fb3eb0d2e94438433D

**Purpose:** Factory contract for creating tokens and bonding curves on Hedera.

**Key Functions:**
- `createToken(...)` - Create new token with bonding curve
- `getTokenCount()` - Get total tokens created
- `getToken(address tokenAddress)` - Get token details

---

## Environment Variables

### Backend Configuration

```env
# Hedera RPC
HEDERA_RPC_URL=https://testnet.hashio.io/api
HEDERA_TESTNET_RPC_URL=https://testnet.hashio.io/api

# Hedera Account
HEDERA_ACCOUNT_ID=0.0.7268944
HEDERA_PRIVATE_KEY=0xfe34316bfc0d64e2470214427bffae181c99b1cbacaa61d206c3a8bf182c22ee

# Contract Addresses
HEDERA_FACTORY_ADDRESS=0x1f1f75d84CB2Ff86ffe2b8Fb3eb0d2e94438433D

# Optional: HCS Audit Logging (Phase 2)
HEDERA_HCS_TOPIC_ID=0.0.xxxxx
```

### Frontend Configuration

```env
VITE_HEDERA_FACTORY=0x1f1f75d84CB2Ff86ffe2b8Fb3eb0d2e94438433D
```

---

## Technical Specifications

### Performance Metrics
- **Transactions Per Second:** 10,000+ TPS
- **Finality Time:** 3-5 seconds
- **Transaction Cost:** ~$0.0001 per transaction
- **Energy Efficiency:** Carbon-negative (removes more CO2 than it produces)

### EVM Compatibility
- **Solidity Version:** 0.8.20
- **EVM Target:** Paris (latest)
- **Contract Size Limit:** 24,576 bytes (Spurious Dragon limit)
- **Gas Model:** Similar to Ethereum (but much cheaper)

### Network Features
- **Consensus:** Hashgraph (not blockchain)
- **Finality:** Instant finality (3-5 seconds)
- **Fees:** Fixed, predictable fees
- **Governance:** Council-based (Google, IBM, etc.)

---

## Integration Details

### Smart Contract Deployment

Hedera uses EVM-compatible smart contracts, so your existing Solidity contracts work with minimal modifications:

```solidity
// Your contracts work on Hedera just like Ethereum
contract MyToken is ERC20 {
    // Standard ERC20 implementation
    // Works on Hedera without changes
}
```

### Cross-Chain Messaging

**Current Status:** LayerZero support for Hedera is being verified.

**Options:**
1. **LayerZero** (if supported) - Primary messaging protocol
2. **Chainlink CCIP** - Backup/alternative (Hedera has CCIP integration)
3. **Hedera Consensus Service (HCS)** - For audit logging (Phase 2)

### Price Synchronization

Hedera tokens participate in the global supply tracking system:

1. **Local Supply Tracking:** Each Hedera deployment tracks local supply
2. **Global Supply Calculation:** Backend sums all chains (Ethereum + BSC + Base + Solana + Hedera)
3. **Unified Pricing:** All chains use the same global supply for price calculation
4. **Cross-Chain Sync:** When supply changes on Hedera, it syncs to other chains (and vice versa)

---

## Deployment Process

### Prerequisites
1. Hedera account (Account ID: `0.0.xxxxx`)
2. Testnet HBAR (get from https://portal.hedera.com/)
3. Private key (hex format)

### Deployment Steps

```bash
# 1. Configure environment
cd contracts
# Add to .env:
HEDERA_PRIVATE_KEY=0x...
HEDERA_TESTNET_RPC_URL=https://testnet.hashio.io/api

# 2. Deploy contracts
npx hardhat run scripts/deploy-hedera.ts --network hederaTestnet

# 3. Save contract addresses
# Update backend/.env and frontend environment variables
```

### Contract Verification

Contracts can be verified on HashScan (similar to Etherscan):
- Visit: https://hashscan.io/testnet
- Search for contract address
- Click "Verify Contract"
- Upload source code and constructor arguments

---

## Backend Integration

### HederaService

The backend includes a `HederaService` class that implements the `BlockchainService` interface:

```typescript
// backend/src/services/blockchain/hedera.ts
export class HederaService implements BlockchainService {
  // EVM-compatible, uses ethers.js
  // Same interface as EthereumService, BSCService, etc.
}
```

### Usage

```typescript
import { getBlockchainService } from './services/blockchain';

const hederaService = getBlockchainService('hedera');
const balance = await hederaService.getBalance(address);
```

---

## Frontend Integration

### Chain Configuration

Hedera is configured in the frontend blockchain service:

```typescript
// frontend/src/services/blockchain.ts
const CHAIN_CONFIGS = {
  hedera: {
    chainId: '0x128', // 296 in hex
    chainName: 'Hedera Testnet',
    nativeCurrency: { name: 'HBAR', symbol: 'HBAR', decimals: 18 },
    rpcUrls: ['https://testnet.hashio.io/api'],
    blockExplorerUrls: ['https://hashscan.io/testnet'],
  },
};
```

### Wallet Support

**MetaMask:** Hedera is EVM-compatible, so MetaMask works (may need network added manually)

**HashPack:** Native Hedera wallet (recommended for best experience)

---

## Cross-Chain Price Sync with Hedera

### How It Works

1. **User buys tokens on Hedera:**
   - BondingCurve contract updates local supply
   - Emits `SupplyUpdated` event

2. **Backend receives event:**
   - Updates Hedera supply in database
   - Recalculates global supply (Ethereum + BSC + Base + Solana + Hedera)

3. **Cross-chain sync:**
   - If LayerZero supports Hedera: Broadcast via LayerZero
   - If not: Use Chainlink CCIP or backend API updates
   - All chains receive new global supply

4. **Price updates everywhere:**
   - All chains query global supply
   - Calculate price using same formula
   - Price = basePrice + (slope × globalSupply)

### Example Flow

```
Hedera: User buys 100 tokens
  ↓
Local Supply: 100
  ↓
Backend: Global Supply = 2,000 + 100 = 2,100
  ↓
LayerZero/CCIP: Broadcast to Ethereum, BSC, Base, Solana
  ↓
All Chains: Price = $0.001 + ($0.0001 × 2,100) = $0.211
  ↓
✅ Same price on all 5 chains!
```

---

## Hedera Consensus Service (HCS) - ✅ Implemented

### Overview

HCS provides immutable, timestamped audit logs for all cross-chain events.

### Implementation Status

**✅ Fully Implemented:** `backend/src/services/hederaAudit.ts`

**Features:**
- `logPriceSyncEvent()` - Log cross-chain price syncs
- `logBondingCurveTransaction()` - Log buy/sell transactions
- Immutable, verifiable timestamps
- ~$0.0001 per message
- Automatically logs all price sync events and bonding curve transactions

### Usage

```typescript
import { initializeHederaAudit } from './services/hederaAudit';

// At app startup (already initialized in index.ts)
await initializeHederaAudit();

// Log events (automatically called by backend services)
const auditService = getHederaAuditService();
await auditService.logPriceSyncEvent({
  tokenAddress: '0x...',
  sourceChain: 'hedera',
  targetChains: ['ethereum', 'bsc'],
  oldGlobalSupply: '2000',
  newGlobalSupply: '2100',
  timestamp: Date.now(),
});
```

---

## Hedera File Service (HFS) - ✅ Implemented

### Overview

HFS provides decentralized, immutable file storage for token metadata (logos, banners, etc.).

### Implementation Status

**✅ Fully Implemented:** `backend/src/services/hederaFileService.ts`

**Features:**
- `uploadTokenLogo()` - Upload token logos to HFS
- `uploadTokenBanner()` - Upload token banners to HFS
- `uploadTokenMetadata()` - Upload metadata JSON to HFS
- `getFile()` - Retrieve files from HFS
- `getFileUrl()` - Get public URL via Mirror Node
- Automatic fallback to Cloudinary/local storage if HFS unavailable

### Benefits

- **Decentralized:** No single point of failure
- **Immutable:** Files cannot be deleted or modified
- **Low Cost:** ~$0.001 per file (one-time, no monthly fees)
- **Permanent:** Files never disappear (unlike IPFS which requires pinning)
- **Enterprise-Grade:** Same infrastructure as Fortune 500 companies

### Cost Comparison

| Storage Solution | Cost per File | Monthly Fees |
|-----------------|---------------|--------------|
| Cloudinary | ~$0.10-0.50 | Yes |
| IPFS Pinning | ~$0.10-0.20 | Yes |
| **Hedera HFS** | **~$0.001** | **No** |

### Usage

```typescript
import { getHederaFileService } from './services/hederaFileService';

// At app startup (already initialized in index.ts)
await initializeHederaFileService();

// Upload logo
const fileService = getHederaFileService();
const result = await fileService.uploadTokenLogo(
  fileBuffer,
  tokenId,
  filename
);

// Result contains:
// - fileId: "0.0.xxxxx" (Hedera File ID)
// - url: Public URL via Mirror Node
// - storage: "hedera"
```

### File Access

Files uploaded to HFS are accessible via Hedera Mirror Node:

**Testnet:**
```
https://testnet.mirrornode.hedera.com/api/v1/files/{fileId}
```

**Mainnet:**
```
https://mainnet-public.mirrornode.hedera.com/api/v1/files/{fileId}
```

### Integration

HFS is automatically used when uploading logos/banners via `/api/upload/logo` and `/api/upload/banner` endpoints. The system:

1. **First tries HFS** (if configured and available)
2. **Falls back to Cloudinary** (if HFS unavailable)
3. **Falls back to local storage** (if both unavailable)

This ensures seamless operation regardless of storage backend availability.

---

## Troubleshooting

### Contract Deployment Issues

**Problem:** Contract size exceeds 24KB limit  
**Solution:** Optimize with `runs: 1` in Hardhat config

**Problem:** Gas price too low  
**Solution:** Remove `gasPrice` from Hardhat config (let Hedera determine)

**Problem:** Transaction reverted  
**Solution:** Check contract constructor parameters match deployment script

### RPC Connection Issues

**Problem:** Cannot connect to RPC  
**Solution:** 
- Verify RPC URL: `https://testnet.hashio.io/api`
- Check network connectivity
- Try alternative RPC endpoints

### Account Issues

**Problem:** Invalid account ID  
**Solution:** 
- Ensure format is `0.0.xxxxx`
- Verify account exists on HashScan
- Check you're using testnet account for testnet

---

## Resources

- **Hedera Portal:** https://portal.hedera.com/
- **HashScan Explorer:** https://hashscan.io/testnet
- **Hedera Docs:** https://docs.hedera.com/
- **Hedera SDK:** https://github.com/hashgraph/hedera-sdk-js
- **HCS Documentation:** https://docs.hedera.com/hedera/core-concepts/consensus-service
- **EVM Compatibility:** https://docs.hedera.com/hedera/smart-contracts/getting-started-smart-contracts

---

## Contract Addresses Summary

### Testnet Deployments

| Contract | Address | HashScan |
|----------|---------|----------|
| GlobalSupplyTracker | `0xc443F7e5F0e62C4803030E938d5Cc762F0829A02` | [View](https://hashscan.io/testnet/address/0xc443F7e5F0e62C4803030E938d5Cc762F0829A02) |
| TokenFactory | `0x1f1f75d84CB2Ff86ffe2b8Fb3eb0d2e94438433D` | [View](https://hashscan.io/testnet/address/0x1f1f75d84CB2Ff86ffe2b8Fb3eb0d2e94438433D) |

### Account Information

- **Account ID:** `0.0.7268944`
- **EVM Address:** `0x30314630fEb44E1b1DF77397906240Ff5c40F6D2`
- **View on HashScan:** https://hashscan.io/testnet/account/0.0.7268944

---

**Last Updated:** December 2024  
**Status:** ✅ Fully Integrated and Deployed

