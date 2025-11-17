# Verify and Fix Token: XDOGE (9ed6d4f6-02bc-4c3e-8b48-dab785d4d9af)

## Environment Variables Found

### GlobalSupplyTracker Addresses:
- **Sepolia**: `0x130195A8D09dfd99c36D5903B94088EDBD66533e`
- **Base Sepolia**: `0x1eC9ee96EbD41111ad7b99f29D9a61e46b721C65`
- **BSC Testnet**: `0xe84Ae64735261F441e0bcB12bCf60630c5239ef4`

### CrossChainSync Addresses:
- **Sepolia**: `0x1eC9ee96EbD41111ad7b99f29D9a61e46b721C65`
- **Base Sepolia**: `0x39fB28323572610eC0Df1EF075f4acDD51f77e2E`
- **BSC Testnet**: `0xf5446E2690B2eb161231fB647476A98e1b6b7736`

### Bonding Curve Addresses (from console logs):
- **Base Sepolia**: `0xc4d1BfaEacCFFf0F359D6E7cDD4026D32A74949E` ✅

### Missing:
- **BSC Testnet curve address**: Need to get from database/explorer
- **Sepolia curve address**: Need to get from database/explorer

---

## Step 1: Verify Base Sepolia Configuration

```bash
cd contracts

# Verify current configuration
CURVE_ADDRESS=0xc4d1BfaEacCFFf0F359D6E7cDD4026D32A74949E \
npx hardhat run scripts/verify-bonding-curve-config.ts --network baseSepolia
```

**Expected Issues:**
- GlobalSupplyTracker might not be set
- useGlobalSupply might be disabled
- Bonding curve might not be authorized

---

## Step 2: Fix Base Sepolia Configuration

```bash
cd contracts

# Fix configuration
CURVE_ADDRESS=0xc4d1BfaEacCFFf0F359D6E7cDD4026D32A74949E \
GLOBAL_SUPPLY_TRACKER=0x1eC9ee96EbD41111ad7b99f29D9a61e46b721C65 \
npx hardhat run scripts/fix-bonding-curve-config.ts --network baseSepolia
```

**Requirements:**
- You must be the owner of the bonding curve
- You must be the owner of the GlobalSupplyTracker

---

## Step 3: Get Other Chain Curve Addresses

We need to find the bonding curve addresses for:
- BSC Testnet
- Sepolia

**Options:**
1. Check the database: `SELECT curve_address FROM token_deployments WHERE token_id = '9ed6d4f6-02bc-4c3e-8b48-dab785d4d9af' AND chain IN ('bsc-testnet', 'sepolia')`
2. Check the token detail page in the frontend
3. Check block explorers for TokenCreated events

---

## Step 4: Verify and Fix Other Chains

Once we have the curve addresses, repeat Steps 1-2 for:
- BSC Testnet
- Sepolia

---

## Step 5: Test Cross-Chain Price Sync

After fixing all chains:
1. Make a buy on Base Sepolia
2. Check if price updates on all chains
3. All chains should show the same price

---

## Notes

- Private keys (`ETHEREUM_PRIVATE_KEY`, `BASE_PRIVATE_KEY`, `BSC_PRIVATE_KEY`) are not visible in screenshots
- These are only needed for automatic cross-chain messaging from the backend
- If not configured, cross-chain sync will still work via smart contracts, but backend won't send messages automatically

