# TokenFactory Deployment Guide

## 🎯 Goal
Redeploy TokenFactory to testnets with the fixed BondingCurve contract.

## ⚠️ Important Note
There are compilation errors in some contracts (CFYGovernance, CFYPresale, CFYStaking), but these **do NOT affect TokenFactory**. TokenFactory only depends on:
- ✅ BondingCurve.sol (FIXED)
- ✅ CrossChainToken.sol (should compile)
- ✅ CrossChainSync.sol (should compile)

## 📋 Prerequisites

1. **Environment Setup**
   - Create `contracts/.env` file if it doesn't exist
   - Add your private key and RPC URLs

2. **Required Environment Variables** (in `contracts/.env`):
   ```env
   PRIVATE_KEY=your_private_key_here
   
   # RPC URLs (use public ones if you don't have your own)
   BASE_SEPOLIA_RPC_URL=https://base-sepolia-rpc.publicnode.com
   BSC_TESTNET_RPC_URL=https://bsc-testnet.publicnode.com
   SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
   
   # Optional: Cross-chain sync addresses (if you've deployed them)
   CROSS_CHAIN_SYNC_BASESEPOLIA=0x...
   CROSS_CHAIN_SYNC_BSCTESTNET=0x...
   CROSS_CHAIN_SYNC_SEPOLIA=0x...
   ```

3. **Testnet Tokens**
   - Make sure you have testnet ETH/BNB for gas fees
   - Base Sepolia: Get from https://www.coinbase.com/faucets/base-ethereum-goerli-faucet
   - BSC Testnet: Get from https://testnet.bnbchain.org/faucet-smart
   - Sepolia: Get from https://sepoliafaucet.com/

## 🚀 Deployment Steps

### Option 1: Try Deployment (Recommended)

Even with compilation errors in other contracts, Hardhat might still be able to deploy TokenFactory if its direct dependencies compile. Try this first:

```bash
cd contracts

# Deploy to Base Sepolia (where your tokens are)
npx hardhat run scripts/deploy.ts --network baseSepolia

# If that fails, try the alternative script
npx hardhat run scripts/deploy-tokenfactory-only.ts --network baseSepolia
```

### Option 2: Fix Compilation First (If Option 1 Fails)

If deployment fails due to compilation errors, we have two options:

#### A. Temporarily Exclude Problematic Contracts

1. Create a backup of problematic contracts:
   ```bash
   cd contracts/contracts
   mkdir ../backup
   mv CFYGovernance.sol ../backup/
   mv CFYPresale.sol ../backup/
   mv CFYStaking.sol ../backup/
   mv CFYToken.sol ../backup/
   ```

2. Try compiling:
   ```bash
   npm run compile
   ```

3. If it compiles, deploy:
   ```bash
   npx hardhat run scripts/deploy.ts --network baseSepolia
   ```

4. Restore the files after deployment:
   ```bash
   mv ../backup/*.sol .
   ```

#### B. Fix the Compilation Errors

The errors are:
1. **CFYGovernance.sol:70** - Type conversion issue
2. **CFYPresale.sol:309** - Lvalue issue
3. **CFYStaking.sol:120** - Struct constructor argument count
4. **CFYStaking.sol:159** - Missing poolType member

These can be fixed, but they're not blocking for TokenFactory deployment.

## 📝 Deployment Commands

### Deploy to Base Sepolia
```bash
cd contracts
npx hardhat run scripts/deploy.ts --network baseSepolia
```

### Deploy to BSC Testnet
```bash
cd contracts
npx hardhat run scripts/deploy.ts --network bscTestnet
```

### Deploy to Sepolia
```bash
cd contracts
npx hardhat run scripts/deploy.ts --network sepolia
```

## ✅ After Deployment

### 1. Update Backend Environment Variables (Railway)

Add/update these variables in Railway:

```env
BASE_FACTORY_ADDRESS=<new_token_factory_address>
BSC_FACTORY_ADDRESS=<new_token_factory_address>
ETHEREUM_FACTORY_ADDRESS=<new_token_factory_address>
```

### 2. Update Frontend Environment Variables (Vercel)

Add/update these variables in Vercel:

```env
VITE_BASE_FACTORY=<new_token_factory_address>
VITE_BSC_FACTORY=<new_token_factory_address>
VITE_ETH_FACTORY=<new_token_factory_address>
```

### 3. Verify Deployment

1. **Check the contract on explorer**:
   - Base Sepolia: https://sepolia-explorer.base.org
   - BSC Testnet: https://testnet.bscscan.com
   - Sepolia: https://sepolia.etherscan.io

2. **Create a test token**:
   - Use the frontend to create a new token
   - Verify it uses the new TokenFactory

3. **Test buying tokens**:
   - Try buying 20 tokens
   - Verify the price is reasonable (< 1 ETH total)
   - Verify no astronomical prices are returned

## 🔍 Troubleshooting

### "Compilation failed" Error
- The errors are in CFY contracts, not TokenFactory dependencies
- Try Option 2A above (temporarily move problematic contracts)
- Or try deploying anyway - Hardhat might still work

### "Insufficient funds" Error
- Get more testnet tokens from faucets
- Check your balance: `npx hardhat run scripts/check-balance.ts --network baseSepolia`

### "Cannot connect to RPC" Error
- Check your RPC URL in `.env`
- Try using public RPC endpoints (listed in prerequisites)

### "No signers found" Error
- Check that PRIVATE_KEY is set in `.env`
- Make sure there are no extra spaces or quotes

## 📊 Expected Output

When deployment succeeds, you should see:

```
✅ Connected to network. Current block: 12345678
🚀 Deploying TokenFactory contract...
📋 Network: baseSepolia
👤 Deployer: 0x...
💰 Balance: 0.5 ETH
📦 Deploying TokenFactory...
   Global Supply Tracker: 0x...
   Chain Name: base
   Use Global Supply: true
⏳ Transaction hash: 0x...
⏳ Waiting for deployment confirmation...
✅ TokenFactory deployed successfully!
📍 Address: 0x...
🔗 Explorer: https://sepolia-explorer.base.org/address/0x...
```

## 🎯 Success Criteria

Deployment is successful when:
- ✅ TokenFactory is deployed to all testnets
- ✅ Contract address is visible on block explorer
- ✅ Environment variables are updated
- ✅ New tokens can be created
- ✅ Token prices are reasonable (no astronomical values)
- ✅ Buying/selling works correctly

---

**Ready to deploy?** Start with Base Sepolia since that's where your tokens are!

