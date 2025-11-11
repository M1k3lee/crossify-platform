# Solana Presale System - Complete Guide

## Overview

This is a comprehensive presale system for Solana tokens that includes:
- ✅ Real-time Solana transaction monitoring
- ✅ Automatic token allocation tracking
- ✅ Affiliate/referral system with rewards
- ✅ Tokenomics configuration for liquidity, dev, and marketing
- ✅ Beautiful, modern presale page with real-time updates
- ✅ Complete transaction history for all contributors

## What You Need to Provide

### 1. Solana Wallet Address
You need a Solana wallet address to receive presale payments. This should be:
- A secure wallet (preferably a hardware wallet or a dedicated wallet for the presale)
- The address where all SOL contributions will be sent
- **Important**: Keep the private key secure! This wallet will receive all presale funds.

### 2. Token Information
- Token name (e.g., "My Awesome Token")
- Token symbol (e.g., "MAT")
- Total tokens allocated for presale (e.g., "1000000000")
- Presale price per token in SOL (e.g., 0.001)

### 3. Presale Configuration
- Minimum purchase amount in SOL (e.g., 0.1)
- Maximum purchase amount in SOL (optional, leave null for unlimited)
- Start date (optional)
- End date (optional)

### 4. Tokenomics Percentages
The system automatically splits raised SOL into:
- **Liquidity Percentage**: % for adding liquidity when token launches (default: 60%)
- **Development Percentage**: % for paying developers (default: 20%)
- **Marketing Percentage**: % for advertising (default: 20%)
- **Affiliate Reward Percentage**: % of each referral's purchase as reward (default: 5%)

These must sum to 100% (excluding affiliate rewards which come from the purchase amount).

## How It Works

### 1. Transaction Monitoring
- The system continuously monitors your Solana wallet address
- When SOL is received, it automatically:
  - Records the transaction
  - Calculates token allocation based on presale price
  - Updates user allocations
  - Processes affiliate rewards if a referral code was used

### 2. Referral System
- Users can create referral codes
- When someone uses a referral code (in transaction memo: `REF:CODE`), the referrer earns a percentage
- Affiliates can track their referrals and earnings

### 3. Token Allocation
- Each contributor's allocation is tracked in real-time
- Users can see their total SOL contributed and tokens allocated
- All transactions are recorded and visible

### 4. Tokenomics Distribution
When the presale ends and you're ready to launch:
- The raised SOL is split according to your tokenomics
- You can use the liquidity portion to add liquidity to a DEX
- Dev and marketing portions can be withdrawn as needed

## Setup Instructions

### Step 1: Database Migration
The database tables are automatically created when the backend starts. If you need to run migrations manually:

```bash
cd backend
# The schema is initialized automatically in postgres.ts
```

### Step 2: Environment Variables
Add to your backend `.env`:

```env
# Solana RPC URL (use mainnet for production)
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com

# Optional: Solana private key (only if you need to send transactions)
# SOLANA_PRIVATE_KEY=your_base58_private_key
```

### Step 3: Create a Presale

#### Option A: Using the API
```bash
curl -X POST http://localhost:3001/api/presale \
  -H "Content-Type: application/json" \
  -d '{
    "token_symbol": "MAT",
    "token_name": "My Awesome Token",
    "solana_address": "YOUR_SOLANA_WALLET_ADDRESS",
    "presale_price": 0.001,
    "total_tokens_for_presale": "1000000000",
    "min_purchase_sol": 0.1,
    "max_purchase_sol": 100,
    "liquidity_percentage": 60,
    "dev_percentage": 20,
    "marketing_percentage": 20,
    "affiliate_reward_percentage": 5
  }'
```

#### Option B: Direct Database Insert (for testing)
You can also insert directly into the database if needed.

### Step 4: Activate the Presale
```bash
curl -X PATCH http://localhost:3001/api/presale/PRESALE_ID/status \
  -H "Content-Type: application/json" \
  -d '{"status": "active"}'
```

This will start monitoring the Solana address for incoming transactions.

### Step 5: Access the Presale Page
Navigate to: `http://localhost:3000/presale?id=PRESALE_ID`

Or if you have a default presale, just: `http://localhost:3000/presale`

## API Endpoints

### Presale Management
- `GET /api/presale` - Get all presales or specific presale by `?id=PRESALE_ID`
- `POST /api/presale` - Create a new presale
- `PATCH /api/presale/:id/status` - Update presale status
- `GET /api/presale/:id/stats` - Get presale statistics

