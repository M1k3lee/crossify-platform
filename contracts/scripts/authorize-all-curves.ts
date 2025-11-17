import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * Authorize bonding curves in GlobalSupplyTracker
 * 
 * This only requires being the owner of GlobalSupplyTracker (not the bonding curves)
 * 
 * Usage:
 *   npx hardhat run scripts/authorize-all-curves.ts --network baseSepolia
 *   npx hardhat run scripts/authorize-all-curves.ts --network bscTestnet
 *   npx hardhat run scripts/authorize-all-curves.ts --network sepolia
 */
async function main() {
  const network = hre.network.name;
  console.log(`\n🔧 Authorizing bonding curves on ${network}...\n`);

  const chains: Record<string, { curve: string; tracker: string }> = {
    baseSepolia: {
      curve: "0xc4d1BfaEacCFFf0F359D6E7cDD4026D32A74949E",
      tracker: "0x1eC9ee96EbD41111ad7b99f29D9a61e46b721C65",
    },
    bscTestnet: {
      curve: "0x681B22f4A1AD0c2b7Bd4DfBf6B8b60De8d45de71",
      tracker: "0xe84Ae64735261F441e0bcB12bCf60630c5239ef4",
    },
    sepolia: {
      curve: "0xdB3B190424Ff8e61091Ca1c672edDc56c75F12d2",
      tracker: "0x130195A8D09dfd99c36D5903B94088EDBD66533e",
    },
  };

  const config = chains[network];
  if (!config) {
    console.error(`❌ ERROR: No configuration for network ${network}`);
    console.error(`   Supported networks: ${Object.keys(chains).join(", ")}`);
    process.exit(1);
  }

  console.log(`📍 Bonding Curve: ${config.curve}`);
  console.log(`📍 Global Supply Tracker: ${config.tracker}\n`);

  const [deployer] = await ethers.getSigners();
  console.log(`👤 Deployer: ${deployer.address}\n`);

  const GlobalSupplyTrackerABI = [
    "function owner() external view returns (address)",
    "function authorizedUpdaters(address) external view returns (bool)",
    "function authorizeUpdater(address) external",
  ];

  const tracker = new ethers.Contract(config.tracker, GlobalSupplyTrackerABI, deployer);

  // Check if deployer is owner
  const owner = await tracker.owner();
  console.log(`Tracker Owner: ${owner}`);

  if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
    console.error(`❌ ERROR: Deployer is not the owner of GlobalSupplyTracker!`);
    console.error(`   Owner: ${owner}`);
    console.error(`   Deployer: ${deployer.address}`);
    console.error(`\n   You need to use the private key of the GlobalSupplyTracker owner.`);
    process.exit(1);
  }

  // Check if already authorized
  const isAuthorized = await tracker.authorizedUpdaters(config.curve);
  if (isAuthorized) {
    console.log(`✅ Bonding curve already authorized`);
    process.exit(0);
  }

  // Authorize
  console.log(`Authorizing bonding curve...`);
  try {
    const tx = await tracker.authorizeUpdater(config.curve);
    console.log(`   Transaction: ${tx.hash}`);
    console.log(`   Waiting for confirmation...`);
    await tx.wait();
    console.log(`✅ Bonding curve authorized successfully!`);
  } catch (error: any) {
    console.error(`❌ Error authorizing: ${error.message}`);
    if (error.transaction) {
      console.error(`   Transaction: ${error.transaction.hash}`);
    }
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

