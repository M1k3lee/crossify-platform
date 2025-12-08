# Update Hedera Credentials in Railway

## ✅ New Credentials

**Account ID:** `0.0.7271342`  
**Private Key:** `8f27a9a489e7fcdce400e7b385c3796842b38d09e24783495246e496d7cc784c`

## 📋 Steps to Update in Railway

### Step 1: Update HEDERA_ACCOUNT_ID

1. Go to **Railway Dashboard** → **Backend Service** → **Variables**
2. Find `HEDERA_ACCOUNT_ID`
3. Click the **three dots** (⋮) → **Edit**
4. Change value from `0.0.7268944` to `0.0.7271342`
5. Click **Save**

### Step 2: Update HEDERA_PRIVATE_KEY

1. Still in **Variables** tab
2. Find `HEDERA_PRIVATE_KEY`
3. Click the **three dots** (⋮) → **Edit**
4. Replace the entire value with: `8f27a9a489e7fcdce400e7b385c3796842b38d09e24783495246e496d7cc784c`
5. Click **Save**

### Step 3: Verify

After saving, Railway will automatically redeploy. Check the logs for:

```
🔍 Initializing Hedera Audit Service (HCS)...
🔍 Checking Hedera credentials...
   HEDERA_ACCOUNT_ID: ✅ Set
   HEDERA_PRIVATE_KEY: ✅ Set
✅ Parsed Hedera private key as hex bytes (32 bytes)
📝 Creating new HCS topic for audit logs...
======================================================================
✅ HEDERA HCS TOPIC CREATED
======================================================================
📋 Topic ID: 0.0.xxxxx

🔧 ADD THIS TO RAILWAY ENVIRONMENT VARIABLES:
   HEDERA_HCS_TOPIC_ID=0.0.xxxxx
======================================================================
✅ Hedera Audit Service initialized (Powered by Hedera)
```

### Step 4: Add HCS Topic ID

Once you see the topic ID in the logs:
1. Go back to **Variables** tab
2. Click **+ New Variable**
3. Add:
   - **Name**: `HEDERA_HCS_TOPIC_ID`
   - **Value**: `0.0.xxxxx` (from logs)
4. Click **Add**

## ✅ Expected Result

After updating:
- ✅ Hedera service will initialize successfully
- ✅ HCS topic will be created automatically
- ✅ Audit logs will start working
- ✅ Topic ID will appear in logs (add it to Railway)

## 🔍 Verify Account

You can check the account on HashScan:
- **Testnet**: https://hashscan.io/testnet/account/0.0.7271342

Make sure the account has some testnet HBAR for topic creation (usually costs ~$0.01 worth of HBAR).

## 📝 Summary

**Update these two variables:**
1. `HEDERA_ACCOUNT_ID` → `0.0.7271342`
2. `HEDERA_PRIVATE_KEY` → `8f27a9a489e7fcdce400e7b385c3796842b38d09e24783495246e496d7cc784c`

**Then:**
3. Check logs for topic ID
4. Add `HEDERA_HCS_TOPIC_ID` with the topic ID from logs

Done! ✅

