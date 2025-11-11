# CFY Presale Setup Instructions

## ✅ Your Presale Configuration

- **Token**: Crossify (CFY)
- **Wallet Address**: `CEYNCD4ayxq9eQnMzg9TsTBBFLjAEBwquq7TKLDvhcG6`
- **Price**: 0.0001 SOL per CFY
- **Total Tokens**: 300,000,000 CFY
- **Min Purchase**: 0.1 SOL
- **Max Purchase**: 100 SOL
- **Tokenomics**: 60% Liquidity, 20% Dev, 20% Marketing
- **Affiliate Rewards**: 5%

## Step 1: Verify Your Wallet

**IMPORTANT**: Before proceeding, verify:
- [ ] This is a secure wallet (hardware wallet recommended)
- [ ] Private key is backed up securely (offline)
- [ ] This is a dedicated wallet for presale
- [ ] You have tested sending/receiving SOL to this address

## Step 2: Set Environment Variables

Make sure your backend has:

```env
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
```

For production, consider using a paid RPC provider:
- Helius: https://www.helius.dev/
- QuickNode: https://www.quicknode.com/
- Alchemy: https://www.alchemy.com/

## Step 3: Create the Presale

### Option A: Using PowerShell (Windows)

```powershell
# Run the PowerShell script
.\create-cfy-presale.ps1
```

### Option B: Using cURL

```bash
curl -X POST http://localhost:3001/api/presale \
  -H "Content-Type: application/json" \
  -d '{
    "token_symbol": "CFY",
    "token_name": "Crossify",
    "solana_address": "CEYNCD4ayxq9eQnMzg9TsTBBFLjAEBwquq7TKLDvhcG6",
    "presale_price": 0.0001,
    "total_tokens_for_presale": "300000000",
    "min_purchase_sol": 0.1,
    "max_purchase_sol": 100,
    "liquidity_percentage": 60,
    "dev_percentage": 20,
    "marketing_percentage": 20,
    "affiliate_reward_percentage": 5
  }'
```

### Option C: Using Postman or API Client

1. POST to `http://localhost:3001/api/presale`
2. Body (JSON):
```json
{
  "token_symbol": "CFY",
  "token_name": "Crossify",
  "solana_address": "CEYNCD4ayxq9eQnMzg9TsTBBFLjAEBwquq7TKLDvhcG6",
  "presale_price": 0.0001,
  "total_tokens_for_presale": "300000000",
  "min_purchase_sol": 0.1,
  "max_purchase_sol": 100,
  "liquidity_percentage": 60,
  "dev_percentage": 20,
  "marketing_percentage": 20,
  "affiliate_reward_percentage": 5
}
```

## Step 4: Save Your Presale ID

After creating, you'll receive a response like:
```json
{
  "id": "abc123-def456-ghi789",
  "message": "Presale created successfully"
}
```

**SAVE THIS ID** - You'll need it to:
- Activate the presale
- View statistics
- Access the presale page

## Step 5: Activate the Presale

Once created, activate it to start monitoring:

```bash
# Replace PRESALE_ID with your actual presale ID
curl -X PATCH http://localhost:3001/api/presale/PRESALE_ID/status \
  -H "Content-Type: application/json" \
  -d '{"status": "active"}'
```

Or in PowerShell:
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/api/presale/PRESALE_ID/status" `
  -Method PATCH `
  -ContentType "application/json" `
  -Body '{"status": "active"}'
```

## Step 6: Access Your Presale Page

Navigate to:
```
http://localhost:3000/presale?id=PRESALE_ID
```

Or in production:
```
https://crossify.io/presale?id=PRESALE_ID
```

## Step 7: Test with Small Amount

**BEFORE** announcing publicly:
1. Send a small amount (0.1 SOL) to your wallet address
2. Wait 10-30 seconds
3. Check the presale page - your transaction should appear
4. Verify the allocation is correct

## Step 8: Monitor Your Presale

### Check Statistics
```bash
GET http://localhost:3001/api/presale/PRESALE_ID/stats
```

### View Transactions
```bash
GET http://localhost:3001/api/presale/PRESALE_ID/transactions
```

### View Allocations
```bash
GET http://localhost:3001/api/presale/PRESALE_ID/allocations
```

## Security Checklist

Before going live:
- [ ] Wallet is secure (hardware wallet if possible)
- [ ] Private key backed up securely (offline)
- [ ] Tested with small amount
- [ ] Presale monitoring is working
- [ ] You have a plan to move funds to cold storage
- [ ] You understand the risks

## Fund Management Plan

**Recommended Schedule:**
- **Daily**: Move funds > 10 SOL to cold storage
- **Weekly**: Review all transactions
- **After milestones**: Move larger amounts (e.g., after 1,000 SOL raised)

## Troubleshooting

### Transactions Not Appearing
1. Check presale status is "active"
2. Verify SOL was sent to correct address
3. Check backend logs for errors
4. Manually process: `POST /api/presale/PRESALE_ID/process-transaction`

### RPC Rate Limits
- Use a paid RPC provider
- Update `SOLANA_RPC_URL` in environment variables

## Next Steps After Presale

1. **Calculate Allocations**: Query `presale_allocations` table
2. **Deploy CFY Token**: Deploy on Solana mainnet
3. **Distribute Tokens**: Send tokens to buyers (20% TGE, 80% vesting)
4. **Add Liquidity**: Use 60% of raised SOL for DEX liquidity
5. **Allocate Funds**: Use 20% for dev, 20% for marketing

## Support

If you encounter issues:
1. Check backend logs
2. Verify wallet address is correct
3. Test with small amounts first
4. Check RPC connection

Good luck with your presale! 🚀

