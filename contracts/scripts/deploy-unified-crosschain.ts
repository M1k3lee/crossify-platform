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

// Chain EIDs
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

  console.log("\n🚀 Deploying Unified Cross-Chain Sync Contracts...");
  console.log(`📋 Network: ${network}`);
  console.log(`👤 Deployer: ${deployer.address}`);
  console.log(`💰 Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH/BNB\n`);

  // Get existing CrossChainSync address (LayerZero adapter)
  const existingCrossChainSync = process.env.CROSS_CHAIN_SYNC_ADDRESS || 
                                  process.env[`CROSS_CHAIN_SYNC_${network.toUpperCase()}`] ||
                                  process.env[`CROSS_CHAIN_SYNC_${network.replace(/([A-Z])/g, '_$1').toUpperCase()}`];
  
  if (!existingCrossChainSync) {
    console.warn("⚠️  WARNING: No existing CrossChainSync address found!");
    console.warn("   You can deploy UnifiedCrossChainSync without LayerZero adapter,");
    console.warn("   but you'll need to deploy CrossChainSync first or set it later.\n");
  } else {
    console.log(`📍 Existing CrossChainSync (LayerZero): ${existingCrossChainSync}`);
  }

  // Step 1: Deploy SupraSync (placeholder)
  console.log("\n📦 Step 1: Deploying SupraSync contract...");
  const SupraSync = await ethers.getContractFactory("SupraSync");
  const supraSync = await SupraSync.deploy(ethers.ZeroAddress); // Will set unified sync later
  
  console.log(`⏳ Transaction hash: ${supraSync.deploymentTransaction()?.hash}`);
  console.log("⏳ Waiting for deployment confirmation...");
  
  await supraSync.waitForDeployment();
  const supraSyncAddress = await supraSync.getAddress();
  
  console.log(`✅ SupraSync deployed to: ${supraSyncAddress}\n`);

  // Step 2: Deploy UnifiedCrossChainSync
  console.log("📦 Step 2: Deploying UnifiedCrossChainSync contract...");
  
  const layerZeroAdapter = existingCrossChainSync || ethers.ZeroAddress;
  const supraAdapter = supraSyncAddress;
  
  console.log(`   LayerZero Adapter: ${layerZeroAdapter}`);
  console.log(`   Supra Adapter: ${supraAdapter}`);
  
  const UnifiedCrossChainSync = await ethers.getContractFactory("UnifiedCrossChainSync");
  const unifiedSync = await UnifiedCrossChainSync.deploy(layerZeroAdapter, supraAdapter);
  
  console.log(`⏳ Transaction hash: ${unifiedSync.deploymentTransaction()?.hash}`);
  console.log("⏳ Waiting for deployment confirmation...");
  
  await unifiedSync.waitForDeployment();
  const unifiedSyncAddress = await unifiedSync.getAddress();
  
  console.log(`✅ UnifiedCrossChainSync deployed to: ${unifiedSyncAddress}\n`);

  // Step 3: Configure SupraSync to use UnifiedSync
  console.log("📦 Step 3: Configuring SupraSync...");
  const setUnifiedTx = await supraSync.setUnifiedSync(unifiedSyncAddress);
  await setUnifiedTx.wait();
  console.log(`✅ SupraSync configured with UnifiedSync\n`);

  // Step 4: If we have existing CrossChainSync, authorize it
  if (existingCrossChainSync && existingCrossChainSync !== ethers.ZeroAddress) {
    console.log("📦 Step 4: Authorizing existing CrossChainSync...");
    try {
      const authorizeTx = await unifiedSync.setLayerZeroSync(existingCrossChainSync);
      await authorizeTx.wait();
      console.log(`✅ Existing CrossChainSync authorized\n`);
    } catch (error: any) {
      console.warn(`⚠️  Could not authorize existing CrossChainSync: ${error.message}\n`);
    }
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("✅ DEPLOYMENT COMPLETE!");
  console.log("=".repeat(60));
  console.log(`\n📍 Network: ${network}`);
  console.log(`📍 Chain EID: ${CHAIN_EIDS[network] || 'N/A'}`);
  console.log(`\n📋 Contract Addresses:`);
  console.log(`   UnifiedCrossChainSync: ${unifiedSyncAddress}`);
  console.log(`   SupraSync: ${supraSyncAddress}`);
  console.log(`   LayerZero Adapter: ${layerZeroAdapter || 'Not set (deploy separately)'}`);
  
  console.log(`\n📝 Environment Variables:`);
  console.log(`   UNIFIED_SYNC_${network.toUpperCase()}=${unifiedSyncAddress}`);
  console.log(`   SUPRA_SYNC_${network.toUpperCase()}=${supraSyncAddress}`);
  
  if (existingCrossChainSync && existingCrossChainSync !== ethers.ZeroAddress) {
    console.log(`   CROSS_CHAIN_SYNC_${network.toUpperCase()}=${existingCrossChainSync}`);
  }
  
  console.log(`\n🔍 Verify on block explorer:`);
  const explorerUrl = getExplorerUrl(network);
  console.log(`   UnifiedSync: ${explorerUrl}/address/${unifiedSyncAddress}`);
  console.log(`   SupraSync: ${explorerUrl}/address/${supraSyncAddress}`);
  
  console.log(`\n⚠️  NEXT STEPS:`);
  console.log(`   1. Deploy to other testnets (sepolia, bscTestnet, baseSepolia)`);
  console.log(`   2. Set trusted remotes between chains`);
  console.log(`   3. Authorize GlobalSupplyTracker to use UnifiedSync`);
  console.log(`   4. Update TokenFactory to use UnifiedSync`);
  console.log(`\n`);
}

function getExplorerUrl(network: string): string {
  const urls: Record<string, string> = {
    sepolia: "https://sepolia.etherscan.io",
    bscTestnet: "https://testnet.bscscan.com",
    baseSepolia: "https://sepolia.basescan.org",
  };
  return urls[network] || "https://etherscan.io";
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });

