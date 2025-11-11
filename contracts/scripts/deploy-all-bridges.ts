import { ethers } from "hardhat";
import hre from "hardhat";
import * as dotenv from "dotenv";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);
dotenv.config();

// Known CrossChainSync addresses from DEPLOYMENT_RESULTS.md
const CROSS_CHAIN_SYNC_ADDRESSES: Record<string, string> = {
  sepolia: "0x1eC9ee96EbD41111ad7b99f29D9a61e46b721C65",
  bscTestnet: "0xf5446E2690B2eb161231fB647476A98e1b6b7736",
  baseSepolia: "0x39fB28323572610eC0Df1EF075f4acDD51f77e2E",
};

// Chain EIDs
const CHAIN_EIDS: Record<string, number> = {
  sepolia: 40161,
  bscTestnet: 40102,
  baseSepolia: 40245,
};

async function deployBridge(network: string) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🚀 Deploying Liquidity Bridge on ${network}`);
  console.log(`${'='.repeat(60)}\n`);

  try {
    // Set environment variable for this network
    const syncAddress = process.env[`CROSS_CHAIN_SYNC_${network.toUpperCase().replace('-', '_')}`] || 
                        CROSS_CHAIN_SYNC_ADDRESSES[network];
    
    if (!syncAddress) {
      console.error(`❌ ERROR: CrossChainSync address not found for ${network}`);
      return null;
    }

    process.env.CROSS_CHAIN_SYNC_ADDRESS = syncAddress;
    console.log(`📍 Using CrossChainSync: ${syncAddress}`);

    // Run deployment script
    const { stdout, stderr } = await execAsync(
      `npx hardhat run scripts/deploy-liquidity-bridge.ts --network ${network}`,
      { cwd: process.cwd() }
    );

    console.log(stdout);
    if (stderr) console.error(stderr);

    // Extract bridge address from output
    const addressMatch = stdout.match(/CrossChainLiquidityBridge deployed to: (0x[a-fA-F0-9]{40})/);
    if (addressMatch) {
      const bridgeAddress = addressMatch[1];
      console.log(`\n✅ Bridge deployed: ${bridgeAddress}`);
      return { network, bridgeAddress };
    }

    return null;
  } catch (error: any) {
    console.error(`❌ Deployment failed for ${network}:`, error.message);
    return null;
  }
}

async function setupBridge(network: string, bridgeAddress: string) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🔧 Setting up Bridge on ${network}`);
  console.log(`${'='.repeat(60)}\n`);

  try {
    process.env.LIQUIDITY_BRIDGE_ADDRESS = bridgeAddress;
    process.env[`${network.toUpperCase().replace('-', '_')}_LIQUIDITY_BRIDGE_ADDRESS`] = bridgeAddress;

    const { stdout, stderr } = await execAsync(
      `npx hardhat run scripts/setup-liquidity-bridge.ts --network ${network}`,
      { cwd: process.cwd() }
    );

    console.log(stdout);
    if (stderr) console.error(stderr);
    return true;
  } catch (error: any) {
    console.error(`❌ Setup failed for ${network}:`, error.message);
    return false;
  }
}

async function main() {
  console.log("\n" + "=".repeat(60));
  console.log("🌉 Cross-Chain Liquidity Bridge - Master Deployment");
  console.log("=".repeat(60) + "\n");

  if (!process.env.PRIVATE_KEY || process.env.PRIVATE_KEY.trim() === '') {
    console.error("❌ ERROR: PRIVATE_KEY not found in environment!");
    console.error("   Please set PRIVATE_KEY in contracts/.env");
    process.exit(1);
  }

  const networks = ['sepolia', 'bscTestnet', 'baseSepolia'];
  const deployments: Record<string, string> = {};

  // Step 1: Deploy bridges
  console.log("\n📦 STEP 1: Deploying Bridges\n");
  for (const network of networks) {
    const result = await deployBridge(network);
    if (result) {
      deployments[network] = result.bridgeAddress;
    }
    // Wait a bit between deployments
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Step 2: Setup bridges
  console.log("\n\n📦 STEP 2: Setting up Bridges\n");
  for (const network of networks) {
    const bridgeAddress = deployments[network];
    if (bridgeAddress) {
      await setupBridge(network, bridgeAddress);
      // Wait a bit between setups
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // Step 3: Summary
  console.log("\n\n" + "=".repeat(60));
  console.log("✅ DEPLOYMENT SUMMARY");
  console.log("=".repeat(60) + "\n");

  console.log("📝 Add these to contracts/.env:");
  for (const [network, address] of Object.entries(deployments)) {
    const envVar = `${network.toUpperCase().replace('-', '_')}_LIQUIDITY_BRIDGE_ADDRESS`;
    console.log(`${envVar}=${address}`);
  }

  console.log("\n📝 Add these to backend/.env:");
  const backendMapping: Record<string, string> = {
    sepolia: 'ETHEREUM',
    bscTestnet: 'BSC',
    baseSepolia: 'BASE',
  };
  for (const [network, address] of Object.entries(deployments)) {
    const envVar = `${backendMapping[network]}_LIQUIDITY_BRIDGE_ADDRESS`;
    console.log(`${envVar}=${address}`);
  }

  console.log("\n⚠️  NEXT STEPS:");
  console.log("   1. Update bonding curves to use bridge addresses");
  console.log("   2. Restart backend to load new configuration");
  console.log("   3. Test bridge functionality with small amounts");
  console.log("\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });

