import { ethers } from "hardhat";
import hre from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * Script to fund contracts with native tokens for cross-chain fees
 */
async function main() {
  const network = hre.network.name;
  console.log(`\n💰 Funding contracts on ${network}...\n`);

  const [deployer] = await ethers.getSigners();
  console.log(`👤 Deployer: ${deployer.address}`);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`💰 Deployer balance: ${ethers.formatEther(balance)} ETH/BNB\n`);

  // Get addresses from environment
  const globalSupplyTrackerAddress = process.env.GLOBAL_SUPPLY_TRACKER_ADDRESS;
  const crossChainSyncAddress = process.env.CROSS_CHAIN_SYNC_ADDRESS;

  if (!globalSupplyTrackerAddress || !crossChainSyncAddress) {
    console.error("❌ ERROR: Missing contract addresses!");
    console.error("   Set GLOBAL_SUPPLY_TRACKER_ADDRESS and CROSS_CHAIN_SYNC_ADDRESS");
    process.exit(1);
  }

  // Get funding amounts
  const trackerAmount = process.env.TRACKER_FUND_AMOUNT || "0.05";
  const syncAmount = process.env.SYNC_FUND_AMOUNT || "0.1";

  const trackerFund = ethers.parseEther(trackerAmount);
  const syncFund = ethers.parseEther(syncAmount);
  const totalNeeded = trackerFund + syncFund;

  console.log(`📋 Funding amounts:`);
  console.log(`   GlobalSupplyTracker: ${trackerAmount} ETH/BNB`);
  console.log(`   CrossChainSync: ${syncAmount} ETH/BNB`);
  console.log(`   Total needed: ${ethers.formatEther(totalNeeded)} ETH/BNB\n`);

  if (balance < totalNeeded) {
    console.error(`❌ ERROR: Insufficient balance!`);
    console.error(`   Need: ${ethers.formatEther(totalNeeded)} ETH/BNB`);
    console.error(`   Have: ${ethers.formatEther(balance)} ETH/BNB`);
    process.exit(1);
  }

  // Fund GlobalSupplyTracker
  console.log(`1️⃣ Funding GlobalSupplyTracker...`);
  console.log(`   Address: ${globalSupplyTrackerAddress}`);
  console.log(`   Amount: ${trackerAmount} ETH/BNB`);
  
  const tx1 = await deployer.sendTransaction({
    to: globalSupplyTrackerAddress,
    value: trackerFund,
  });
  await tx1.wait();
  console.log(`   ✅ Transaction: ${tx1.hash}\n`);

  // Fund CrossChainSync
  console.log(`2️⃣ Funding CrossChainSync...`);
  console.log(`   Address: ${crossChainSyncAddress}`);
  console.log(`   Amount: ${syncAmount} ETH/BNB`);
  
  const tx2 = await deployer.sendTransaction({
    to: crossChainSyncAddress,
    value: syncFund,
  });
  await tx2.wait();
  console.log(`   ✅ Transaction: ${tx2.hash}\n`);

  // Verify balances
  console.log(`3️⃣ Verifying balances...`);
  const trackerBalance = await ethers.provider.getBalance(globalSupplyTrackerAddress);
  const syncBalance = await ethers.provider.getBalance(crossChainSyncAddress);

  console.log(`   GlobalSupplyTracker: ${ethers.formatEther(trackerBalance)} ETH/BNB`);
  console.log(`   CrossChainSync: ${ethers.formatEther(syncBalance)} ETH/BNB\n`);

  console.log("✅ Funding complete!\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Funding failed:");
    console.error(error);
    process.exit(1);
  });

