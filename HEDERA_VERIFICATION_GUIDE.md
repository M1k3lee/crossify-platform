# Hedera Integration - Verification & Proof Guide

## 🔍 What Is Hedera Actually Doing?

Hedera is integrated into your platform in **three distinct ways**, each providing verifiable proof:

---

## 1. 📦 Token Deployment Chain (Primary Function)

### What It Does
Hedera serves as the **5th blockchain** where users can deploy tokens, alongside Ethereum, BSC, Base, and Solana.

### How It Works
1. **Smart Contracts Deployed:**
   - **TokenFactory**: `0x1f1f75d84CB2Ff86ffe2b8Fb3eb0d2e94438433D`
   - **GlobalSupplyTracker**: `0xc443F7e5F0e62C4803030E938d5Cc762F0829A02`
   
2. **When a user creates a token:**
   - If they select "Hedera" as one of the chains
   - The TokenFactory contract creates a new ERC20 token on Hedera
   - A bonding curve is deployed for price discovery
   - Token becomes tradeable on Hedera network

### ✅ Verifiable Proof

**Clickable Links to Verify:**
- **TokenFactory Contract**: https://hashscan.io/testnet/address/0x1f1f75d84CB2Ff86ffe2b8Fb3eb0d2e94438433D
- **GlobalSupplyTracker**: https://hashscan.io/testnet/address/0xc443F7e5F0e62C4803030E938d5Cc762F0829A02
- **Your Account**: https://hashscan.io/testnet/account/0.0.7268944

**What You Can Verify:**
- ✅ View all transactions on the TokenFactory (every token creation)
- ✅ See contract code (if verified)
- ✅ View all token addresses created
- ✅ Check account balance and transaction history
- ✅ Verify any deployed token's contract address

**How to Verify:**
1. Go to https://hashscan.io/testnet
2. Search for any token address created on Hedera
3. View all transactions, holders, and contract details
4. Click on any transaction hash to see full details

---

## 2. 📝 Immutable Audit Logging (HCS - Hedera Consensus Service)

### What It Does
**Every cross-chain price sync and bonding curve transaction is logged to Hedera Consensus Service (HCS)** for an immutable, timestamped audit trail.

### How It Works
1. **When a user buys/sells tokens:**
   - Transaction is recorded in your database
   - **Automatically logged to HCS** with:
     - Token address
     - Chain name
     - Transaction type (BUY/SELL)
     - Amount and price
     - New supply
     - Transaction hash
     - Timestamp

2. **When prices sync across chains:**
   - Global supply update is calculated
   - **Automatically logged to HCS** with:
     - Source chain
     - Target chains
     - Old and new global supply
     - Timestamp

### ✅ Verifiable Proof

**HCS Topic ID:** (Set in `HEDERA_HCS_TOPIC_ID` environment variable)

**What You Can Verify:**
- ✅ All audit logs are stored on Hedera network (immutable)
- ✅ Each log has a cryptographically verifiable timestamp
- ✅ Logs can be queried via Hedera Mirror Node API
- ✅ Logs prove price synchronization events occurred
- ✅ Logs prove all buy/sell transactions

**How to Verify:**
1. **Via Hedera Mirror Node API:**
   ```
   https://testnet.mirrornode.hedera.com/api/v1/topics/{topicId}/messages
   ```

2. **Via HashScan:**
   - Search for your HCS topic ID
   - View all messages submitted to the topic
   - Each message contains the full audit log JSON

3. **Via Backend API (if implemented):**
   - Query endpoint to retrieve audit logs
   - Display in admin dashboard

**Current Status:**
- ✅ **Fully Implemented** in `backend/src/services/hederaAudit.ts`
- ✅ **Automatically Called** when transactions occur
- ✅ **Automatically Called** when prices sync
- ⚠️ **Topic ID Required**: Set `HEDERA_HCS_TOPIC_ID` in environment variables

