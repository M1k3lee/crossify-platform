import { ethers } from "hardhat";
import hre from "hardhat";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function main() {
  // Check RPC connection
  try {
    const blockNumber = await ethers.provider.getBlockNumber();
    console.log(`✅ Connected to network. Current block: ${blockNumber}`);
  } catch (error) {
    console.error("❌ ERROR: Cannot connect to RPC endpoint!");
    console.error("Please check your RPC URL in the .env file.");
    process.exit(1);
  }

  const signers = await ethers.getSigners();
  if (signers.length === 0) {
    throw new Error("❌ No signers found! Please check your PRIVATE_KEY in .env file.");
  }
  
  const deployer = signers[0];
  const network = hre.network.name;
  
  console.log("\n🚀 Deploying GlobalSupplyTracker contract...");
  console.log(`📋 Network: ${network}`);
  console.log(`👤 Deployer: ${deployer.address}`);
  
  // Check balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH/BNB`);

  if (balance < ethers.parseEther("0.01")) {
    console.warn("⚠️  Warning: Low balance! You may need more funds for deployment.");
  }

  // Get chain EID based on network
  const chainEIDs: Record<string, number> = {
    sepolia: 40161,      // Sepolia
    bscTestnet: 40102,   // BSC Testnet
    baseSepolia: 40245,  // Base Sepolia
  };
  
  const chainEID = chainEIDs[network];
  if (!chainEID) {
    console.error(`❌ ERROR: Unknown network ${network}. Cannot determine chain EID.`);
    process.exit(1);
  }
  
  console.log(`📍 Chain EID: ${chainEID}`);
  
  // Deploy GlobalSupplyTracker with chain EID
  const GlobalSupplyTracker = await ethers.getContractFactory("GlobalSupplyTracker");
  console.log("\n📦 Deploying contract...");
  
  const tracker = await GlobalSupplyTracker.deploy(chainEID);
  await tracker.waitForDeployment();
  
  const address = await tracker.getAddress();
  console.log(`\n✅ GlobalSupplyTracker deployed to: ${address}`);
  console.log(`\n📝 Please update your .env file with:`);
  console.log(`   VITE_GLOBAL_SUPPLY_TRACKER_${network.toUpperCase()}=${address}`);
  console.log(`\n🔍 Verify on block explorer:`);
  const explorerUrls: Record<string, string> = {
    sepolia: `https://sepolia.etherscan.io/address/${address}`,
    bscTestnet: `https://testnet.bscscan.com/address/${address}`,
    baseSepolia: `https://sepolia.basescan.org/address/${address}`,
  };
  if (explorerUrls[network]) {
    console.log(`   ${explorerUrls[network]}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });





