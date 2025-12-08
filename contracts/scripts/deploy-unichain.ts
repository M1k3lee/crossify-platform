import { ethers } from "hardhat";
import hre from "hardhat";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

/**
 * Deploy TokenFactory and related contracts to Unichain Sepolia Testnet
 * 
 * Unichain is EVM-compatible (OP Stack), so we can use the same contracts as Ethereum/BSC/Base
 * 
 * Prerequisites:
 * 1. Set UNICHAIN_TESTNET_RPC_URL in contracts/.env (default: https://sepolia.unichain.org)
 * 2. Set PRIVATE_KEY in contracts/.env
 * 3. Have ETH in your wallet for gas fees on Unichain Sepolia
 *    - Bridge from Ethereum Sepolia: https://bridge.unichain.org or use Brid.gg/Superbridge
 */
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
    console.log(`✅ Connected to Unichain Sepolia Testnet. Current block: ${blockNumber}`);
  } catch (error) {
    console.error("❌ ERROR: Cannot connect to Unichain RPC endpoint!");
    console.error("Please check your UNICHAIN_TESTNET_RPC_URL in the .env file.");
    console.error("Default: https://sepolia.unichain.org");
    process.exit(1);
  }

  const signers = await ethers.getSigners();
  if (signers.length === 0) {
    throw new Error("❌ No signers found! Please check your PRIVATE_KEY in .env file.");
  }
  
  const deployer = signers[0];
  const network = hre.network.name;
  
  console.log("\n🚀 Deploying contracts to Unichain Sepolia Testnet...");
  console.log(`📋 Network: ${network}`);
  console.log(`👤 Deployer: ${deployer.address}`);
  
  // Check balance (ETH on Unichain)
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH`);
  
  if (balance < ethers.parseEther("0.1")) {
    console.warn("⚠️  WARNING: Low balance! You may not have enough ETH for deployment.");
    console.warn("Get testnet ETH by bridging from Ethereum Sepolia:");
    console.warn("   - https://bridge.unichain.org");
    console.warn("   - https://brid.gg");
    console.warn("   - https://superbridge.com");
  }

  // LayerZero configuration for Unichain
  // Note: Unichain is part of Optimism Superchain, so LayerZero should support it
  // We'll use the same LayerZero endpoint as other OP Stack chains
  const lzEndpoint = process.env.LAYERZERO_ENDPOINT_UNICHAIN || 
                     process.env.LAYERZERO_ENDPOINT || 
                     "0x6EDCE65403992e310A62460808c4b910D972f10f"; // Sepolia endpoint (verify for Unichain)
  const chainEID = parseInt(process.env.UNICHAIN_CHAIN_EID || "0"); // TODO: Get from LayerZero docs
  
  console.log("\n📝 Configuration:");
  console.log(`   LayerZero Endpoint: ${lzEndpoint}`);
  console.log(`   Chain EID: ${chainEID === 0 ? 'NOT SET (verify with LayerZero docs)' : chainEID}`);
  console.log(`   ⚠️  NOTE: Verify LayerZero EID for Unichain Sepolia from LayerZero documentation`);

  // Deploy GlobalSupplyTracker first
  console.log("\n📦 Step 1: Deploying GlobalSupplyTracker...");
  const GlobalSupplyTracker = await ethers.getContractFactory("GlobalSupplyTracker");
  const globalTracker = await GlobalSupplyTracker.deploy(chainEID);
  await globalTracker.waitForDeployment();
  const globalTrackerAddress = await globalTracker.getAddress();
  console.log(`✅ GlobalSupplyTracker deployed to: ${globalTrackerAddress}`);

  // Deploy CrossChainSync
  console.log("\n📦 Step 2: Deploying CrossChainSync...");
  const CrossChainSync = await ethers.getContractFactory("CrossChainSync");
  const crossChainSync = await CrossChainSync.deploy(lzEndpoint);
  await crossChainSync.waitForDeployment();
  const crossChainSyncAddress = await crossChainSync.getAddress();
  console.log(`✅ CrossChainSync deployed to: ${crossChainSyncAddress}`);
  
  // Configure GlobalSupplyTracker to use CrossChainSync
  console.log("\n📦 Step 3: Configuring GlobalSupplyTracker...");
  const setSyncTx = await globalTracker.setCrossChainSync(crossChainSyncAddress);
  await setSyncTx.wait();
  console.log(`✅ GlobalSupplyTracker configured with CrossChainSync`);

  // Deploy TokenFactory
  console.log("\n📦 Step 4: Deploying TokenFactory...");
  const TokenFactory = await ethers.getContractFactory("TokenFactory");
  
  const tokenFactory = await TokenFactory.deploy(
    deployer.address, // initialOwner
    globalTrackerAddress, // _globalSupplyTracker
    "unichain", // _chainName
    true, // _useGlobalSupply
    lzEndpoint, // _lzEndpoint
    crossChainSyncAddress, // _crossChainSync
    ethers.ZeroAddress, // _priceOracle (optional, set to ZeroAddress for now)
    chainEID // _chainEID
  );
  await tokenFactory.waitForDeployment();
  const tokenFactoryAddress = await tokenFactory.getAddress();
  console.log(`✅ TokenFactory deployed to: ${tokenFactoryAddress}`);

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("🎉 DEPLOYMENT COMPLETE!");
  console.log("=".repeat(60));
  console.log("\n📋 Contract Addresses:");
  console.log(`   GlobalSupplyTracker: ${globalTrackerAddress}`);
  console.log(`   CrossChainSync:      ${crossChainSyncAddress}`);
  console.log(`   TokenFactory:        ${tokenFactoryAddress}`);
  console.log("\n📝 Next Steps:");
  console.log("   1. Add these addresses to your backend/.env:");
  console.log(`      UNICHAIN_FACTORY_ADDRESS=${tokenFactoryAddress}`);
  console.log(`      UNICHAIN_GLOBAL_SUPPLY_TRACKER=${globalTrackerAddress}`);
  console.log(`      UNICHAIN_CROSS_CHAIN_SYNC=${crossChainSyncAddress}`);
  console.log("   2. Add to your frontend/.env (or Vercel/Netlify):");
  console.log(`      VITE_UNICHAIN_FACTORY=${tokenFactoryAddress}`);
  console.log("   3. Verify LayerZero EID for Unichain and update if needed");
  console.log("   4. Set trusted remotes in CrossChainSync for cross-chain sync");
  console.log("\n🔗 Explorer:");
  console.log(`   https://sepolia.uniscan.xyz/address/${tokenFactoryAddress}`);
  console.log("=".repeat(60) + "\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

