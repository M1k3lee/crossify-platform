import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * Fix bonding curve configuration for cross-chain price sync
 * 
 * This script:
 * 1. Sets GlobalSupplyTracker address on bonding curve
 * 2. Enables useGlobalSupply
 * 3. Authorizes bonding curve in GlobalSupplyTracker
 * 
 * Usage:
 *   CURVE_ADDRESS=0x... GLOBAL_SUPPLY_TRACKER=0x... npx hardhat run scripts/fix-bonding-curve-config.ts --network baseSepolia
 */
async function main() {
  const network = hre.network.name;
  console.log(`\n🔧 Fixing bonding curve configuration on ${network}...\n`);

  const curveAddress = process.env.CURVE_ADDRESS;
  const globalSupplyTrackerAddress = process.env.GLOBAL_SUPPLY_TRACKER;

  if (!curveAddress) {
    console.error("❌ ERROR: CURVE_ADDRESS environment variable not set");
    process.exit(1);
  }

  if (!globalSupplyTrackerAddress) {
    console.error("❌ ERROR: GLOBAL_SUPPLY_TRACKER environment variable not set");
    console.error("   Get the address from your .env file or deployment logs");
    process.exit(1);
  }

  console.log(`📍 Bonding Curve: ${curveAddress}`);
  console.log(`📍 Global Supply Tracker: ${globalSupplyTrackerAddress}\n`);

  const [deployer] = await ethers.getSigners();
  console.log(`👤 Deployer: ${deployer.address}\n`);

  // Get bonding curve contract
  const BondingCurveABI = [
    "function owner() external view returns (address)",
    "function globalSupplyTracker() external view returns (address)",
    "function useGlobalSupply() external view returns (bool)",
    "function setGlobalSupplyTracker(address) external",
    "function setUseGlobalSupply(bool) external",
  ];

  const curve = new ethers.Contract(curveAddress, BondingCurveABI, deployer);

  // Check if deployer is owner
  const owner = await curve.owner();
  if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
    console.error(`❌ ERROR: Deployer is not the owner of the bonding curve!`);
    console.error(`   Owner: ${owner}`);
    console.error(`   Deployer: ${deployer.address}`);
    process.exit(1);
  }

  console.log("✅ Deployer is the owner\n");

  // Check current configuration
  const currentTracker = await curve.globalSupplyTracker();
  const currentUseGlobalSupply = await curve.useGlobalSupply();

  console.log("📊 Current Configuration:");
  console.log(`   Global Supply Tracker: ${currentTracker}`);
  console.log(`   Use Global Supply: ${currentUseGlobalSupply}\n`);

  // Step 1: Set GlobalSupplyTracker
  if (currentTracker.toLowerCase() !== globalSupplyTrackerAddress.toLowerCase()) {
    console.log("1️⃣ Setting GlobalSupplyTracker address...");
    try {
      const tx1 = await curve.setGlobalSupplyTracker(globalSupplyTrackerAddress);
      console.log(`   Transaction: ${tx1.hash}`);
      await tx1.wait();
      console.log("   ✅ GlobalSupplyTracker address set\n");
    } catch (error: any) {
      console.error(`   ❌ Error: ${error.message}`);
      process.exit(1);
    }
  } else {
    console.log("1️⃣ GlobalSupplyTracker address already set ✅\n");
  }

  // Step 2: Enable useGlobalSupply
  if (!currentUseGlobalSupply) {
    console.log("2️⃣ Enabling useGlobalSupply...");
    try {
      const tx2 = await curve.setUseGlobalSupply(true);
      console.log(`   Transaction: ${tx2.hash}`);
      await tx2.wait();
      console.log("   ✅ useGlobalSupply enabled\n");
    } catch (error: any) {
      console.error(`   ❌ Error: ${error.message}`);
      process.exit(1);
    }
  } else {
    console.log("2️⃣ useGlobalSupply already enabled ✅\n");
  }

  // Step 3: Authorize bonding curve in GlobalSupplyTracker
  console.log("3️⃣ Authorizing bonding curve in GlobalSupplyTracker...");
  const GlobalSupplyTrackerABI = [
    "function owner() external view returns (address)",
    "function authorizedUpdaters(address) external view returns (bool)",
    "function authorizeUpdater(address) external",
  ];

  const tracker = new ethers.Contract(globalSupplyTrackerAddress, GlobalSupplyTrackerABI, deployer);

  // Check if deployer is owner of tracker
  const trackerOwner = await tracker.owner();
  if (trackerOwner.toLowerCase() !== deployer.address.toLowerCase()) {
    console.log("   ⚠️  Deployer is not the owner of GlobalSupplyTracker");
    console.log(`   Owner: ${trackerOwner}`);
    console.log(`   Deployer: ${deployer.address}`);
    console.log("   ⚠️  Skipping authorization (you'll need to do this manually)\n");
  } else {
    try {
      const isAuthorized = await tracker.authorizedUpdaters(curveAddress);
      if (!isAuthorized) {
        const tx3 = await tracker.authorizeUpdater(curveAddress);
        console.log(`   Transaction: ${tx3.hash}`);
        await tx3.wait();
        console.log("   ✅ Bonding curve authorized\n");
      } else {
        console.log("   ✅ Bonding curve already authorized\n");
      }
    } catch (error: any) {
      console.error(`   ❌ Error: ${error.message}`);
      console.log("   ⚠️  You may need to authorize manually\n");
    }
  }

  // Verify final configuration
  console.log("=".repeat(60));
  console.log("VERIFICATION");
  console.log("=".repeat(60) + "\n");

  const finalTracker = await curve.globalSupplyTracker();
  const finalUseGlobalSupply = await curve.useGlobalSupply();

  console.log(`Global Supply Tracker: ${finalTracker}`);
  console.log(`Use Global Supply: ${finalUseGlobalSupply ? "✅ YES" : "❌ NO"}\n`);

  if (finalTracker.toLowerCase() === globalSupplyTrackerAddress.toLowerCase() && finalUseGlobalSupply) {
    console.log("✅ Bonding curve is now properly configured for cross-chain price sync!");
  } else {
    console.log("❌ Configuration incomplete. Please check the errors above.");
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

