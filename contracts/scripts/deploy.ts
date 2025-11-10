import { ethers } from "hardhat";
import hre from "hardhat";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function main() {
  // Debug: Check if PRIVATE_KEY is loaded
  if (!process.env.PRIVATE_KEY || process.env.PRIVATE_KEY.trim() === '') {
    console.error("❌ ERROR: PRIVATE_KEY not found in environment!");
    console.error("Please check your contracts/.env file and ensure it contains:");
    console.error("PRIVATE_KEY=your_private_key_here");
    process.exit(1);
  }
  // Check RPC connection first
  try {
    const blockNumber = await ethers.provider.getBlockNumber();
    console.log(`✅ Connected to network. Current block: ${blockNumber}`);
  } catch (error) {
    console.error("❌ ERROR: Cannot connect to RPC endpoint!");
    console.error("Please check your RPC URL in the .env file.");
    console.error("For Sepolia, try: https://ethereum-sepolia-rpc.publicnode.com");
    console.error("For BSC Testnet, try: https://bsc-testnet.publicnode.com");
    console.error("For Base Sepolia, try: https://base-sepolia-rpc.publicnode.com");
    process.exit(1);
  }

  const signers = await ethers.getSigners();
  if (signers.length === 0) {
    throw new Error("❌ No signers found! Please check your PRIVATE_KEY in .env file.");
  }
  
  const deployer = signers[0];
  const network = hre.network.name;
  
  console.log("\n🚀 Deploying TokenFactory contract...");
  console.log(`📋 Network: ${network}`);
  console.log(`👤 Deployer: ${deployer.address}`);
  
  // Check balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH/BNB`);
  
  if (balance < ethers.parseEther("0.001")) {
    console.warn("⚠️  WARNING: Low balance! You may not have enough funds for deployment.");
  }

  // Get global supply tracker address for this network (from DEPLOYMENT_RESULTS.md)
  const globalTrackerAddresses: Record<string, string> = {
    sepolia: "0x130195A8D09dfd99c36D5903B94088EDBD66533e",
    bscTestnet: "0xe84Ae64735261F441e0bcB12bCf60630c5239ef4",
    baseSepolia: "0x1eC9ee96EbD41111ad7b99f29D9a61e46b721C65",
  };
  
  const chainNames: Record<string, string> = {
    sepolia: "ethereum",
    bscTestnet: "bsc",
    baseSepolia: "base",
  };

  // LayerZero endpoint addresses (testnet)
  const lzEndpoints: Record<string, string> = {
    sepolia: "0x6EDCE65403992e310A62460808c4b910D972f10f", // Sepolia LayerZero Endpoint
    bscTestnet: "0x6EDCE65403992e310A62460808c4b910D972f10f", // BSC Testnet LayerZero Endpoint  
    baseSepolia: "0x6EDCE65403992e310A62460808c4b910D972f10f", // Base Sepolia LayerZero Endpoint
  };

  // LayerZero EIDs (Endpoint IDs)
  const chainEIDs: Record<string, number> = {
    sepolia: 40161, // LayerZero EID for Sepolia
    bscTestnet: 40102, // LayerZero EID for BSC Testnet
    baseSepolia: 40245, // LayerZero EID for Base Sepolia
  };

  // Cross-chain sync addresses (from DEPLOYMENT_RESULTS.md)
  const crossChainSyncAddresses: Record<string, string> = {
    sepolia: process.env.CROSS_CHAIN_SYNC_SEPOLIA || "0x1eC9ee96EbD41111ad7b99f29D9a61e46b721C65",
    bscTestnet: process.env.CROSS_CHAIN_SYNC_BSCTESTNET || "0xf5446E2690B2eb161231fB647476A98e1b6b7736",
    baseSepolia: process.env.CROSS_CHAIN_SYNC_BASESEPOLIA || "0x39fB28323572610eC0Df1EF075f4acDD51f77e2E",
  };

  // Price oracle addresses (optional, can deploy later)
  const priceOracleAddresses: Record<string, string> = {
    sepolia: process.env.PRICE_ORACLE_SEPOLIA || ethers.ZeroAddress,
    bscTestnet: process.env.PRICE_ORACLE_BSCTESTNET || ethers.ZeroAddress,
    baseSepolia: process.env.PRICE_ORACLE_BASESEPOLIA || ethers.ZeroAddress,
  };
  
  const globalTracker = globalTrackerAddresses[network] || ethers.ZeroAddress;
  const chainName = chainNames[network] || network;
  const useGlobalSupply = globalTracker !== ethers.ZeroAddress;
  
  // Cross-chain infrastructure
  const lzEndpoint = lzEndpoints[network] || ethers.ZeroAddress;
  const chainEID = chainEIDs[network] || 0;
  const crossChainSync = crossChainSyncAddresses[network] || ethers.ZeroAddress;
  const priceOracle = priceOracleAddresses[network] || ethers.ZeroAddress;
  const crossChainEnabled = lzEndpoint !== ethers.ZeroAddress && crossChainSync !== ethers.ZeroAddress;
  
  console.log("\n📦 Deploying TokenFactory...");
  if (useGlobalSupply) {
    console.log(`   Global Supply Tracker: ${globalTracker}`);
    console.log(`   Chain Name: ${chainName}`);
    console.log(`   Use Global Supply: ${useGlobalSupply}`);
  } else {
    console.log(`   ⚠️  No global tracker configured for ${network} - using local supply only`);
  }

  if (crossChainEnabled) {
    console.log(`   🔗 Cross-Chain Enabled: YES`);
    console.log(`   LayerZero Endpoint: ${lzEndpoint}`);
    console.log(`   Cross-Chain Sync: ${crossChainSync}`);
    console.log(`   Price Oracle: ${priceOracle || 'Not configured'}`);
    console.log(`   Chain EID: ${chainEID}`);
  } else {
    console.log(`   ⚠️  Cross-Chain Enabled: NO`);
    console.log(`   💡 Deploy CrossChainSync first, then set CROSS_CHAIN_SYNC_${network.toUpperCase()} in .env`);
  }
  
  const TokenFactory = await ethers.getContractFactory("TokenFactory");
  
  // Deploy TokenFactory with cross-chain support
  // Constructor: owner, globalTracker, chainName, useGlobalSupply, lzEndpoint, crossChainSync, priceOracle, chainEID
  const tokenFactory = await TokenFactory.deploy(
    deployer.address,
    globalTracker,
    chainName,
    useGlobalSupply,
    lzEndpoint,
    crossChainSync,
    priceOracle,
    chainEID
  );
  
  console.log(`⏳ Transaction hash: ${tokenFactory.deploymentTransaction()?.hash}`);
  console.log("⏳ Waiting for deployment confirmation...");
  
  await tokenFactory.waitForDeployment();
  const tokenFactoryAddress = await tokenFactory.getAddress();
  
  console.log("\n✅ TokenFactory deployed successfully!");
  console.log(`📍 Address: ${tokenFactoryAddress}`);
  
  // Get explorer URL based on network
  const explorerUrls: Record<string, string> = {
    sepolia: "https://sepolia.etherscan.io",
    bscTestnet: "https://testnet.bscscan.com",
    baseSepolia: "https://sepolia-explorer.base.org",
  };
  
  const explorerUrl = explorerUrls[network] || "https://etherscan.io";
  console.log(`🔗 Explorer: ${explorerUrl}/address/${tokenFactoryAddress}`);
  
  console.log("\n📝 IMPORTANT: Add this address to your frontend/.env file:");
  const envVarName = network === 'sepolia' ? 'ETH' : network === 'bscTestnet' ? 'BSC' : 'BASE';
  console.log(`   VITE_${envVarName}_FACTORY=${tokenFactoryAddress}`);
  
  if (useGlobalSupply) {
    console.log(`\n   Global Supply Tracker (already deployed):`);
    console.log(`   VITE_GLOBAL_SUPPLY_TRACKER_${network.toUpperCase()}=${globalTracker}`);
  }

  if (!crossChainEnabled) {
    console.log(`\n📝 Next Steps:`);
    console.log(`   1. Deploy CrossChainSync: npx hardhat run scripts/deploy-crosschain-sync.ts --network ${network}`);
    console.log(`   2. Set CROSS_CHAIN_SYNC_${network.toUpperCase()}=<address> in contracts/.env`);
    console.log(`   3. Redeploy TokenFactory to enable cross-chain features`);
  }
  
  console.log("\n✅ Deployment complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });

