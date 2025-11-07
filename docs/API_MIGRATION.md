# API Migration Note: BSC Verification

## BscScan API Deprecation

**Important Update:** BscScan APIs have been deprecated and replaced by **Etherscan API V2**.

## What This Means

For BSC (Binance Smart Chain) contract verification, you should now use your **Etherscan API key** instead of a separate BscScan API key.

## Configuration

### Before (Deprecated)
```env
ETHERSCAN_API_KEY=your_etherscan_key
BSCSCAN_API_KEY=your_bscscan_key  # ❌ Deprecated
```

### After (Current)
```env
ETHERSCAN_API_KEY=your_etherscan_key  # ✅ Use this for both Ethereum and BSC
# Optional: You can still use a separate key if you prefer
# BSC_ETHERSCAN_API_KEY=your_etherscan_key
```

## How to Get Your API Key

1. Go to https://etherscan.io/apis
2. Sign up or log in
3. Create a new API key
4. Use this same API key for both Ethereum and BSC verification

## Hardhat Configuration

The Hardhat config has been updated to use `ETHERSCAN_API_KEY` for BSC verification:

```typescript
etherscan: {
  apiKey: {
    sepolia: process.env.ETHERSCAN_API_KEY,
    bscTestnet: process.env.ETHERSCAN_API_KEY || process.env.BSC_ETHERSCAN_API_KEY,
    // ...
  },
}
```

## Verification Commands

### Ethereum (Sepolia)
```bash
npx hardhat verify --network sepolia CONTRACT_ADDRESS
```

### BSC Testnet
```bash
npx hardhat verify --network bscTestnet CONTRACT_ADDRESS
```

Both will use the same `ETHERSCAN_API_KEY` from your `.env` file.

## Migration Checklist

- [x] Updated Hardhat configuration
- [x] Updated documentation
- [x] Updated `.env.example` files
- [ ] Get Etherscan API key (if you don't have one)
- [ ] Update your `.env` file to use `ETHERSCAN_API_KEY` for BSC

## References

- Etherscan API Documentation: https://docs.etherscan.io/
- Migration Guide: https://docs.etherscan.io/migrating-to-v2
- BSC Verification: Now uses Etherscan API V2








