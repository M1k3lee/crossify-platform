/**
 * Verify and Fix TokenFactory Configuration
 * 
 * This script checks if TokenFactory contracts are properly configured for price sync:
 * 1. Checks if useGlobalSupply is enabled
 * 2. Checks if globalSupplyTracker address is set correctly
 * 3. Optionally fixes the configuration if needed
 * 
 * Usage:
 *   npx hardhat run scripts/verify-and-fix-factories.ts --network sepolia
 *   npx hardhat run scripts/verify-and-fix-factories.ts --network bscTestnet
 *   npx hardhat run scripts/verify-and-fix-factories.ts --network baseSepolia
 * 
 * Or check all chains:
 *   npx ts-node --project tsconfig.json scripts/verify-and-fix-factories.ts
 */

import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

interface ChainConfig {
  name: string;
  factoryAddress: string;
  expectedTracker: string;
  rpcUrl: string;
}

const CHAIN_CONFIGS: Record<string, ChainConfig> = {
  sepolia: {
    name: "Sepolia (Ethereum Testnet)",
    factoryAddress: process.env.ETHEREUM_FACTORY_ADDRESS || process.env.SEPOLIA_FACTORY_ADDRESS || "",
    expectedTracker: process.env.GLOBAL_SUPPLY_TRACKER_V2_SEPOLIA || process.env.GLOBAL_SUPPLY_TRACKER_SEPOLIA || "",
    rpcUrl: process.env.ETHEREUM_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com",
  },
  "bsc-testnet": {
    name: "BSC Testnet",
    factoryAddress: process.env.BSC_FACTORY_ADDRESS || process.env.BSC_TESTNET_FACTORY_ADDRESS || "",
    expectedTracker: process.env.GLOBAL_SUPPLY_TRACKER_V2_BSC_TESTNET || process.env.GLOBAL_SUPPLY_TRACKER_BSCTESTNET || "",
    rpcUrl: process.env.BSC_RPC_URL || "https://bsc-testnet.publicnode.com",
  },
  "base-sepolia": {
    name: "Base Sepolia",
    factoryAddress: process.env.BASE_FACTORY_ADDRESS || process.env.BASE_SEPOLIA_FACTORY_ADDRESS || "",
    expectedTracker: process.env.GLOBAL_SUPPLY_TRACKER_V2_BASE_SEPOLIA || process.env.GLOBAL_SUPPLY_TRACKER_BASESEPOLIA || "",
    rpcUrl: process.env.BASE_RPC_URL || "https://base-sepolia-rpc.publicnode.com",
  },
};

const TOKEN_FACTORY_ABI = [
  "function globalSupplyTracker() external view returns (address)",
  "function useGlobalSupply() external view returns (bool)",
  "function chainName() external view returns (string)",
  "function owner() external view returns (address)",
  "function setGlobalSupplyTracker(address) external",
  "function setUseGlobalSupply(bool) external",
  "function setChainName(string memory) external",
];

interface FactoryStatus {
  chain: string;
  factoryAddress: string;
  found: boolean;
  useGlobalSupply: boolean;
  globalSupplyTracker: string;
  chainName: string;
  owner: string;
  configured: boolean;
  issues: string[];
  needsFix: boolean;
}

