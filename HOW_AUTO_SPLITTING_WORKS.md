# How Automatic Fund Splitting Works

## Overview

You asked: **"Is something done with the address CEYNCD4ayxq9eQnMzg9TsTBBFLjAEBwquq7TKLDvhcG6 where any time SOL is received, it's auto split? How is this possible?"**

## Answer: It's NOT Automatic on the Blockchain

**Important**: The Solana blockchain itself does NOT automatically split funds. There's no smart contract or program on the address that automatically splits incoming SOL.

## How It Actually Works

### The Process:

1. **User Sends SOL** → SOL arrives at `CEYNCD4ayxq9eQnMzg9TsTBBFLjAEBwquq7TKLDvhcG6`
2. **Backend Service Monitors** → Our backend service (`PresaleSolanaMonitor`) continuously watches this address
3. **Transaction Detected** → When a new transaction is detected, the service:
   - Records the transaction in the database
   - Accumulates the SOL amount in `presale_unsplit_funds` table
   - Checks if accumulated amount ≥ threshold (1.0 SOL by default)
4. **Auto-Split Triggers** → If threshold is reached:
   - The `PresaleFundSplitter` service creates 3 separate Solana transactions:
     - Transfer X% to Liquidity wallet
     - Transfer Y% to Dev wallet  
     - Transfer Z% to Marketing wallet
   - These transactions are sent from the **operator wallet** (which must be the presale wallet or have authority)
5. **Funds Split** → SOL is physically moved from presale wallet to the three allocation wallets

## Technical Details

### Backend Service Architecture

```
┌─────────────────────────────────────────────────────────┐
│  PresaleSolanaMonitor (Backend Service)                │
│  - Polls Solana blockchain every 10 seconds            │
│  - Checks for new transactions to presale address       │
│  - Detects incoming SOL transfers                       │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│  PresaleFundSplitter (Backend Service)                  │
│  - Accumulates funds in database                        │
│  - Checks threshold (1.0 SOL default)                  │
│  - Creates split transactions                           │
│  - Sends SOL to 3 wallets using operator wallet        │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│  Solana Blockchain                                      │
│  - Presale Wallet: CEYNCD4ayxq9eQnMzg9TsTBBFLjAEBwquq7TKLDvhcG6 │
│  - Liquidity Wallet: 9F9vF1j2f4Feykyw2idgTcb4PMZso7EpA7BmL4cjFmdt │
│  - Dev Wallet: Bvm4pKoXXr86uPquGNvDj6FGceiitkT52kb85a13AEjC │
│  - Marketing Wallet: 3VK7LvBToxDiLjGJSpQYDf3QQs3dVprzdktXyEZfcVLn │
└─────────────────────────────────────────────────────────┘
```

### Key Components

1. **PresaleSolanaMonitor** (`backend/src/services/presaleSolanaMonitor.ts`)
   - Monitors presale address for new transactions
   - Calls `accumulateFunds()` when transaction detected
   - Calls `checkAndAutoSplit()` to trigger splitting

2. **PresaleFundSplitter** (`backend/src/services/presaleFundSplitter.ts`)
   - Tracks accumulated funds in database
   - Calculates split amounts (60/20/20)
   - Creates and sends Solana transactions
   - Requires `SOLANA_OPERATOR_PRIVATE_KEY` (presale wallet's private key)

3. **Database Tables**
   - `presale_unsplit_funds`: Tracks accumulated SOL waiting to be split
   - `presale_fund_splits`: Records all split operations with transaction hashes

## Requirements for Auto-Splitting

### 1. Backend Service Must Be Running
- The backend must be running and monitoring the presale
- Service polls every 10 seconds for new transactions

### 2. Operator Wallet Configuration
```env
SOLANA_OPERATOR_PRIVATE_KEY=your_presale_wallet_private_key
```
**Critical**: This must be the **presale wallet's private key** because:
- The operator wallet needs to transfer SOL FROM the presale wallet
- Solana requires the wallet that holds the funds to sign the transfer transaction

### 3. Wallet Addresses Configured
- Liquidity wallet address set in database
- Dev wallet address set in database
- Marketing wallet address set in database
- `auto_split_enabled = true` in presale config

### 4. Threshold Reached
- Accumulated funds must reach `split_threshold_sol` (default: 1.0 SOL)
- Prevents too many small transactions (saves on gas fees)

## Why This Approach?

### Advantages:
✅ **No Smart Contract Needed** - Simpler, no deployment costs
✅ **Flexible** - Can adjust percentages, thresholds, wallets anytime
✅ **Transparent** - All splits recorded in database with transaction hashes
✅ **Reliable** - Backend service handles all logic

### Limitations:
⚠️ **Requires Backend Running** - If backend is down, splitting pauses
⚠️ **Not Instant** - Small delay (up to 10 seconds) before split triggers
⚠️ **Requires Private Key** - Operator wallet private key must be secure

## Alternative: Smart Contract Approach

If you wanted true blockchain-level automation, you could:
1. Deploy a Solana program (smart contract)
2. Program automatically splits on every incoming transfer
3. More complex, requires program deployment
4. Less flexible (harder to change percentages)

**Current approach is recommended** because it's simpler and more flexible.

## Monitoring & Verification

### Check Split History
```bash
GET /api/presale/default/splits
```

### Check Accumulated Funds
```bash
GET /api/presale/default/unsplit
```

### View Transaction on Solana
All split transactions are recorded with hashes. You can verify on Solscan:
- Each split creates 3 transactions (one to each wallet)
- Transaction hashes stored in `presale_fund_splits` table

## Summary

**Auto-splitting is NOT automatic on the blockchain level.** Instead:

1. ✅ Backend service monitors the presale address
2. ✅ When SOL is received, it's tracked in the database
3. ✅ When threshold is reached, backend creates 3 transactions
4. ✅ Backend sends transactions using operator wallet (presale wallet's private key)
5. ✅ SOL is physically moved to the 3 allocation wallets

This is a **backend-driven automation**, not a blockchain smart contract. The backend service acts as an automated manager that watches and splits funds according to your tokenomics.

