# Blockchain Token Sync Setup

## Overview

The backend now automatically syncs tokens from the blockchain to the database when users view their dashboard. This ensures that tokens created on-chain are always visible, even if the database was reset or updated.

## How It Works

1. When a user visits their dashboard, the `/api/tokens/my-tokens` endpoint is called
2. The backend queries the TokenFactory contract on each chain to find tokens created by the user's wallet address
3. For each token found on-chain, the backend:
   - Fetches token details (name, symbol, decimals, etc.)
   - Fetches bonding curve details (basePrice, slope, etc.)
   - Creates a database entry if the token doesn't exist
   - Updates the database if the token already exists

## Environment Variables Required

Add these to your `backend/.env` file:

```env
# TokenFactory Contract Addresses
BASE_FACTORY_ADDRESS=0x... # TokenFactory address on Base (mainnet or testnet)
ETHEREUM_FACTORY_ADDRESS=0x... # TokenFactory address on Ethereum (mainnet or testnet)
BSC_FACTORY_ADDRESS=0x... # TokenFactory address on BSC (mainnet or testnet)

# Or use testnet-specific addresses:
BASE_SEPOLIA_FACTORY_ADDRESS=0x... # Base Sepolia testnet
BSC_TESTNET_FACTORY_ADDRESS=0x... # BSC testnet
SEPOLIA_FACTORY_ADDRESS=0x... # Ethereum Sepolia testnet

# RPC URLs (if not using defaults)
BASE_RPC_URL=https://mainnet.base.org
ETHEREUM_RPC_URL=https://eth.llamarpc.com
BSC_RPC_URL=https://bsc-dataseed.binance.org
```

## Finding Your TokenFactory Addresses

1. **Deploy TokenFactory** to each chain using the deployment scripts:
   ```bash
   cd contracts
   npx hardhat run scripts/deploy.ts --network base-sepolia
   npx hardhat run scripts/deploy.ts --network sepolia
   npx hardhat run scripts/deploy.ts --network bsc-testnet
   ```

2. **Copy the addresses** from the deployment output

3. **Add them to your backend .env file**

## Supported Chains

- **Base** (mainnet and testnet)
- **Ethereum** (mainnet and testnet)
- **BSC** (mainnet and testnet)

## API Usage

### Get User Tokens (with blockchain sync)

```bash
GET /api/tokens/my-tokens?address=0x...
```

**Query Parameters:**
- `address` (required): User's wallet address
- `chains` (optional): Comma-separated list of chains to sync (default: `base,ethereum,bsc`)
- `sync` (optional): Enable/disable blockchain sync (default: `true`, set to `false` to skip sync)

**Example:**
```bash
# Sync tokens from all chains
GET /api/tokens/my-tokens?address=0x1234...

# Sync tokens from specific chains only
GET /api/tokens/my-tokens?address=0x1234...&chains=base,bsc

# Skip blockchain sync (use database only)
GET /api/tokens/my-tokens?address=0x1234...&sync=false
```

## Troubleshooting

### No tokens found after sync

1. **Check TokenFactory addresses**: Ensure the correct addresses are in your `.env` file
2. **Check RPC URLs**: Ensure the RPC URLs are correct and accessible
3. **Check wallet address**: Ensure the wallet address is correct (case-sensitive)
4. **Check logs**: Look for error messages in the backend logs

### Sync is slow

The sync process queries the blockchain for each token, which can be slow if:
- RPC endpoints are slow
- Many tokens exist
- Network congestion

**Solution**: The sync only runs when requested. Consider caching results or running sync in the background.

### Tokens not appearing

If tokens exist on-chain but don't appear in the dashboard:

1. **Check TokenFactory contract**: Ensure tokens were created through the TokenFactory
2. **Check creator address**: Ensure the wallet address matches the token creator
3. **Check database**: Verify tokens were synced by checking the database directly
4. **Check logs**: Look for sync errors in the backend logs

## Manual Sync

You can manually trigger a sync by calling the sync service directly:

```typescript
import { syncTokensFromBlockchain } from './services/blockchainTokenSync';

const result = await syncTokensFromBlockchain(
  '0x...', // user address
  ['base', 'ethereum', 'bsc'] // chains to sync
);

console.log(`Synced ${result.synced} tokens`);
```

## Database Schema

Tokens synced from the blockchain are stored in the same format as tokens created through the API:

- **tokens table**: Token metadata (name, symbol, decimals, etc.)
- **token_deployments table**: Chain-specific deployment information (token address, curve address, etc.)

## Security Considerations

1. **RPC Rate Limits**: Be aware of RPC rate limits when syncing many tokens
2. **Database Writes**: Ensure database writes are atomic and handle conflicts
3. **Error Handling**: Sync failures should not break the API response
4. **User Privacy**: Only sync tokens for the authenticated user's wallet address

## Future Improvements

- [ ] Cache sync results to reduce blockchain queries
- [ ] Background sync job to keep database up-to-date
- [ ] WebSocket updates when new tokens are created
- [ ] Support for Solana tokens
- [ ] Batch queries for multiple users