async function checkFactory(config: ChainConfig, chainKey: string): Promise<FactoryStatus> {
  const status: FactoryStatus = {
    chain: chainKey,
    factoryAddress: config.factoryAddress,
    found: false,
    useGlobalSupply: false,
    globalSupplyTracker: "",
    chainName: "",
    owner: "",
    configured: false,
    issues: [],
    needsFix: false,
  };

  if (!config.factoryAddress) {
    status.issues.push("Factory address not configured in environment");
    return status;
  }

  if (!config.expectedTracker) {
    status.issues.push("GlobalSupplyTracker address not configured in environment");
    return status;
  }

  try {
    const provider = new ethers.JsonRpcProvider(config.rpcUrl);
    const factory = new ethers.Contract(config.factoryAddress, TOKEN_FACTORY_ABI, provider);

    const [globalSupplyTracker, useGlobalSupply, chainName, owner] = await Promise.all([
      factory.globalSupplyTracker().catch(() => ethers.ZeroAddress),
      factory.useGlobalSupply().catch(() => false),
      factory.chainName().catch(() => ""),
      factory.owner().catch(() => ethers.ZeroAddress),
    ]);

    status.found = true;
    status.globalSupplyTracker = globalSupplyTracker;
    status.useGlobalSupply = useGlobalSupply;
    status.chainName = chainName;
    status.owner = owner;

    // Check for issues
    if (globalSupplyTracker === ethers.ZeroAddress) {
      status.issues.push("GlobalSupplyTracker not set (address is zero)");
      status.needsFix = true;
    } else if (globalSupplyTracker.toLowerCase() !== config.expectedTracker.toLowerCase()) {
      status.issues.push(`GlobalSupplyTracker mismatch: ${globalSupplyTracker} (expected: ${config.expectedTracker})`);
      status.needsFix = true;
    }

    if (!useGlobalSupply) {
      status.issues.push("useGlobalSupply is disabled");
      status.needsFix = true;
    }

    status.configured = !status.needsFix;
  } catch (error: any) {
    status.issues.push(`Error checking factory: ${error.message}`);
  }

  return status;
}

