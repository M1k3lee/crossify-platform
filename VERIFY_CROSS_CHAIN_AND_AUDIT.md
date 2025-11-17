# Cross-Chain & Audit Log Verification Guide

## Transaction to Verify
**Transaction Hash:** `0xeb2e0f48dac416619ba92e49e7f9ab83f88b7e2cfa35c830c237a6ad8d0ebec8`  
**Chain:** Sepolia (Ethereum Testnet)  
**Explorer:** https://sepolia.etherscan.io/tx/0xeb2e0f48dac416619ba92e49e7f9ab83f88b7e2cfa35c830c237a6ad8d0ebec8

## What Should Happen

When a buy/sell transaction occurs, the system should:

1. ✅ **Record Transaction in Database** - Backend records the transaction
2. ✅ **Update Global Supply** - Database is updated with new supply
3. ✅ **Log to Hedera HCS** - Immutable audit log created on Hedera
4. ⚠️ **Send Cross-Chain Messages** - LayerZero messages sent to other chains (requires configuration)

## How to Verify

### Step 1: Check Backend Logs (Railway)

1. Go to Railway Dashboard → Your Backend Service → **Logs**
2. Search for the transaction hash: `0xeb2e0f48dac416619ba92e49e7f9ab83f88b7e2cfa35c830c237a6ad8d0ebec8`
3. Look for these log messages:

**Expected Logs:**
```
✅ Recorded sell transaction for token [tokenId] on sepolia: 0xeb2e0f48dac416619ba92e49e7f9ab83f88b7e2cfa35c830c237a6ad8d0ebec8
✅ Updated supply for [tokenId] on sepolia: [old] → [new]
✅ Triggered price sync for [tokenId] across all chains
📝 Logging sell transaction to Hedera HCS: { tokenId, tokenAddress, chain, amount, price, txHash }
✅ Successfully logged sell transaction to Hedera HCS
```

**If Cross-Chain is Configured:**
```
📡 Sending cross-chain supply update for token [tokenId]: { sourceChain, newSupply, tokenAddress }
📤 Sent cross-chain supply update transaction: [txHash]
✅ Cross-chain supply update confirmed: [txHash]
✅ Cross-chain messages sent: Cross-chain supply update sent successfully
```

**If Cross-Chain is NOT Configured:**
```
⚠️  Cross-chain messaging failed (non-critical): Cross-chain sync not configured for sepolia
```

### Step 2: Check Hedera HCS Audit Logs

1. Go to your token detail page on the frontend
2. Scroll to **"Immutable Audit Trail"** section
3. You should see:
   - ✅ Transaction listed with type "SELL"
   - ✅ Transaction hash displayed
   - ✅ Amount and price shown
   - ✅ HCS message ID (if HCS is configured)
   - ✅ Link to HashScan (if HCS is configured)

**If you see "No audit logs yet":**
- HCS might not be configured
- Check Railway logs for: `⚠️  Hedera HCS not initialized`
- Verify `HEDERA_HCS_TOPIC_ID` is set in Railway environment variables

### Step 3: Check Database Transaction Record

You can query the database directly or use the API:

**API Endpoint:**
```
GET /api/transactions?tokenId=[tokenId]&chain=sepolia
```

**Expected Response:**
```json
{
  "transactions": [
    {
      "tx_hash": "0xeb2e0f48dac416619ba92e49e7f9ab83f88b7e2cfa35c830c237a6ad8d0ebec8",
      "type": "sell",
      "chain": "sepolia",
      "amount": "[amount]",
      "price": "[price]",
      "status": "confirmed",
      "created_at": "[timestamp]"
    }
  ]
}
```

### Step 4: Verify Cross-Chain Messages (If Configured)

**Check on Other Chains:**
1. Go to Base Sepolia explorer
2. Check the GlobalSupplyTracker contract
3. Query `chainSupply(tokenAddress, sepoliaEID)` - should show updated supply

**Check LayerZero Messages:**
1. Go to LayerZero Scan: https://layerzeroscan.com/
2. Search for your transaction hash
3. Should show cross-chain messages if they were sent

## Current Status

### ✅ What's Working
- Transaction recording in database
- Global supply calculation
- Price sync in database
- HCS audit logging (if configured)

### ⚠️ What Needs Configuration

**Cross-Chain Messaging:**
- Requires `GLOBAL_SUPPLY_TRACKER_[CHAIN]` addresses in Railway
- Requires private keys for each chain (`ETHEREUM_PRIVATE_KEY`, `BASE_PRIVATE_KEY`, etc.)
- Requires LayerZero configuration on smart contracts
- Requires trusted remotes configured on CrossChainSync contracts

**Hedera HCS:**
- Requires `HEDERA_ACCOUNT_ID` in Railway
- Requires `HEDERA_PRIVATE_KEY` in Railway
- Requires `HEDERA_NETWORK=testnet` in Railway
- `HEDERA_HCS_TOPIC_ID` will be auto-created on first run

## Next Steps

1. **Check Railway Logs** for the transaction hash to see what actually happened
2. **Verify HCS Configuration** - Check if audit logs appear on the token page
3. **Configure Cross-Chain** - If you want on-chain cross-chain messages, configure the required environment variables
4. **Check Smart Contracts** - Verify that GlobalSupplyTracker contracts are deployed and configured with LayerZero

## Troubleshooting

**No Audit Logs:**
- Check Railway logs for HCS initialization errors
- Verify Hedera credentials are set correctly
- Check if `HEDERA_HCS_TOPIC_ID` was created (look for "HEDERA HCS TOPIC CREATED" in logs)

**No Cross-Chain Messages:**
- This is expected if cross-chain messaging is not configured
- The system still works with database-level sync
- To enable on-chain messages, configure the required environment variables

**Transaction Not Recorded:**
- Check if the frontend successfully called `POST /api/transactions`
- Check Railway logs for errors
- Verify the transaction hash is correct

