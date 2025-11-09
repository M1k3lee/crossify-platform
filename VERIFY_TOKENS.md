# How to Verify Tokens Exist on Testnet

## Quick Verification Steps

### 1. Check Block Explorer for Factory Events

#### Base Sepolia
1. Go to: https://sepolia-explorer.base.org/address/0x314DFf75620f1CFB09B5aD88892Dded0A13A6c58
2. Click "Events" or "Logs" tab
3. Look for "TokenCreated" events
4. Count how many tokens were created

#### BSC Testnet
1. Go to: https://testnet.bscscan.com/address/0x39fB28323572610eC0Df1EF075f4acDD51f77e2E
2. Click "Events" or "Logs" tab
3. Look for "TokenCreated" events
4. Count how many tokens were created

#### Sepolia
1. Go to: https://sepolia.etherscan.io/address/0x39fB28323572610eC0Df1EF075f4acDD51f77e2E
2. Click "Events" or "Logs" tab
3. Look for "TokenCreated" events
4. Count how many tokens were created

### 2. Check Your Token's Creation Transaction

1. Find your token address (from your wallet or previous transactions)
2. Look up the token on the block explorer
3. Find the transaction that created it
4. Check the "From" address (this is the factory that created it)
5. Compare with Railway environment variables

### 3. Verify Factory Address in Token Creation

When you created tokens through the frontend:
- Which factory address was used?
- Check the frontend environment variables
- Compare with Railway backend environment variables

## Expected Results

If tokens exist and factory addresses match:
- Block explorer should show TokenCreated events
- Sync should find and sync those tokens
- Database should show tokens after sync

If tokens exist but factory addresses don't match:
- Block explorer shows TokenCreated events
- But sync finds 0 tokens (because it's looking at wrong factory)
- Solution: Update Railway factory address to match

If no tokens exist:
- Block explorer shows 0 TokenCreated events
- Sync correctly finds 0 tokens
- Solution: Create tokens with the configured factory

## Common Issues

### Issue: Factory Address Mismatch

**Symptom**: Tokens exist on blockchain but sync finds 0 tokens

**Cause**: Tokens were created with a different factory than configured

**Fix**: 
1. Find the actual factory address used
2. Update Railway environment variable
3. Run sync again

### Issue: Tokens Created with Old Factory

**Symptom**: Tokens exist but were created before new factory deployment

**Cause**: Old tokens use old factory, new factory has no tokens

**Fix**: 
- Old tokens won't sync (they use old factory)
- New tokens will sync (they use new factory)
- Or update Railway to use old factory address

### Issue: Tokens on Different Chain

**Symptom**: Created tokens on one chain but checking another

**Cause**: Chain mismatch

**Fix**: 
- Check which chain you created tokens on
- Verify that chain's factory address is configured
- Run sync for that specific chain

---

**Next Step**: Check block explorer to verify tokens exist and which factory created them.


