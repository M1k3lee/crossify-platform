/**
 * Fix bonding curve configuration for all chains of a specific token
 * 
 * Usage:
 *   TOKEN_ID=<tokenId> npx hardhat run scripts/fix-all-chains-for-token.ts
 * 
 * This will:
 * 1. Fetch token deployments from API
 * 2. Fix bonding curve config on each chain
 * 3. Authorize curves in GlobalSupplyTracker
 */

import { ethers } from "hardhat";
import * as dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const API_BASE = process.env.API_BASE_URL || "https://crossify-platform-production.up.railway.app/api";

interface ChainConfig {
  name: string;
  network: string;
  rpcUrl: string;
  globalSupplyTracker: string;
  privateKey: string;
}

const CHAIN_CONFIGS: Record<string, ChainConfig> = {
  'base-sepolia': {
    name: "Base Sepolia",
    network: "baseSepolia",
    rpcUrl: process.env.RPC_URL_BASE_SEPOLIA || "https://base-sepolia-rpc.publicnode.com",
    globalSupplyTracker: process.env.GLOBAL_SUPPLY_TRACKER_BASE_SEPOLIA || "0x1eC9ee96EbD41111ad7b99f29D9a61e46b721C65",
    privateKey: process.env.PRIVATE_KEY_BASE_SEPOLIA || "",
  },
  'bsc-testnet': {
    name: "BSC Testnet",
    network: "bscTestnet",
    rpcUrl: process.env.RPC_URL_BSC_TESTNET || "https://bsc-testnet.publicnode.com",
    globalSupplyTracker: process.env.GLOBAL_SUPPLY_TRACKER_BSC_TESTNET || "0xe84Ae64735261F441e0bcB12bCf60630c5239ef4",
    privateKey: process.env.PRIVATE_KEY_BSC_TESTNET || "",
  },
  'sepolia': {
    name: "Sepolia",
    network: "sepolia",
    rpcUrl: process.env.RPC_URL_SEPOLIA || "https://ethereum-sepolia-rpc.publicnode.com",
    globalSupplyTracker: process.env.GLOBAL_SUPPLY_TRACKER_SEPOLIA || "0x130195A8D09dfd99c36D5903B94088EDBD66533e",
    privateKey: process.env.PRIVATE_KEY_SEPOLIA || "",
  },
};

async function getTokenDeployments(tokenId: string) {
  try {
    const response = await axios.get(`${API_BASE}/tokens/${tokenId}/status`);
    return response.data.deployments || [];
  } catch (error: any) {
    console.error("❌ Failed to fetch token deployments:", error.message);
    return [];
  }
}

async function fixBondingCurve(
  config: ChainConfig,
  curveAddress: string
): Promise<{ success: boolean; message: string }> {
  if (!config.privateKey) {
    return {
      success: false,
      message: `Private key not set for ${config.name}`,
    };
  }
  
  const provider = new ethers.JsonRpcProvider(config.rpcUrl);
  const wallet = new ethers.Wallet(config.privateKey, provider);
  
  const bondingCurveABI = [
    "function owner() external view returns (address)",
    "function globalSupplyTracker() external view returns (address)",
    "function useGlobalSupply() external view returns (bool)",
    "function setGlobalSupplyTracker(address) external",
    "function setUseGlobalSupply(bool) external",
  ];
  
  const trackerABI = [
    "function owner() external view returns (address)",
    "function isAuthorized(address) external view returns (bool)",
    "function authorizeUpdater(address) external",
  ];
  
  try {
    const curveContract = new ethers.Contract(curveAddress, bondingCurveABI, wallet);
    const trackerContract = new ethers.Contract(config.globalSupplyTracker, trackerABI, wallet);
    
    // Check current state
    const curveOwner = await curveContract.owner();
    const trackerOwner = await trackerContract.owner();
    const currentTracker = await curveContract.globalSupplyTracker();
    const useGlobalSupply = await curveContract.useGlobalSupply();
    const isAuthorized = await trackerContract.isAuthorized(curveAddress);
    
    console.log(`\n   Current state:`);
    console.log(`   - Curve owner: ${curveOwner}`);
    console.log(`   - Tracker owner: ${trackerOwner}`);
    console.log(`   - Wallet address: ${wallet.address}`);
    console.log(`   - Current tracker: ${currentTracker}`);
    console.log(`   - useGlobalSupply: ${useGlobalSupply}`);
    console.log(`   - Authorized: ${isAuthorized}`);
    
    // Check if we can make changes
    if (curveOwner.toLowerCase() !== wallet.address.toLowerCase()) {
      return {
        success: false,
        message: `Wallet ${wallet.address} is not the owner of bonding curve (owner: ${curveOwner})`,
      };
    }
    
    const changes: string[] = [];
    
    // Fix 1: Set GlobalSupplyTracker
    if (currentTracker.toLowerCase() !== config.globalSupplyTracker.toLowerCase()) {
      console.log(`\n   🔧 Setting GlobalSupplyTracker...`);
      const tx1 = await curveContract.setGlobalSupplyTracker(config.globalSupplyTracker);
      await tx1.wait();
      changes.push("Set GlobalSupplyTracker");
      console.log(`   ✅ Transaction: ${tx1.hash}`);
    }
    
    // Fix 2: Enable useGlobalSupply
    if (!useGlobalSupply) {
      console.log(`\n   🔧 Enabling useGlobalSupply...`);
      const tx2 = await curveContract.setUseGlobalSupply(true);
      await tx2.wait();
      changes.push("Enabled useGlobalSupply");
      console.log(`   ✅ Transaction: ${tx2.hash}`);
    }
    
    // Fix 3: Authorize in tracker
    if (!isAuthorized) {
      if (trackerOwner.toLowerCase() !== wallet.address.toLowerCase()) {
        return {
          success: false,
          message: `Wallet ${wallet.address} is not the owner of GlobalSupplyTracker (owner: ${trackerOwner}). Cannot authorize.`,
        };
      }
      
      console.log(`\n   🔧 Authorizing bonding curve in GlobalSupplyTracker...`);
      const tx3 = await trackerContract.authorizeUpdater(curveAddress);
      await tx3.wait();
      changes.push("Authorized in GlobalSupplyTracker");
      console.log(`   ✅ Transaction: ${tx3.hash}`);
    }
    
    if (changes.length === 0) {
      return {
        success: true,
        message: "Already configured correctly",
      };
    }
    
    return {
      success: true,
      message: `Fixed: ${changes.join(", ")}`,
    };
    
  } catch (error: any) {
    return {
      success: false,
      message: error.message,
    };
  }
}

