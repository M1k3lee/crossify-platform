# Verify and Export Hedera Private Key from HashPack

## The Problem
The private key `8f27a9a489e7fcdce400e7b385c3796842b38d09e24783495246e496d7cc784c` does not match account `0.0.7271342`. The Hedera network is rejecting transactions with `INVALID_SIGNATURE`.

## Step-by-Step Verification

### 1. Verify Account in HashPack
1. Open HashPack wallet
2. Make sure you're on **Testnet** (not Mainnet)
3. Check that account `0.0.7271342-knsbb` is visible
4. Try sending a small transaction (0.1 HBAR) to another account
   - If this works, the account is valid
   - If this fails, the account might be rekeyed or invalid

### 2. Export Private Key from HashPack

**Option A: Export via HashPack UI**
1. In HashPack, click on your account
2. Go to **Settings** or **Account Settings**
3. Look for **Export Private Key** or **Show Private Key**
4. Copy the private key (it should be a hex string)

**Option B: Export via HashPack CLI (if available)**
- Some versions of HashPack allow CLI export
- Check HashPack documentation

**Option C: Check if you have a recovery phrase**
- If you imported the account using a recovery phrase, you might need to derive the private key from the phrase
- The private key format might be different

### 3. Verify Private Key Format

The private key should be:
- **64 hex characters** (32 bytes) for ED25519
- Example: `8f27a9a489e7fcdce400e7b385c3796842b38d09e24783495246e496d7cc784c`
- **No `0x` prefix** (or remove it if present)

### 4. Test the Private Key Locally

You can test if the private key matches the account using the provided test script:

```bash
# From the backend directory
cd backend
node test-hedera-key.js
```

Or set environment variables:
```bash
cd backend
HEDERA_ACCOUNT_ID=0.0.7271342 HEDERA_PRIVATE_KEY=your_key_here node test-hedera-key.js
```

The script will:
- Parse the private key
- Derive the public key
- Query the account on Hedera Testnet
- Compare public keys to verify they match
- Show account balance and details

### 5. Common Issues

**Issue 1: Account was rekeyed**
- If you imported the account into HashPack, it might have been rekeyed
- The original private key no longer works
- Solution: Export the NEW private key from HashPack

**Issue 2: Wrong network**
- Make sure you're using **Testnet** credentials
- Mainnet and Testnet accounts are different

**Issue 3: Wrong key format**
- HashPack might export in a different format
- Try exporting again and check the format

**Issue 4: Account doesn't exist**
- Verify the account exists: https://hashscan.io/testnet/account/0.0.7271342
- If it doesn't exist, you need to create it first

### 6. Alternative: Create a New Account

If you can't get the private key to work, you can create a new Hedera testnet account:

1. **Via HashPack:**
   - Create a new account in HashPack (Testnet)
   - Export the private key
   - Fund it with testnet HBAR (use faucet if needed)

2. **Via Hedera SDK:**
   ```javascript
   const { Client, PrivateKey } = require("@hashgraph/sdk");
   
   const client = Client.forTestnet();
   const newPrivateKey = PrivateKey.generateED25519();
   const newPublicKey = newPrivateKey.publicKey;
   
   console.log("New private key:", newPrivateKey.toStringRaw());
   console.log("New public key:", newPublicKey.toString());
   ```

### 7. Update Railway Environment Variables

Once you have the correct private key:

1. Go to Railway → Your Service → Variables
2. Update `HEDERA_PRIVATE_KEY` with the new key
3. Make sure `HEDERA_ACCOUNT_ID` is `0.0.7271342` (without checksum)
4. Restart the service

## Next Steps

1. **Export the private key from HashPack** (don't use the one you have)
2. **Test it locally** using the script above
3. **Update Railway** with the correct key
4. **Restart the service** and check Deploy Logs

The verification step we added will now catch this early and give you a clear error message!

