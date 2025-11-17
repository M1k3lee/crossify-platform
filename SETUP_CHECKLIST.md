# Cross-Chain Price Sync Setup Checklist

## Prerequisites

Before starting, ensure you have:
- ✅ Node.js and npm installed
- ✅ Hardhat configured
- ✅ Private keys for each chain (for deploying/fixing contracts)
- ✅ RPC URLs configured in `.env`

---

## Step 1: Gather Information

### 1.1 Get Environment Variables from Railway

Please provide screenshots or values for these in Railway:

#### Private Keys (for cross-chain messaging):
```
ETHEREUM_PRIVATE_KEY=...
BASE_PRIVATE_KEY=...
BSC_PRIVATE_KEY=...
```

#### GlobalSupplyTracker Addresses:
```
GLOBAL_SUPPLY_TRACKER_SEPOLIA=...
GLOBAL_SUPPLY_TRACKER_BASESEPOLIA=...
GLOBAL_SUPPLY_TRACKER_BSCTESTNET=...
```

#### CrossChainSync Addresses:
```
CROSS_CHAIN_SYNC_SEPOLIA=...
CROSS_CHAIN_SYNC_BASESEPOLIA=...
CROSS_CHAIN_SYNC_BSCTESTNET=...
```

### 1.2 Get Token Information

For the token you're testing (e.g., XDOGE):
- **Token ID**: `9ed6d4f6-02bc-4c3e-8b48-dab785d4d9af`
- **Bonding Curve Addresses**:
  - Base Sepolia: `0xc4d1BfaEacCFFf0F359D6E7cDD4026D32A74949E`
  - BSC Testnet: (need to get from database/explorer)
  - Sepolia: (need to get from database/explorer)

---

## Step 2: Verify Current Configuration

### 2.1 Check Bonding Curve Configuration

For each chain, run:

```bash
cd contracts

# Base Sepolia
CURVE_ADDRESS=0xc4d1BfaEacCFFf0F359D6E7cDD4026D32A74949E npx hardhat run scripts/verify-bonding-curve-config.ts --network baseSepolia

# BSC Testnet (replace with actual curve address)
CURVE_ADDRESS=0x... npx hardhat run scripts/verify-bonding-curve-config.ts --network bscTestnet

# Sepolia (replace with actual curve address)
CURVE_ADDRESS=0x... npx hardhat run scripts/verify-bonding-curve-config.ts --network sepolia
```

**Expected Output:**
- ✅ GlobalSupplyTracker is set
- ✅ useGlobalSupply is enabled
- ✅ Bonding curve is authorized

**If issues found:**
- Note which issues (tracker not set, useGlobalSupply disabled, not authorized)
- Proceed to Step 3

---

## Step 3: Fix Bonding Curve Configuration

### 3.1 Fix Each Bonding Curve

For each chain with issues, run:

```bash
cd contracts

# Base Sepolia
CURVE_ADDRESS=0xc4d1BfaEacCFFf0F359D6E7cDD4026D32A74949E \
GLOBAL_SUPPLY_TRACKER=0xA4c5bFA9099347Bc405B72dd1955b75dCa263573 \
npx hardhat run scripts/fix-bonding-curve-config.ts --network baseSepolia

# BSC Testnet
CURVE_ADDRESS=0x... \
GLOBAL_SUPPLY_TRACKER=0x15Bc893fa73694106D1720f4f0c8C3EE3259a15e \
npx hardhat run scripts/fix-bonding-curve-config.ts --network bscTestnet

# Sepolia
CURVE_ADDRESS=0x... \
GLOBAL_SUPPLY_TRACKER=0xA4c5bFA9099347Bc405B72dd1955b75dCa263573 \
npx hardhat run scripts/fix-bonding-curve-config.ts --network sepolia
```

**Note:** Replace `GLOBAL_SUPPLY_TRACKER` with the actual address from your environment variables.

**Requirements:**
- You must be the owner of the bonding curve
- You must be the owner of the GlobalSupplyTracker (for authorization)

---

## Step 4: Verify GlobalSupplyTracker Contracts

### 4.1 Check if GlobalSupplyTracker Contracts Exist

Check on each chain's explorer:
- Base Sepolia: `https://sepolia.basescan.org/address/0xA4c5bFA9099347Bc405B72dd1955b75dCa263573`
- BSC Testnet: `https://testnet.bscscan.com/address/0x15Bc893fa73694106D1720f4f0c8C3EE3259a15e`
- Sepolia: `https://sepolia.etherscan.io/address/0xA4c5bFA9099347Bc405B72dd1955b75dCa263573`

**If contracts don't exist:**
- Deploy using `deploy-global-supply.ts` script
- Update environment variables with new addresses

---

## Step 5: Deploy CrossChainSync (If Missing)

### 5.1 Check if CrossChainSync Contracts Exist

Check if these addresses have contracts:
- Base Sepolia: (from environment variable)
- BSC Testnet: (from environment variable)
- Sepolia: (from environment variable)

**If missing, deploy:**

```bash
cd contracts

# Base Sepolia
npx hardhat run scripts/deploy-crosschain-sync.ts --network baseSepolia

# BSC Testnet
npx hardhat run scripts/deploy-crosschain-sync.ts --network bscTestnet

# Sepolia
npx hardhat run scripts/deploy-crosschain-sync.ts --network sepolia
```

**Save the addresses** and update environment variables.

---

## Step 6: Configure Cross-Chain Trusted Remotes

### 6.1 Set Trusted Remotes in CrossChainSync

Each CrossChainSync contract needs to know about the others:

```bash
# On Base Sepolia, set BSC Testnet and Sepolia as trusted remotes
# On BSC Testnet, set Base Sepolia and Sepolia as trusted remotes
# On Sepolia, set Base Sepolia and BSC Testnet as trusted remotes
```

**This requires a script** - I'll create one if needed.

---

## Step 7: Update Environment Variables in Railway

### 7.1 Add Missing Variables

Add to Railway environment variables:
- Private keys (if not already set)
- GlobalSupplyTracker addresses (if different from defaults)
- CrossChainSync addresses (if deployed new ones)

---

## Step 8: Test Cross-Chain Price Sync

### 8.1 Make a Test Buy

1. Go to token page on Base Sepolia
2. Make a small buy (e.g., 100 tokens)
3. Check backend logs for:
   - ✅ Transaction recorded
   - ✅ Global supply updated
   - ✅ Cross-chain message sent
   - ✅ HCS audit log created

### 8.2 Verify Price Sync

1. Check price on Base Sepolia (should increase)
2. Check price on BSC Testnet (should match Base Sepolia)
3. Check price on Sepolia (should match Base Sepolia)

**Expected:** All chains show the same price.

---

## Step 9: Verify Cross-Chain Messages

### 9.1 Check Transaction Logs

On the chain where you made the buy, check:
- Transaction hash on explorer
- Look for LayerZero events
- Look for SupplySynced events

**If no events:**
- Cross-chain messaging might not be configured
- Check GlobalSupplyTracker configuration
- Check CrossChainSync configuration

---

## Troubleshooting

### Issue: Prices Still Different

**Possible causes:**
1. `useGlobalSupply` is still disabled
2. GlobalSupplyTracker is returning 0 or wrong value
3. Cross-chain messages not being sent/received

**Fix:**
1. Re-run verification script
2. Check GlobalSupplyTracker contract state
3. Check cross-chain message logs

### Issue: Buy Transaction Fails

**Possible causes:**
1. Price calculation error
2. Insufficient funds
3. Contract revert

**Fix:**
1. Check console logs for error details
2. Try smaller amount
3. Check contract state

### Issue: Cross-Chain Messages Not Sending

**Possible causes:**
1. Private keys not configured
2. CrossChainSync not configured
3. Insufficient funds for LayerZero fees

**Fix:**
1. Check environment variables
2. Verify CrossChainSync addresses
3. Ensure contracts have native tokens for fees

---

## Success Criteria

✅ All bonding curves have GlobalSupplyTracker set
✅ All bonding curves have useGlobalSupply enabled
✅ All bonding curves are authorized in GlobalSupplyTracker
✅ All chains show the same price
✅ Prices update when buys/sells happen on any chain
✅ Cross-chain messages are sent (check logs)
✅ HCS audit logs are created

---

## Next Steps After Setup

1. Monitor prices across chains (should stay in sync)
2. Test buys/sells on different chains
3. Verify cross-chain messages in LayerZero explorer
4. Check HCS audit logs

---

## Need Help?

If you encounter issues:
1. Check the verification script output
2. Check contract explorer pages
3. Check backend logs
4. Provide error messages and I'll help debug

