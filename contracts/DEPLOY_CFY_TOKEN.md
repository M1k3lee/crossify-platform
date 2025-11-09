# CFY Token Deployment Guide

This guide covers deploying the CFY (Crossify Platform Token) and all supporting contracts to Base mainnet.

## Overview

The CFY token is the native platform token for Crossify.io with the following features:

- **Total Supply:** 1,000,000,000 CFY (1 billion)
- **Symbol:** CFY
- **Name:** Crossify Token
- **Decimals:** 18

### Tokenomics

- **Automatic Buyback:** 50% of platform fees (80% to liquidity, 20% burned)
- **Liquidity Provision:** 30% of platform fees
- **Deflationary Burns:** 10% of platform fees
- **Staking Rewards:** Up to 100% APY (100M CFY distributed over 4 years)
- **Fee Discounts:** Based on holder balance (5%-50% off)
- **Governance:** 1 CFY = 1 vote

### Distribution

- **Presale:** 30% (300M CFY)
- **Liquidity Pool:** 25% (250M CFY)
- **Team & Advisors:** 15% (150M CFY) - 6 month cliff, 24 month vesting
- **Ecosystem:** 15% (150M CFY)
- **Staking Rewards:** 10% (100M CFY) - distributed over 4 years
- **Treasury:** 5% (50M CFY)

## Prerequisites

1. **Environment Setup:**
   ```bash
   cd contracts
   npm install
   ```

2. **Environment Variables:**
   Create a `.env` file with:
   ```env
   PRIVATE_KEY=your_private_key_here
   BASE_MAINNET_RPC_URL=https://mainnet.base.org
   BASESCAN_API_KEY=your_basescan_api_key
   
   # Optional addresses
   FEE_COLLECTOR=0x...
   TREASURY=0x...
   PRESALE_ADDRESS=0x...
   LIQUIDITY_ADDRESS=0x...
   TEAM_ADDRESS=0x...
   ECOSYSTEM_ADDRESS=0x...
   
   # DEX addresses (Base mainnet)
   UNISWAP_ROUTER=0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24
   UNISWAP_FACTORY=0xFDa619b6d20975be80A10332cD39b9a4b0FAa8BB
   ```

3. **Funds:**
   - Ensure your deployer wallet has enough ETH for gas fees on Base
   - Recommended: 0.1-0.5 ETH

## Deployment Steps

### Step 1: Compile Contracts

```bash
npx hardhat compile
```

### Step 2: Deploy Contracts

Deploy all contracts to Base mainnet:

```bash
npx hardhat run scripts/deploy-cfy-platform-token.ts --network base
```

This will deploy:
1. CFYToken (main token contract)
2. CFYVesting (vesting for team/advisor tokens)
3. CFYStaking (staking rewards)
4. CFYGovernance (voting)
5. BuybackContract (automatic buybacks)
6. LiquidityProvisionContract (liquidity provision)

### Step 3: Verify Contracts

After deployment, verify contracts on Basescan:

```bash
npx hardhat verify --network base <CFY_TOKEN_ADDRESS> <OWNER> <FEE_COLLECTOR> <TREASURY>
npx hardhat verify --network base <VESTING_ADDRESS> <CFY_TOKEN_ADDRESS> <OWNER>
npx hardhat verify --network base <STAKING_ADDRESS> <CFY_TOKEN_ADDRESS> <LP_TOKEN_ADDRESS> <OWNER>
# ... verify other contracts
```

### Step 4: Distribute Tokens

After verifying contracts, distribute tokens according to tokenomics:

```bash
# Set environment variables
export CFY_TOKEN_ADDRESS=<deployed_cfy_token_address>
export VESTING_CONTRACT_ADDRESS=<deployed_vesting_address>
export STAKING_CONTRACT_ADDRESS=<deployed_staking_address>

# Run distribution script
npx hardhat run scripts/distribute-cfy-tokens.ts --network base
```

### Step 5: Create Initial Liquidity

1. Create CFY/ETH liquidity pool on Uniswap V2 (Base)
2. Add initial liquidity (using 250M CFY from distribution)
3. Update LP token address in staking contract
4. Update liquidity pool address in buyback contract

### Step 6: Set Up Vesting Schedules

1. Create vesting schedules for team members
2. Create vesting schedules for advisors
3. Verify vesting schedules are correct

### Step 7: Fund Staking Contract

Transfer 100M CFY to staking contract for rewards distribution:

```bash
# Using ethers.js or similar
await cfyToken.transfer(stakingContractAddress, ethers.parseEther("100000000"));
```

## Contract Addresses

After deployment, save these addresses:

- **CFY Token:** `0x...`
- **Vesting Contract:** `0x...`
- **Staking Contract:** `0x...`
- **Governance Contract:** `0x...`
- **Buyback Contract:** `0x...`
- **Liquidity Provision Contract:** `0x...`

## Security Considerations

1. **Multi-sig Wallet:** Use a multi-sig wallet for:
   - Token owner
   - Fee collector
   - Treasury

2. **Vesting:** Team/advisor tokens should be vested with proper cliff and vesting periods

3. **Audit:** Before mainnet deployment, consider getting contracts audited

4. **Testnet Testing:** Test thoroughly on Base Sepolia testnet first

## Chain Selection: Base vs Solana

### Why Base?

**Advantages:**
- ✅ Lower fees than Ethereum (much cheaper transactions)
- ✅ EVM-compatible (can reuse Solidity contracts)
- ✅ Fast transactions (~2 second block time)
- ✅ Coinbase-backed (legitimacy and support)
- ✅ Growing ecosystem
- ✅ Easy to expand to other EVM chains later

**Considerations:**
- Still requires ETH for gas (but much cheaper)
- Less established than Ethereum

### Why Not Solana First?

**Challenges:**
- ❌ Requires separate Rust/Anchor development
- ❌ Different architecture (not EVM-compatible)
- ❌ Less tooling/ecosystem for DeFi tokenomics
- ❌ Would need to duplicate all contracts in Rust

**Recommendation:**
- Deploy CFY token on **Base mainnet first**
- Expand to Ethereum, BSC, and Solana later
- Base gives you the best balance of low fees and EVM compatibility

## Next Steps After Deployment

1. ✅ Verify all contracts on block explorer
2. ✅ Create initial liquidity pools
3. ✅ Set up vesting schedules
4. ✅ Fund staking contract
5. ✅ Launch presale
6. ✅ Enable buyback mechanism
7. ✅ Deploy to other chains (Ethereum, BSC, Solana)
8. ✅ Integrate with platform (update backend to use CFY for fees)

## Support

For questions or issues, contact the Crossify team.