async function fixFactory(config: ChainConfig, chainKey: string, privateKey: string): Promise<{ success: boolean; message: string; txHashes: string[] }> {
  const txHashes: string[] = [];
  
  try {
    const provider = new ethers.JsonRpcProvider(config.rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    const factory = new ethers.Contract(config.factoryAddress, TOKEN_FACTORY_ABI, wallet);

    // Check if wallet is owner
    const owner = await factory.owner();
    if (owner.toLowerCase() !== wallet.address.toLowerCase()) {
      return {
        success: false,
        message: `Wallet ${wallet.address} is not the owner of TokenFactory (owner: ${owner})`,
        txHashes: [],
      };
    }

    const changes: string[] = [];

    // Fix 1: Set GlobalSupplyTracker
    const currentTracker = await factory.globalSupplyTracker();
    if (currentTracker.toLowerCase() !== config.expectedTracker.toLowerCase()) {
      console.log(`   🔧 Setting GlobalSupplyTracker to ${config.expectedTracker}...`);
      const tx1 = await factory.setGlobalSupplyTracker(config.expectedTracker, { gasLimit: 200000 });
      await tx1.wait();
      txHashes.push(tx1.hash);
      changes.push(`Set GlobalSupplyTracker`);
      console.log(`   ✅ Transaction: ${tx1.hash}`);
    }

    // Fix 2: Enable useGlobalSupply
    const currentUseGlobalSupply = await factory.useGlobalSupply();
    if (!currentUseGlobalSupply) {
      console.log(`   🔧 Enabling useGlobalSupply...`);
      const tx2 = await factory.setUseGlobalSupply(true, { gasLimit: 100000 });
      await tx2.wait();
      txHashes.push(tx2.hash);
      changes.push(`Enabled useGlobalSupply`);
      console.log(`   ✅ Transaction: ${tx2.hash}`);
    }

    if (changes.length === 0) {
      return {
        success: true,
        message: "Factory already configured correctly",
        txHashes: [],
      };
    }

    return {
      success: true,
      message: `Fixed: ${changes.join(", ")}`,
      txHashes,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message,
      txHashes,
    };
  }
}

async function main() {
  console.log("\n" + "=".repeat(70));
  console.log("🔍 TokenFactory Configuration Checker");
  console.log("=".repeat(70) + "\n");

  const results: FactoryStatus[] = [];

  // Check all factories
  for (const [chainKey, config] of Object.entries(CHAIN_CONFIGS)) {
    console.log(`\n📋 Checking ${config.name}...`);
    console.log(`   Factory: ${config.factoryAddress || "Not configured"}`);
    console.log(`   Expected Tracker: ${config.expectedTracker || "Not configured"}\n`);

    const status = await checkFactory(config, chainKey);
    results.push(status);

    if (!status.found) {
      console.log(`   ❌ ${status.issues.join(", ")}\n`);
      continue;
    }

    const statusIcon = status.configured ? "✅" : "⚠️";
    console.log(`   ${statusIcon} useGlobalSupply: ${status.useGlobalSupply}`);
    console.log(`   ${statusIcon} GlobalSupplyTracker: ${status.globalSupplyTracker}`);
    console.log(`   Chain Name: ${status.chainName}`);
    console.log(`   Owner: ${status.owner}`);

    if (status.issues.length > 0) {
      console.log(`\n   ⚠️  Issues found:`);
      status.issues.forEach(issue => console.log(`      - ${issue}`));
    }

    if (status.configured) {
      console.log(`\n   ✅ Factory is properly configured! New tokens will have price sync enabled.\n`);
    } else {
      console.log(`\n   ❌ Factory needs configuration! New tokens will NOT have price sync enabled.\n`);
    }
  }

  // Summary
  console.log("\n" + "=".repeat(70));
  console.log("📊 SUMMARY");
  console.log("=".repeat(70) + "\n");

  const configuredCount = results.filter(r => r.configured).length;
  const needsFixCount = results.filter(r => r.needsFix).length;

  console.log(`✅ Properly Configured: ${configuredCount}/${results.length}`);
  console.log(`⚠️  Needs Fix: ${needsFixCount}/${results.length}\n`);

  if (needsFixCount > 0) {
    console.log("🔧 FACTORIES THAT NEED FIXING:\n");
    results.filter(r => r.needsFix).forEach(status => {
      console.log(`   ${status.chain.toUpperCase()}:`);
      status.issues.forEach(issue => console.log(`      - ${issue}`));
    });

    console.log("\n💡 TO FIX:\n");
    console.log("   1. Get the TokenFactory owner's private key");
    console.log("   2. Set it as PRIVATE_KEY in your .env file");
    console.log("   3. Run this script with --fix flag:\n");
    console.log("      npx ts-node --project tsconfig.json scripts/verify-and-fix-factories.ts --fix\n");
    console.log("   OR fix manually using update-tokenfactory.ts script for each chain.\n");
  } else {
    console.log("✅ All TokenFactory contracts are properly configured!");
    console.log("   New tokens created from these factories will automatically have price sync enabled.\n");
  }

  // Auto-fix if requested
  const shouldFix = process.argv.includes("--fix");
  if (shouldFix && needsFixCount > 0) {
    const privateKey = process.env.PRIVATE_KEY || process.env.ETHEREUM_PRIVATE_KEY;
    
    if (!privateKey) {
      console.log("\n❌ ERROR: PRIVATE_KEY or ETHEREUM_PRIVATE_KEY not found in environment");
      console.log("   Set PRIVATE_KEY in your .env file (must be TokenFactory owner's key)\n");
      process.exit(1);
    }

    console.log("\n" + "=".repeat(70));
    console.log("🔧 AUTO-FIXING FACTORIES");
    console.log("=".repeat(70) + "\n");

    for (const status of results.filter(r => r.needsFix)) {
      const config = CHAIN_CONFIGS[status.chain];
      console.log(`\n🔧 Fixing ${config.name}...`);
      
      const result = await fixFactory(config, status.chain, privateKey);
      
      if (result.success) {
        console.log(`   ✅ ${result.message}`);
        if (result.txHashes.length > 0) {
          console.log(`   📤 Transactions: ${result.txHashes.join(", ")}`);
        }
      } else {
        console.log(`   ❌ Failed: ${result.message}`);
      }
    }

    console.log("\n✅ Auto-fix complete! Re-run this script to verify.\n");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

