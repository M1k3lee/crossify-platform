# Google Cloud Run Setup Guide

## Prerequisites

1. Google Cloud account with £300 credit activated
2. GitHub repository connected
3. All environment variables from Railway (export before Railway shuts down)

---

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click "Select a project" → "New Project"
3. Project name: `crossify-platform`
4. Click "Create"
5. Wait for project creation (~30 seconds)

---

## Step 2: Enable Billing

1. Go to **Billing** in the left menu
2. Link your billing account (with £300 credit)
3. Select your project
4. Enable billing

---

## Step 3: Enable Required APIs

1. Go to **APIs & Services** → **Library**
2. Search and enable each:
   - **Cloud Run API**
   - **Cloud SQL Admin API**
   - **Cloud Build API**
   - **Artifact Registry API** (or Container Registry API)

Or use gcloud CLI:
```bash
gcloud services enable run.googleapis.com
gcloud services enable sqladmin.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable artifactregistry.googleapis.com
```

---

## Step 4: Create Cloud SQL PostgreSQL Database

1. Go to **SQL** in left menu
2. Click **"Create Instance"**
3. Choose **PostgreSQL**
4. Configure:
   - **Instance ID**: `crossify-db`
   - **Password**: Set a strong password (SAVE THIS!)
   - **Database version**: PostgreSQL 15 or 16
   - **Region**: `europe-west1` (or closest to you)
   - **Zone**: Any
5. **Machine configuration**:
   - **Machine type**: Shared core → `db-f1-micro` (smallest/cheapest)
6. **Storage**:
   - **Storage type**: SSD
   - **Storage capacity**: 10GB (minimum)