**Code Location:**
- Service: `backend/src/services/hederaAudit.ts`
- Integration: `backend/src/routes/transactions.ts` (line 132-151)
- Integration: `backend/src/services/globalSupply.ts` (line 155-172)

---

## 3. 🗄️ Decentralized File Storage (HFS - Hedera File Service)

### What It Does
**Token logos, banners, and metadata are stored on Hedera File Service (HFS)** instead of centralized storage like Cloudinary.

### How It Works
1. **When a user uploads a logo/banner:**
   - File is uploaded to Hedera File Service
   - Returns a Hedera File ID (format: `0.0.xxxxx`)
   - File is permanently stored on Hedera network
   - Public URL via Mirror Node: `https://testnet.mirrornode.hedera.com/api/v1/files/{fileId}`

2. **Benefits:**
   - **Decentralized**: No single point of failure
   - **Immutable**: Files cannot be deleted or modified
   - **Low Cost**: ~$0.001 per file (one-time, no monthly fees)
   - **Permanent**: Files never disappear (unlike IPFS which requires pinning)

### ✅ Verifiable Proof

**What You Can Verify:**
- ✅ Every file uploaded has a Hedera File ID
- ✅ Files are accessible via public Mirror Node URLs
- ✅ Files are permanently stored on Hedera network
- ✅ File metadata is stored in your database

**How to Verify:**
1. **Check Database:**
   - Look for `logo_ipfs` or `banner_image_ipfs` fields
   - If they start with `0.0.`, they're Hedera File IDs

2. **Access Files:**
   - Testnet: `https://testnet.mirrornode.hedera.com/api/v1/files/{fileId}`
   - Mainnet: `https://mainnet-public.mirrornode.hedera.com/api/v1/files/{fileId}`

3. **Via HashScan:**
   - Search for file ID (e.g., `0.0.123456`)
   - View file details and access URL

**Current Status:**
- ✅ **Fully Implemented** in `backend/src/services/hederaFileService.ts`
- ✅ **Integrated** in upload endpoints (`/api/upload/logo`, `/api/upload/banner`)
- ✅ **Automatic Fallback** to Cloudinary if HFS unavailable

**Code Location:**
- Service: `backend/src/services/hederaFileService.ts`
- Integration: `backend/src/routes/upload.ts` (line 181-186, 280-285)

---

## 🔗 Clickable Verification Links

### For Deployed Tokens

**On Token Detail Page:**
- Transaction hashes are clickable
- Links to HashScan explorer: `https://hashscan.io/testnet/tx/{txHash}`
- Shows full transaction details

**Current Implementation:**
- ✅ Transaction links work for Hedera (line 1857-1867 in `TokenDetail.tsx`)
- ✅ Uses `getTestnetInfo()` to get correct explorer URL
- ✅ HashScan is configured for Hedera testnet

### For Contracts

**Contract Addresses:**
- **TokenFactory**: https://hashscan.io/testnet/address/0x1f1f75d84CB2Ff86ffe2b8Fb3eb0d2e94438433D
- **GlobalSupplyTracker**: https://hashscan.io/testnet/address/0xc443F7e5F0e62C4803030E938d5Cc762F0829A02

**What You Can See:**
- All transactions on the contract
- Contract code (if verified)
- Token addresses created
- Event logs
- Contract balance

### For Audit Logs

**HCS Topic (if configured):**
- View on HashScan: Search for topic ID
- Query via Mirror Node API
- Each message is an audit log entry

---

## 📊 Proof of Functionality

### 1. Token Creation Proof

**Evidence:**
- Every token created on Hedera has a contract address
- Contract address is stored in `token_deployments` table
- Contract is visible on HashScan
- Contract has transaction history

**How to Verify:**
```sql
SELECT token_address, chain, created_at 
FROM token_deployments 
WHERE chain = 'hedera';
```

Then visit HashScan with any token address.

### 2. Audit Logging Proof

