# Deploy Updated TokenFactory to Testnets

This guide covers deploying the updated TokenFactory with ownership fixes to all testnets.

## Prerequisites

- ✅ Contracts compiled successfully (`npx hardhat compile`)
- ✅ Private key with testnet ETH/BNB for gas
- ✅ RPC URLs configured in `contracts/.env`
- ✅ Access to existing TokenFactory owner wallet (for migration)

## Step 1: Prepare Environment

### 1.1 Check `contracts/.env` file

Ensure you have:
```env
PRIVATE_KEY=your_private_key_here
SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
BSC_TESTNET_RPC_URL=https://bsc-testnet.publicnode.com
BASE_SEPOLIA_RPC_URL=https://base-sepolia-rpc.publicnode.com

# Optional: Cross-chain sync addresses (if deployed)
CROSS_CHAIN_SYNC_SEPOLIA=0x...
CROSS_CHAIN_SYNC_BSCTESTNET=0x...
CROSS_CHAIN_SYNC_BASESEPOLIA=0x...

# Optional: Price oracle addresses
PRICE_ORACLE_SEPOLIA=0x...
PRICE_ORACLE_BSCTESTNET=0x...
PRICE_ORACLE_BASESEPOLIA=0x...
```

### 1.2 Verify Account Balance

Check you have enough testnet tokens for deployment:
- **Sepolia**: ~0.01 ETH
- **BSC Testnet**: ~0.01 BNB
- **Base Sepolia**: ~0.01 ETH

Get testnet tokens from faucets if needed.

## Step 2: Deploy to Sepolia

```bash
cd contracts
npx hardhat run scripts/deploy.ts --network sepolia
```

**Expected Output:**
```
✅ TokenFactory deployed successfully!
📍 Address: 0x...
🔗 Explorer: https://sepolia.etherscan.io/address/0x...

📝 IMPORTANT: Add this address to your frontend/.env file:
   VITE_ETH_FACTORY=0x...
```

**Save the factory address!** You'll need it for:
- Environment variables
- Migration script
- Frontend configuration

## Step 3: Deploy to BSC Testnet

```bash
npx hardhat run scripts/deploy.ts --network bscTestnet
```

**Expected Output:**
```
✅ TokenFactory deployed successfully!
📍 Address: 0x...
🔗 Explorer: https://testnet.bscscan.com/address/0x...

📝 IMPORTANT: Add this address to your frontend/.env file:
   VITE_BSC_FACTORY=0x...
```

## Step 4: Deploy to Base Sepolia

```bash
npx hardhat run scripts/deploy.ts --network baseSepolia
```

**Expected Output:**
```
✅ TokenFactory deployed successfully!
📍 Address: 0x...
🔗 Explorer: https://sepolia-explorer.base.org/address/0x...

📝 IMPORTANT: Add this address to your frontend/.env file:
   VITE_BASE_FACTORY=0x...
```

## Step 5: Update Environment Variables

### 5.1 Update `contracts/.env`

Add the new factory addresses:
```env
# New TokenFactory addresses (with ownership fixes)
TOKEN_FACTORY_ADDRESS_SEPOLIA=0x...
TOKEN_FACTORY_ADDRESS_BSCTESTNET=0x...
TOKEN_FACTORY_ADDRESS_BASESEPOLIA=0x...
```

### 5.2 Update `frontend/.env`

Update factory addresses:
```env
VITE_ETH_FACTORY=0x...  # New Sepolia factory
VITE_BSC_FACTORY=0x...  # New BSC Testnet factory
VITE_BASE_FACTORY=0x... # New Base Sepolia factory
```

### 5.3 Update `backend/.env` (if applicable)

If backend uses factory addresses:
```env
TOKEN_FACTORY_ETHEREUM=0x...
TOKEN_FACTORY_BSC=0x...
TOKEN_FACTORY_BASE=0x...
```

## Step 6: Migrate Existing Tokens (If Any)

If you have existing tokens created with the old factory:

### 6.1 Update Migration Script

Edit `contracts/scripts/migrate-token-ownership.ts` and add token addresses to migrate:
```typescript
const MANUAL_TOKEN_ADDRESSES: string[] = [
  '0x...', // Token 1
  '0x...', // Token 2
  // Add all existing token addresses
];
```