7. **Connections**:
   - **Public IP**: ✅ Enable
   - **Authorized networks**: Add `0.0.0.0/0` (temporary - we'll secure later)
8. Click **"Create"**
9. Wait for creation (~5-10 minutes)

**After creation, note:**
- **Public IP address**: `XXX.XXX.XXX.XXX`
- **Connection name**: `PROJECT_ID:europe-west1:crossify-db`

---

## Step 5: Set Up Cloud Build for GitHub Auto-Deploy

1. Go to **Cloud Build** → **Triggers**
2. Click **"Connect Repository"**
3. Select **"GitHub (Cloud Build GitHub App)"**
4. Authorize Google Cloud to access GitHub
5. Select your `crossify-platform` repository
6. Click **"Create Push Trigger"**:
   - **Name**: `deploy-backend`
   - **Event**: Push to a branch
   - **Branch**: `^main$` (or your default branch)
   - **Configuration**: Cloud Build configuration file
   - **Location**: `cloudbuild.yaml`
   - Click **"Create"**

---

## Step 6: First Manual Deployment (Test)

### Option A: Using Google Cloud Console

1. Go to **Cloud Build** → **History**
2. Click **"Run"** → **"Run trigger"**
3. Select your trigger
4. Click **"Run"**

### Option B: Using gcloud CLI

```bash
# Install gcloud CLI if not installed
# https://cloud.google.com/sdk/docs/install

# Authenticate
gcloud auth login

# Set project
gcloud config set project YOUR_PROJECT_ID

# Build and deploy
cd backend
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/crossify-backend

# Deploy to Cloud Run
gcloud run deploy crossify-backend \
  --image gcr.io/YOUR_PROJECT_ID/crossify-backend \
  --platform managed \
  --region europe-west1 \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10
```

---

## Step 7: Configure Environment Variables

1. Go to **Cloud Run** → `crossify-backend` service
2. Click **"Edit & Deploy New Revision"**
3. Go to **"Variables & Secrets"** tab
4. Click **"Add Variable"** for each:

### Database Connection
```
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@PUBLIC_IP:5432/postgres
```
(Replace `YOUR_PASSWORD` and `PUBLIC_IP` with your Cloud SQL values)

### Core Settings
```
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://crossify.io,https://www.crossify.io,https://crossify-platform.vercel.app
```

### Blockchain RPC URLs
```
SOLANA_RPC_URL=https://api.devnet.solana.com
ETHEREUM_RPC_URL=https://rpc.sepolia.org
BSC_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545
BASE_RPC_URL=https://sepolia.base.org
HEDERA_RPC_URL=https://testnet.hashio.io/api
HEDERA_NETWORK=testnet
```

### Factory Addresses
```
ETHEREUM_FACTORY_ADDRESS=0x8eF1A74d477448630282EFC130ac9D17f495Bca4
BSC_FACTORY_ADDRESS=0xFF8c690B5b65905da20D8de87Cd6298c223a40B6
BASE_FACTORY_ADDRESS=0x170EE984fBcfd01599312EaA1AD4D35Ad5e66f58
VITE_HEDERA_FACTORY=0x1f1f75d84CB2Ff86ffe2b8Fb3eb0d2e94438433D
```

### Global Supply Trackers
```
GLOBAL_SUPPLY_TRACKER_ETHEREUM_SEPOLIA=<your-address>
GLOBAL_SUPPLY_TRACKER_BSC_TESTNET=<your-address>
GLOBAL_SUPPLY_TRACKER_BASE_SEPOLIA=<your-address>
GLOBAL_SUPPLY_TRACKER_HEDERA_TESTNET=<your-address>
```

### Hedera Credentials
```
HEDERA_ACCOUNT_ID=YOUR_HEDERA_ACCOUNT_ID
HEDERA_PRIVATE_KEY=<your-private-key>
HEDERA_HCS_TOPIC_ID=<your-topic-id>
```

### Security & Admin
```
JWT_SECRET=<your-jwt-secret>
ADMIN_PASSWORD_HASH=<your-admin-hash>
```

### Optional (if you have them)
```
SOLANA_PRIVATE_KEY=<your-solana-key>
ETHEREUM_PRIVATE_KEY=<your-eth-key>
BSC_PRIVATE_KEY=<your-bsc-key>
BASE_PRIVATE_KEY=<your-base-key>
```

5. Click **"Deploy"** to save

---

## Step 8: Connect Cloud SQL to Cloud Run (Secure Connection)

1. In Cloud Run service → **"Connections"** tab
2. Click **"Add Connection"**
3. Select your `crossify-db` instance
4. Click **"Add"**

This enables secure connection via Cloud SQL Proxy.

5. **Update DATABASE_URL** to use Cloud SQL connection:
   ```
   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@/postgres?host=/cloudsql/PROJECT_ID:europe-west1:crossify-db
   ```
   (Replace `PROJECT_ID` and `YOUR_PASSWORD`)

6. **Remove public IP access** from Cloud SQL (optional but recommended):
   - Go to Cloud SQL → `crossify-db` → **Connections**
   - Remove `0.0.0.0/0` from authorized networks

---

## Step 9: Update Frontend API URL

1. Go to **Vercel** (or your frontend host)
2. Go to **Settings** → **Environment Variables**
3. Update:
   ```
   VITE_API_BASE=https://crossify-backend-XXXXX-ew.a.run.app/api
   ```
   (Get the URL from Cloud Run service overview page)
4. **Redeploy frontend**

---

## Step 10: Test Deployment

1. Check Cloud Run logs:
   - Go to Cloud Run → `crossify-backend` → **Logs** tab
   - Look for: `✅ Database initialized` and `🚀 Server running on port 3001`

2. Test API endpoint:
   ```bash
   curl https://crossify-backend-XXXXX-ew.a.run.app/api/health
   ```

3. Test from frontend:
   - Visit your frontend URL
   - Check browser console for API calls

---

## Troubleshooting

### Build Fails
- Check Cloud Build logs
- Verify `cloudbuild.yaml` is in root directory
- Ensure `backend/Dockerfile` exists

### Database Connection Fails
- Verify `DATABASE_URL` is correct
- Check Cloud SQL public IP is enabled (if using public IP)
- Verify Cloud SQL connection is linked in Cloud Run

### Service Won't Start
- Check Cloud Run logs
- Verify all environment variables are set
- Check memory/CPU limits (increase if needed)

### Cold Starts
- Cloud Run spins down after inactivity
- First request after spin-down takes 30-60 seconds
- Consider setting `--min-instances 1` (costs more but no cold starts)

---

## Cost Monitoring

1. Go to **Billing** → **Reports**
2. Set up budget alerts:
   - Go to **Budgets & Alerts**
   - Create budget for £300
   - Set alert at 50%, 75%, 90%

---

## Next Steps After Setup

1. ✅ Test all API endpoints
2. ✅ Verify database persistence
3. ✅ Test GitHub auto-deploy (push to main branch)
4. ✅ Monitor costs
5. ✅ Set up Cloud SQL backups (optional but recommended)

---

## Quick Reference

**Project ID**: `YOUR_PROJECT_ID`  
**Cloud SQL Instance**: `crossify-db`  
**Cloud Run Service**: `crossify-backend`  
**Region**: `europe-west1`  
**Database Connection**: `PROJECT_ID:europe-west1:crossify-db`

---

**Estimated Monthly Cost**: £9-17/month  
**Credit Duration**: 18-33 months with £300 credit




