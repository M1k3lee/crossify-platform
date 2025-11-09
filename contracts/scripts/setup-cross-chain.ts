import { ethers } from "hardhat";
import hre from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * Setup script for cross-chain synchronization
 * This script configures GlobalSupplyTracker and CrossChainSync contracts
 */
async function main() {
  const network = hre.network.name;
  console.log(`\n🔧 Setting up cross-chain sync on ${network}...\n`);

  // Get deployer
  const [deployer] = await ethers.getSigners();
  console.log(`👤 Deployer: ${deployer.address}`);

  // Get contract addresses from environment or prompt
  const globalSupplyTrackerAddress = process.env.GLOBAL_SUPPLY_TRACKER_ADDRESS;
  const crossChainSyncAddress = process.env.CROSS_CHAIN_SYNC_ADDRESS;

  if (!globalSupplyTrackerAddress || !crossChainSyncAddress) {
    console.error("❌ ERROR: Missing contract addresses in environment!");
    console.error("   Set GLOBAL_SUPPLY_TRACKER_ADDRESS and CROSS_CHAIN_SYNC_ADDRESS");
    process.exit(1);
  }

  console.log(`📍 GlobalSupplyTracker: ${globalSupplyTrackerAddress}`);
  console.log(`📍 CrossChainSync: ${crossChainSyncAddress}\n`);

  // Get contracts
  const GlobalSupplyTracker = await ethers.getContractFactory("GlobalSupplyTracker");
  const CrossChainSync = await ethers.getContractFactory("CrossChainSync");

  const globalSupplyTracker = GlobalSupplyTracker.attach(globalSupplyTrackerAddress);
  const crossChainSync = CrossChainSync.attach(crossChainSyncAddress);

  // Step 1: Set CrossChainSync in GlobalSupplyTracker
  console.log("1️⃣ Setting CrossChainSync in GlobalSupplyTracker...");
  try {
    const tx1 = await globalSupplyTracker.setCrossChainSync(crossChainSyncAddress);
    await tx1.wait();
    console.log("   ✅ CrossChainSync set\n");
  } catch (error: any) {
    console.error("   ❌ Failed:", error.message);
    process.exit(1);
  }

  // Step 2: Authorize GlobalSupplyTracker in CrossChainSync
  console.log("2️⃣ Authorizing GlobalSupplyTracker in CrossChainSync...");
  try {
    const tx2 = await crossChainSync.authorizeAddress(globalSupplyTrackerAddress);
    await tx2.wait();
    console.log("   ✅ GlobalSupplyTracker authorized\n");
  } catch (error: any) {
    console.error("   ❌ Failed:", error.message);
    process.exit(1);
  }

  // Step 3: Set trusted remotes (if provided)
  const trustedRemotes = process.env.TRUSTED_REMOTES;
  if (trustedRemotes) {
    console.log("3️⃣ Setting trusted remotes...");
    try {
      const remotes = JSON.parse(trustedRemotes);
      for (const remote of remotes) {
        const { eid, address: remoteAddress } = remote;
        const encoded = ethers.AbiCoder.defaultAbiCoder().encode(["address"], [remoteAddress]);
        const tx = await crossChainSync.setTrustedRemote(eid, encoded);
        await tx.wait();
        console.log(`   ✅ Trusted remote set: EID ${eid} -> ${remoteAddress}`);
      }
      console.log("");
    } catch (error: any) {
      console.error("   ❌ Failed:", error.message);
    }
  } else {
    console.log("3️⃣ Skipping trusted remotes (not provided)\n");
  }

  // Step 4: Fund contracts (optional)
  const fundAmount = process.env.FUND_AMOUNT;
  if (fundAmount) {
    console.log("4️⃣ Funding contracts...");
    try {
      const amount = ethers.parseEther(fundAmount);
      
      // Fund GlobalSupplyTracker
      const tx3 = await deployer.sendTransaction({
        to: globalSupplyTrackerAddress,
        value: amount,
      });
      await tx3.wait();
      console.log(`   ✅ Funded GlobalSupplyTracker: ${fundAmount} ETH/BNB`);

      // Fund CrossChainSync
      const tx4 = await deployer.sendTransaction({
        to: crossChainSyncAddress,
        value: amount,
      });
      await tx4.wait();
      console.log(`   ✅ Funded CrossChainSync: ${fundAmount} ETH/BNB\n`);
    } catch (error: any) {
      console.error("   ❌ Failed:", error.message);
    }
  } else {
    console.log("4️⃣ Skipping funding (FUND_AMOUNT not set)\n");
  }

  // Step 5: Verify setup
  console.log("5️⃣ Verifying setup...");
  try {
    const isEnabled = await globalSupplyTracker.crossChainEnabled();
    const syncAddress = await globalSupplyTracker.crossChainSync();
    const isAuthorized = await crossChainSync.authorizedTokens(globalSupplyTrackerAddress);
    const trackerBalance = await ethers.provider.getBalance(globalSupplyTrackerAddress);
    const syncBalance = await ethers.provider.getBalance(crossChainSyncAddress);

    console.log(`   ✅ Cross-chain enabled: ${isEnabled}`);
    console.log(`   ✅ Sync address: ${syncAddress}`);
    console.log(`   ✅ Authorized: ${isAuthorized}`);
    console.log(`   ✅ Tracker balance: ${ethers.formatEther(trackerBalance)} ETH/BNB`);
    console.log(`   ✅ Sync balance: ${ethers.formatEther(syncBalance)} ETH/BNB\n`);
  } catch (error: any) {
    console.error("   ❌ Verification failed:", error.message);
  }

  console.log("✅ Cross-chain setup complete!\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Setup failed:");
    console.error(error);
    process.exit(1);
  });

