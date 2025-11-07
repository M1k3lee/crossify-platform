import { ethers } from "hardhat";
import hre from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

// LayerZero Endpoint addresses for testnets
const LZ_ENDPOINTS: Record<string, string> = {
  sepolia: "0x6EDCE65403992e310A62460808c4b910D972f10f",
  bscTestnet: "0x6EDCE65403992e310A62460808c4b910D972f10f",
  baseSepolia: "0x6EDCE65403992e310A62460808c4b910D972f10f",
};

// LayerZero EIDs
const CHAIN_EIDS: Record<string, number> = {
  sepolia: 40161,
  bscTestnet: 40102,
  baseSepolia: 40245,
};

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

  console.log("\n🚀 Deploying Cross-Chain Infrastructure...");
  console.log(`📋 Network: ${network}`);
  console.log(`👤 Deployer: ${deployer.address}`);
  console.log(`💰 Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH/BNB`);

  const lzEndpoint = LZ_ENDPOINTS[network];
  const chainEID = CHAIN_EIDS[network];

  if (!lzEndpoint || !chainEID) {
    console.error(`❌ ERROR: Network ${network} not supported`);
    process.exit(1);
  }

  console.log(`\n📍 LayerZero Endpoint: ${lzEndpoint}`);
  console.log(`📍 Chain EID: ${chainEID}`);

  // Step 1: Deploy DEXDetector
  console.log("\n📦 Step 1: Deploying DEXDetector...");
  const DEXDetector = await ethers.getContractFactory("DEXDetector");
  const dexDetector = await DEXDetector.deploy();
  await dexDetector.waitForDeployment();
  const dexDetectorAddress = await dexDetector.getAddress();
  console.log(`✅ DEXDetector deployed: ${dexDetectorAddress}`);

  // Step 2: Deploy CrossChainSync
  console.log("\n📦 Step 2: Deploying CrossChainSync...");
  const CrossChainSync = await ethers.getContractFactory("CrossChainSync");
  const crossChainSync = await CrossChainSync.deploy(lzEndpoint);
  await crossChainSync.waitForDeployment();
  const syncAddress = await crossChainSync.getAddress();
  console.log(`✅ CrossChainSync deployed: ${syncAddress}`);

  // Step 3: Get current EID for this contract
  const currentEID = chainEID;
  console.log(`📍 Current Chain EID: ${currentEID}`);

  // Step 4: Display configuration
  console.log("\n✅ Deployment Complete!");
  console.log("\n📝 Add to your contracts/.env file:");
  console.log(`   DEX_DETECTOR_${network.toUpperCase()}=${dexDetectorAddress}`);
  console.log(`   CROSS_CHAIN_SYNC_${network.toUpperCase()}=${syncAddress}`);
  console.log(`\n📝 Add to your frontend/.env file:`);
  console.log(`   VITE_DEX_DETECTOR_${network.toUpperCase()}=${dexDetectorAddress}`);
  console.log(`   VITE_CROSS_CHAIN_SYNC_${network.toUpperCase()}=${syncAddress}`);
  
  console.log("\n⚠️  IMPORTANT NEXT STEPS:");
  console.log("   1. Deploy CrossChainSync to ALL chains (Sepolia, BSC Testnet, Base Sepolia)");
  console.log("   2. Set trusted remotes on each CrossChainSync contract:");
  console.log(`      - On Sepolia: setTrustedRemote(40102, <BSC_SYNC_ADDRESS>)`);
  console.log(`      - On Sepolia: setTrustedRemote(40245, <BASE_SYNC_ADDRESS>)`);
  console.log(`      - On BSC: setTrustedRemote(40161, <SEPOLIA_SYNC_ADDRESS>)`);
  console.log(`      - On BSC: setTrustedRemote(40245, <BASE_SYNC_ADDRESS>)`);
  console.log(`      - On Base: setTrustedRemote(40161, <SEPOLIA_SYNC_ADDRESS>)`);
  console.log(`      - On Base: setTrustedRemote(40102, <BSC_SYNC_ADDRESS>)`);
  console.log("   3. Update TokenFactory deployment with CrossChainSync addresses");
  console.log("   4. Start relayer service: npm run dev (in backend/)");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });




