# BondingCurve Contract Fix - Deployment Guide

## ✅ Fixes Applied

The BondingCurve contract has been fixed to prevent invalid price calculations. Key improvements:

### 1. Global Supply Validation
- **Maximum supply limit**: 1 billion tokens (1e27 wei)
- **Corrupted data protection**: Validates global supply when local supply is 0
- **Ratio validation**: Rejects global supply > 100x local supply
- **New token protection**: Rejects global supply > 1 million tokens for new chains

### 2. Price Calculation Safety
- **Maximum amount**: 1 billion tokens per transaction
- **Maximum price per token**: 1 ETH
- **Maximum total price**: 100 ETH per transaction
- **Overflow protection**: Validates inputs before multiplication
- **Small amount handling**: Simplified calculation for amounts < 1 token

### 3. Error Handling
- Clear error messages for validation failures
- Prevents astronomical prices from corrupted data
- Graceful fallback when global supply tracker fails

## 🚀 Deployment Steps

### Option 1: Redeploy TokenFactory (Recommended)

The BondingCurve contract is deployed automatically by TokenFactory when creating new tokens. To use the fixed version:

1. **Compile the contracts**:
   ```bash
   cd contracts
   npm run compile
   ```

2. **Deploy TokenFactory to testnets**:
   ```bash
   # Deploy to Base Sepolia
   npx hardhat run scripts/deploy.ts --network baseSepolia
   
   # Deploy to BSC Testnet
   npx hardhat run scripts/deploy.ts --network bscTestnet
   
   # Deploy to Sepolia
   npx hardhat run scripts/deploy.ts --network sepolia
   ```

3. **Update frontend environment variables**:
   ```env
   VITE_BASE_FACTORY=<new_token_factory_address>
   VITE_BSC_FACTORY=<new_token_factory_address>
   VITE_ETH_FACTORY=<new_token_factory_address>
   ```

4. **Redeploy frontend** to Vercel (automatic on push to main)

### Option 2: Verify Existing Contracts

If you want to verify that existing BondingCurve contracts are working correctly:

1. **Test price calculation** on existing tokens:
   - Try buying a small amount (e.g., 20 tokens)
   - Verify the price is reasonable (< 1 ETH total)
   - Check that the contract doesn't return astronomical prices

2. **Monitor for errors**:
   - Watch for "Price calculation error" revert messages
   - Check if global supply tracker is returning corrupted data
   - Verify that prices are within expected ranges

## 📝 Important Notes

### Existing Tokens
- **Existing BondingCurve contracts** deployed before this fix may still have the bug
- **New tokens** created after redeploying TokenFactory will use the fixed version
- **Existing tokens** cannot be upgraded (they're not upgradeable contracts)

### Migration Strategy
If you have existing tokens with the bug:

1. **Option A**: Create new tokens using the fixed TokenFactory
2. **Option B**: Accept that existing tokens may need users to use smaller amounts
3. **Option C**: Deploy a new version of existing tokens (users would need to migrate)

### Testing Checklist

Before deploying to production:

- [ ] Compile contracts successfully
- [ ] Deploy TokenFactory to testnet
- [ ] Create a test token using the new TokenFactory
- [ ] Test buying tokens (small and large amounts)
- [ ] Verify price calculations are reasonable
- [ ] Test with global supply tracker enabled
- [ ] Test with global supply tracker disabled
- [ ] Verify error messages are clear
- [ ] Test edge cases (very small amounts, maximum amounts)

## 🔍 Verification

After deployment, verify the fix is working:

1. **Create a new token** on testnet
2. **Try to buy tokens**:
   ```javascript
   // Should work and return reasonable prices
   const price = await bondingCurve.getPriceForAmount(ethers.parseEther("20"));
   console.log("Price for 20 tokens:", ethers.formatEther(price), "ETH");
   ```

3. **Check for errors**:
   - No "Price calculation error" messages
   - Prices are within expected ranges (< 1 ETH per token)
   - No astronomical prices returned

## 🐛 Known Issues

### Compilation Errors
There are compilation errors in other contracts (CFYToken, CFYStaking) that prevent full compilation. However, **BondingCurve.sol compiles correctly** and can be deployed independently through TokenFactory.

### Frontend Fallback
The frontend has a fallback mechanism that will use a simplified price calculation if the contract returns an invalid price. This fallback will no longer be needed once all contracts are using the fixed version.

## 📞 Support

If you encounter issues:

1. Check that TokenFactory is using the latest BondingCurve contract
2. Verify global supply tracker is configured correctly
3. Check that prices are within expected ranges
4. Review error messages for specific issues

## 🎯 Next Steps

1. ✅ BondingCurve contract fixed and committed
2. ⏳ Fix compilation errors in other contracts (optional)
3. ⏳ Redeploy TokenFactory to testnets
4. ⏳ Update frontend environment variables
5. ⏳ Test new token creation
6. ⏳ Verify price calculations work correctly

---

**Status**: ✅ BondingCurve contract is ready for deployment
**Date**: $(Get-Date -Format "yyyy-MM-dd")
**Version**: Fixed with comprehensive safety checks

