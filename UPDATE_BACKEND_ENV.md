# Update Backend .env with Private Keys

## ✅ Step 1 Complete: Bridge Addresses Added

I've created the `backend/.env` file with the bridge addresses. Now you need to add your private keys.

## 🔑 Step 2: Add Your Private Keys

The `backend/.env` file has been created with:
- ✅ Bridge addresses (all 3 chains)
- ⚠️ Private key placeholders (need to be filled in)

### What Private Key to Use?

**Use the SAME private key that was used to deploy the bridge contracts.**

This is the key that:
- Deployed the bridges successfully
- Has ETH/BNB for gas fees on each chain
- Has permission to execute bridge operations

### How to Update

1. **Open `backend/.env`**
2. **Replace `YOUR_PRIVATE_KEY_HERE`** with your actual private key (3 times - one for each chain)

Example:
```bash
# Replace this:
ETHEREUM_PRIVATE_KEY=YOUR_PRIVATE_KEY_HERE
BSC_PRIVATE_KEY=YOUR_PRIVATE_KEY_HERE
BASE_PRIVATE_KEY=YOUR_PRIVATE_KEY_HERE

# With your actual key (same for all chains is fine for testnets):
ETHEREUM_PRIVATE_KEY=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
BSC_PRIVATE_KEY=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
BASE_PRIVATE_KEY=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
```

### Private Key Format

- 64 hex characters (32 bytes)
- With or without `0x` prefix (both work)
- Example: `0x1234...abcd` or `1234...abcd`

## ✅ Step 3: Restart Backend

After updating the private keys:

```bash
cd backend
npm run dev
```

**Expected Output:**
```
✅ Liquidity monitoring service started
🔄 Starting liquidity monitoring service...
```

## 🎯 Quick Checklist

- [x] Bridge addresses added to `backend/.env`
- [ ] Private keys added to `backend/.env` (use deployment key)
- [ ] Backend restarted
- [ ] Check logs for: `✅ Liquidity monitoring service started`

## 📝 Note

If you used the same private key for all contract deployments, you can use that same key for all three chains in the backend `.env` file. This is perfectly fine for testnets.

