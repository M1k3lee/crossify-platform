import { ethers } from "hardhat";
import hre from "hardhat";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

/**
 * Deploy TokenFactory and related contracts to Hedera Testnet
 * 
 * Hedera is EVM-compatible, so we can use the same contracts as Ethereum/BSC/Base
 * 
 * Prerequisites:
 * 1. Set HEDERA_TESTNET_RPC_URL in contracts/.env (default: https://testnet.hashio.io/api)
 * 2. Set PRIVATE_KEY in contracts/.env
 * 3. Have HBAR in your wallet for gas fees (very cheap, ~$0.0001 per transaction)
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
    console.log(`✅ Connected to Hedera Testnet. Current block: ${blockNumber}`);
  } catch (error) {
    console.error("❌ ERROR: Cannot connect to Hedera RPC endpoint!");
    console.error("Please check your HEDERA_TESTNET_RPC_URL in the .env file.");
    console.error("Default: https://testnet.hashio.io/api");
    process.exit(1);
  }

  const signers = await ethers.getSigners();
  if (signers.length === 0) {
    throw new Error("❌ No signers found! Please check your PRIVATE_KEY in .env file.");
  }
  
  const deployer = signers[0];
  const network = hre.network.name;
  
  console.log("\n🚀 Deploying contracts to Hedera Testnet...");
  console.log(`📋 Network: ${network}`);
  console.log(`👤 Deployer: ${deployer.address}`);
  
  // Check balance (HBAR on Hedera)
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`💰 Balance: ${ethers.formatEther(balance)} HBAR`);
  
  if (balance < ethers.parseEther("1")) {
    console.warn("⚠️  WARNING: Low balance! You may not have enough HBAR for deployment.");
    console.warn("Get testnet HBAR from: https://portal.hedera.com/");
  }

  // NOTE: For Hedera, LayerZero support may not be available
  // We'll use placeholder addresses and note that CCIP might be needed instead
  const lzEndpoint = process.env.LAYERZERO_ENDPOINT_HEDERA || ethers.ZeroAddress;
  const chainEID = 0; // TODO: Verify LayerZero EID for Hedera or use CCIP
  
  console.log("\n📝 Configuration:");
  console.log(`   LayerZero Endpoint: ${lzEndpoint === ethers.ZeroAddress ? 'NOT SET (may need CCIP instead)' : lzEndpoint}`);
  console.log(`   Chain EID: ${chainEID === 0 ? 'NOT SET (verify with LayerZero or use CCIP)' : chainEID}`);

  // Deploy GlobalSupplyTracker first
  // Note: Hedera EID is 0 for now (LayerZero support may need verification)
  console.log("\n📦 Step 1: Deploying GlobalSupplyTracker...");
  const GlobalSupplyTracker = await ethers.getContractFactory("GlobalSupplyTracker");
  const globalTracker = await GlobalSupplyTracker.deploy(0); // Use 0 for Hedera EID (to be updated if LayerZero supports Hedera)
  await globalTracker.waitForDeployment();
  const globalTrackerAddress = await globalTracker.getAddress();
  console.log(`✅ GlobalSupplyTracker deployed to: ${globalTrackerAddress}`);

  // Deploy CrossChainSync (if LayerZero is available, otherwise will need CCIP)
  let crossChainSyncAddress = ethers.ZeroAddress;
  if (lzEndpoint !== ethers.ZeroAddress) {
    console.log("\n📦 Step 2: Deploying CrossChainSync...");
    const CrossChainSync = await ethers.getContractFactory("CrossChainSync");
    const crossChainSync = await CrossChainSync.deploy(lzEndpoint);
    await crossChainSync.waitForDeployment();
    crossChainSyncAddress = await crossChainSync.getAddress();
    console.log(`✅ CrossChainSync deployed to: ${crossChainSyncAddress}`);
    
    // Note about Hedera EID
    console.log(`⚠️  NOTE: Hedera LayerZero EID may need to be verified.`);
    console.log(`   If LayerZero doesn't support Hedera, consider using Chainlink CCIP instead.`);
  } else {
    console.log("\n⚠️  Step 2: Skipping CrossChainSync (LayerZero endpoint not configured)");
    console.log("   Consider using Chainlink CCIP for Hedera cross-chain messaging.");
  }

  // Deploy TokenFactory
  console.log("\n📦 Step 3: Deploying TokenFactory...");
  const TokenFactory = await ethers.getContractFactory("TokenFactory");
  
  // Try to estimate gas first
  try {
    const gasEstimate = await TokenFactory.signer.estimateGas(
      TokenFactory.getDeployTransaction(
        deployer.address, // initialOwner
        globalTrackerAddress, // _globalSupplyTracker
        "hedera", // _chainName
        true, // _useGlobalSupply
        lzEndpoint, // _lzEndpoint (can be ZeroAddress)
        crossChainSyncAddress, // _crossChainSync (can be ZeroAddress)
        ethers.ZeroAddress, // _priceOracle (optional, set to ZeroAddress for now)
        chainEID // _chainEID (0 for now)
      )
    );
    console.log(`   Estimated gas: ${gasEstimate.toString()}`);
  } catch (error: any) {
    console.log(`   ⚠️  Gas estimation failed: ${error.message}`);
    console.log(`   This might be due to contract size limits on Hedera.`);
  }
  
  const tokenFactory = await TokenFactory.deploy(
    deployer.address, // initialOwner
    globalTrackerAddress, // _globalSupplyTracker
    "hedera", // _chainName
    true, // _useGlobalSupply
    lzEndpoint, // _lzEndpoint (can be ZeroAddress)
    crossChainSyncAddress, // _crossChainSync (can be ZeroAddress)
    ethers.ZeroAddress, // _priceOracle (optional, set to ZeroAddress for now)
    chainEID, // _chainEID (0 for now)
    { gasLimit: 10000000 } // Set high gas limit for large contract
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
  if (crossChainSyncAddress !== ethers.ZeroAddress) {
    console.log(`   CrossChainSync:      ${crossChainSyncAddress}`);
  }
  console.log(`   TokenFactory:        ${tokenFactoryAddress}`);
  console.log("\n📝 Next Steps:");
  console.log("   1. Add these addresses to your frontend/.env:");
  console.log(`      VITE_HEDERA_FACTORY=${tokenFactoryAddress}`);
  console.log("   2. If using LayerZero, verify Hedera EID and update CrossChainSync");
  console.log("   3. If LayerZero doesn't support Hedera, integrate Chainlink CCIP");
  console.log("   4. Set trusted remotes in CrossChainSync for cross-chain sync");
  console.log("\n🔗 Explorer:");
  console.log(`   https://hashscan.io/testnet/address/${tokenFactoryAddress}`);
  console.log("=".repeat(60) + "\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

