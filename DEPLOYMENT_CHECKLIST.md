# TokenFactory Deployment Checklist

## ✅ Pre-Deployment Checklist

Before deploying, ensure you have:

- [ ] **Private Key** - Wallet private key with testnet tokens
- [ ] **Testnet Tokens** - Enough ETH/BNB for gas fees (0.1+ recommended)
- [ ] **Environment File** - `.env` file in `contracts/` directory
- [ ] **RPC URLs** - Working RPC endpoints for each network
- [ ] **Contract Addresses** - CrossChainSync and GlobalSupplyTracker addresses

## 📋 Step-by-Step Deployment

### 1. Prepare Environment

Create `contracts/.env` file with:
```env
PRIVATE_KEY=your_private_key_here
SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
BSC_TESTNET_RPC_URL=https://bsc-testnet.publicnode.com
BASE_SEPOLIA_RPC_URL=https://base-sepolia-rpc.publicnode.com
```

### 2. Verify Wallet Balance

Check you have testnet tokens:
- **Sepolia ETH**: Get from https://sepoliafaucet.com/
- **BSC Testnet BNB**: Get from https://testnet.bnbchain.org/faucet-smart
- **Base Sepolia ETH**: Get from https://www.coinbase.com/faucets/base-ethereum-goerli-faucet

### 3. Compile Contracts

```bash
cd contracts
npx hardhat compile
```

Expected output: `Compiled successfully`

### 4. Deploy to Sepolia

```bash
npx hardhat run scripts/deploy.ts --network sepolia
```

**Copy the factory address from output:**
```
✅ TokenFactory deployed successfully!
📍 Address: 0x...
```

### 5. Deploy to BSC Testnet

```bash
npx hardhat run scripts/deploy.ts --network bscTestnet
```

**Copy the factory address from output**

### 6. Deploy to Base Sepolia

```bash
npx hardhat run scripts/deploy.ts --network baseSepolia
```

**Copy the factory address from output**

### 7. Update Frontend Environment Variables

**For Vercel:**
1. Go to Project Settings → Environment Variables
2. Add/Update:
   - `VITE_ETH_FACTORY` = (Sepolia factory address)
   - `VITE_BSC_FACTORY` = (BSC Testnet factory address)
   - `VITE_BASE_FACTORY` = (Base Sepolia factory address)
3. Redeploy frontend

**For Local:**
Update `frontend/.env`:
```env
VITE_ETH_FACTORY=0x... (Sepolia factory address)
VITE_BSC_FACTORY=0x... (BSC Testnet factory address)
VITE_BASE_FACTORY=0x... (Base Sepolia factory address)
```

### 8. Test Token Creation

1. Go to Builder page
2. Create a test token
3. Select all chains (Sepolia, BSC, Base)
4. Deploy token
5. Verify it deploys successfully without errors

## 🔍 Verification

After deployment, verify:

- [ ] TokenFactory deployed on all networks
- [ ] Factory addresses copied correctly
- [ ] Frontend environment variables updated
- [ ] Token creation works without errors
- [ ] Cross-chain sync is working (if enabled)

## 📝 Current Contract Addresses

### Cross-Chain Infrastructure (Already Deployed)

**Base Sepolia:**
- CrossChainSync: `0x39fB28323572610eC0Df1EF075f4acDD51f77e2E`
- GlobalSupplyTracker: `0x1eC9ee96EbD41111ad7b99f29D9a61e46b721C65`

**BSC Testnet:**
- CrossChainSync: `0xf5446E2690B2eb161231fB647476A98e1b6b7736`
- GlobalSupplyTracker: `0xe84Ae64735261F441e0bcB12bCf60630c5239ef4`

**Sepolia:**
- CrossChainSync: `0x1eC9ee96EbD41111ad7b99f29D9a61e46b721C65`
- GlobalSupplyTracker: `0x130195A8D09dfd99c36D5903B94088EDBD66533e`

### TokenFactory Addresses (To Be Deployed)

- Sepolia: `TBD` (will be generated after deployment)
- BSC Testnet: `TBD` (will be generated after deployment)
- Base Sepolia: `TBD` (will be generated after deployment)

## ⚠️ Important Notes

1. **Private Key Security**: Never commit your `.env` file with real private keys
2. **Testnet Only**: These deployments are for testnets only
3. **Gas Fees**: Ensure you have enough testnet tokens for gas fees
4. **Backup Addresses**: Save all factory addresses for future reference

## 🆘 Troubleshooting

### "Private key not found"
- Check `.env` file exists in `contracts/` directory
- Verify `PRIVATE_KEY=...` is set (no quotes)

### "Insufficient funds"
- Get testnet tokens from faucets
- Check wallet balance on block explorers

### "RPC connection failed"
- Check RPC URLs in `.env` file
- Try public RPC endpoints

### "Transaction reverted"
- Verify contract addresses are correct
- Check network configuration

## ✅ Success Criteria

After deployment, you should be able to:
1. Create tokens on all networks without errors
2. See tokens in the marketplace
3. Buy/sell tokens successfully
4. See cross-chain price synchronization (if enabled)

---

**Status:** Ready for deployment
**Estimated Time:** 15-30 minutes
**Priority:** High (blocks token creation)
