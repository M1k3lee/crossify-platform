# Environment Variables Summary

## ✅ Found in Railway

### GlobalSupplyTracker Addresses:
- `GLOBAL_SUPPLY_TRACKER_SEPOLIA`: `0x130195A8D09dfd99c36D5903B94088EDBD66533e`
- `GLOBAL_SUPPLY_TRACKER_BASE_SEPOLIA`: `0x1eC9ee96EbD41111ad7b99f29D9a61e46b721C65`
- `GLOBAL_SUPPLY_TRACKER_BSC_TESTNET`: `0xe84Ae64735261F441e0bcB12bCf60630c5239ef4`

### CrossChainSync Addresses:
- `CROSS_CHAIN_SYNC_SEPOLIA`: `0x1eC9ee96EbD41111ad7b99f29D9a61e46b721C65`
- `CROSS_CHAIN_SYNC_BASE_SEPOLIA`: `0x39fB28323572610eC0Df1EF075f4acDD51f77e2E`
- `CROSS_CHAIN_SYNC_BSC_TESTNET`: `0xf5446E2690B2eb161231fB647476A98e1b6b7736`

### Other:
- `HEDERA_PRIVATE_KEY`: `0xYOUR_PRIVATE_KEY`

## ⚠️ Missing (Not Visible in Screenshots)

### Private Keys for Cross-Chain Messaging:
- `ETHEREUM_PRIVATE_KEY`: Not visible (needed for sending cross-chain messages from Sepolia)
- `BASE_PRIVATE_KEY`: Not visible (needed for sending cross-chain messages from Base Sepolia)
- `BSC_PRIVATE_KEY`: Not visible (needed for sending cross-chain messages from BSC Testnet)

**Note:** These are only needed if you want the backend to automatically send cross-chain messages. If not configured, the system will still work but cross-chain messages won't be sent automatically.

---

## Next Steps

1. ✅ Verify bonding curve configurations (can do this now)
2. ✅ Fix bonding curves if needed (can do this now)
3. ⚠️ Add private keys to Railway (optional - for automatic cross-chain messaging)

