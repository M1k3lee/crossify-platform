import { ethers } from "hardhat";
import hre from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * Script to verify cross-chain setup is complete and correct
 */
async function main() {
  const network = hre.network.name;
  console.log(`\n🔍 Verifying cross-chain setup on ${network}...\n`);

  // Get addresses from environment
  const globalSupplyTrackerAddress = process.env.GLOBAL_SUPPLY_TRACKER_ADDRESS;
  const crossChainSyncAddress = process.env.CROSS_CHAIN_SYNC_ADDRESS;

  if (!globalSupplyTrackerAddress || !crossChainSyncAddress) {
    console.error("❌ ERROR: Missing contract addresses!");
    console.error("   Set GLOBAL_SUPPLY_TRACKER_ADDRESS and CROSS_CHAIN_SYNC_ADDRESS");
    process.exit(1);
  }

  console.log(`📍 GlobalSupplyTracker: ${globalSupplyTrackerAddress}`);
  console.log(`📍 CrossChainSync: ${crossChainSyncAddress}\n`);

  const [deployer] = await ethers.getSigners();
  console.log(`👤 Verifying as: ${deployer.address}\n`);

  // Get contracts
  const GlobalSupplyTracker = await ethers.getContractFactory("GlobalSupplyTracker");
  const CrossChainSync = await ethers.getContractFactory("CrossChainSync");

  const tracker = GlobalSupplyTracker.attach(globalSupplyTrackerAddress);
  const sync = CrossChainSync.attach(crossChainSyncAddress);

  let allGood = true;

  // Check 1: GlobalSupplyTracker has CrossChainSync set
  console.log("1️⃣ Checking GlobalSupplyTracker configuration...");
  try {
    const syncAddress = await tracker.crossChainSync();
    const isEnabled = await tracker.crossChainEnabled();
    const currentEID = await tracker.currentChainEID();

    if (syncAddress.toLowerCase() === crossChainSyncAddress.toLowerCase()) {
      console.log("   ✅ CrossChainSync address is set correctly");
    } else {
      console.log("   ❌ CrossChainSync address mismatch!");
      console.log(`      Expected: ${crossChainSyncAddress}`);
      console.log(`      Got: ${syncAddress}`);
      allGood = false;
    }

    if (isEnabled) {
      console.log("   ✅ Cross-chain sync is enabled");
    } else {
      console.log("   ❌ Cross-chain sync is NOT enabled");
      allGood = false;
    }

    if (currentEID > 0) {
      console.log(`   ✅ Current chain EID: ${currentEID}`);
    } else {
      console.log("   ⚠️  Current chain EID is not set (may use chain name mapping)");
    }
  } catch (error: any) {
    console.log("   ❌ Error checking GlobalSupplyTracker:", error.message);
    allGood = false;
  }

  console.log("");

  // Check 2: GlobalSupplyTracker is authorized in CrossChainSync
  console.log("2️⃣ Checking CrossChainSync authorization...");
  try {
    const isAuthorized = await sync.authorizedTokens(globalSupplyTrackerAddress);
    if (isAuthorized) {
      console.log("   ✅ GlobalSupplyTracker is authorized");
    } else {
      console.log("   ❌ GlobalSupplyTracker is NOT authorized");
      allGood = false;
    }
  } catch (error: any) {
    console.log("   ❌ Error checking authorization:", error.message);
    allGood = false;
  }

  console.log("");

  // Check 3: Trusted remotes are set
  console.log("3️⃣ Checking trusted remotes...");
  try {
    const baseRemote = await sync.trustedRemotes(40245); // Base Sepolia
    const bscRemote = await sync.trustedRemotes(40102);  // BSC Testnet
    const sepoliaRemote = await sync.trustedRemotes(40161); // Sepolia

    if (baseRemote.length > 0) {
      console.log("   ✅ Base Sepolia (40245) trusted remote is set");
    } else {
      console.log("   ⚠️  Base Sepolia (40245) trusted remote is NOT set");
    }

    if (bscRemote.length > 0) {
      console.log("   ✅ BSC Testnet (40102) trusted remote is set");
    } else {
      console.log("   ⚠️  BSC Testnet (40102) trusted remote is NOT set");
    }

    if (sepoliaRemote.length > 0) {
      console.log("   ✅ Sepolia (40161) trusted remote is set");
    } else {
      console.log("   ⚠️  Sepolia (40161) trusted remote is NOT set");
    }
  } catch (error: any) {
    console.log("   ❌ Error checking trusted remotes:", error.message);
    allGood = false;
  }

  console.log("");

  // Check 4: Contracts have funds
  console.log("4️⃣ Checking contract balances...");
  try {
    const trackerBalance = await ethers.provider.getBalance(globalSupplyTrackerAddress);
    const syncBalance = await ethers.provider.getBalance(crossChainSyncAddress);

    const minTrackerBalance = ethers.parseEther("0.01");
    const minSyncBalance = ethers.parseEther("0.01");

    if (trackerBalance >= minTrackerBalance) {
      console.log(`   ✅ GlobalSupplyTracker has sufficient funds: ${ethers.formatEther(trackerBalance)} ETH/BNB`);
    } else {
      console.log(`   ⚠️  GlobalSupplyTracker has low balance: ${ethers.formatEther(trackerBalance)} ETH/BNB`);
      console.log("      Recommended: 0.05 ETH/BNB minimum");
    }

    if (syncBalance >= minSyncBalance) {
      console.log(`   ✅ CrossChainSync has sufficient funds: ${ethers.formatEther(syncBalance)} ETH/BNB`);
    } else {
      console.log(`   ⚠️  CrossChainSync has low balance: ${ethers.formatEther(syncBalance)} ETH/BNB`);
      console.log("      Recommended: 0.1 ETH/BNB minimum");
    }
  } catch (error: any) {
    console.log("   ❌ Error checking balances:", error.message);
    allGood = false;
  }

  console.log("");

  // Summary
  console.log("📊 Summary:");
  if (allGood) {
    console.log("   ✅ All checks passed! Cross-chain setup is complete.");
  } else {
    console.log("   ⚠️  Some checks failed. Please review the output above.");
    console.log("   See CROSS_CHAIN_SETUP_GUIDE.md for troubleshooting steps.");
  }

  console.log("");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Verification failed:");
    console.error(error);
    process.exit(1);
  });

