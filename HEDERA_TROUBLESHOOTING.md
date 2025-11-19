# Hedera HCS Troubleshooting - Credentials Set But Not Working

## ✅ Current Status

Your Railway variables are **correctly set**:
- ✅ `HEDERA_ACCOUNT_ID` = `0.0.7268944`
- ✅ `HEDERA_PRIVATE_KEY` = `0xYOUR_PRIVATE_KEY`

But logs don't show Hedera initialization. This usually means:

## 🔍 Possible Issues

### 1. Service Needs Restart

**Most likely cause**: The backend started before you added the Hedera credentials.

**Solution**: 
1. Go to Railway → Your service → **Settings**
2. Click **Restart** (or trigger a redeploy)
3. Check logs after restart for Hedera messages

### 2. Check for Error Messages

Look in Railway logs for:
- `⚠️  Hedera credentials not configured` = credentials not being read
- `❌ Error initializing Hedera Audit Service` = check error details
- `✅ Hedera Audit Service initialized` = working!

### 3. Missing Dependencies

The Hedera SDK might not be installed. Check `backend/package.json` for:
```json
"@hashgraph/sdk": "^2.x.x"
```

If missing, add it:
```bash
cd backend
npm install @hashgraph/sdk
```

### 4. Network/Connection Issues

Hedera might be having connectivity issues. Check logs for:
- Network timeout errors
- Connection refused errors
- RPC URL issues

## 🚀 Quick Fix Steps

### Step 1: Restart Service

1. Railway Dashboard → Your service
2. Click **Settings** tab
3. Scroll to bottom → Click **Restart**
4. Or trigger a redeploy by pushing a commit

### Step 2: Check Logs Immediately After Restart

After restart, look for these messages in order:

1. **Database initialized**
2. **Redis initialized** (or warning if not available)
3. **Price sync service started**
4. **Hedera Audit Service initialized** ← **LOOK FOR THIS**

If you see:
- ✅ `✅ Hedera Audit Service initialized` = Working!
- ⚠️ `⚠️  Hedera credentials not configured` = Variables not being read
- ❌ `❌ Error initializing Hedera Audit Service` = Check error message

### Step 3: Check for Topic Creation

If initialization succeeds, you should see either:
- `✅ Using existing HCS topic: 0.0.xxxxx` (if `HEDERA_HCS_TOPIC_ID` is set)
- Or the big topic creation message with the new topic ID

## 🔍 What to Look For in Logs

### Success Pattern:
```
✅ Database initialized
✅ Redis initialized
✅ Price sync service started
...
✅ Hedera Audit Service initialized (Powered by Hedera)
✅ Hedera File Service initialized (Powered by Hedera)
```

### Or Topic Creation:
```
======================================================================
✅ HEDERA HCS TOPIC CREATED
======================================================================
📋 Topic ID: 0.0.1234567
...
```

### Error Pattern:
```
⚠️  Hedera credentials not configured. HCS audit logging disabled.
   Set HEDERA_ACCOUNT_ID and HEDERA_PRIVATE_KEY to enable.
```

Or:
```
❌ Error initializing Hedera Audit Service: [error message]
```

## 🎯 Next Steps

1. **Restart the Railway service**
2. **Watch the logs** during startup
3. **Look for Hedera messages** (they appear early in startup)
4. **If you see errors**, share them and I'll help debug

## 📋 Additional Variables to Check

While you have the credentials, you might also want to add (optional):

```env
HEDERA_RPC_URL=https://testnet.hashio.io/api
HEDERA_TESTNET_RPC_URL=https://testnet.hashio.io/api
```

These have defaults, but explicit is better.

## 🆘 If Still Not Working

If after restart you still don't see Hedera messages:

1. **Check if `@hashgraph/sdk` is installed:**
   - Look in `backend/package.json`
   - If missing, add it and redeploy

2. **Check Railway build logs:**
   - Go to Deployments tab
   - Click latest deployment
   - Check if npm install succeeded

3. **Verify variable names:**
   - Make sure no typos: `HEDERA_ACCOUNT_ID` (not `HEDERA_ACCOUNT`)
   - Make sure no extra spaces

4. **Check account balance:**
   - Visit: https://hashscan.io/testnet/account/0.0.7268944
   - Account needs HBAR for topic creation

---

**Most likely fix**: Just restart the Railway service! The credentials are there, it just needs to pick them up on startup.