### Transactions
- `GET /api/presale/:id/transactions` - Get all transactions
- `POST /api/presale/:id/process-transaction` - Manually process a transaction by hash

### Allocations
- `GET /api/presale/:id/allocations` - Get all allocations or specific user by `?address=WALLET_ADDRESS`

### Affiliates
- `POST /api/presale/:id/affiliates` - Create an affiliate referral code
- `GET /api/presale/:id/affiliates` - Get all affiliates or specific by `?code=REFERRAL_CODE`

## How Users Participate

1. **Visit the presale page** and connect their Solana wallet (Phantom, etc.)
2. **Copy the presale address** shown on the page
3. **Send SOL** from their wallet to the presale address
   - Minimum: As specified in presale config
   - Maximum: As specified (or unlimited)
   - Optional: Include referral code in memo: `REF:CODE`
4. **View their allocation** - The page automatically updates to show their contribution
5. **Track transactions** - All their transactions are visible with links to Solscan

## Referral System

### For Affiliates:
1. Create a referral code via API or have an admin create it
2. Share the referral link: `https://yoursite.com/presale?id=PRESALE_ID&ref=YOUR_CODE`
3. Earn a percentage of every purchase made through your link
4. Track your referrals and earnings on the presale page

### For Buyers:
1. Use a referral link or add `REF:CODE` to your transaction memo
2. The referrer automatically earns their reward
3. Your purchase is tracked normally

## Token Distribution After Presale

When you're ready to launch your token:

1. **Calculate allocations**: Each user's `total_tokens_allocated` from `presale_allocations` table
2. **Deploy your token** on Solana mainnet
3. **Distribute tokens**: Send tokens to each buyer's address from `presale_allocations.buyer_address`
4. **Add liquidity**: Use the liquidity portion of raised SOL to create a liquidity pool
5. **Update allocations**: Mark tokens as claimed in the database

### Example Distribution Script
```typescript
// Pseudo-code for token distribution
const allocations = await getAllocations(presaleId);
for (const allocation of allocations) {
  await sendTokens(
    allocation.buyer_address,
    allocation.total_tokens_allocated
  );
  await markAsClaimed(allocation.id);
}
```

## Monitoring & Maintenance

### Check Presale Status
```bash
curl http://localhost:3001/api/presale/PRESALE_ID/stats
```

### View Recent Transactions
```bash
curl http://localhost:3001/api/presale/PRESALE_ID/transactions?limit=10
```

### Manual Transaction Processing
If a transaction wasn't automatically detected:
```bash
curl -X POST http://localhost:3001/api/presale/PRESALE_ID/process-transaction \
  -H "Content-Type: application/json" \
  -d '{"tx_hash": "TRANSACTION_HASH"}'
```

## Security Considerations

1. **Wallet Security**: The presale wallet should be highly secure (hardware wallet recommended)
2. **Private Keys**: Never expose your Solana private key in environment variables unless absolutely necessary
3. **Rate Limiting**: The API has rate limiting enabled (100 requests per 15 minutes)
4. **Transaction Verification**: All transactions are verified on-chain before being recorded
5. **Duplicate Prevention**: The system prevents duplicate transaction processing

## Troubleshooting

### Transactions Not Being Detected
1. Check that the presale status is "active"
2. Verify the Solana RPC URL is correct and accessible
3. Check backend logs for errors
4. Manually process the transaction using the API endpoint

### Allocation Not Showing
1. Ensure the wallet is connected
2. Check that transactions are confirmed (status = "confirmed")
3. Refresh the page (auto-refreshes every 10 seconds)

### RPC Rate Limits
If you hit Solana RPC rate limits:
- Use a paid RPC provider (Helius, QuickNode, etc.)
- Update `SOLANA_RPC_URL` in environment variables

## Next Steps

1. **Create your presale** using the API
2. **Test with small amounts** on devnet first
3. **Set up monitoring** to track presale progress
4. **Create affiliate codes** for your marketing team
5. **Launch the presale page** and start accepting contributions
6. **Monitor transactions** and allocations
7. **Prepare token distribution** for when presale ends

## Questions?

The system is designed to be:
- **Automatic**: Monitors transactions in real-time
- **Transparent**: All transactions are recorded and visible
- **Flexible**: Configurable tokenomics and limits
- **Scalable**: Handles multiple presales and many transactions

For issues or questions, check the backend logs and API responses for detailed error messages.

