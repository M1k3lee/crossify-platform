# TokenFactory Contract Deployment Guide

This guide will help you deploy the TokenFactory contract to testnets using Hardhat (the easiest method).

## Prerequisites

1. **Node.js** installed (v18+)
2. **MetaMask** or another wallet with testnet ETH/BNB
3. **Testnet tokens**:
   - Sepolia ETH (get from [faucet](https://sepoliafaucet.com/))
   - BSC Testnet BNB (get from [faucet](https://testnet.bnbchain.org/faucet-smart))
   - Base Sepolia ETH (get from [faucet](https://www.coinbase.com/faucets/base-ethereum-goerli-faucet))

## Step 1: Install Dependencies

```bash
cd contracts
npm install
```

## Step 2: Configure Environment

Create a `.env` file in the `contracts` directory:

```env
# Private key of wallet with testnet tokens (NEVER commit this!)
PRIVATE_KEY=your_private_key_here

# RPC URLs (use free ones or your own)
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
# Or use public: https://rpc.sepolia.org

BSC_TESTNET_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org

# Optional: Etherscan API keys for verification
ETHERSCAN_API_KEY=your_etherscan_api_key
BSCSCAN_API_KEY=your_bscscan_api_key
BASESCAN_API_KEY=your_basescan_api_key
```

**⚠️ WARNING**: Never commit your `.env` file with real private keys!

## Step 3: Deploy to Sepolia (Ethereum Testnet)

```bash
npx hardhat run scripts/deploy.ts --network sepolia
```

This will:
1. Deploy the TokenFactory contract
2. Print the contract address
3. Save it to `deployments/sepolia.json`

**Copy the TokenFactory address** - you'll need it for the frontend!

## Step 4: Deploy to BSC Testnet

```bash
npx hardhat run scripts/deploy.ts --network bscTestnet
```

Copy the TokenFactory address for BSC.

## Step 5: Deploy to Base Sepolia

```bash
npx hardhat run scripts/deploy.ts --network baseSepolia
```

Copy the TokenFactory address for Base.

## Step 6: Update Frontend Environment

Add the factory addresses to your frontend `.env` file:

```env
VITE_ETH_FACTORY=0x... (from Step 3)
VITE_BSC_FACTORY=0x... (from Step 4)
VITE_BASE_FACTORY=0x... (from Step 5)
```

## Step 7: Verify Contracts (Optional but Recommended)

Verify on block explorers for transparency:

### Sepolia
```bash
npx hardhat verify --network sepolia <TOKEN_FACTORY_ADDRESS>
```

### BSC Testnet
```bash
npx hardhat verify --network bscTestnet <TOKEN_FACTORY_ADDRESS>
```

### Base Sepolia
```bash
npx hardhat verify --network baseSepolia <TOKEN_FACTORY_ADDRESS>
```

## Alternative: Use Remix (Even Easier!)

If Hardhat setup is too complex, you can use Remix IDE:

1. Go to [remix.ethereum.org](https://remix.ethereum.org)
2. Create a new file `TokenFactory.sol`
3. Copy the contents from `contracts/contracts/TokenFactory.sol`
4. Install OpenZeppelin contracts:
   - Go to "File Explorer" → "contracts"
   - Click "OpenZeppelin" → Install
5. Compile the contract (Solidity compiler tab)
6. Deploy:
   - Go to "Deploy & Run Transactions"
   - Select "Injected Provider - MetaMask"
   - Switch MetaMask to Sepolia/BSC Testnet/Base Sepolia
   - Click "Deploy"
   - Copy the contract address

## Troubleshooting

### "Insufficient funds"
- Make sure your wallet has testnet tokens
- Get tokens from faucets listed above

### "Nonce too high"
- Reset your MetaMask account (Settings → Advanced → Reset Account)

### "Contract not verified"
- Make sure you have the correct constructor parameters
- Check that the contract bytecode matches

## Next Steps

Once deployed, your frontend will be able to:
- Create tokens using the factory
- Deploy bonding curves
- Track all deployments on the dashboard

The factory addresses are saved in your frontend `.env` file and the app will use them automatically!






