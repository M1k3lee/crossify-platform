# TokenFactory Deployment Steps

## Problem Fixed
The token deployment was failing with error: "Failed to authorize token in CrossChainSync"

**Root Cause:** TokenFactory was trying to authorize tokens in CrossChainSync, but it didn't have permission.

**Solution:** Removed the unnecessary authorization call. Tokens don't need to be authorized - only GlobalSupplyTracker does, and it's already authorized.

## Quick Start

### Option 1: Manual Deployment (Recommended)

1. **Navigate to contracts directory:**
   ```bash
   cd contracts
   ```

2. **Verify your .env file has:**
   ```env
   PRIVATE_KEY=your_private_key_here
   SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
   BSC_TESTNET_RPC_URL=https://bsc-testnet.publicnode.com
   BASE_SEPOLIA_RPC_URL=https://base-sepolia-rpc.publicnode.com
   ```

3. **Compile contracts:**
   ```bash
   npx hardhat compile
   ```

4. **Deploy to each network:**
   ```bash
   # Sepolia
   npx hardhat run scripts/deploy.ts --network sepolia
   
   # BSC Testnet
   npx hardhat run scripts/deploy.ts --network bscTestnet
   
   # Base Sepolia
   npx hardhat run scripts/deploy.ts --network baseSepolia
   ```

5. **Copy the new factory addresses** from each deployment output

6. **Update frontend environment variables:**
   - Vercel: Add/update environment variables in project settings
   - Local: Update `frontend/.env` file
   
   ```env
   VITE_ETH_FACTORY=0x... (new Sepolia factory address)
   VITE_BSC_FACTORY=0x... (new BSC Testnet factory address)
   VITE_BASE_FACTORY=0x... (new Base Sepolia factory address)
   ```

7. **Redeploy frontend** (if using Vercel, it will auto-deploy)

### Option 2: Using Deployment Script

1. **Make script executable (Linux/Mac):**
   ```bash
   chmod +x contracts/scripts/quick-deploy-factory.sh
   ```

2. **Run the script:**
   ```bash
   cd contracts
   ./scripts/quick-deploy-factory.sh
   ```

## What to Expect

### Successful Deployment Output:
```
🚀 Deploying TokenFactory contract...
📋 Network: sepolia
👤 Deployer: 0x097b70CfE0007915249D31dF96a5B582bAb96D75
💰 Balance: 0.5 ETH
✅ TokenFactory deployed to: 0x...
✅ Deployment saved to deployments/sepolia.json
```

### After Deployment:
- ✅ Token creation will work without authorization errors
- ✅ Cross-chain sync will still work (GlobalSupplyTracker is authorized)
- ✅ Existing tokens created with old factory will continue to work
- ✅ New tokens must use the new factory addresses

## Verification

1. **Test token creation:**
   - Go to Builder page
   - Create a new token
   - Select chains (Sepolia, BSC, Base)
   - Click "Deploy Token"
   - Verify it deploys successfully

2. **Check block explorers:**
   - Sepolia: https://sepolia.etherscan.io
   - BSC Testnet: https://testnet.bscscan.com
   - Base Sepolia: https://sepolia-explorer.base.org

## Troubleshooting

### "Insufficient funds"
- Get testnet tokens from faucets:
  - Sepolia: https://sepoliafaucet.com/
  - BSC Testnet: https://testnet.bnbchain.org/faucet-smart
  - Base Sepolia: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet

### "Private key not found"
- Check `.env` file exists in `contracts/` directory
- Verify `PRIVATE_KEY=...` is set (no quotes, no spaces)

### "RPC connection failed"
- Check RPC URLs in `.env` file
- Try public RPC endpoints if custom ones are down

### "Transaction reverted"
- Verify you're on the correct network
- Check that GlobalSupplyTracker and CrossChainSync addresses are correct
- Ensure contracts are properly funded

## Next Steps

After successful deployment:

1. ✅ Update frontend environment variables
2. ✅ Test token creation on all networks
3. ✅ Verify cross-chain price synchronization
4. ✅ Monitor for any issues

## Important Notes

- **Old factory addresses:** Can be retired after confirming new deployments work
- **Existing tokens:** Will continue to work (created with old factory)
- **New tokens:** Must use new factory addresses
- **Cross-chain sync:** Still works (GlobalSupplyTracker is already authorized)

## Support

If you encounter issues:
1. Check the deployment logs
2. Verify contract addresses in `DEPLOYMENT_RESULTS.md`
3. Check block explorers for transaction status
4. Review `contracts/FIX_TOKEN_DEPLOYMENT.md` for detailed explanation

