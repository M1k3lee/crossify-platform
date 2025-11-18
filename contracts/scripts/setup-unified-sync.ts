import { ethers } from "hardhat";
import hre from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * Setup Unified Cross-Chain Sync after deployment
 * 
 * This script:
 * 1. Sets trusted remotes between UnifiedSync contracts on different chains
 * 2. Authorizes GlobalSupplyTracker to use UnifiedSync
 * 3. Configures protocol preferences
 */

// Chain EIDs
const CHAIN_EIDS: Record<string, number> = {
  sepolia: 40161,
  bscTestnet: 40102,
  baseSepolia: 40245,
};

async function main() {
  const network = hre.network.name;
  console.log(`\n🔧 Setting up Unified Cross-Chain Sync on ${network}...\n`);

  if (!process.env.PRIVATE_KEY || process.env.PRIVATE_KEY.trim() === '') {
    console.error("❌ ERROR: PRIVATE_KEY not found in environment!");
    process.exit(1);
  }

  // Get contract addresses
  const unifiedSyncAddress = process.env.UNIFIED_SYNC_ADDRESS || 
                             process.env[`UNIFIED_SYNC_${network.toUpperCase()}`];
  
  if (!unifiedSyncAddress) {
    console.error("❌ ERROR: UnifiedSync address not found!");
    console.error(`   Set UNIFIED_SYNC_${network.toUpperCase()} in environment`);
    process.exit(1);
  }

  console.log(`📍 UnifiedSync: ${unifiedSyncAddress}`);

  // Get remote addresses
  const baseSepoliaSync = process.env.UNIFIED_SYNC_BASE_SEPOLIA || 
                          process.env.UNIFIED_SYNC_BASESEPOLIA;
  const bscTestnetSync = process.env.UNIFIED_SYNC_BSC_TESTNET || 
                         process.env.UNIFIED_SYNC_BSCTESTNET;
  const sepoliaSync = process.env.UNIFIED_SYNC_SEPOLIA;

  const [deployer] = await ethers.getSigners();
  console.log(`👤 Deployer: ${deployer.address}\n`);

  // Get UnifiedCrossChainSync contract
  const UnifiedCrossChainSync = await ethers.getContractFactory("UnifiedCrossChainSync");
  const unifiedSync = UnifiedCrossChainSync.attach(unifiedSyncAddress);

  // Step 1: Set trusted remotes (if we have remote addresses)
  if (baseSepoliaSync && bscTestnetSync && sepoliaSync) {
    console.log("1️⃣ Setting trusted remotes...\n");

    if (network === "baseSepolia") {
      if (bscTestnetSync) {
        console.log(`   Setting BSC Testnet (EID: 40102)...`);
        const bscRemote = ethers.AbiCoder.defaultAbiCoder().encode(["address"], [bscTestnetSync]);
        const tx1 = await unifiedSync.setTrustedRemote(40102, bscRemote);
        await tx1.wait();
        console.log(`   ✅ BSC Testnet -> ${bscTestnetSync}\n`);
      }

      if (sepoliaSync) {
        console.log(`   Setting Sepolia (EID: 40161)...`);
        const sepoliaRemote = ethers.AbiCoder.defaultAbiCoder().encode(["address"], [sepoliaSync]);
        const tx2 = await unifiedSync.setTrustedRemote(40161, sepoliaRemote);
        await tx2.wait();
        console.log(`   ✅ Sepolia -> ${sepoliaSync}\n`);
      }
    } else if (network === "bscTestnet") {
      if (baseSepoliaSync) {
        console.log(`   Setting Base Sepolia (EID: 40245)...`);
        const baseRemote = ethers.AbiCoder.defaultAbiCoder().encode(["address"], [baseSepoliaSync]);
        const tx1 = await unifiedSync.setTrustedRemote(40245, baseRemote);
        await tx1.wait();
        console.log(`   ✅ Base Sepolia -> ${baseSepoliaSync}\n`);
      }

      if (sepoliaSync) {
        console.log(`   Setting Sepolia (EID: 40161)...`);
        const sepoliaRemote = ethers.AbiCoder.defaultAbiCoder().encode(["address"], [sepoliaSync]);
        const tx2 = await unifiedSync.setTrustedRemote(40161, sepoliaRemote);
        await tx2.wait();
        console.log(`   ✅ Sepolia -> ${sepoliaSync}\n`);
      }
    } else if (network === "sepolia") {
      if (baseSepoliaSync) {
        console.log(`   Setting Base Sepolia (EID: 40245)...`);
        const baseRemote = ethers.AbiCoder.defaultAbiCoder().encode(["address"], [baseSepoliaSync]);
        const tx1 = await unifiedSync.setTrustedRemote(40245, baseRemote);
        await tx1.wait();
        console.log(`   ✅ Base Sepolia -> ${baseSepoliaSync}\n`);
      }

      if (bscTestnetSync) {
        console.log(`   Setting BSC Testnet (EID: 40102)...`);
        const bscRemote = ethers.AbiCoder.defaultAbiCoder().encode(["address"], [bscTestnetSync]);
        const tx2 = await unifiedSync.setTrustedRemote(40102, bscRemote);
        await tx2.wait();
        console.log(`   ✅ BSC Testnet -> ${bscTestnetSync}\n`);
      }
    }
  } else {
    console.log("⚠️  Skipping trusted remotes (remote addresses not set)\n");
  }

  // Step 2: Authorize GlobalSupplyTracker (if address provided)
  const globalSupplyTracker = process.env.GLOBAL_SUPPLY_TRACKER_ADDRESS ||
                              process.env[`GLOBAL_SUPPLY_TRACKER_${network.toUpperCase()}`];
  
  if (globalSupplyTracker) {
    console.log("2️⃣ Authorizing GlobalSupplyTracker...");
    try {
      const authorizeTx = await unifiedSync.authorizeToken(globalSupplyTracker);
      await authorizeTx.wait();
      console.log(`   ✅ GlobalSupplyTracker authorized: ${globalSupplyTracker}\n`);
    } catch (error: any) {
      console.warn(`   ⚠️  Could not authorize GlobalSupplyTracker: ${error.message}\n`);
    }
  } else {
    console.log("⚠️  Skipping GlobalSupplyTracker authorization (address not set)\n");
  }

  // Step 3: Verify configuration
  console.log("3️⃣ Verifying configuration...\n");
  
  const layerZeroAdapter = await unifiedSync.layerZeroSync();
  const supraAdapter = await unifiedSync.supraSync();
  
  console.log(`   LayerZero Adapter: ${layerZeroAdapter}`);
  console.log(`   Supra Adapter: ${supraAdapter}`);
  console.log(`   Owner: ${await unifiedSync.owner()}\n`);

  console.log("✅ Setup complete!\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Setup failed:");
    console.error(error);
    process.exit(1);
  });