### 6.2 Run Migration for Each Network

**Sepolia:**
```bash
cd contracts
export TOKEN_FACTORY_ADDRESS=0x... # New Sepolia factory address
npx hardhat run scripts/migrate-token-ownership.ts --network sepolia
```

**BSC Testnet:**
```bash
export TOKEN_FACTORY_ADDRESS=0x... # New BSC factory address
npx hardhat run scripts/migrate-token-ownership.ts --network bscTestnet
```

**Base Sepolia:**
```bash
export TOKEN_FACTORY_ADDRESS=0x... # New Base factory address
npx hardhat run scripts/migrate-token-ownership.ts --network baseSepolia
```

### 6.3 Verify Migration

Check that tokens are now owned by their creators:
```typescript
// In a test script or console
const token = await ethers.getContractAt("Ownable", tokenAddress);
const owner = await token.owner();
const creator = await factory.tokenCreator(tokenAddress);
console.log(`Owner: ${owner}, Creator: ${creator}, Match: ${owner === creator}`);
```

## Step 7: Verify New Factory

### 7.1 Test Token Creation

Create a test token using the new factory:
1. Go to frontend
2. Use Builder page
3. Create a test token
4. Verify it's owned by you (not the factory)

### 7.2 Test Owner Functions

Verify you can:
- ✅ Mint tokens (should work now!)
- ✅ Burn tokens
- ✅ Pause/unpause token
- ✅ Update fees

## Step 8: Update Documentation

Update `DEPLOYED_CONTRACTS.md` with new factory addresses:

```markdown
## TokenFactory Contracts (Updated with Ownership Fixes)

### Sepolia (Ethereum Testnet)
- **Address**: `0x...` (NEW)
- **Explorer**: https://sepolia.etherscan.io/address/0x...
- **Ownership Fix**: ✅ Yes
- **Migration**: ✅ Completed (if applicable)

### BSC Testnet
- **Address**: `0x...` (NEW)
- **Explorer**: https://testnet.bscscan.com/address/0x...
- **Ownership Fix**: ✅ Yes
- **Migration**: ✅ Completed (if applicable)

### Base Sepolia
- **Address**: `0x...` (NEW)
- **Explorer**: https://sepolia-explorer.base.org/address/0x...
- **Ownership Fix**: ✅ Yes
- **Migration**: ✅ Completed (if applicable)
```

## Troubleshooting

### "PRIVATE_KEY not found"
- Check `contracts/.env` file exists
- Verify PRIVATE_KEY is set (no quotes)
- Ensure `.env` is not in `.gitignore` accidentally

### "Cannot connect to RPC endpoint"
- Check RPC URL is correct
- Try a different RPC endpoint
- Verify network is accessible

### "Insufficient funds"
- Get testnet tokens from faucets
- Check balance: `npx hardhat run scripts/check-balance.ts --network <network>`

### "Migration failed"
- Verify you're using the factory owner wallet
- Check token was created by this factory
- Verify token address is correct
- Check gas limit is sufficient

### "Token creation fails"
- Verify new factory is deployed
- Check frontend is using new factory address
- Verify RPC connection
- Check gas estimation

## Security Notes

1. **Factory Owner**: Only factory owner can migrate tokens. Keep owner wallet secure.
2. **Private Keys**: Never commit private keys to git. Use environment variables.
3. **Verification**: Verify all contract addresses on block explorers.
4. **Testing**: Test thoroughly on testnets before mainnet deployment.

## Next Steps

After successful deployment:

1. ✅ Update frontend to use new factory addresses
2. ✅ Test token creation with new factory
3. ✅ Migrate existing tokens (if any)
4. ✅ Verify ownership fixes work
5. ✅ Update documentation
6. ✅ Test all owner functions (mint, burn, pause, etc.)

## Support

If you encounter issues:
1. Check deployment logs
2. Verify environment variables
3. Check block explorer for transaction status
4. Review contract code on explorer
5. Test with a simple token creation first

---

**Status**: Ready for deployment
**Last Updated**: 2025-01-XX


