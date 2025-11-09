# Quick Debug Guide for BOUNCE 2.0

## 🚀 Quick Start

### 1. Get BOUNCE 2.0 Token Address

Go to the BOUNCE 2.0 token page and note:
- Token address (e.g., `0x...`)
- Chain (e.g., `bsc-testnet`, `base-sepolia`)
- Curve address (optional, from token detail page)

### 2. Check Factory Configuration

Visit: `http://localhost:3001/api/debug/factory-info`

Or if deployed: `https://your-backend-url/api/debug/factory-info`

This shows which factory addresses are configured.

### 3. Debug Token

Visit: `http://localhost:3001/api/debug/token-info?tokenAddress=0x...&chain=bsc-testnet`

Replace:
- `0x...` with BOUNCE 2.0 token address
- `bsc-testnet` with the actual chain name

### 4. Check Results

Look for:
- ✅ **Factory Address**: Does it match the new factory?
  - Base Sepolia: `0x314DFf75620f1CFB09B5aD88892Dded0A13A6c58`
  - BSC Testnet: `0x39fB28323572610eC0Df1EF075f4acDD51f77e2E`
- ✅ **Price Test**: Is `bondingCurve.priceTest.isValid` true?
- ✅ **Supply Validation**: Is `bondingCurve.supplyValidation.isReasonable` true?

### 5. Common Issues

#### Issue: Factory address doesn't match
**Solution**: Update environment variables in Railway/Vercel

#### Issue: Price test fails but factory is correct
**Possible causes**:
- Global supply tracker corrupted
- Bonding curve contract has old code
- Environment variables not updated when token was created

#### Issue: Environment variables not configured
**Solution**: Set factory addresses in Railway (backend) and Vercel (frontend)

## 📋 Next Steps

1. Run debug endpoint
2. Share results
3. We'll determine the fix needed

---

For detailed instructions, see `DEBUG_BOUNCE_TOKEN.md`


