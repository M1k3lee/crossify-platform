import { ethers } from "ethers";
import * as dotenv from "dotenv";

dotenv.config();

const ownerAddress = "0x78B056f4cFb69bE85E52850000902eB0B5b418BC";

async function main() {
  console.log(`\n🔍 Looking for private key for owner: ${ownerAddress}\n`);

  // Try all possible private key environment variables
  const possibleKeys = [
    process.env.PRIVATE_KEY,
    process.env.ETHEREUM_PRIVATE_KEY,
    process.env.BASE_PRIVATE_KEY,
    process.env.BSC_PRIVATE_KEY,
    process.env.HEDERA_PRIVATE_KEY,
  ].filter(Boolean);

  console.log(`Found ${possibleKeys.length} private keys to check\n`);

  for (let i = 0; i < possibleKeys.length; i++) {
    const key = possibleKeys[i];
    if (!key) continue;

    try {
      // Remove 0x prefix if present
      const cleanKey = key.trim().replace(/^0x/, '');
      
      // Create wallet from private key
      const wallet = new ethers.Wallet(cleanKey);
      const address = wallet.address;

      console.log(`Key ${i + 1}: ${address === ownerAddress ? "✅ MATCH!" : "❌"}`);
      
      if (address.toLowerCase() === ownerAddress.toLowerCase()) {
        console.log(`\n✅ FOUND IT!`);
        console.log(`   Address: ${address}`);
        console.log(`   Private Key: ${key.substring(0, 10)}...${key.substring(key.length - 10)}`);
        console.log(`\n   Use this key in contracts/.env as PRIVATE_KEY to authorize bonding curves.`);
        return;
      }
    } catch (error: any) {
      console.log(`Key ${i + 1}: ❌ Invalid key format`);
    }
  }

  console.log(`\n❌ No matching private key found in environment variables.`);
  console.log(`\nYou'll need to:`);
  console.log(`1. Find the private key for address ${ownerAddress}`);
  console.log(`2. Add it to contracts/.env as PRIVATE_KEY`);
  console.log(`3. Then run the authorization scripts`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

