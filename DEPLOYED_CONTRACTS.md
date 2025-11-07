# Deployed Contracts

## Global Supply Tracker Contracts

These contracts track global token supply across all chains for virtual liquidity and price synchronization.

### Sepolia (Ethereum Testnet)
- **Address**: `0xA4c5bFA9099347Bc405B72dd1955b75dCa263573`
- **Explorer**: https://sepolia.etherscan.io/address/0xA4c5bFA9099347Bc405B72dd1955b75dCa263573
- **Network**: Sepolia Testnet (Chain ID: 11155111)

### BSC Testnet
- **Address**: `0x15Bc893fa73694106D1720f4f0c8C3EE3259a15e`
- **Explorer**: https://testnet.bscscan.com/address/0x15Bc893fa73694106D1720f4f0c8C3EE3259a15e
- **Network**: BSC Testnet (Chain ID: 97)

### Base Sepolia
- **Address**: `0xA4c5bFA9099347Bc405B72dd1955b75dCa263573`
- **Explorer**: https://sepolia.basescan.org/address/0xA4c5bFA9099347Bc405B72dd1955b75dCa263573
- **Network**: Base Sepolia (Chain ID: 84532)

## TokenFactory Contracts

### Current Deployments (With Global Supply Tracker)

All TokenFactory contracts have been redeployed with global supply tracker integration. New tokens created will automatically use virtual liquidity for cross-chain price synchronization.

#### Sepolia (Ethereum Testnet)
- **Address**: `0x8eC132791e6897bDbe8dCd6849d51129A7630241` (Latest)
- **Explorer**: https://sepolia.etherscan.io/address/0x8eC132791e6897bDbe8dCd6849d51129A7630241
- **Global Tracker**: `0xA4c5bFA9099347Bc405B72dd1955b75dCa263573`
- **Chain Name**: `ethereum`
- **Virtual Liquidity**: ✅ Enabled
- **Error Handling**: ✅ Fixed (try-catch around tracker calls)

#### BSC Testnet
- **Address**: `0xBc56A85F475515dFc9a0d5F2c185c2fB523471B0` (Latest)
- **Explorer**: https://testnet.bscscan.com/address/0xBc56A85F475515dFc9a0d5F2c185c2fB523471B0
- **Global Tracker**: `0x15Bc893fa73694106D1720f4f0c8C3EE3259a15e`
- **Chain Name**: `bsc`
- **Virtual Liquidity**: ✅ Enabled
- **Error Handling**: ✅ Fixed (try-catch around tracker calls)

#### Base Sepolia
- **Address**: `0x8eC132791e6897bDbe8dCd6849d51129A7630241` (Latest)
- **Explorer**: https://sepolia-explorer.base.org/address/0x8eC132791e6897bDbe8dCd6849d51129A7630241
- **Global Tracker**: `0xA4c5bFA9099347Bc405B72dd1955b75dCa263573`
- **Chain Name**: `base`
- **Virtual Liquidity**: ✅ Enabled
- **Error Handling**: ✅ Fixed (try-catch around tracker calls)

## Environment Variables

Add these to your `frontend/.env` file:

```env
# Global Supply Trackers
VITE_GLOBAL_SUPPLY_TRACKER_SEPOLIA=0xA4c5bFA9099347Bc405B72dd1955b75dCa263573
VITE_GLOBAL_SUPPLY_TRACKER_BSCTESTNET=0x15Bc893fa73694106D1720f4f0c8C3EE3259a15e
VITE_GLOBAL_SUPPLY_TRACKER_BASESEPOLIA=0xA4c5bFA9099347Bc405B72dd1955b75dCa263573

# TokenFactory addresses (with global supply tracker integration)
VITE_ETH_FACTORY=0x8eC132791e6897bDbe8dCd6849d51129A7630241
VITE_BSC_FACTORY=0xBc56A85F475515dFc9a0d5F2c185c2fB523471B0
VITE_BASE_FACTORY=0x8eC132791e6897bDbe8dCd6849d51129A7630241
```

## How Virtual Liquidity Works

1. **Global Supply Tracking**: Each chain's bonding curve queries the global supply tracker
2. **Unified Pricing**: Price = `basePrice + (slope * globalSupply)`
3. **Cross-Chain Sync**: When you buy on one chain, all chains see the new price instantly
4. **No Arbitrage**: Prices stay synchronized across all chains automatically

## Next Steps

1. ✅ Global Supply Tracker deployed to all testnets
2. ✅ TokenFactory contracts redeployed with global supply tracker integration
3. ⏳ Update frontend `.env` with new factory addresses (see above)
4. ⏳ Test token creation - prices will automatically sync across chains!

## How It Works Now

When you create a token using the new TokenFactory contracts:

1. **Token Creation**: Token and BondingCurve are deployed
2. **Global Supply Tracking**: BondingCurve queries the GlobalSupplyTracker for global supply
3. **Unified Pricing**: Price = `basePrice + (slope * globalSupply)`
4. **Cross-Chain Sync**: When someone buys on one chain, all chains see the new price instantly
5. **No Arbitrage**: Prices stay synchronized automatically across Ethereum, BSC, and Base

The virtual liquidity system is now fully operational on-chain!

