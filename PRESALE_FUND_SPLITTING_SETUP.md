# Presale Fund Splitting Setup Guide

## Overview

The presale system includes an automated fund splitting mechanism that distributes incoming SOL from presale purchases to different wallets based on your tokenomics configuration.

## How It Works

### 1. **Fund Splitting Architecture**

The system is designed to:
- **Track** all incoming SOL transactions to the presale wallet
- **Accumulate** funds until a threshold is reached
- **Automatically split** funds to three separate wallets:
  - **Liquidity Wallet** (60% by default)
  - **Dev Wallet** (20% by default)
  - **Marketing Wallet** (20% by default)

### 2. **Current Configuration**

Based on your `CFY_PRESALE_CONFIG.json`:
- **Liquidity**: 60% of raised SOL
- **Dev**: 20% of raised SOL
- **Marketing**: 20% of raised SOL
- **Affiliate Rewards**: 5% (handled separately, deducted from total before splitting)

### 3. **Database Schema**

The system uses three main database tables:

#### `presale_config` (Extended)
- `liquidity_wallet` - Solana address for liquidity funds
- `dev_wallet` - Solana address for development funds
- `marketing_wallet` - Solana address for marketing funds
- `auto_split_enabled` - Boolean to enable/disable auto-splitting
- `split_threshold_sol` - Minimum SOL amount before splitting (default: 1.0 SOL)

#### `presale_fund_splits`
Tracks each split operation:
- Total SOL amount split
- Amounts sent to each wallet
- Transaction hashes for each transfer
- Status (pending, completed, failed)

#### `presale_unsplit_funds`
Tracks accumulated funds waiting to be split:
- `accumulated_sol` - Total SOL waiting to be split
- Updated when new transactions are detected

## What You Need to Set Up

### ✅ **YES, You Need Separate Wallets**

You need to configure **three separate Solana wallet addresses**:

1. **Liquidity Wallet** - Where 60% of funds go (for adding liquidity to DEX)
2. **Dev Wallet** - Where 20% of funds go (for development expenses)
3. **Marketing Wallet** - Where 20% of funds go (for marketing expenses)

### 🔧 **Configuration Steps**

#### Step 1: Create/Get Your Wallet Addresses

You need three Solana wallet addresses. You can:
- Create new wallets using Phantom, Solflare, or CLI
- Use existing wallets (make sure you control the private keys)

**Example:**
```
Liquidity Wallet:  ABC123...xyz (60% of funds)
Dev Wallet:        DEF456...uvw (20% of funds)
Marketing Wallet:  GHI789...rst (20% of funds)
```

#### Step 2: Update Presale Configuration

You need to update your presale configuration in the database to add these wallet addresses. Currently, there's no API endpoint for this, so you'll need to:

**Option A: Direct SQL Update**
```sql
UPDATE presale_config 
SET 
  liquidity_wallet = 'YOUR_LIQUIDITY_WALLET_ADDRESS',
  dev_wallet = 'YOUR_DEV_WALLET_ADDRESS',
  marketing_wallet = 'YOUR_MARKETING_WALLET_ADDRESS',
  auto_split_enabled = true,
  split_threshold_sol = 1.0
WHERE id = 'default';  -- or your presale ID
```

**Option B: Add API Endpoint** (Recommended)
We should add a PATCH endpoint to update these settings.

#### Step 3: Configure Operator Wallet

The fund splitter needs an **operator wallet** that can transfer SOL from the presale wallet. This is set via environment variable:

```env
SOLANA_OPERATOR_PRIVATE_KEY=your_private_key_here
```

**Important Security Note:**
- The operator wallet must be the **presale wallet itself** OR
- The operator wallet must have authority to transfer from the presale wallet
- Currently, the code assumes the operator wallet = presale wallet

#### Step 4: Enable Auto-Splitting

Set `auto_split_enabled = true` in the presale config to automatically split funds when the threshold is reached.

## How Funds Are Split

### Example Calculation

If you receive **10 SOL** in a presale transaction:

1. **Affiliate Reward** (if applicable): 5% = 0.5 SOL → Goes to affiliate
2. **Remaining**: 9.5 SOL
3. **Split Calculation**:
   - Liquidity: 9.5 × 60% = **5.7 SOL** → Liquidity Wallet
   - Dev: 9.5 × 20% = **1.9 SOL** → Dev Wallet
   - Marketing: 9.5 × 20% = **1.9 SOL** → Marketing Wallet

### Splitting Process

1. **Accumulation**: When a new transaction is detected, funds are accumulated in `presale_unsplit_funds`
2. **Threshold Check**: When accumulated funds ≥ `split_threshold_sol`, splitting is triggered
3. **Transfer**: Three separate Solana transactions are created:
   - Transfer to liquidity wallet
   - Transfer to dev wallet
   - Transfer to marketing wallet
4. **Tracking**: All transfers are recorded in `presale_fund_splits` with transaction hashes

## Current Status

### ✅ What's Implemented

- [x] Database schema for fund splitting
- [x] `PresaleFundSplitter` service class
- [x] Split calculation logic
- [x] Manual split function (`splitFunds()`)
- [x] Auto-split check function (`checkAndAutoSplit()`)
- [x] Fund accumulation tracking

### ⚠️ What's Missing

- [ ] **Integration with Presale Monitor**: The monitor doesn't call the fund splitter when transactions are detected
- [ ] **API Endpoint**: No endpoint to update wallet addresses
- [ ] **API Endpoint**: No endpoint to manually trigger splits
- [ ] **API Endpoint**: No endpoint to view split history

## Next Steps

### 1. Integrate Fund Splitter with Monitor

The `presaleSolanaMonitor.ts` should call the fund splitter when transactions are detected:

```typescript
// In recordTransaction() method, after recording transaction:
import { getPresaleFundSplitter } from './presaleFundSplitter';

// Accumulate funds
const splitter = getPresaleFundSplitter();
await splitter.accumulateFunds(presaleId, transaction.sol_amount, transactionId);

// Check if auto-split should trigger
await splitter.checkAndAutoSplit(presaleId);
```

### 2. Add API Endpoints

Add endpoints to:
- `PATCH /api/presale/:id/wallets` - Update wallet addresses
- `POST /api/presale/:id/split` - Manually trigger split
- `GET /api/presale/:id/splits` - View split history
- `GET /api/presale/:id/unsplit` - View accumulated unsplit funds

### 3. Configure Your Wallets

Once endpoints are added, configure your three wallet addresses in the presale config.

## Security Considerations

1. **Operator Wallet**: Must be secure and backed up
2. **Wallet Addresses**: Double-check addresses before configuring (no way to recover if wrong)
3. **Threshold**: Set appropriate threshold to avoid too many small transactions (gas costs)
4. **Testing**: Test on devnet first before mainnet

## Manual Split (Current Workaround)

If you need to manually split funds right now, you can call the service directly:

```typescript
import { getPresaleFundSplitter } from './services/presaleFundSplitter';

const splitter = getPresaleFundSplitter();
const result = await splitter.splitFunds('default', 10.0); // Split 10 SOL
```

## Summary

**Yes, you need three separate wallets** for:
- Liquidity (60%)
- Dev (20%)
- Marketing (20%)

The system is **mostly implemented** but needs:
1. Integration with the transaction monitor
2. API endpoints for configuration and management
3. Your wallet addresses configured in the database

Once configured, funds will automatically split when the threshold is reached!

