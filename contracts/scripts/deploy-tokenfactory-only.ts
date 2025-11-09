import { ethers } from "hardhat";
import hre from "hardhat";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function main() {
  // Check if PRIVATE_KEY is loaded
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

  // Get global supply tracker address for this network
  const globalTrackerAddresses: Record<string, string> = {
    sepolia: "0xA4c5bFA9099347Bc405B72dd1955b75dCa263573",
    bscTestnet: "0x15Bc893fa73694106D1720f4f0c8C3EE3259a15e",
    baseSepolia: "0xA4c5bFA9099347Bc405B72dd1955b75dCa263573",
  };
  
  const chainNames: Record<string, string> = {
    sepolia: "ethereum",
    bscTestnet: "bsc",
    baseSepolia: "base",
  };

  // LayerZero endpoint addresses (testnet)
  const lzEndpoints: Record<string, string> = {
    sepolia: "0x6EDCE65403992e310A62460808c4b910D972f10f",
    bscTestnet: "0x6EDCE65403992e310A62460808c4b910D972f10f",
    baseSepolia: "0x6EDCE65403992e310A62460808c4b910D972f10f",
  };

  // LayerZero EIDs (Endpoint IDs)
  const chainEIDs: Record<string, number> = {
    sepolia: 40161,
    bscTestnet: 40102,
    baseSepolia: 40245,
  };

  // Cross-chain sync addresses (set in .env after deploying CrossChainSync)
  const crossChainSyncAddresses: Record<string, string> = {
    sepolia: process.env.CROSS_CHAIN_SYNC_SEPOLIA || ethers.ZeroAddress,
    bscTestnet: process.env.CROSS_CHAIN_SYNC_BSCTESTNET || ethers.ZeroAddress,
    baseSepolia: process.env.CROSS_CHAIN_SYNC_BASESEPOLIA || ethers.ZeroAddress,
  };

  // Price oracle addresses (optional)
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
  } else {
    console.log(`   ⚠️  Cross-Chain Enabled: NO (using zero addresses)`);
  }
  
  console.log("\n⏳ Deploying TokenFactory contract...");
  
  try {
    const TokenFactory = await ethers.getContractFactory("TokenFactory");
    
    // Deploy TokenFactory
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
    
    console.log("\n📝 IMPORTANT: Add this address to your environment variables:");
    const envVarName = network === 'sepolia' ? 'ETH' : network === 'bscTestnet' ? 'BSC' : 'BASE';
    console.log(`\n   Backend (Railway):`);
    console.log(`   ${envVarName}_FACTORY_ADDRESS=${tokenFactoryAddress}`);
    console.log(`\n   Frontend (Vercel):`);
    console.log(`   VITE_${envVarName}_FACTORY=${tokenFactoryAddress}`);
    
    if (useGlobalSupply) {
      console.log(`\n   Global Supply Tracker (already deployed):`);
      console.log(`   ${envVarName}_GLOBAL_SUPPLY_TRACKER=${globalTracker}`);
    }

    console.log("\n✅ Deployment complete!");
    console.log("\n🎯 Next Steps:");
    console.log("   1. Update environment variables in Railway (backend)");
    console.log("   2. Update environment variables in Vercel (frontend)");
    console.log("   3. Create a test token to verify the fixed BondingCurve works");
    console.log("   4. Test buying tokens to verify prices are reasonable");
    
  } catch (error: any) {
    console.error("\n❌ Deployment failed:");
    if (error.message?.includes("Compilation")) {
      console.error("   Compilation error detected. The contract may have dependencies that need to be fixed.");
      console.error("   However, BondingCurve.sol has been fixed and should work correctly.");
      console.error("   Error details:", error.message);
    } else {
      console.error(error);
    }
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });

