# Configure Cloud Run - Environment Variables & Database Connection

## Step 1: Connect Cloud SQL to Cloud Run

1. Go to: https://console.cloud.google.com/run/detail/europe-west1/crossify-backend?project=voltaic-wall-480423-u9
2. Click **"Edit & Deploy New Revision"** button (top right)
3. Scroll down to **"Connections"** tab
4. Under **"Cloud SQL connections"**, click **"Add connection"**
5. Select `crossify-db` from the dropdown
6. Click **"Deploy"** (this will create a new revision)

**Note:** After connecting, you'll get a connection name like: `voltaic-wall-480423-u9:europe-west2:crossify-db`

## Step 2: Get Database Connection String

After connecting Cloud SQL, you need to get the connection string:

1. Go to Cloud SQL: https://console.cloud.google.com/sql/instances/crossify-db?project=voltaic-wall-480423-u9
2. Click on **"Connections"** tab
3. Under **"Connection name"**, copy the connection name (format: `project:region:instance`)
4. You'll use this to construct the `DATABASE_URL`

## Step 3: Configure Environment Variables

1. Go back to Cloud Run: https://console.cloud.google.com/run/detail/europe-west1/crossify-backend?project=voltaic-wall-480423-u9
2. Click **"Edit & Deploy New Revision"**
3. Scroll to **"Variables & Secrets"** tab
4. Click **"Add Variable"** for each environment variable

### Required Environment Variables

**Add these in the "Variables & Secrets" tab:**

#### Database (After connecting Cloud SQL)
- **Name:** `DATABASE_URL`
- **Value:** `postgresql://postgres:@@Mixmaster@20@/crossify-db?host=/cloudsql/voltaic-wall-480423-u9:europe-west2:crossify-db`

#### Basic Configuration
- **Name:** `PORT` → **Value:** `3001`
- **Name:** `NODE_ENV` → **Value:** `production`

#### Blockchain RPC URLs
- **Name:** `BASE_RPC_URL` → **Value:** `https://base-sepolia.publicnode.com`
- **Name:** `BSC_RPC_URL` → **Value:** `https://bsc-testnet.publicnode.com`
- **Name:** `ETHEREUM_RPC_URL` → **Value:** `https://ethereum-sepolia-rpc.publicnode.com`
- **Name:** `SOLANA_RPC_URL` → **Value:** `https://api.mainnet-beta.solana.com`

#### Factory Addresses (Note: Renamed from Railway)
- **Name:** `BASE_FACTORY` → **Value:** `0x170EE984fBcfd01599312EaA1AD4D35Ad5e66f58`
- **Name:** `BSC_FACTORY` → **Value:** `0xFF8c690B5b65905da20D8de87Cd6298c223a40B6`
- **Name:** `ETH_FACTORY` → **Value:** `0x8eF1A74d477448630282EFC130ac9D17f495Bca4`
- **Name:** `HEDERA_FACTORY` → **Value:** `0x1f1f75d84CB2Ff86ffe2b8Fb3eb0d2e94438433D`

#### Private Keys
- **Name:** `PRIVATE_KEY` → **Value:** `fe34316bfc0d64e2470214427bffae181c99b1cbacaa61d206c3a8bf182c22ee`
- **Name:** `ETHEREUM_PRIVATE_KEY` → **Value:** `b25f128af2a36a5434e92eb95d5d29cb78181746752c96dbfcf25ebd36a558ec`
- **Name:** `HEDERA_PRIVATE_KEY` → **Value:** `8f27a9a489e7fcdce400e7b385c3796842b38d09e24783495246e496d7cc784c`

#### Hedera Configuration
- **Name:** `HEDERA_ACCOUNT_ID` → **Value:** `0.0.7271342`
- **Name:** `HEDERA_HCS_TOPIC_ID` → **Value:** `0.0.7277191`
- **Name:** `HEDERA_NETWORK` → **Value:** `testnet`

#### Cloudinary (Image Upload)
- **Name:** `CLOUDINARY_CLOUD_NAME` → **Value:** `dgfmot6eo`
- **Name:** `CLOUDINARY_API_KEY` → **Value:** `156865466263218`
- **Name:** `CLOUDINARY_API_SECRET` → **Value:** `hmMhdSWPV0GZKMnIgQ0EmdBW9uU`

#### CORS
- **Name:** `CORS_ORIGIN` → **Value:** `https://crossify.io,https://www.crossify.io,https://M1k3lee.github.io`

#### Cross-Chain Sync Addresses
- **Name:** `CROSS_CHAIN_SYNC_BASE_SEPOLIA` → **Value:** `0x39fB28323572610eC0Df1EF075f4acDD51f77e2E`
- **Name:** `CROSS_CHAIN_SYNC_BSC_TESTNET` → **Value:** `0xf5446E2690B2eb161231fB647476A98e1b6b7736`
- **Name:** `CROSS_CHAIN_SYNC_SEPOLIA` → **Value:** `0x1eC9ee96EbD41111ad7b99f29D9a61e46b721C65`

#### Global Supply Trackers
- **Name:** `GLOBAL_SUPPLY_TRACKER_BASE_SEPOLIA` → **Value:** `0x1eC9ee96EbD41111ad7b99f29D9a61e46b721C65`
- **Name:** `GLOBAL_SUPPLY_TRACKER_BSC_TESTNET` → **Value:** `0xe84Ae64735261F441e0bcB12bCf60630c5239ef4`
- **Name:** `GLOBAL_SUPPLY_TRACKER_HEDERA_TESTNET` → **Value:** `0xc443F7e5F0e62C4803030E938d5Cc762F0829A02`
- **Name:** `GLOBAL_SUPPLY_TRACKER_SEPOLIA` → **Value:** `0x130195A8D09dfd99c36D5903B94088EDBD66533e`

#### WalletConnect
- **Name:** `WALLETCONNECT_PROJECT_ID` → **Value:** `38a3f6702a1aafea9420aa8a4a58bb26`

## Step 4: Deploy

After adding all environment variables:
1. Scroll to the bottom
2. Click **"Deploy"**
3. Wait for deployment to complete (~2-3 minutes)

## Step 5: Verify

After deployment:
1. Test the health endpoint: https://crossify-backend-88917802850.europe-west1.run.app/api/health
2. Check Cloud Run logs for any errors
3. Test database connection by checking if tokens/marketplace endpoints work

## Quick Reference

**Cloud Run Service:** https://console.cloud.google.com/run/detail/europe-west1/crossify-backend?project=voltaic-wall-480423-u9

**Cloud SQL Database:** https://console.cloud.google.com/sql/instances/crossify-db?project=voltaic-wall-480423-u9

**Database Password:** `@@Mixmaster@20` (the one you set when creating the database)

