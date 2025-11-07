import { ethers } from "hardhat";
import hre from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  if (!process.env.PRIVATE_KEY || process.env.PRIVATE_KEY.trim() === '') {
    console.error("❌ ERROR: PRIVATE_KEY not found in environment!");
    process.exit(1);
  }

  try {
    await ethers.provider.getBlockNumber();
    console.log(`✅ Connected to network. Current block: ${await ethers.provider.getBlockNumber()}`);
  } catch (error) {
    console.error("❌ ERROR: Cannot connect to RPC endpoint!");
    process.exit(1);
  }

  const signers = await ethers.getSigners();
  const deployer = signers[0];
  const network = hre.network.name;

  console.log("\n🚀 Deploying DEXDetector contract...");
  console.log(`📋 Network: ${network}`);
  console.log(`👤 Deployer: ${deployer.address}`);
  console.log(`💰 Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH/BNB`);

  console.log("\n📦 Deploying DEXDetector contract...");
  const DEXDetector = await ethers.getContractFactory("DEXDetector");
  const dexDetector = await DEXDetector.deploy();

  console.log(`⏳ Transaction hash: ${dexDetector.deploymentTransaction()?.hash}`);
  console.log("⏳ Waiting for deployment confirmation...");

  await dexDetector.waitForDeployment();
  const detectorAddress = await dexDetector.getAddress();

  console.log(`\n✅ DEXDetector deployed to: ${detectorAddress}`);
  console.log(`\n📝 Please update your .env file with:`);
  console.log(`   VITE_DEX_DETECTOR_${network.toUpperCase()}=${detectorAddress}`);
  console.log(`\n🔍 Verify on block explorer:`);
  const explorerUrl = (hre.config.etherscan.customChains as any[])?.find(c => c.network === network)?.urls?.browserURL || 'https://etherscan.io';
  console.log(`   ${explorerUrl}/address/${detectorAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });




