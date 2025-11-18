import { ethers } from "hardhat";
import hre from "hardhat";

async function main() {
  const network = hre.network.name;
  console.log(`\n🔧 Configuring SupraSync on ${network}...\n`);

  // Get addresses from environment or use known addresses
  const supraSyncAddress = process.env.SUPRA_SYNC_ADDRESS || 
                           process.env[`SUPRA_SYNC_${network.toUpperCase()}`];
  const unifiedSyncAddress = process.env.UNIFIED_SYNC_ADDRESS || 
                             process.env[`UNIFIED_SYNC_${network.toUpperCase()}`];

  if (!supraSyncAddress || !unifiedSyncAddress) {
    console.error("❌ ERROR: SupraSync or UnifiedSync address not found!");
    console.error(`   Set SUPRA_SYNC_${network.toUpperCase()} and UNIFIED_SYNC_${network.toUpperCase()}`);
    process.exit(1);
  }

  console.log(`📍 SupraSync: ${supraSyncAddress}`);
  console.log(`📍 UnifiedSync: ${unifiedSyncAddress}\n`);

  const [deployer] = await ethers.getSigners();
  console.log(`👤 Deployer: ${deployer.address}\n`);

  const SupraSync = await ethers.getContractFactory("SupraSync");
  const supraSync = SupraSync.attach(supraSyncAddress);

  // Check current configuration
  const currentUnifiedSync = await supraSync.unifiedSync();
  if (currentUnifiedSync.toLowerCase() === unifiedSyncAddress.toLowerCase()) {
    console.log("✅ SupraSync already configured correctly!\n");
    return;
  }

  // Configure
  console.log("Setting UnifiedSync address...");
  const tx = await supraSync.setUnifiedSync(unifiedSyncAddress);
  await tx.wait();
  console.log("✅ Configuration complete!\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Configuration failed:");
    console.error(error);
    process.exit(1);
  });

