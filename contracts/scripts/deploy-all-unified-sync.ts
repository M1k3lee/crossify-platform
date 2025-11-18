import { execSync } from "child_process";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * Deploy Unified Cross-Chain Sync contracts to all testnets
 * 
 * This script deploys:
 * 1. UnifiedCrossChainSync
 * 2. SupraSync
 * 
 * To all three testnets:
 * - Sepolia
 * - BSC Testnet
 * - Base Sepolia
 */

const networks = ["sepolia", "bscTestnet", "baseSepolia"];

async function main() {
  console.log("\n" + "=".repeat(60));
  console.log("🚀 DEPLOYING UNIFIED CROSS-CHAIN SYNC TO ALL TESTNETS");
  console.log("=".repeat(60) + "\n");

  if (!process.env.PRIVATE_KEY || process.env.PRIVATE_KEY.trim() === '') {
    console.error("❌ ERROR: PRIVATE_KEY not found in environment!");
    process.exit(1);
  }

  const results: Array<{ network: string; success: boolean; addresses?: any }> = [];

  for (const network of networks) {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`📡 Deploying to ${network.toUpperCase()}...`);
    console.log("=".repeat(60) + "\n");

    try {
      // Deploy using hardhat
      execSync(
        `npx hardhat run scripts/deploy-unified-crosschain.ts --network ${network}`,
        {
          stdio: "inherit",
          cwd: process.cwd(),
        }
      );

      results.push({ network, success: true });
      console.log(`\n✅ Successfully deployed to ${network}\n`);
    } catch (error: any) {
      console.error(`\n❌ Failed to deploy to ${network}:`);
      console.error(error.message);
      results.push({ network, success: false });
    }
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 DEPLOYMENT SUMMARY");
  console.log("=".repeat(60) + "\n");

  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  console.log(`✅ Successful: ${successful.length}/${networks.length}`);
  successful.forEach((r) => console.log(`   - ${r.network}`));

  if (failed.length > 0) {
    console.log(`\n❌ Failed: ${failed.length}/${networks.length}`);
    failed.forEach((r) => console.log(`   - ${r.network}`));
  }

  console.log("\n📝 Next Steps:");
  console.log("   1. Collect all contract addresses from above");
  console.log("   2. Set trusted remotes between chains");
  console.log("   3. Authorize GlobalSupplyTracker contracts");
  console.log("   4. Update TokenFactory to use UnifiedSync");
  console.log("\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });

