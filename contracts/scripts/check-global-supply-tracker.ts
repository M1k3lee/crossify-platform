import { ethers } from "hardhat";
import hre from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * Script to check if existing GlobalSupplyTracker has the new cross-chain functions
 */
async function main() {
  const network = hre.network.name;
  console.log(`\n🔍 Checking GlobalSupplyTracker on ${network}...\n`);

  // Get address from environment or use known addresses
  const addresses: Record<string, string> = {
    baseSepolia: "0xA4c5bFA9099347Bc405B72dd1955b75dCa263573",
    bscTestnet: "0x15Bc893fa73694106D1720f4f0c8C3EE3259a15e",
    sepolia: "0xA4c5bFA9099347Bc405B72dd1955b75dCa263573",
  };

  const address = process.env.GLOBAL_SUPPLY_TRACKER_ADDRESS || addresses[network];

  if (!address) {
    console.error("❌ ERROR: GlobalSupplyTracker address not found!");
    console.error("   Set GLOBAL_SUPPLY_TRACKER_ADDRESS or update the script with known addresses");
    process.exit(1);
  }

  console.log(`📍 Checking address: ${address}\n`);

  // Check if contract exists
  const code = await ethers.provider.getCode(address);
  if (!code || code === '0x' || code === '0x0') {
    console.error("❌ Contract not found at this address!");
    process.exit(1);
  }

  console.log("✅ Contract found\n");

  // Try to interact with the contract
  try {
    const GlobalSupplyTracker = await ethers.getContractFactory("GlobalSupplyTracker");
    const tracker = GlobalSupplyTracker.attach(address);

    // Check if it has the new functions
    console.log("🔍 Checking for cross-chain functions...\n");

    try {
      const crossChainSync = await tracker.crossChainSync();
      console.log(`✅ crossChainSync() function exists`);
      console.log(`   Address: ${crossChainSync}\n`);
    } catch (error: any) {
      console.log(`❌ crossChainSync() function NOT found`);
      console.log(`   This contract needs to be redeployed with the new version\n`);
    }

    try {
      const crossChainEnabled = await tracker.crossChainEnabled();
      console.log(`✅ crossChainEnabled() function exists`);
      console.log(`   Enabled: ${crossChainEnabled}\n`);
    } catch (error: any) {
      console.log(`❌ crossChainEnabled() function NOT found`);
      console.log(`   This contract needs to be redeployed\n`);
    }

    try {
      const currentChainEID = await tracker.currentChainEID();
      console.log(`✅ currentChainEID() function exists`);
      console.log(`   Chain EID: ${currentChainEID}\n`);
    } catch (error: any) {
      console.log(`❌ currentChainEID() function NOT found`);
      console.log(`   This contract was deployed without chain EID parameter\n`);
    }

    // Check owner
    try {
      const owner = await tracker.owner();
      console.log(`✅ Owner: ${owner}\n`);
    } catch (error: any) {
      console.log(`⚠️  Could not get owner: ${error.message}\n`);
    }

    // Summary
    console.log("📊 Summary:");
    console.log("   If all functions exist: ✅ Contract is compatible");
    console.log("   If functions are missing: ⚠️  Contract needs to be redeployed\n");

  } catch (error: any) {
    console.error("❌ Error checking contract:", error.message);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Check failed:");
    console.error(error);
    process.exit(1);
  });

