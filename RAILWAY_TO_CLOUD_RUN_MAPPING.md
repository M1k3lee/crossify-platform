# Railway to Cloud Run Environment Variables Mapping

## ✅ Direct Mappings (Same Name)

Add these to Cloud Run with the same name:

| Railway Variable | Cloud Run Value |
|------------------|-----------------|
| `BASE_RPC_URL` | `https://base-sepolia.publicnode.com` |
| `BSC_RPC_URL` | `https://bsc-testnet.publicnode.com` |
| `ETHEREUM_RPC_URL` | `https://ethereum-sepolia-rpc.publicnode.com` |
| `CLOUDINARY_API_KEY` | `156865466263218` |
| `CLOUDINARY_API_SECRET` | `hmMhdSWPV0GZKMnIgQ0EmdBW9uU` |
| `CLOUDINARY_CLOUD_NAME` | `dgfmot6eo` |
| `CORS_ORIGIN` | `https://crossify.io,https://www.crossify.io,https://M1k3lee.github.io` |
| `HEDERA_ACCOUNT_ID` | `0.0.7271342` |
| `HEDERA_HCS_TOPIC_ID` | `0.0.7277191` |
| `HEDERA_NETWORK` | `testnet` |
| `HEDERA_PRIVATE_KEY` | `8f27a9a489e7fcdce400e7b385c3796842b38d09e24783495246e496d7cc784c` |
| `NODE_ENV` | `production` |
| `PRIVATE_KEY` | `fe34316bfc0d64e2470214427bffae181c99b1cbacaa61d206c3a8bf182c22ee` |
| `SOLANA_RPC_URL` | `https://api.mainnet-beta.solana.com` |
| `WALLETCONNECT_PROJECT_ID` | `38a3f6702a1aafea9420aa8a4a58bb26` |

## 🔄 Name Changes (Backend Expects Different Names)

| Railway Variable | Cloud Run Name | Cloud Run Value |
|------------------|----------------|-----------------|
| `BASE_FACTORY_ADDRESS` | `BASE_FACTORY` | `0x170EE984fBcfd01599312EaA1AD4D35Ad5e66f58` |
| `BSC_FACTORY_ADDRESS` | `BSC_FACTORY` | `0xFF8c690B5b65905da20D8de87Cd6298c223a40B6` |
| `ETHEREUM_FACTORY_ADDRESS` | `ETH_FACTORY` | `0x8eF1A74d477448630282EFC130ac9D17f495Bca4` |
| `ETHEREUM_PRIVATE_KEY` | `ETHEREUM_PRIVATE_KEY` | `b25f128af2a36a5434e92eb95d5d29cb78181746752c96dbfcf25ebd36a558ec` |
| `CROSS_CHAIN_SYNC_BASE_SEPOLIA` | `CROSS_CHAIN_SYNC_BASE_SEPOLIA` | `0x39fB28323572610eC0Df1EF075f4acDD51f77e2E` |
| `CROSS_CHAIN_SYNC_BSC_TESTNET` | `CROSS_CHAIN_SYNC_BSC_TESTNET` | `0xf5446E2690B2eb161231fB647476A98e1b6b7736` |
| `CROSS_CHAIN_SYNC_SEPOLIA` | `CROSS_CHAIN_SYNC_SEPOLIA` | `0x1eC9ee96EbD41111ad7b99f29D9a61e46b721C65` |
| `GLOBAL_SUPPLY_TRACKER_BASE_SEPOLIA` | `GLOBAL_SUPPLY_TRACKER_BASE_SEPOLIA` | `0x1eC9ee96EbD41111ad7b99f29D9a61e46b721C65` |
| `GLOBAL_SUPPLY_TRACKER_BSC_TESTNET` | `GLOBAL_SUPPLY_TRACKER_BSC_TESTNET` | `0xe84Ae64735261F441e0bcB12bCf60630c5239ef4` |
| `GLOBAL_SUPPLY_TRACKER_HEDERA_TESTNET` | `GLOBAL_SUPPLY_TRACKER_HEDERA_TESTNET` | `0xc443F7e5F0e62C4803030E938d5Cc762F0829A02` |
| `GLOBAL_SUPPLY_TRACKER_SEPOLIA` | `GLOBAL_SUPPLY_TRACKER_SEPOLIA` | `0x130195A8D09dfd99c36D5903B94088EDBD66533e` |
| `VITE_HEDERA_FACTORY` | `HEDERA_FACTORY` | `0x1f1f75d84CB2Ff86ffe2b8Fb3eb0d2e94438433D` |

