import { ethers } from "ethers";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * Find which private key in your environment matches the GlobalSupplyTracker owner
 * This helps identify which key to add to Railway
 */

const OWNER_ADDRESS = "0x78B056f4cFb69bE85E52850000902eB0B5b418BC";

async function main() {
  console.log(`\n🔍 Finding private key for owner: ${OWNER_ADDRESS}\n`);
  console.log("Checking all environment variables...\n");

  // Check all possible private key environment variables
  const keysToCheck = [
    { name: "PRIVATE_KEY", value: process.env.PRIVATE_KEY },
    { name: "ETHEREUM_PRIVATE_KEY", value: process.env.ETHEREUM_PRIVATE_KEY },
    { name: "BASE_PRIVATE_KEY", value: process.env.BASE_PRIVATE_KEY },
    { name: "BSC_PRIVATE_KEY", value: process.env.BSC_PRIVATE_KEY },
    { name: "HEDERA_PRIVATE_KEY", value: process.env.HEDERA_PRIVATE_KEY },
    { name: "CROSS_CHAIN_SYNC_OWNER_PRIVATE_KEY", value: process.env.CROSS_CHAIN_SYNC_OWNER_PRIVATE_KEY },
    { name: "GLOBAL_SUPPLY_TRACKER_OWNER_PRIVATE_KEY", value: process.env.GLOBAL_SUPPLY_TRACKER_OWNER_PRIVATE_KEY },
  ];

  let found = false;

  for (const { name, value } of keysToCheck) {
    if (!value) {
      console.log(`❌ ${name}: Not set`);
      continue;
    }

    try {
      const cleanKey = value.trim().replace(/^0x/, '');
      const wallet = new ethers.Wallet(cleanKey);
      const address = wallet.address;

      if (address.toLowerCase() === OWNER_ADDRESS.toLowerCase()) {
        console.log(`✅ ${name}: MATCHES OWNER!`);
        console.log(`   Address: ${address}`);
        console.log(`   Private Key: ${value.substring(0, 10)}...${value.substring(value.length - 10)}`);
        console.log(`\n📝 ADD THIS TO RAILWAY:`);
        console.log(`   Variable Name: ETHEREUM_PRIVATE_KEY`);
        console.log(`   Value: ${value}`);
        found = true;
      } else {
        console.log(`❌ ${name}: ${address} (not owner)`);
      }
    } catch (error: any) {
      console.log(`❌ ${name}: Invalid format - ${error.message}`);
    }
  }

  if (!found) {
    console.log(`\n❌ No matching private key found in environment variables.`);
    console.log(`\n📝 You need to:`);
    console.log(`1. Find the private key for address ${OWNER_ADDRESS}`);
    console.log(`2. Add it to Railway as ETHEREUM_PRIVATE_KEY`);
    console.log(`3. Then call the authorize-backend-wallet endpoint again`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