**Evidence:**
- Every transaction triggers `logBondingCurveTransaction()`
- Every price sync triggers `logPriceSyncEvent()`
- Logs are stored on Hedera HCS (immutable)
- Logs include timestamps and transaction hashes

**How to Verify:**
1. Check backend logs for "Logged to HCS" messages
2. Query HCS topic via Mirror Node API
3. View topic messages on HashScan

### 3. File Storage Proof

**Evidence:**
- Files uploaded to HFS have File IDs
- File IDs are stored in database
- Files are accessible via Mirror Node URLs

**How to Verify:**
```sql
SELECT logo_ipfs, banner_image_ipfs 
FROM tokens 
WHERE logo_ipfs LIKE '0.0.%' OR banner_image_ipfs LIKE '0.0.%';
```

Then access files via Mirror Node URLs.

---

## 🚀 How to Enable Full Verification

### Step 1: Configure HCS Topic

1. **Initialize HCS (one-time):**
   - Set `HEDERA_ACCOUNT_ID` and `HEDERA_PRIVATE_KEY` in backend `.env`
   - Restart backend
   - Service will create a topic automatically
   - Save the topic ID from logs

2. **Add Topic ID to Environment:**
   ```env
   HEDERA_HCS_TOPIC_ID=0.0.xxxxx
   ```

3. **Verify Topic:**
   - Visit: `https://hashscan.io/testnet/topic/{topicId}`
   - You'll see all audit log messages

### Step 2: Enable File Storage

1. **Ensure Credentials Are Set:**
   ```env
   HEDERA_ACCOUNT_ID=0.0.7268944
   HEDERA_PRIVATE_KEY=0xYOUR_PRIVATE_KEY
   ```

2. **Test Upload:**
   - Upload a token logo via frontend
   - Check database for Hedera File ID
   - Access file via Mirror Node URL

### Step 3: View Audit Logs (Frontend)

**Recommended Addition:**
Create an "Audit Logs" section in the admin dashboard or token detail page that:
- Queries HCS topic for audit logs
- Displays price sync events
- Displays bonding curve transactions
- Shows clickable links to HashScan

---

## 📋 Summary: What Hedera Provides

| Feature | What It Does | Verifiable Proof | Clickable Links |
|---------|--------------|------------------|-----------------|
| **Token Deployment** | Users can deploy tokens on Hedera | ✅ Contract addresses on HashScan | ✅ HashScan contract links |
| **Audit Logging (HCS)** | Immutable logs of all transactions | ✅ HCS topic messages | ✅ HashScan topic view |
| **File Storage (HFS)** | Decentralized logo/banner storage | ✅ File IDs in database | ✅ Mirror Node file URLs |
| **Transaction Links** | Clickable explorer links | ✅ HashScan transaction pages | ✅ Already implemented |

---

## ✅ Current Status

- ✅ **Token Deployment**: Fully functional, contracts deployed
- ✅ **Transaction Links**: Working, clickable HashScan links
- ✅ **Audit Logging**: Implemented, needs HCS topic configuration
- ✅ **File Storage**: Implemented, needs credentials verification
- ⚠️ **Audit Log Viewer**: Not yet in frontend (can be added)

---

## 🎯 Next Steps to Make Verification More Visible

1. **Add Audit Log Viewer Component:**
   - Display HCS messages in admin dashboard
   - Show price sync events and transactions
   - Include HashScan links for each log

2. **Add File Storage Indicator:**
   - Show "Stored on Hedera" badge for HFS files
   - Display Hedera File ID in token details
   - Add link to Mirror Node file URL

3. **Add Contract Verification:**
   - Verify TokenFactory and GlobalSupplyTracker on HashScan
   - Add "Verified Contract" badges
   - Link to verified contract source code

4. **Add HCS Topic Display:**
   - Show HCS topic ID in admin dashboard
   - Link to HashScan topic view
   - Display message count

---

**Last Updated:** December 2024  
**Status:** ✅ Fully Functional, Verification Available via HashScan

