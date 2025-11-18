# Fix: INVALID_SIGNATURE Error for Hedera HCS

## ❌ Error

```
PrecheckStatusError: transaction 0.0.7268944@1763424326.746364417 failed precheck with status INVALID_SIGNATURE
```

## 🔍 What This Means

The private key doesn't match the Hedera account ID `0.0.7268944`. This could be because:

1. **Wrong private key** - The key doesn't belong to this account
2. **Key format issue** - The key format is incorrect
3. **Account was rekeyed** - The account's private key was changed (e.g., by importing into HashPack)

## ✅ Solution

### Step 1: Verify Your Private Key

The private key in Railway is:
```
0xYOUR_PRIVATE_KEY
```

**Check if this is correct:**
1. Go to HashPack wallet (or your Hedera wallet)
2. Export the private key for account `0.0.7268944`
3. Compare it with the one in Railway

### Step 2: Get the Correct Private Key

**If using HashPack:**
1. Open HashPack wallet
2. Click on account `0.0.7268944`
3. Go to Settings → Export Private Key
4. Copy the private key (it might be in a different format)

**Hedera private key formats:**
- **DER format** (most common): Starts with `302e0201...` or similar
- **Hex format**: 64 hex characters (32 bytes)
- **Raw bytes**: 32 bytes

### Step 3: Update Railway

1. Go to Railway → Backend Service → Variables
2. Find `HEDERA_PRIVATE_KEY`
3. Click the three dots → Edit
4. Replace with the correct private key
5. Save (Railway will redeploy)

### Step 4: Verify

After updating, check logs for:
```
✅ Parsed Hedera private key as...
✅ Hedera Audit Service initialized
✅ HEDERA HCS TOPIC CREATED
```

## 🔧 Alternative: Use Account Recovery

If you can't find the correct private key:

1. **Create a new Hedera account** (if this is testnet)
2. **Update Railway** with the new account ID and private key
3. **Fund the account** with testnet HBAR (for topic creation)

## 📝 Common Issues

### Issue: Account was imported into HashPack

If you imported account `0.0.7268944` into HashPack, the private key might have changed. HashPack sometimes rekeys accounts.

**Solution:** Export the private key from HashPack again.

### Issue: Wrong key format

Hedera keys can be in different formats. The code now tries multiple formats:
- Hex (64 chars = 32 bytes)
- DER string format
- 128 hex chars (64 bytes - extracts first 32)

**Solution:** The updated code should handle most formats automatically.

## ✅ After Fix

Once the private key is correct:
1. Backend will initialize Hedera service
2. HCS topic will be created automatically
3. Topic ID will appear in logs
4. Add `HEDERA_HCS_TOPIC_ID` to Railway

## 🆘 Still Having Issues?

If the error persists:
1. **Verify account has HBAR** - Topic creation requires a small fee
2. **Check account on HashScan** - https://hashscan.io/testnet/account/0.0.7268944
3. **Try creating a new testnet account** - Use HashPack to create a fresh account
4. **Check Railway logs** - Look for more detailed error messages

