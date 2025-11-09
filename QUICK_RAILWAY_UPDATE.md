# Quick Railway Update - TokenFactory Addresses

## ⚠️ ACTION REQUIRED: Update These 3 Variables in Railway

### Current Railway Variables (OLD)
```
BASE_FACTORY_ADDRESS=0x8eC132791e6897bDbe8dCd6849d51129A7630241
BSC_FACTORY_ADDRESS=0x314DFf75620f1CFB09B5aD88892Dded0A13A6c58
ETHEREUM_FACTORY_ADDRESS=0xBc56A85F475515dFc9a0d5F2c185c2fB523471B0
```

### New Values to Set (NEW)
```
BASE_FACTORY_ADDRESS=0x314DFf75620f1CFB09B5aD88892Dded0A13A6c58
BSC_FACTORY_ADDRESS=0x39fB28323572610eC0Df1EF075f4acDD51f77e2E
ETHEREUM_FACTORY_ADDRESS=0x39fB28323572610eC0Df1EF075f4acDD51f77e2E
```

## 📝 Steps to Update

1. Go to Railway Dashboard → Your Project → Variables Tab
2. Find each variable above
3. Click edit and update to the NEW value
4. Save (Railway will auto-redeploy)

## ✅ Why Update?

The backend uses these addresses to:
- Sync tokens from blockchain to database
- Find tokens created by users
- Display tokens in the dashboard

**Without updating**: Backend will query OLD contracts and won't find your new tokens!
**After updating**: Backend will query NEW contracts with the fixed BondingCurve!

## 🔍 Verify After Update

1. Check Railway logs for any errors
2. Test: `GET /tokens/my-tokens?address=YOUR_WALLET_ADDRESS`
3. Should now find tokens created with the new TokenFactory

---

**Quick Copy-Paste for Railway:**

```
BASE_FACTORY_ADDRESS=0x314DFf75620f1CFB09B5aD88892Dded0A13A6c58
BSC_FACTORY_ADDRESS=0x39fB28323572610eC0Df1EF075f4acDD51f77e2E
ETHEREUM_FACTORY_ADDRESS=0x39fB28323572610eC0Df1EF075f4acDD51f77e2E
```

