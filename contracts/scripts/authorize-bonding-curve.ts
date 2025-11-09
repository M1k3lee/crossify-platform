import { ethers } from "hardhat";
import hre from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * Script to authorize a BondingCurve in GlobalSupplyTracker
 * Run this after creating a token to enable cross-chain sync for that token
 */
async function main() {
  const network = hre.network.name;
  console.log(`\n🔐 Authorizing BondingCurve on ${network}...\n`);

  const globalSupplyTrackerAddress = process.env.GLOBAL_SUPPLY_TRACKER_ADDRESS;
  const bondingCurveAddress = process.env.BONDING_CURVE_ADDRESS;

  if (!globalSupplyTrackerAddress) {
    console.error("❌ ERROR: GLOBAL_SUPPLY_TRACKER_ADDRESS not set!");
    process.exit(1);
  }

  if (!bondingCurveAddress) {
    console.error("❌ ERROR: BONDING_CURVE_ADDRESS not set!");
    console.error("   Set BONDING_CURVE_ADDRESS to the bonding curve contract address");
    process.exit(1);
  }

  console.log(`📍 GlobalSupplyTracker: ${globalSupplyTrackerAddress}`);
  console.log(`📍 BondingCurve: ${bondingCurveAddress}\n`);

  const [deployer] = await ethers.getSigners();
  console.log(`👤 Authorizing as: ${deployer.address}\n`);

  // Check if bonding curve exists
  const code = await ethers.provider.getCode(bondingCurveAddress);
  if (!code || code === '0x' || code === '0x0') {
    console.error("❌ ERROR: BondingCurve contract not found at this address!");
    process.exit(1);
  }

  console.log("✅ BondingCurve contract verified\n");

  // Authorize
  const GlobalSupplyTracker = await ethers.getContractFactory("GlobalSupplyTracker");
  const tracker = GlobalSupplyTracker.attach(globalSupplyTrackerAddress);

  console.log("🔐 Authorizing BondingCurve...");
  try {
    const tx = await tracker.authorizeUpdater(bondingCurveAddress);
    console.log(`   Transaction: ${tx.hash}`);
    await tx.wait();
    console.log("   ✅ BondingCurve authorized!\n");
  } catch (error: any) {
    console.error("   ❌ Authorization failed:", error.message);
    process.exit(1);
  }

  // Verify
  console.log("🔍 Verifying authorization...");
  const isAuthorized = await tracker.authorizedUpdaters(bondingCurveAddress);
  if (isAuthorized) {
    console.log("   ✅ BondingCurve is authorized\n");
  } else {
    console.log("   ❌ Authorization verification failed\n");
    process.exit(1);
  }

  console.log("✅ Complete! This BondingCurve can now update global supply and trigger cross-chain sync.\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Authorization failed:");
    console.error(error);
    process.exit(1);
  });

