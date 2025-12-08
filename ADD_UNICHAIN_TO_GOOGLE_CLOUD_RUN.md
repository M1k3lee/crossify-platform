# Adding Unichain Environment Variables to Google Cloud Run

## 🎯 Where to Add: Google Cloud Run

Your backend is deployed on **Google Cloud Run**. Here's exactly where to add the Unichain variables:

---

## 📋 Step-by-Step Instructions

### Step 1: Go to Cloud Run

1. Open [Google Cloud Console](https://console.cloud.google.com)
2. Make sure you're in the correct project (the one with your backend)
3. In the left menu, go to **Cloud Run**
4. Click on your service: **`crossify-backend`**

### Step 2: Edit the Service

1. Click **"Edit & Deploy New Revision"** (top of the page)
2. Wait for the editor to load

### Step 3: Add Environment Variables

1. Scroll down to the **"Variables & Secrets"** tab
2. Click on the **"Variables"** tab (if not already selected)
3. Click **"Add Variable"** for each of these:

#### Add These Variables:

```
Name: UNICHAIN_FACTORY_ADDRESS
Value: 0x4f3854445c33E9cf42b40B0AB36f4Dd58c23331f
```

```
Name: UNICHAIN_GLOBAL_SUPPLY_TRACKER
Value: 0x0D5f52088E30802DC8d5c67Bc5E2231f7ad36569
```

```
Name: UNICHAIN_CROSS_CHAIN_SYNC
Value: 0xa5B144683Db8fE4402B06dbb774cacD95FD1A93e
```

```
Name: UNICHAIN_TESTNET_RPC_URL
Value: https://sepolia.unichain.org
```

```
Name: UNICHAIN_CHAIN_ID
Value: 1301
```

### Step 4: Deploy

1. After adding all variables, scroll to the bottom
2. Click **"Deploy"** (or **"Create Revision"**)
3. Wait for deployment to complete (~1-2 minutes)

---

## ✅ Verification

After deployment, you can verify the variables are set:

1. Go back to Cloud Run → `crossify-backend`
2. Click on the latest revision
3. Check the **"Variables & Secrets"** section
4. You should see all 5 Unichain variables listed

---

## 🔗 Quick Links

- **Cloud Run Console**: https://console.cloud.google.com/run
- **Your Service**: Look for `crossify-backend` in the list

---

## 📝 Summary

**Location**: Google Cloud Run → `crossify-backend` → Edit & Deploy New Revision → Variables & Secrets → Variables

**Variables to Add**:
- `UNICHAIN_FACTORY_ADDRESS`
- `UNICHAIN_GLOBAL_SUPPLY_TRACKER`
- `UNICHAIN_CROSS_CHAIN_SYNC`
- `UNICHAIN_TESTNET_RPC_URL`
- `UNICHAIN_CHAIN_ID`

**After Adding**: Click "Deploy" to create a new revision with the variables.

---

**That's it!** Once deployed, your backend will have access to Unichain configuration. 🚀

