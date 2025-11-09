import { ethers } from "hardhat";
import hre from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * Script to set trusted remotes for cross-chain synchronization
 * Run this after deploying CrossChainSync on all chains
 */

// Chain EIDs
const CHAIN_EIDS: Record<string, number> = {
  sepolia: 40161,
  bscTestnet: 40102,
  baseSepolia: 40245,
};

async function main() {
  const network = hre.network.name;
  console.log(`\n🔧 Setting up trusted remotes on ${network}...\n`);

  // Get CrossChainSync address from environment or prompt
  const crossChainSyncAddress = process.env.CROSS_CHAIN_SYNC_ADDRESS;
  if (!crossChainSyncAddress) {
    console.error("❌ ERROR: CROSS_CHAIN_SYNC_ADDRESS not set in environment!");
    process.exit(1);
  }

  console.log(`📍 CrossChainSync: ${crossChainSyncAddress}`);

  // Get remote addresses
  const baseSepoliaSync = process.env.CROSS_CHAIN_SYNC_BASE_SEPOLIA;
  const bscTestnetSync = process.env.CROSS_CHAIN_SYNC_BSC_TESTNET;
  const sepoliaSync = process.env.CROSS_CHAIN_SYNC_SEPOLIA;

  if (!baseSepoliaSync || !bscTestnetSync || !sepoliaSync) {
    console.error("❌ ERROR: Remote CrossChainSync addresses not set!");
    console.error("   Set CROSS_CHAIN_SYNC_BASE_SEPOLIA, CROSS_CHAIN_SYNC_BSC_TESTNET, CROSS_CHAIN_SYNC_SEPOLIA");
    process.exit(1);
  }

  const [deployer] = await ethers.getSigners();
  console.log(`👤 Deployer: ${deployer.address}\n`);

  // Get CrossChainSync contract
  const CrossChainSync = await ethers.getContractFactory("CrossChainSync");
  const crossChainSync = CrossChainSync.attach(crossChainSyncAddress);

  // Set trusted remotes based on current network
  if (network === "baseSepolia") {
    console.log("Setting trusted remotes for Base Sepolia...\n");

    // Trust BSC Testnet (EID: 40102)
    console.log("1️⃣ Setting trusted remote for BSC Testnet (EID: 40102)...");
    const bscRemote = ethers.AbiCoder.defaultAbiCoder().encode(["address"], [bscTestnetSync]);
    const tx1 = await crossChainSync.setTrustedRemote(40102, bscRemote);
    await tx1.wait();
    console.log(`   ✅ Trusted remote set: BSC Testnet -> ${bscTestnetSync}\n`);

    // Trust Sepolia (EID: 40161)
    console.log("2️⃣ Setting trusted remote for Sepolia (EID: 40161)...");
    const sepoliaRemote = ethers.AbiCoder.defaultAbiCoder().encode(["address"], [sepoliaSync]);
    const tx2 = await crossChainSync.setTrustedRemote(40161, sepoliaRemote);
    await tx2.wait();
    console.log(`   ✅ Trusted remote set: Sepolia -> ${sepoliaSync}\n`);

  } else if (network === "bscTestnet") {
    console.log("Setting trusted remotes for BSC Testnet...\n");

    // Trust Base Sepolia (EID: 40245)
    console.log("1️⃣ Setting trusted remote for Base Sepolia (EID: 40245)...");
    const baseRemote = ethers.AbiCoder.defaultAbiCoder().encode(["address"], [baseSepoliaSync]);
    const tx1 = await crossChainSync.setTrustedRemote(40245, baseRemote);
    await tx1.wait();
    console.log(`   ✅ Trusted remote set: Base Sepolia -> ${baseSepoliaSync}\n`);

    // Trust Sepolia (EID: 40161)
    console.log("2️⃣ Setting trusted remote for Sepolia (EID: 40161)...");
    const sepoliaRemote = ethers.AbiCoder.defaultAbiCoder().encode(["address"], [sepoliaSync]);
    const tx2 = await crossChainSync.setTrustedRemote(40161, sepoliaRemote);
    await tx2.wait();
    console.log(`   ✅ Trusted remote set: Sepolia -> ${sepoliaSync}\n`);

  } else if (network === "sepolia") {
    console.log("Setting trusted remotes for Sepolia...\n");

    // Trust Base Sepolia (EID: 40245)
    console.log("1️⃣ Setting trusted remote for Base Sepolia (EID: 40245)...");
    const baseRemote = ethers.AbiCoder.defaultAbiCoder().encode(["address"], [baseSepoliaSync]);
    const tx1 = await crossChainSync.setTrustedRemote(40245, baseRemote);
    await tx1.wait();
    console.log(`   ✅ Trusted remote set: Base Sepolia -> ${baseSepoliaSync}\n`);

    // Trust BSC Testnet (EID: 40102)
    console.log("2️⃣ Setting trusted remote for BSC Testnet (EID: 40102)...");
    const bscRemote = ethers.AbiCoder.defaultAbiCoder().encode(["address"], [bscTestnetSync]);
    const tx2 = await crossChainSync.setTrustedRemote(40102, bscRemote);
    await tx2.wait();
    console.log(`   ✅ Trusted remote set: BSC Testnet -> ${bscTestnetSync}\n`);

  } else {
    console.error(`❌ ERROR: Unknown network ${network}`);
    process.exit(1);
  }

  // Verify trusted remotes
  console.log("3️⃣ Verifying trusted remotes...");
  const baseRemote = await crossChainSync.trustedRemotes(40245);
  const bscRemote = await crossChainSync.trustedRemotes(40102);
  const sepoliaRemote = await crossChainSync.trustedRemotes(40161);

  console.log(`   Base Sepolia (40245): ${baseRemote.length > 0 ? "✅ Set" : "❌ Not set"}`);
  console.log(`   BSC Testnet (40102): ${bscRemote.length > 0 ? "✅ Set" : "❌ Not set"}`);
  console.log(`   Sepolia (40161): ${sepoliaRemote.length > 0 ? "✅ Set" : "❌ Not set"}\n`);

  console.log("✅ Trusted remotes setup complete!\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Setup failed:");
    console.error(error);
    process.exit(1);
  });

