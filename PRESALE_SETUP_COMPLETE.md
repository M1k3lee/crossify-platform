# Presale Setup Complete - Fund Splitting & Token Distribution

## ✅ What's Been Implemented

### 1. Fund Splitting System
- ✅ Automatic fund splitting to three wallets (Liquidity, Dev, Marketing)
- ✅ Integration with transaction monitor (auto-splits when threshold reached)
- ✅ API endpoints for manual splitting and monitoring
- ✅ Database tracking of all splits

### 2. Token Distribution System
- ✅ Automated CFY token distribution to presale buyers
- ✅ Batch distribution with configurable batch sizes
- ✅ TGE (Token Generation Event) distribution (20% immediate release)
- ✅ Status tracking and unclaimed allocations monitoring

## 🎯 Your Wallet Configuration

Your presale is now configured with these wallet addresses:

- **Liquidity Wallet**: `9F9vF1j2f4Feykyw2idgTcb4PMZso7EpA7BmL4cjFmdt` (60% of funds)
- **Dev Wallet**: `Bvm4pKoXXr86uPquGNvDj6FGceiitkT52kb85a13AEjC` (20% of funds)
- **Marketing Wallet**: `3VK7LvBToxDiLjGJSpQYDf3QQs3dVprzdktXyEZfcVLn` (20% of funds)

## 📋 Setup Steps

### Step 1: Update Presale Configuration

Run the wallet update script:

**Windows (PowerShell):**
```powershell
.\update-presale-wallets.ps1
```

**Linux/Mac (Bash):**
```bash
chmod +x update-presale-wallets.sh
./update-presale-wallets.sh
```

Or manually via API:
```bash
curl -X PATCH http://localhost:3001/api/presale/default/wallets \
  -H "Content-Type: application/json" \
  -d '{
    "liquidity_wallet": "9F9vF1j2f4Feykyw2idgTcb4PMZso7EpA7BmL4cjFmdt",
    "dev_wallet": "Bvm4pKoXXr86uPquGNvDj6FGceiitkT52kb85a13AEjC",
    "marketing_wallet": "3VK7LvBToxDiLjGJSpQYDf3QQs3dVprzdktXyEZfcVLn",
    "auto_split_enabled": true,
    "split_threshold_sol": 1.0
  }'
```

### Step 2: Configure Environment Variables

Make sure your backend has these environment variables set:

```env
# Solana RPC URL
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com

# Operator wallet (MUST be the presale wallet's private key)
# This wallet needs to be able to transfer SOL from the presale wallet
SOLANA_OPERATOR_PRIVATE_KEY=your_presale_wallet_private_key_here

# For token distribution (after CFY token is deployed)
CFY_TOKEN_MINT_ADDRESS=your_cfy_token_mint_address
SOLANA_DISTRIBUTOR_PRIVATE_KEY=wallet_that_holds_cfy_tokens_private_key
```

**Important**: The `SOLANA_OPERATOR_PRIVATE_KEY` must be the **presale wallet's private key** (the wallet that receives SOL from buyers). This is because the operator needs to transfer SOL from the presale wallet to the three allocation wallets.

### Step 3: Verify Configuration

Check that wallets are configured:
```bash
curl http://localhost:3001/api/presale/default
```

You should see:
- `liquidity_wallet`: Your liquidity wallet address
- `dev_wallet`: Your dev wallet address
- `marketing_wallet`: Your marketing wallet address
- `auto_split_enabled`: `true`
- `split_threshold_sol`: `1.0`

## 🔄 How Fund Splitting Works

### Automatic Splitting

1. **Transaction Detected**: When a buyer sends SOL to the presale wallet, the monitor detects it
2. **Funds Accumulated**: The SOL amount is added to `presale_unsplit_funds`
3. **Threshold Check**: When accumulated funds ≥ `split_threshold_sol` (1.0 SOL), splitting triggers
4. **Split Calculation**: Funds are split according to percentages:
   - 60% → Liquidity Wallet
   - 20% → Dev Wallet
   - 20% → Marketing Wallet
5. **Transfers**: Three separate Solana transactions are created and sent
6. **Tracking**: All splits are recorded in `presale_fund_splits` table

### Manual Splitting

You can manually trigger a split at any time:

```bash
curl -X POST http://localhost:3001/api/presale/default/split \
  -H "Content-Type: application/json" \
  -d '{"amount": 10.0}'
```

This will split 10 SOL immediately (or all accumulated funds if no amount specified).

### Monitoring Splits

View split history:
```bash
curl http://localhost:3001/api/presale/default/splits
```

View accumulated unsplit funds:
```bash
curl http://localhost:3001/api/presale/default/unsplit
```

## 🪙 Token Distribution System

### How Allocations Are Tracked

All presale buyers' token allocations are automatically tracked in the `presale_allocations` table:
- `buyer_address`: Buyer's Solana wallet address
- `total_tokens_allocated`: Total CFY tokens they purchased
- `total_sol_contributed`: Total SOL they sent
- `tokens_claimed`: Whether tokens have been distributed
- `tokens_claimed_at`: When tokens were distributed

### Distribution Methods

#### 1. TGE Distribution (Recommended First Step)

Distribute 20% of tokens immediately at Token Generation Event:

```bash
curl -X POST http://localhost:3001/api/presale/default/distribute-tokens \
  -H "Content-Type: application/json" \
  -d '{
    "tge_only": true,
    "tge_percentage": 20
  }'
```

This will:
- Calculate 20% of each buyer's allocation
- Send tokens to each buyer's wallet
- Mark allocations as claimed (for TGE portion)

#### 2. Full Batch Distribution

