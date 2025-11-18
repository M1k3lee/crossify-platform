/**
 * Enable useGlobalSupply on all TokenFactory contracts
 * Requires the factory owner's private key
 * 
 * Usage:
 *   FACTORY_OWNER_PRIVATE_KEY=<key> npx ts-node scripts/enable-useglobalsupply-factories.ts
 */

import { ethers } from "ethers";
import * as dotenv from "dotenv";

dotenv.config();

interface ChainConfig {
  name: string;
  rpcUrl: string;
  factoryAddress: string;
}

const CHAIN_CONFIGS: Record<string, ChainConfig> = {
  'base-sepolia': {
    name: "Base Sepolia",
    rpcUrl: process.env.RPC_URL_BASE_SEPOLIA || "https://base-sepolia-rpc.publicnode.com",
    factoryAddress: process.env.TOKEN_FACTORY_BASE_SEPOLIA || process.env.VITE_BASE_FACTORY || "",
  },
  'bsc-testnet': {
    name: "BSC Testnet",
    rpcUrl: process.env.RPC_URL_BSC_TESTNET || "https://bsc-testnet.publicnode.com",
    factoryAddress: process.env.TOKEN_FACTORY_BSC_TESTNET || process.env.VITE_BSC_FACTORY || "",
  },
  'sepolia': {
    name: "Sepolia",
    rpcUrl: process.env.RPC_URL_SEPOLIA || "https://ethereum-sepolia-rpc.publicnode.com",
    factoryAddress: process.env.TOKEN_FACTORY_SEPOLIA || process.env.VITE_ETH_FACTORY || "",
  },
};

const TokenFactoryABI = [
  "function useGlobalSupply() external view returns (bool)",
  "function owner() external view returns (address)",
  "function setUseGlobalSupply(bool) external",
];

async function enableUseGlobalSupply(config: ChainConfig, privateKey: string) {
  if (!config.factoryAddress) {
    return {
      success: false,
      message: "Factory address not configured",
    };
  }

  const provider = new ethers.JsonRpcProvider(config.rpcUrl);
  const wallet = new ethers.Wallet(privateKey.replace(/^0x/, ''), provider);
  
  try {
    const factory = new ethers.Contract(config.factoryAddress, TokenFactoryABI, wallet);
    
    const owner = await factory.owner();
    const currentUseGlobalSupply = await factory.useGlobalSupply();
    
    console.log(`   Owner: ${owner}`);
    console.log(`   Wallet: ${wallet.address}`);
    console.log(`   Current useGlobalSupply: ${currentUseGlobalSupply}`);
    
    if (owner.toLowerCase() !== wallet.address.toLowerCase()) {
      return {
        success: false,
        message: `Wallet ${wallet.address} is not the owner (owner: ${owner})`,
      };
    }
    
    if (currentUseGlobalSupply) {
      return {
        success: true,
        message: "Already enabled",
      };
    }
    
    console.log(`   🔧 Enabling useGlobalSupply...`);
    const tx = await factory.setUseGlobalSupply(true);
    console.log(`   ⏳ Transaction sent: ${tx.hash}`);
    await tx.wait();
    console.log(`   ✅ Transaction confirmed`);
    
    return {
      success: true,
      message: `Enabled successfully. Tx: ${tx.hash}`,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message,
    };
  }
}

async function main() {
  const privateKey = process.env.FACTORY_OWNER_PRIVATE_KEY || process.env.ETHEREUM_PRIVATE_KEY || process.env.PRIVATE_KEY;
  
  if (!privateKey) {
    console.error("❌ ERROR: FACTORY_OWNER_PRIVATE_KEY, ETHEREUM_PRIVATE_KEY, or PRIVATE_KEY not found!");
    console.error("   Usage: FACTORY_OWNER_PRIVATE_KEY=<key> npx ts-node scripts/enable-useglobalsupply-factories.ts");
    process.exit(1);
  }
  
  console.log("\n🔧 Enabling useGlobalSupply on all TokenFactory contracts...\n");
  
  const results: Array<{ chain: string; success: boolean; message: string }> = [];
  
  for (const [key, config] of Object.entries(CHAIN_CONFIGS)) {
    console.log(`${'='.repeat(60)}`);
    console.log(`${config.name}`);
    console.log(`${'='.repeat(60)}`);
    console.log(`Factory: ${config.factoryAddress || 'Not configured'}\n`);
    
    if (!config.factoryAddress) {
      console.log(`⚠️  Skipping: Factory address not configured\n`);
      results.push({
        chain: config.name,
        success: false,
        message: "Factory address not configured",
      });
      continue;
    }
    
    const result = await enableUseGlobalSupply(config, privateKey);
    
    const status = result.success ? "✅" : "❌";
    console.log(`${status} ${result.message}\n`);
    
    results.push({
      chain: config.name,
      ...result,
    });
  }
  
  // Summary
  console.log(`${'='.repeat(60)}`);
  console.log("SUMMARY");
  console.log(`${'='.repeat(60)}\n`);
  
  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;
  
  console.log(`✅ Successfully enabled: ${successCount}`);
  console.log(`❌ Failed: ${failCount}\n`);
  
  if (failCount > 0) {
    console.log("Failed chains:");
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.chain}: ${r.message}`);
    });
  }
}

main().catch(console.error);