## 🗄️ Database URL (Special - Use Cloud SQL Connection)

**DO NOT use the Railway DATABASE_URL!**

Instead, after connecting Cloud SQL, use:
- **Name:** `DATABASE_URL`
- **Value:** `postgresql://postgres:@@Mixmaster@20@/crossify-db?host=/cloudsql/voltaic-wall-480423-u9:europe-west2:crossify-db`

## 📝 Additional Required Variables

Add these that weren't in Railway:

- **Name:** `PORT`
- **Value:** `3001`

## 🚀 Quick Copy-Paste List for Cloud Run

When adding variables in Cloud Run, use these exact names and values:

```
PORT=3001
NODE_ENV=production
DATABASE_URL=postgresql://postgres:@@Mixmaster@20@/crossify-db?host=/cloudsql/voltaic-wall-480423-u9:europe-west2:crossify-db
BASE_RPC_URL=https://base-sepolia.publicnode.com
BSC_RPC_URL=https://bsc-testnet.publicnode.com
ETHEREUM_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
CLOUDINARY_API_KEY=156865466263218
CLOUDINARY_API_SECRET=hmMhdSWPV0GZKMnIgQ0EmdBW9uU
CLOUDINARY_CLOUD_NAME=dgfmot6eo
CORS_ORIGIN=https://crossify.io,https://www.crossify.io,https://M1k3lee.github.io
HEDERA_ACCOUNT_ID=0.0.7271342
HEDERA_HCS_TOPIC_ID=0.0.7277191
HEDERA_NETWORK=testnet
HEDERA_PRIVATE_KEY=8f27a9a489e7fcdce400e7b385c3796842b38d09e24783495246e496d7cc784c
PRIVATE_KEY=fe34316bfc0d64e2470214427bffae181c99b1cbacaa61d206c3a8bf182c22ee
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
WALLETCONNECT_PROJECT_ID=38a3f6702a1aafea9420aa8a4a58bb26
BASE_FACTORY=0x170EE984fBcfd01599312EaA1AD4D35Ad5e66f58
BSC_FACTORY=0xFF8c690B5b65905da20D8de87Cd6298c223a40B6
ETH_FACTORY=0x8eF1A74d477448630282EFC130ac9D17f495Bca4
ETHEREUM_PRIVATE_KEY=b25f128af2a36a5434e92eb95d5d29cb78181746752c96dbfcf25ebd36a558ec
CROSS_CHAIN_SYNC_BASE_SEPOLIA=0x39fB28323572610eC0Df1EF075f4acDD51f77e2E
CROSS_CHAIN_SYNC_BSC_TESTNET=0xf5446E2690B2eb161231fB647476A98e1b6b7736
CROSS_CHAIN_SYNC_SEPOLIA=0x1eC9ee96EbD41111ad7b99f29D9a61e46b721C65
GLOBAL_SUPPLY_TRACKER_BASE_SEPOLIA=0x1eC9ee96EbD41111ad7b99f29D9a61e46b721C65
GLOBAL_SUPPLY_TRACKER_BSC_TESTNET=0xe84Ae64735261F441e0bcB12bCf60630c5239ef4
GLOBAL_SUPPLY_TRACKER_HEDERA_TESTNET=0xc443F7e5F0e62C4803030E938d5Cc762F0829A02
GLOBAL_SUPPLY_TRACKER_SEPOLIA=0x130195A8D09dfd99c36D5903B94088EDBD66533e
HEDERA_FACTORY=0x1f1f75d84CB2Ff86ffe2b8Fb3eb0d2e94438433D
```

## ⚠️ Important Notes

1. **DATABASE_URL** - Use the Cloud SQL connection format, NOT the Railway one
2. **CORS_ORIGIN** - I've added GitHub Pages URL to the list
3. **Factory addresses** - Renamed to match backend expectations:
   - `BASE_FACTORY_ADDRESS` → `BASE_FACTORY`
   - `BSC_FACTORY_ADDRESS` → `BSC_FACTORY`
   - `ETHEREUM_FACTORY_ADDRESS` → `ETH_FACTORY`
   - `VITE_HEDERA_FACTORY` → `HEDERA_FACTORY`



