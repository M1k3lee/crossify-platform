/**
 * Deploy TokenIDRegistry and GlobalSupplyTrackerV2 to all testnets
 * 
 * Usage:
 *   npx hardhat run scripts/deploy-token-id-system.ts --network sepolia
 *   npx hardhat run scripts/deploy-token-id-system.ts --network bscTestnet
 *   npx hardhat run scripts/deploy-token-id-system.ts --network baseSepolia
 */

import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const network = hre.network.name;
  console.log(`\n🚀 Deploying Token ID System on ${network}...\n`);

  // Get chain EID
  const chainEIDs: Record<string, number> = {
    sepolia: 40161,
    bscTestnet: 40102,
    baseSepolia: 40245,
  };

  const chainEID = chainEIDs[network];
  if (!chainEID) {
    console.error(`❌ Unknown network: ${network}`);
    process.exit(1);
  }

  const [deployer] = await ethers.getSigners();
  console.log(`👤 Deployer: ${deployer.address}`);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH/BNB\n`);

  // Step 1: Deploy TokenIDRegistry
  console.log("📦 Deploying TokenIDRegistry...");
  const TokenIDRegistry = await ethers.getContractFactory("TokenIDRegistry");
  const tokenIDRegistry = await TokenIDRegistry.deploy();
  await tokenIDRegistry.waitForDeployment();
  const registryAddress = await tokenIDRegistry.getAddress();
  console.log(`✅ TokenIDRegistry deployed to: ${registryAddress}\n`);

  // Step 2: Deploy GlobalSupplyTrackerV2
  console.log("📦 Deploying GlobalSupplyTrackerV2...");
  const GlobalSupplyTrackerV2 = await ethers.getContractFactory("GlobalSupplyTrackerV2");
  const trackerV2 = await GlobalSupplyTrackerV2.deploy(chainEID, registryAddress);
  await trackerV2.waitForDeployment();
  const trackerAddress = await trackerV2.getAddress();
  console.log(`✅ GlobalSupplyTrackerV2 deployed to: ${trackerAddress}\n`);

  // Summary
  console.log("=".repeat(60));
  console.log("DEPLOYMENT SUMMARY");
  console.log("=".repeat(60));
  console.log(`Network: ${network}`);
  console.log(`Chain EID: ${chainEID}`);
  console.log(`TokenIDRegistry: ${registryAddress}`);
  console.log(`GlobalSupplyTrackerV2: ${trackerAddress}`);
  console.log("=".repeat(60));
  
  console.log("\n📝 Next steps:");
  console.log(`1. Update .env with:`);
  console.log(`   TOKEN_ID_REGISTRY_${network.toUpperCase()}=${registryAddress}`);
  console.log(`   GLOBAL_SUPPLY_TRACKER_V2_${network.toUpperCase()}=${trackerAddress}`);
  console.log(`2. Register existing tokens using register-tokens.ts`);
  console.log(`3. Update bonding curves to use GlobalSupplyTrackerV2`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

