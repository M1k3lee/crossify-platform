# TokenFactory Deployment - Quick Start

## 🚀 What You Need to Do

### 1. Create `.env` File

Create a file named `.env` in this directory (`contracts/.env`) with:

```env
PRIVATE_KEY=your_private_key_here
SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
BSC_TESTNET_RPC_URL=https://bsc-testnet.publicnode.com
BASE_SEPOLIA_RPC_URL=https://base-sepolia-rpc.publicnode.com
```

**Replace `your_private_key_here` with your actual private key (64 characters, no 0x prefix)**

### 2. Check Setup

```bash
npm run check-setup
```

This will verify your environment is ready.

### 3. Get Testnet Tokens

You need testnet tokens for gas fees:

- **Sepolia ETH**: https://sepoliafaucet.com/
- **BSC Testnet BNB**: https://testnet.bnbchain.org/faucet-smart
- **Base Sepolia ETH**: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet

### 4. Compile Contracts

```bash
npm run compile
```

### 5. Deploy TokenFactory

Deploy to each network:

```bash
# Sepolia
npm run deploy:sepolia

# BSC Testnet
npm run deploy:bsc

# Base Sepolia
npm run deploy:base
```

### 6. Copy Factory Addresses

After each deployment, copy the factory address from the output and update your frontend environment variables:

- `VITE_ETH_FACTORY` = (Sepolia factory address)
- `VITE_BSC_FACTORY` = (BSC Testnet factory address)
- `VITE_BASE_FACTORY` = (Base Sepolia factory address)

## 📚 Detailed Guides

- `SETUP_AND_DEPLOY.md` - Complete setup and deployment guide
- `DEPLOYMENT_CHECKLIST.md` - Step-by-step checklist
- `FIX_TOKEN_DEPLOYMENT.md` - Problem explanation

## ⚠️ Important

- **Never commit your `.env` file** - it contains your private key
- **Use testnet only** - these are testnet deployments
- **Have testnet tokens** - you need ETH/BNB for gas fees

## 🆘 Need Help?

1. Run `npm run check-setup` to verify your setup
2. Check the detailed guides above
3. Verify you have testnet tokens
4. Check error messages carefully

---

**Ready?** Start with step 1 above!

