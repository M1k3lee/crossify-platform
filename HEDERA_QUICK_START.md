# Hedera Quick Start - TL;DR Version

## What You Need (5 minutes)

### 1. Create Hedera Account
- **Option A**: Install HashPack wallet (https://hashpack.app/) - easiest
- **Option B**: Use Hedera Portal (https://portal.hedera.com/)
- **You'll get**: Account ID (`0.0.xxxxx`) and Private Key

### 2. Get Free Testnet HBAR
- Visit: https://portal.hedera.com/
- Click "Get Testnet HBAR"
- Enter your Account ID
- You'll get ~10,000 free testnet HBAR

### 3. Deploy Contracts
```bash
cd contracts

# Add to contracts/.env:
HEDERA_TESTNET_RPC_URL=https://testnet.hashio.io/api
PRIVATE_KEY=your_hedera_private_key_here  # No 0x prefix!

# Deploy:
npx hardhat run scripts/deploy-hedera.ts --network hederaTestnet
```

**Save the TokenFactory address from output!**

### 4. Configure Environment Variables

**Backend (`backend/.env`):**
```env
HEDERA_RPC_URL=https://testnet.hashio.io/api
HEDERA_ACCOUNT_ID=0.0.xxxxx
HEDERA_PRIVATE_KEY=your_private_key_hex
HEDERA_FACTORY_ADDRESS=0x... # From deployment
```

**Frontend (Netlify/Vercel):**
```env
VITE_HEDERA_FACTORY=0x... # From deployment
```

**Then redeploy frontend!**

### 5. Test It
- Go to your site
- Click "Launch Token"
- Select "Hedera" chain
- Create a test token!

---

## Security Notes

✅ **DO:**
- Use testnet keys for development
- Store keys in environment variables (not in code)
- Add `.env` files to `.gitignore`

❌ **DON'T:**
- Commit private keys to Git
- Share private keys publicly
- Use mainnet keys for testing

---

## Troubleshooting

**"Cannot connect to RPC"**
→ Check RPC URL: `https://testnet.hashio.io/api`

**"Insufficient HBAR"**
→ Get more from: https://portal.hedera.com/

**"Invalid private key"**
→ Remove `0x` prefix if present, ensure hex format

**"Factory not found"**
→ Verify contract address, check HashScan: https://hashscan.io/testnet

---

## That's It!

For detailed instructions, see: `docs/HEDERA_SETUP_GUIDE.md`

