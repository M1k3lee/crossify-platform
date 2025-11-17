# Hedera HCS Topic Setup Guide

## 🎯 Quick Answer

**You don't need to add it to GitHub secrets!** The HCS topic is **automatically created** on first run. You just need to:

1. **Deploy to Railway** (topic will auto-create)
2. **Check Railway logs** for the topic ID
3. **Add it to Railway environment variables** (optional, but recommended)

---

## 🚀 How It Works

### Automatic Topic Creation

When the backend starts for the first time with Hedera credentials configured:

1. ✅ Checks if `HEDERA_HCS_TOPIC_ID` is set
2. ✅ If **not set**, automatically creates a new HCS topic
3. ✅ Logs the topic ID prominently in the console
4. ✅ Audit logging starts working immediately

### What You'll See in Logs

When the topic is created, you'll see:

```
======================================================================
✅ HEDERA HCS TOPIC CREATED
======================================================================
📋 Topic ID: 0.0.1234567

🔧 ADD THIS TO RAILWAY ENVIRONMENT VARIABLES:
   HEDERA_HCS_TOPIC_ID=0.0.1234567

📍 View on HashScan:
   https://hashscan.io/testnet/topic/0.0.1234567
======================================================================
```

---

## 📋 Step-by-Step Setup

### Step 1: Ensure Hedera Credentials Are Set

In **Railway** → Your Backend Service → **Variables** tab, make sure you have:

```env
HEDERA_ACCOUNT_ID=0.0.7268944
HEDERA_PRIVATE_KEY=0xYOUR_PRIVATE_KEY
```

### Step 2: Deploy/Restart Backend

1. Deploy your backend to Railway (or restart if already deployed)
2. The HCS topic will be created automatically on first initialization

### Step 3: Capture Topic ID from Logs

1. Go to Railway dashboard
2. Click on your backend service
3. Go to **Deployments** tab
4. Click on the latest deployment
5. Click **View Logs**
6. Look for the "HEDERA HCS TOPIC CREATED" message
7. **Copy the Topic ID** (format: `0.0.xxxxx`)

### Step 4: Add Topic ID to Railway (Optional but Recommended)

**Why add it?**
- Prevents creating duplicate topics on redeploy
- Ensures consistent topic usage
- Better for production stability

**How to add:**

1. Go to Railway dashboard
2. Click on your backend service
3. Go to **Variables** tab
4. Click **+ New Variable**
5. Add:
   - **Name**: `HEDERA_HCS_TOPIC_ID`
   - **Value**: `0.0.xxxxx` (the topic ID from logs)
6. Click **Add**
7. Railway will automatically redeploy

---

## ✅ Verification

### Check if Topic is Working

1. **View Logs**: Look for "✅ Hedera Audit Service initialized"
2. **Check HashScan**: Visit the topic URL from logs
3. **Test Transaction**: Make a buy/sell transaction
4. **View Audit Trail**: Check the token detail page for audit logs

### View Topic on HashScan

Visit the HashScan URL from the logs (or construct it):
- **Testnet**: `https://hashscan.io/testnet/topic/{topicId}`
- **Mainnet**: `https://hashscan.io/topic/{topicId}`

You should see:
- Topic details
- All messages submitted to the topic
- Each audit log entry

---

## 🔄 What Happens on Redeploy?

### If Topic ID is Set
- ✅ Uses existing topic
- ✅ Continues logging to same topic
- ✅ No duplicate topics created

### If Topic ID is NOT Set
- ⚠️ Creates a NEW topic each time
- ⚠️ Old audit logs won't be visible
- ⚠️ Not recommended for production

**Recommendation**: Always set `HEDERA_HCS_TOPIC_ID` after first creation!

---

## 🎯 Current Status

### For Your Deployment

**Option 1: Let it Auto-Create (Easiest)**
1. Deploy to Railway with Hedera credentials
2. Check logs for topic ID
3. Add topic ID to Railway variables
4. Done! ✅

**Option 2: Pre-Create Topic (Advanced)**
1. Run initialization script locally
2. Get topic ID
3. Add to Railway before first deploy
4. Topic will be reused

---

## 📝 Environment Variables Summary

### Required for HCS to Work
```env
HEDERA_ACCOUNT_ID=0.0.7268944
HEDERA_PRIVATE_KEY=0xYOUR_PRIVATE_KEY
```

### Optional (but Recommended)
```env
HEDERA_HCS_TOPIC_ID=0.0.xxxxx  # Add after first creation
```

---

## 🆘 Troubleshooting

### Topic Not Creating?

**Check:**
1. ✅ `HEDERA_ACCOUNT_ID` is set
2. ✅ `HEDERA_PRIVATE_KEY` is set
3. ✅ Account has HBAR balance (for topic creation fee)
4. ✅ Check Railway logs for errors

### Can't Find Topic ID in Logs?

**Try:**
1. Search logs for "HCS topic" or "Topic ID"
2. Check deployment logs (not just runtime logs)
3. Look for "Created HCS topic" message
4. If not found, topic creation may have failed - check error logs

### Want to Use Existing Topic?

If you already have a topic ID:
1. Add `HEDERA_HCS_TOPIC_ID` to Railway variables
2. Restart backend
3. It will use the existing topic

---

## 🎉 Summary

**TL;DR:**
- ✅ **No GitHub secrets needed**
- ✅ **Auto-creates on first run**
- ✅ **Just add to Railway after first deploy**
- ✅ **Works immediately without topic ID**

**After first deploy:**
1. Copy topic ID from Railway logs
2. Add `HEDERA_HCS_TOPIC_ID` to Railway variables
3. Done! ✅

---

**Last Updated**: December 2024  
**Status**: ✅ Ready for Deployment