Distribute all remaining tokens to all buyers:

```bash
curl -X POST http://localhost:3001/api/presale/default/distribute-tokens \
  -H "Content-Type: application/json" \
  -d '{
    "batch_size": 10,
    "max_recipients": 100
  }'
```

Parameters:
- `batch_size`: Number of recipients per batch (default: 10)
- `max_recipients`: Maximum number of recipients to process (optional, for testing)

#### 3. Individual Distribution

For specific buyers, you can use the service directly in code or create a custom endpoint.

### Distribution Status

Check distribution progress:

```bash
curl http://localhost:3001/api/presale/default/distribution-status
```

Response:
```json
{
  "total_buyers": 150,
  "claimed_buyers": 120,
  "unclaimed_buyers": 30,
  "total_tokens": "1000000000",
  "claimed_tokens": "800000000",
  "unclaimed_tokens": "200000000"
}
```

### Unclaimed Allocations

View buyers who haven't received tokens yet:

```bash
curl http://localhost:3001/api/presale/default/unclaimed-allocations?limit=50
```

## 🚀 Token Distribution Workflow

### Recommended Approach

1. **After Presale Ends**:
   - Verify all allocations are correct
   - Check distribution status

2. **Deploy CFY Token**:
   - Deploy CFY as SPL token on Solana
   - Set `CFY_TOKEN_MINT_ADDRESS` environment variable
   - Transfer presale allocation (300M CFY) to distributor wallet
   - Set `SOLANA_DISTRIBUTOR_PRIVATE_KEY` to wallet holding tokens

3. **TGE Distribution** (20% immediate):
   ```bash
   curl -X POST http://localhost:3001/api/presale/default/distribute-tokens \
     -H "Content-Type: application/json" \
     -d '{"tge_only": true, "tge_percentage": 20}'
   ```

4. **Set Up Vesting** (for remaining 80%):
   - Use existing vesting system: `/api/cfy/vesting/initialize-from-presale`
   - This creates vesting schedules for all buyers
   - Remaining 80% will be released over 18 months

5. **Monthly Releases**:
   - Vesting system handles monthly releases automatically
   - Or use vesting API to release manually

### Alternative: Direct Full Distribution

If you want to distribute all tokens immediately (no vesting):

```bash
curl -X POST http://localhost:3001/api/presale/default/distribute-tokens \
  -H "Content-Type: application/json" \
  -d '{"batch_size": 10}'
```

This will send 100% of tokens to all buyers.

## 📊 Best Practices

### Fund Splitting

1. **Test First**: Test with a small amount before going live
2. **Monitor Threshold**: Adjust `split_threshold_sol` based on transaction volume
   - Higher threshold = fewer transactions (lower gas costs)
   - Lower threshold = more frequent splits (better cash flow)
3. **Verify Wallets**: Double-check wallet addresses before configuring
4. **Backup Keys**: Ensure operator wallet private key is securely backed up

### Token Distribution

1. **Test on Devnet**: Test distribution on Solana devnet first
2. **Batch Size**: Start with smaller batches (5-10) to avoid rate limits
3. **Monitor Progress**: Check distribution status regularly
4. **Handle Failures**: Review failed distributions and retry if needed
5. **Gas Costs**: Ensure distributor wallet has enough SOL for transaction fees

### Security

1. **Private Keys**: Never commit private keys to git
2. **Environment Variables**: Use secure environment variable management
3. **Access Control**: Add authentication to distribution endpoints in production
4. **Audit Trail**: All splits and distributions are logged in database

## 🔍 Troubleshooting

### Fund Splitting Not Working

1. Check `SOLANA_OPERATOR_PRIVATE_KEY` is set correctly
2. Verify operator wallet has authority over presale wallet
3. Check wallet addresses are valid Solana addresses
4. Ensure `auto_split_enabled` is `true`
5. Check threshold isn't too high

### Token Distribution Failing

1. Verify `CFY_TOKEN_MINT_ADDRESS` is set
2. Check `SOLANA_DISTRIBUTOR_PRIVATE_KEY` is correct
3. Ensure distributor wallet holds enough CFY tokens
4. Verify distributor wallet has SOL for transaction fees
5. Check buyer addresses are valid Solana addresses

### Transaction Failures

- **Insufficient SOL**: Operator/distributor wallet needs SOL for fees
- **Invalid Address**: Check all wallet addresses are valid
- **Rate Limiting**: Add delays between batches
- **Network Issues**: Check Solana RPC connection

## 📝 API Endpoints Summary

### Fund Splitting

- `PATCH /api/presale/:id/wallets` - Update wallet addresses
- `POST /api/presale/:id/split` - Manually trigger split
- `GET /api/presale/:id/splits` - View split history
- `GET /api/presale/:id/unsplit` - View accumulated unsplit funds

### Token Distribution

- `POST /api/presale/:id/distribute-tokens` - Distribute tokens
- `GET /api/presale/:id/distribution-status` - Get distribution status
- `GET /api/presale/:id/unclaimed-allocations` - Get unclaimed allocations

## ✅ Next Steps

1. ✅ Run wallet update script to configure addresses
2. ✅ Set `SOLANA_OPERATOR_PRIVATE_KEY` environment variable
3. ✅ Test fund splitting with a small amount
4. ⏳ Deploy CFY token on Solana
5. ⏳ Set `CFY_TOKEN_MINT_ADDRESS` and `SOLANA_DISTRIBUTOR_PRIVATE_KEY`
6. ⏳ Run TGE distribution after token launch
7. ⏳ Set up vesting for remaining tokens

Your presale system is now fully automated for both fund splitting and token distribution! 🎉

