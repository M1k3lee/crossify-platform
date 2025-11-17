import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * Authorize bonding curves in GlobalSupplyTracker for all chains
 * Uses the owner's private key (0x78B056f4cFb69bE85E52850000902eB0B5b418BC)
 */
async function main() {
  console.log("\n🔧 Authorizing bonding curves on all chains...\n");

  // Owner's private key (found via find-owner-private-key.ts)
  // This is ETHEREUM_PRIVATE_KEY from .env
  const ownerPrivateKey = process.env.ETHEREUM_PRIVATE_KEY || process.env.PRIVATE_KEY;
  
  if (!ownerPrivateKey) {
    console.error("❌ ERROR: ETHEREUM_PRIVATE_KEY or PRIVATE_KEY not found!");
    console.error("   The owner's private key is needed to authorize bonding curves.");
    process.exit(1);
  }

  const chains = [
    {
      name: "Base Sepolia",
      network: "baseSepolia",
      rpcUrl: process.env.BASE_SEPOLIA_RPC_URL || "https://base-sepolia-rpc.publicnode.com",
      curve: "0xc4d1BfaEacCFFf0F359D6E7cDD4026D32A74949E",
      tracker: "0x1eC9ee96EbD41111ad7b99f29D9a61e46b721C65",
    },
    {
      name: "BSC Testnet",
      network: "bscTestnet",
      rpcUrl: process.env.BSC_TESTNET_RPC_URL || "https://bsc-testnet.publicnode.com",
      curve: "0x681B22f4A1AD0c2b7Bd4DfBf6B8b60De8d45de71",
      tracker: "0xe84Ae64735261F441e0bcB12bCf60630c5239ef4",
    },
    {
      name: "Sepolia",
      network: "sepolia",
      rpcUrl: process.env.SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com",
      curve: "0xdB3B190424Ff8e61091Ca1c672edDc56c75F12d2",
      tracker: "0x130195A8D09dfd99c36D5903B94088EDBD66533e",
    },
  ];

  const GlobalSupplyTrackerABI = [
    "function owner() external view returns (address)",
    "function authorizedUpdaters(address) external view returns (bool)",
    "function authorizeUpdater(address) external",
  ];

  for (const chain of chains) {
    console.log("=".repeat(60));
    console.log(`${chain.name}`);
    console.log("=".repeat(60));
    console.log(`Bonding Curve: ${chain.curve}`);
    console.log(`Global Supply Tracker: ${chain.tracker}\n`);

    try {
      // Create provider and wallet for this chain
      const provider = new ethers.JsonRpcProvider(chain.rpcUrl);
      const wallet = new ethers.Wallet(ownerPrivateKey.replace(/^0x/, ''), provider);
      
      console.log(`👤 Wallet Address: ${wallet.address}`);

      const tracker = new ethers.Contract(chain.tracker, GlobalSupplyTrackerABI, wallet);

      // Verify wallet is owner
      const owner = await tracker.owner();
      console.log(`👑 Tracker Owner: ${owner}`);

      if (owner.toLowerCase() !== wallet.address.toLowerCase()) {
        console.error(`❌ ERROR: Wallet is not the owner!`);
        console.error(`   Owner: ${owner}`);
        console.error(`   Wallet: ${wallet.address}`);
        console.log(`\n⏭️  Skipping ${chain.name}...\n`);
        continue;
      }

      // Check if already authorized
      const isAuthorized = await tracker.authorizedUpdaters(chain.curve);
      if (isAuthorized) {
        console.log(`✅ Bonding curve already authorized\n`);
        continue;
      }

      // Authorize
      console.log(`📝 Authorizing bonding curve...`);
      const tx = await tracker.authorizeUpdater(chain.curve);
      console.log(`   Transaction: ${tx.hash}`);
      console.log(`   Waiting for confirmation...`);
      const receipt = await tx.wait();
      console.log(`✅ Bonding curve authorized successfully!`);
      console.log(`   Block: ${receipt.blockNumber}\n`);

    } catch (error: any) {
      console.error(`❌ Error authorizing ${chain.name}: ${error.message}`);
      if (error.transaction) {
        console.error(`   Transaction: ${error.transaction.hash}`);
      }
      console.log(`\n⏭️  Continuing to next chain...\n`);
    }
  }

  console.log("=".repeat(60));
  console.log("✅ Authorization complete!");
  console.log("=".repeat(60));
  console.log("\n📝 Next steps:");
  console.log("1. Run verify-all-chains.ts to confirm authorization");
  console.log("2. Test a buy/sell transaction to verify price sync");
  console.log("3. Check that prices match across all chains\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

