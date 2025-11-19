/**
 * Check TokenFactory settings on all chains
 * 
 * Usage:
 *   npx ts-node scripts/check-tokenfactory-settings.ts
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
  "function globalSupplyTracker() external view returns (address)",
  "function chainName() external view returns (string)",
  "function owner() external view returns (address)",
];

async function checkFactory(config: ChainConfig) {
  if (!config.factoryAddress) {
    return {
      found: false,
      message: "Factory address not configured",
    };
  }

  const provider = new ethers.JsonRpcProvider(config.rpcUrl);
  
  try {
    const factory = new ethers.Contract(config.factoryAddress, TokenFactoryABI, provider);
    
    const useGlobalSupply = await factory.useGlobalSupply();
    const globalSupplyTracker = await factory.globalSupplyTracker();
    const chainName = await factory.chainName();
    const owner = await factory.owner();
    
    return {
      found: true,
      useGlobalSupply,
      globalSupplyTracker,
      chainName,
      owner,
    };
  } catch (error: any) {
    return {
      found: false,
      message: error.message,
    };
  }
}

async function main() {
  console.log("\n🔍 Checking TokenFactory settings on all chains...\n");
  
  for (const [key, config] of Object.entries(CHAIN_CONFIGS)) {
    console.log(`${'='.repeat(60)}`);
    console.log(`${config.name}`);
    console.log(`${'='.repeat(60)}`);
    console.log(`Factory: ${config.factoryAddress || 'Not configured'}\n`);
    
    const result = await checkFactory(config);
    
    if (!result.found) {
      console.log(`❌ ${result.message || 'Factory not found or error'}\n`);
      continue;
    }
    
    const status = result.useGlobalSupply ? "✅" : "❌";
    console.log(`${status} useGlobalSupply: ${result.useGlobalSupply}`);
    console.log(`   GlobalSupplyTracker: ${result.globalSupplyTracker}`);
    console.log(`   Chain Name: ${result.chainName}`);
    console.log(`   Owner: ${result.owner}\n`);
    
    if (!result.useGlobalSupply) {
      console.log(`⚠️  WARNING: useGlobalSupply is disabled!`);
      console.log(`   New tokens created from this factory will NOT have price sync enabled.`);
      console.log(`   Fix: Call setUseGlobalSupply(true) on the factory (requires owner's key).\n`);
    }
  }
  
  console.log(`${'='.repeat(60)}`);
  console.log("SUMMARY");
  console.log(`${'='.repeat(60)}\n`);
  
  const allEnabled = Object.values(CHAIN_CONFIGS).every(async (config) => {
    const result = await checkFactory(config);
    return result.found && result.useGlobalSupply;
  });
  
  if (allEnabled) {
    console.log("✅ All TokenFactory contracts have useGlobalSupply enabled!");
  } else {
    console.log("⚠️  Some TokenFactory contracts need useGlobalSupply enabled.");
    console.log("   Run: npx ts-node scripts/enable-useglobalsupply-factories.ts");
  }
}

main().catch(console.error);





