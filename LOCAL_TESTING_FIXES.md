# Local Testing Fixes

## Issues Fixed

### 1. ✅ Decimals NOT NULL Constraint Error

**Problem:** 
- Token sync was failing with `SQLITE_CONSTRAINT: NOT NULL constraint failed: tokens.decimals`
- Decimals was sometimes null/undefined when token contract call failed

**Fix:**
- Added robust decimals parsing with multiple fallback checks
- Ensured decimals is always a valid number (defaults to 18)
- Added `Number()` coercion in both INSERT statements
- Added validation to ensure decimals is between 0-255

### 2. ✅ Sepolia RPC URL 404 Error

**Problem:**
- Sepolia RPC URL `https://eth-sepolia.publicnode.com` was returning 404
- Causing JsonRpcProvider to fail repeatedly

**Fix:**
- Changed to official Sepolia RPC: `https://rpc.sepolia.org`
- More reliable and always available

### 3. ✅ Base Sepolia RPC URL

**Problem:**
- Using publicnode.com which might be unreliable

**Fix:**
- Changed to official Base Sepolia RPC: `https://sepolia.base.org`
- More reliable for Base Sepolia network

### 4. ✅ BSC Testnet RPC URL

**Problem:**
- Using publicnode.com which has pruned history
- Getting "History has been pruned" errors

**Fix:**
- Changed to official Binance RPC: `https://data-seed-prebsc-1-s1.binance.org:8545`
- Better history retention (though still may have limits)

### 5. ✅ Name and Symbol Null Safety

**Problem:**
- Name and symbol could potentially be null/undefined

**Fix:**
- Added fallback to empty string for name and symbol
- Ensures database constraints are always satisfied

## Testing

After these fixes, you should be able to:

1. ✅ Start backend without errors
2. ✅ Sync tokens from blockchain successfully
3. ✅ Insert tokens into database without constraint errors
4. ✅ Connect to all RPC endpoints successfully

## Notes

- **BSC Testnet History**: Even with the official RPC, BSC testnet may still have pruned history for very old blocks. This is normal for testnets.
- **Decimals**: All tokens will default to 18 decimals if the contract doesn't return a valid value.
- **RPC Endpoints**: Using official RPC endpoints is more reliable than public node services.

## Next Steps

1. Restart the backend server
2. Check logs for successful token sync
3. Verify tokens are inserted into database
4. Test token detail page in frontend

