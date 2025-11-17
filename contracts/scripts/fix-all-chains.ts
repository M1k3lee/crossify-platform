import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * Fix bonding curve configuration for all chains
 * 
 * This script:
 * 1. Authorizes bonding curves in GlobalSupplyTracker
 * 2. Verifies configuration
 * 
 * Usage:
 *   npx hardhat run scripts/fix-all-chains.ts
 */
async function main() {
  console.log("\n🔧 Fixing bonding curve configuration for all chains...\n");

  const chains = [
    {
      name: "Base Sepolia",
      network: "baseSepolia",
      curveAddress: "0xc4d1BfaEacCFFf0F359D6E7cDD4026D32A74949E",
      globalSupplyTracker: "0x1eC9ee96EbD41111ad7b99f29D9a61e46b721C65",
    },
    {
      name: "BSC Testnet",
      network: "bscTestnet",
      curveAddress: "0x681B22f4A1AD0c2b7Bd4DfBf6B8b60De8d45de71",
      globalSupplyTracker: "0xe84Ae64735261F441e0bcB12bCf60630c5239ef4",
    },
    {
      name: "Sepolia",
      network: "sepolia",
      curveAddress: "0xdB3B190424Ff8e61091Ca1c672edDc56c75F12d2",
      globalSupplyTracker: "0x130195A8D09dfd99c36D5903B94088EDBD66533e",
    },
  ];

  const [deployer] = await ethers.getSigners();
  console.log(`👤 Deployer: ${deployer.address}\n`);

  const GlobalSupplyTrackerABI = [
    "function owner() external view returns (address)",
    "function authorizedUpdaters(address) external view returns (bool)",
    "function authorizeUpdater(address) external",
  ];

  for (const chain of chains) {
    console.log("=".repeat(60));
    console.log(`${chain.name}`);
    console.log("=".repeat(60));
    console.log(`Curve Address: ${chain.curveAddress}`);
    console.log(`Global Supply Tracker: ${chain.globalSupplyTracker}\n`);

    try {
      // Switch to the appropriate network
      await hre.network.provider.request({
        method: "hardhat_reset",
        params: [{
          forking: {
            jsonRpcUrl: hre.config.networks[chain.network]?.url,
          }
        }]
      });

      // Use the network's provider
      const provider = new ethers.JsonRpcProvider(
        hre.config.networks[chain.network]?.url
      );
      const signer = new ethers.Wallet(process.env.PRIVATE_KEY || "", provider);

      const tracker = new ethers.Contract(
        chain.globalSupplyTracker,
        GlobalSupplyTrackerABI,
        signer
      );

      // Check if deployer is owner
      const owner = await tracker.owner();
      console.log(`Tracker Owner: ${owner}`);
      console.log(`Deployer: ${signer.address}`);

      if (owner.toLowerCase() !== signer.address.toLowerCase()) {
        console.log(`⚠️  Deployer is not the owner of GlobalSupplyTracker`);
        console.log(`   Skipping authorization for ${chain.name}\n`);
        continue;
      }

      // Check if already authorized
      const isAuthorized = await tracker.authorizedUpdaters(chain.curveAddress);
      if (isAuthorized) {
        console.log(`✅ Bonding curve already authorized\n`);
        continue;
      }

      // Authorize
      console.log(`Authorizing bonding curve...`);
      const tx = await tracker.authorizeUpdater(chain.curveAddress);
      console.log(`   Transaction: ${tx.hash}`);
      await tx.wait();
      console.log(`✅ Bonding curve authorized successfully\n`);

    } catch (error: any) {
      console.error(`❌ Error fixing ${chain.name}: ${error.message}`);
      if (error.message.includes("network")) {
        console.error(`   Make sure ${chain.network} is configured in hardhat.config.ts`);
      }
      console.log("");
    }
  }

  console.log("=".repeat(60));
  console.log("DONE");
  console.log("=".repeat(60));
  console.log("\n✅ Authorization complete!");
  console.log("Run verify-all-chains.ts again to verify the fixes.\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