async function main() {
  const tokenId = process.env.TOKEN_ID;
  
  if (!tokenId) {
    console.error("❌ ERROR: TOKEN_ID environment variable not set");
    console.error("   Usage: TOKEN_ID=<tokenId> npx hardhat run scripts/fix-all-chains-for-token.ts");
    process.exit(1);
  }
  
  console.log(`\n🔧 Fixing bonding curve configuration for token: ${tokenId}\n`);
  
  // Get deployments
  const deployments = await getTokenDeployments(tokenId);
  
  if (deployments.length === 0) {
    console.error("❌ No deployments found for token");
    process.exit(1);
  }
  
  console.log(`Found ${deployments.length} deployments\n`);
  
  const results: Array<{
    chain: string;
    success: boolean;
    message: string;
  }> = [];
  
  // Fix each chain
  for (const dep of deployments) {
    if (!dep.curve_address || dep.status !== 'deployed') {
      console.warn(`⚠️  Skipping ${dep.chain}: no curve address or not deployed`);
      continue;
    }
    
    const chainKey = dep.chain?.toLowerCase().includes('base-sepolia') ? 'base-sepolia' :
                    dep.chain?.toLowerCase().includes('bsc-testnet') ? 'bsc-testnet' :
                    dep.chain?.toLowerCase().includes('sepolia') ? 'sepolia' : null;
    
    if (!chainKey || !CHAIN_CONFIGS[chainKey]) {
      console.warn(`⚠️  Unknown chain: ${dep.chain}`);
      continue;
    }
    
    const config = CHAIN_CONFIGS[chainKey];
    
    console.log(`${'='.repeat(60)}`);
    console.log(`${config.name}`);
    console.log(`${'='.repeat(60)}`);
    console.log(`Curve Address: ${dep.curve_address}`);
    console.log(`Tracker Address: ${config.globalSupplyTracker}\n`);
    
    const result = await fixBondingCurve(config, dep.curve_address);
    
    const status = result.success ? "✅" : "❌";
    console.log(`\n${status} ${result.message}\n`);
    
    results.push({
      chain: config.name,
      success: result.success,
      message: result.message,
    });
  }
  
  // Summary
  console.log(`${'='.repeat(60)}`);
  console.log("SUMMARY");
  console.log(`${'='.repeat(60)}\n`);
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Successfully fixed: ${successful.length}`);
  successful.forEach(r => {
    console.log(`   - ${r.chain}: ${r.message}`);
  });
  
  if (failed.length > 0) {
    console.log(`\n❌ Failed: ${failed.length}`);
    failed.forEach(r => {
      console.log(`   - ${r.chain}: ${r.message}`);
    });
  }
  
  if (successful.length === results.length) {
    console.log(`\n✅ All chains fixed successfully!`);
    console.log(`\nNext step: Run initialize-global-supply.ts to sync prices`);
  }
}

main().catch(console.error);





