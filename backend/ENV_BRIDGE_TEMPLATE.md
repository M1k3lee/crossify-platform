# Backend Environment Variables - Bridge Configuration

## Required Variables for Bridge System

Add these to your `backend/.env` file:

```bash
# ============================================
# Cross-Chain Liquidity Bridge Addresses
# ============================================
ETHEREUM_LIQUIDITY_BRIDGE_ADDRESS=0x7005c0A2c9Cd108af213c717cA6d7232AcBD1b29
BSC_LIQUIDITY_BRIDGE_ADDRESS=0x08BA4231c0843375714Ef89999C9F908735E0Ec2
BASE_LIQUIDITY_BRIDGE_ADDRESS=0xDeFC8B749e68b5e21b3873928e68Aaf56031C6EA

# ============================================
# Private Keys for Bridge Operations
# ============================================
# Use the same private key as your contracts deployment, or create separate keys
ETHEREUM_PRIVATE_KEY=0x... # Your private key (64 hex chars, with or without 0x)
BSC_PRIVATE_KEY=0x... # Your private key
BASE_PRIVATE_KEY=0x... # Your private key

# OR use a shared bridge key for all chains:
# BRIDGE_PRIVATE_KEY=0x... # Single key for all bridge operations

# ============================================
# RPC URLs (if not already set)
# ============================================
# ETHEREUM_RPC_URL=https://...
# BSC_RPC_URL=https://...
# BASE_RPC_URL=https://...
```

## Notes

- **Private Keys**: Must be 64-character hex strings (32 bytes)
- **Bridge Addresses**: Already deployed on testnets (see addresses above)
- **RPC URLs**: Optional if already configured in your environment

## After Adding Variables

1. Save the `.env` file
2. Restart the backend: `npm run dev`
3. Check logs for: `✅ Liquidity monitoring service started`

## Verification

Once backend is running, test the API:

```bash
# Check reserves for a token
curl http://localhost:3000/api/crosschain/liquidity/reserves/TOKEN_ID

# Manual rebalance test
curl -X POST http://localhost:3000/api/crosschain/liquidity/rebalance \
  -H "Content-Type: application/json" \
  -d '{"tokenId": "TOKEN_ID"}'
```

