import { ethers } from "hardhat";
import hre from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * Script to update TokenFactory with new GlobalSupplyTracker and CrossChainSync addresses
 */
async function main() {
  const network = hre.network.name;
  console.log(`\n🔧 Updating TokenFactory on ${network}...\n`);

  // Get addresses from environment
  const tokenFactoryAddress = process.env.TOKEN_FACTORY_ADDRESS;
  const globalSupplyTrackerAddress = process.env.GLOBAL_SUPPLY_TRACKER_ADDRESS;
  const crossChainSyncAddress = process.env.CROSS_CHAIN_SYNC_ADDRESS;
  const lzEndpoint = process.env.LZ_ENDPOINT || "0x6EDCE65403992e310A62460808c4b910D972f10f";

  // Chain EIDs
  const chainEIDs: Record<string, number> = {
    sepolia: 40161,
    bscTestnet: 40102,
    baseSepolia: 40245,
  };

  const chainEID = chainEIDs[network];
  if (!chainEID) {
    console.error(`❌ ERROR: Unknown network ${network}`);
    process.exit(1);
  }

  if (!tokenFactoryAddress) {
    console.error("❌ ERROR: TOKEN_FACTORY_ADDRESS not set!");
    console.error("   Known addresses:");
    console.error("   Base Sepolia: 0x314DFf75620f1CFB09B5aD88892Dded0A13A6c58");
    console.error("   BSC Testnet: 0x39fB28323572610eC0Df1EF075f4acDD51f77e2E");
    console.error("   Sepolia: 0x39fB28323572610eC0Df1EF075f4acDD51f77e2E");
    process.exit(1);
  }

  if (!globalSupplyTrackerAddress) {
    console.error("❌ ERROR: GLOBAL_SUPPLY_TRACKER_ADDRESS not set!");
    process.exit(1);
  }

  console.log(`📍 TokenFactory: ${tokenFactoryAddress}`);
  console.log(`📍 GlobalSupplyTracker: ${globalSupplyTrackerAddress}`);
  if (crossChainSyncAddress) {
    console.log(`📍 CrossChainSync: ${crossChainSyncAddress}`);
  }
  console.log(`📍 Chain EID: ${chainEID}\n`);

  const [deployer] = await ethers.getSigners();
  console.log(`👤 Updating as: ${deployer.address}\n`);

  // Get TokenFactory contract
  const TokenFactory = await ethers.getContractFactory("TokenFactory");
  const factory = TokenFactory.attach(tokenFactoryAddress);

  // Step 1: Update GlobalSupplyTracker
  console.log("1️⃣ Updating GlobalSupplyTracker address...");
  try {
    const tx1 = await factory.setGlobalSupplyTracker(globalSupplyTrackerAddress);
    console.log(`   Transaction: ${tx1.hash}`);
    await tx1.wait();
    console.log("   ✅ GlobalSupplyTracker updated\n");
  } catch (error: any) {
    console.error("   ❌ Failed:", error.message);
    process.exit(1);
  }

  // Step 2: Update CrossChainSync (if provided)
  if (crossChainSyncAddress) {
    console.log("2️⃣ Updating CrossChainSync infrastructure...");
    try {
      const tx2 = await factory.setCrossChainInfrastructure(
        lzEndpoint,
        crossChainSyncAddress,
        "0x0000000000000000000000000000000000000000", // Price oracle (optional)
        chainEID
      );
      console.log(`   Transaction: ${tx2.hash}`);
      await tx2.wait();
      console.log("   ✅ CrossChainSync infrastructure updated\n");
    } catch (error: any) {
      console.error("   ❌ Failed:", error.message);
      console.error("   Continuing without cross-chain sync...\n");
    }
  } else {
    console.log("2️⃣ Skipping CrossChainSync update (not provided)\n");
  }

  // Step 3: Enable global supply usage
  console.log("3️⃣ Enabling global supply usage...");
  try {
    const tx3 = await factory.setUseGlobalSupply(true);
    console.log(`   Transaction: ${tx3.hash}`);
    await tx3.wait();
    console.log("   ✅ Global supply enabled\n");
  } catch (error: any) {
    console.error("   ❌ Failed:", error.message);
    console.error("   Continuing...\n");
  }

  // Verify
  console.log("4️⃣ Verifying updates...");
  try {
    const currentTracker = await factory.globalSupplyTracker();
    const useGlobalSupply = await factory.useGlobalSupply();
    const crossChainEnabled = await factory.crossChainEnabled();

    console.log(`   GlobalSupplyTracker: ${currentTracker}`);
    console.log(`   Use Global Supply: ${useGlobalSupply}`);
    console.log(`   Cross-Chain Enabled: ${crossChainEnabled}\n`);

    if (currentTracker.toLowerCase() === globalSupplyTrackerAddress.toLowerCase()) {
      console.log("   ✅ GlobalSupplyTracker address is correct");
    } else {
      console.log("   ❌ GlobalSupplyTracker address mismatch!");
    }
  } catch (error: any) {
    console.error("   ⚠️  Could not verify:", error.message);
  }

  console.log("✅ TokenFactory update complete!\n");
  console.log("⚠️  Note: New tokens created will use the updated addresses.");
  console.log("   Existing tokens will continue using their original configuration.\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Update failed:");
    console.error(error);
    process.exit(1);
  });

