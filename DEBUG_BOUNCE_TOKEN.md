# Debugging BOUNCE 2.0 Token Issue

## 🔍 Investigation Steps

Since BOUNCE 2.0 was created after the new TokenFactory deployment but still has price issues, we need to verify:

1. **Which factory was used** to create BOUNCE 2.0
2. **Which bonding curve contract** it's using
3. **Whether the bonding curve has the fixed code** or old buggy code
4. **What the actual price calculation returns** for the problematic amount (122 tokens)

## 🛠️ Step 1: Get BOUNCE 2.0 Token Information

### Option A: From Database (if you have access)

Query the database to get:
- Token ID
- Token address
- Curve address
- Chain name

### Option B: From Block Explorer

1. Go to the token detail page for BOUNCE 2.0
2. Check the browser console or network tab to see the API response from `/api/tokens/:id/status`
3. Note down:
   - `tokenAddress`
   - `curveAddress` (for each chain deployment)
   - `chain` name

## 🧪 Step 2: Use Debug Endpoint

I've created a debug endpoint to investigate the token. Use it like this:

### Check Factory Configuration

```bash
# Check all factory configurations
curl http://localhost:3001/api/debug/factory-info
```

Or visit in browser: `http://localhost:3001/api/debug/factory-info`

This will show:
- Which factory addresses are configured
- Whether they're deployed and accessible
- RPC URLs for each chain

### Check Token Information

```bash
# Replace with actual BOUNCE 2.0 token address and chain
curl "http://localhost:3001/api/debug/token-info?tokenAddress=0x...&chain=bsc-testnet"
```

Or visit in browser:
```
http://localhost:3001/api/debug/token-info?tokenAddress=0x...&chain=bsc-testnet
```

**Parameters:**
- `tokenAddress`: The BOUNCE 2.0 token contract address
- `chain`: The chain name (e.g., `bsc-testnet`, `base-sepolia`, `sepolia`)
- `curveAddress`: (Optional) If you know the curve address, you can provide it directly

### Example Response

The debug endpoint will return:

```json
{
  "chain": "bsc-testnet",
  "tokenAddress": "0x...",
  "factoryAddress": "0x39fB28323572610eC0Df1EF075f4acDD51f77e2E",
  "factoryInfo": {
    "factoryAddress": "0x39fB28323572610eC0Df1EF075f4acDD51f77e2E",
    "creator": "0x...",
    "curveAddressFromEvent": "0x...",
    "tokenName": "BOUNCE 2.0",
    "tokenSymbol": "BOUNCE",
    "blockNumber": 12345,
    "transactionHash": "0x..."
  },
  "curveAddress": "0x...",
  "bondingCurve": {
    "address": "0x...",
    "exists": true,
    "codeSize": 12345,
    "parameters": {
      "basePrice": "0.0001",
      "slope": "0.000001",
      "totalSupplySold": "1000000",
      "tokenAddress": "0x..."
    },
    "supplyForPricing": "1000000",
    "supplyValidation": {
      "value": "1000000",
      "isReasonable": true,
      "note": "✅ Supply is within reasonable range"
    },
    "currentPrice": {
      "wei": "100000000000000",
      "eth": "0.0001"
    },
    "priceTest": {
      "tokenAmount": "122",
      "priceWei": "74420000000000000012200000000000000",
      "priceEth": "74420000000000000012200000000000000.0",
      "isValid": false,
      "validation": "❌ Price too high: 74420000000000000012200000000000000.0 ETH (exceeds 100 ETH limit)"
    }
  },
  "environmentVariables": {
    "rpcUrl": "✅ Configured",
    "factoryAddress": "✅ Configured",
    "factoryAddressValue": "0x39fB28323572610eC0Df1EF075f4acDD51f77e2E"
  }
}
```

## 🔬 Step 3: Analyze Results

### Key Things to Check:

1. **Factory Address Match**
   - Does `factoryInfo.factoryAddress` match the newly deployed factory?
   - New Base Sepolia: `0x314DFf75620f1CFB09B5aD88892Dded0A13A6c58`
   - New BSC Testnet: `0x39fB28323572610eC0Df1EF075f4acDD51f77e2E`

2. **Bonding Curve Contract**
   - Is `bondingCurve.exists` true?
   - Check `bondingCurve.codeSize` - the new contract should be larger (has more validation)

3. **Supply Validation**
   - Check `bondingCurve.supplyValidation.isReasonable`
   - If `false`, the global supply tracker has corrupted data
   - Note the `supplyValidation.note` message

4. **Price Test**
   - Check `bondingCurve.priceTest.isValid`
   - If `false`, the contract is returning invalid prices
   - Check `bondingCurve.priceTest.validation` message

## 🎯 Step 4: Determine Root Cause

### Scenario A: Wrong Factory Used

**Symptoms:**
- `factoryInfo.factoryAddress` doesn't match the new factory address
- Token was created with old factory → old bonding curve → buggy code

**Solution:**
- Verify environment variables in Railway/Vercel are updated
- Create a new token after environment variables are updated
- Old tokens cannot be fixed (they use the old contract)

### Scenario B: New Factory, But Still Buggy

**Symptoms:**
- `factoryInfo.factoryAddress` matches new factory
- But `bondingCurve.priceTest.isValid` is still `false`
- Supply validation might show corrupted data

**Possible Causes:**
1. **Global Supply Tracker Corruption**
   - `supplyValidation.isReasonable` is `false`
   - Solution: Check global supply tracker contract, may need to reset or fix it

2. **Bonding Curve Still Has Bug**
   - Even with new factory, the deployed bonding curve might have a bug
   - Solution: Check the actual bonding curve contract code on block explorer
   - Compare with the fixed BondingCurve.sol code

3. **Environment Variables Not Updated**
   - Frontend/backend still using old factory addresses
   - Token was created through old code path
   - Solution: Update environment variables and restart services

### Scenario C: Environment Variables Not Updated

**Symptoms:**
- `environmentVariables.factoryAddress` shows "NOT CONFIGURED" or old address
- Factory info cannot be retrieved

**Solution:**
- Update Railway backend environment variables
- Update Vercel frontend environment variables
- Restart services
- Verify with `/api/debug/factory-info` endpoint

## 📋 Step 5: Verify Contract Code

If the factory address is correct but prices are still wrong:

1. **Check Bonding Curve Contract on Block Explorer**
   - Go to the curve address on the block explorer (BSCScan, BaseScan, etc.)
   - Verify the contract code
   - Look for these functions in the code:
     - `getSupplyForPricing()` - should have `maxReasonableSupply` check
     - `getPriceForAmount()` - should have multiple validation checks
     - Should NOT have `unchecked` blocks in price calculation

2. **Compare with Fixed Code**
   - Check `contracts/contracts/BondingCurve.sol`
   - Verify the deployed contract matches the fixed version
   - If not, the bonding curve was deployed with old code

## 🔧 Step 6: Fix and Verify

### If Environment Variables Are Wrong:

1. **Update Railway (Backend)**
   ```bash
   # Set these in Railway dashboard:
   BASE_FACTORY_ADDRESS=0x314DFf75620f1CFB09B5aD88892Dded0A13A6c58
   BASE_SEPOLIA_FACTORY_ADDRESS=0x314DFf75620f1CFB09B5aD88892Dded0A13A6c58
   BSC_FACTORY_ADDRESS=0x39fB28323572610eC0Df1EF075f4acDD51f77e2E
   BSC_TESTNET_FACTORY_ADDRESS=0x39fB28323572610eC0Df1EF075f4acDD51f77e2E
   SEPOLIA_FACTORY_ADDRESS=0x... # (if deployed)
   ```

2. **Update Vercel (Frontend)**
   ```bash
   # Set these in Vercel dashboard:
   VITE_BASE_FACTORY=0x314DFf75620f1CFB09B5aD88892Dded0A13A6c58
   VITE_BSC_FACTORY=0x39fB28323572610eC0Df1EF075f4acDD51f77e2E
   VITE_ETH_FACTORY=0x... # (if deployed)
   ```

3. **Restart Services**
   - Railway will auto-deploy
   - Vercel will auto-deploy

4. **Verify**
   - Check `/api/debug/factory-info` endpoint
   - Create a new test token
   - Verify prices are correct

### If Global Supply Tracker Is Corrupted:

1. Check the global supply tracker contract
2. May need to deploy a new tracker
3. Update TokenFactory to use new tracker
4. New tokens will use the new tracker

### If Bonding Curve Code Is Wrong:

1. The bonding curve contract cannot be upgraded (it's immutable)
2. Need to create a new token with the fixed factory
3. Old tokens will continue to have issues

## 🚨 Important Notes

- **Old tokens cannot be fixed** - if they were created with the old factory/contract, they will always use the old buggy code
- **Only new tokens** created after the fix will use the fixed contract
- **Environment variables must be updated** before creating new tokens
- **Frontend fallback** should handle invalid prices gracefully (already implemented in BuyWidget)

## 📞 Next Steps

1. Run the debug endpoint to get BOUNCE 2.0 information
2. Share the results
3. We'll determine the root cause and fix it
4. If it's an environment variable issue, update and create a new test token
5. If it's a contract issue, we may need to investigate further

---

**Status**: 🔍 Ready for investigation
**Priority**: 🔴 High - Need to determine why new tokens are still broken


