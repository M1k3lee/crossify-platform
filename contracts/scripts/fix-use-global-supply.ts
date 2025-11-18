/**
 * Fix useGlobalSupply for bonding curves
 * Tries all available private keys to find the one that owns the bonding curves
 * 
 * Usage:
 *   TOKEN_ID=<tokenId> npx ts-node scripts/fix-use-global-supply.ts
 */

import { ethers } from "ethers";
import * as dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const API_BASE = process.env.API_BASE_URL || "https://crossify-platform-production.up.railway.app/api";

interface ChainConfig {
  name: string;
  rpcUrl: string;
  globalSupplyTracker: string;
}

const CHAIN_CONFIGS: Record<string, ChainConfig> = {
  'base-sepolia': {
    name: "Base Sepolia",
    rpcUrl: process.env.RPC_URL_BASE_SEPOLIA || "https://base-sepolia-rpc.publicnode.com",
    globalSupplyTracker: process.env.GLOBAL_SUPPLY_TRACKER_BASE_SEPOLIA || "0x1eC9ee96EbD41111ad7b99f29D9a61e46b721C65",
  },
  'bsc-testnet': {
    name: "BSC Testnet",
    rpcUrl: process.env.RPC_URL_BSC_TESTNET || "https://bsc-testnet.publicnode.com",
    globalSupplyTracker: process.env.GLOBAL_SUPPLY_TRACKER_BSC_TESTNET || "0xe84Ae64735261F441e0bcB12bCf60630c5239ef4",
  },
  'sepolia': {
    name: "Sepolia",
    rpcUrl: process.env.RPC_URL_SEPOLIA || "https://ethereum-sepolia-rpc.publicnode.com",
    globalSupplyTracker: process.env.GLOBAL_SUPPLY_TRACKER_SEPOLIA || "0x130195A8D09dfd99c36D5903B94088EDBD66533e",
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
  curveAddress: string,
  tokenAddress: string,
  privateKey: string,
  keyName: string
): Promise<{ success: boolean; message: string; usedKey: string }> {
  const provider = new ethers.JsonRpcProvider(config.rpcUrl);
  const wallet = new ethers.Wallet(privateKey.replace(/^0x/, ''), provider);
  
  const bondingCurveABI = [
    "function owner() external view returns (address)",
    "function globalSupplyTracker() external view returns (address)",
    "function useGlobalSupply() external view returns (bool)",
    "function setGlobalSupplyTracker(address) external",
    "function setUseGlobalSupply(bool) external",
  ];
  
  try {
    const curveContract = new ethers.Contract(curveAddress, bondingCurveABI, wallet);
    
    // Check if wallet is owner
    const curveOwner = await curveContract.owner();
    const currentTracker = await curveContract.globalSupplyTracker();
    const useGlobalSupply = await curveContract.useGlobalSupply();
    
    console.log(`   Current state:`);
    console.log(`   - Owner: ${curveOwner}`);
    console.log(`   - Wallet: ${wallet.address}`);
    console.log(`   - Tracker: ${currentTracker}`);
    console.log(`   - Expected Tracker: ${config.globalSupplyTracker}`);
    console.log(`   - useGlobalSupply: ${useGlobalSupply}`);
    
    if (curveOwner.toLowerCase() !== wallet.address.toLowerCase()) {
      return {
        success: false,
        message: `Wallet ${wallet.address} is not the owner (owner: ${curveOwner})`,
        usedKey: keyName,
      };
    }
    
    const changes: string[] = [];
    
    // Fix 1: Set GlobalSupplyTracker if needed
    if (currentTracker.toLowerCase() !== config.globalSupplyTracker.toLowerCase()) {
      console.log(`   🔧 Setting GlobalSupplyTracker...`);
      const tx1 = await curveContract.setGlobalSupplyTracker(config.globalSupplyTracker);
      console.log(`   ⏳ Transaction sent: ${tx1.hash}`);
      await tx1.wait();
      changes.push("Set GlobalSupplyTracker");
      console.log(`   ✅ Transaction confirmed`);
    }
    
    // Fix 2: Enable useGlobalSupply
    if (!useGlobalSupply) {
      console.log(`   🔧 Enabling useGlobalSupply...`);
      const tx2 = await curveContract.setUseGlobalSupply(true);
      console.log(`   ⏳ Transaction sent: ${tx2.hash}`);
      await tx2.wait();
      changes.push("Enabled useGlobalSupply");
      console.log(`   ✅ Transaction confirmed`);
    }
    
    if (changes.length === 0) {
      return {
        success: true,
        message: "Already configured correctly",
        usedKey: keyName,
      };
    }
    
    return {
      success: true,
      message: `Fixed: ${changes.join(", ")}`,
      usedKey: keyName,
    };
    
  } catch (error: any) {
    return {
      success: false,
      message: error.message,
      usedKey: keyName,
    };
  }
}

async function main() {
  const tokenId = process.env.TOKEN_ID;
  
  if (!tokenId) {
    console.error("❌ ERROR: TOKEN_ID environment variable not set");
    process.exit(1);
  }
  
  console.log(`\n🔧 Fixing useGlobalSupply for token: ${tokenId}\n`);
  
  // Collect all available private keys
  const availableKeys: Array<{ name: string; key: string; address: string }> = [];
  
  const keyConfigs = [
    { env: 'TOKEN_CREATOR_PRIVATE_KEY', name: 'TOKEN_CREATOR_PRIVATE_KEY' },
    { env: 'PRIVATE_KEY', name: 'PRIVATE_KEY' },
    { env: 'ETHEREUM_PRIVATE_KEY', name: 'ETHEREUM_PRIVATE_KEY' },
    { env: 'PRIVATE_KEY_BASE_SEPOLIA', name: 'PRIVATE_KEY_BASE_SEPOLIA' },
    { env: 'PRIVATE_KEY_BSC_TESTNET', name: 'PRIVATE_KEY_BSC_TESTNET' },
    { env: 'PRIVATE_KEY_SEPOLIA', name: 'PRIVATE_KEY_SEPOLIA' },
  ];
  
  for (const { env, name } of keyConfigs) {
    const key = process.env[env];
    if (key && key.trim() !== '') {
      try {
        const wallet = new ethers.Wallet(key.replace(/^0x/, ''));
        availableKeys.push({
          name,
          key: key.replace(/^0x/, ''),
          address: wallet.address.toLowerCase(),
        });
      } catch (e) {
        // Invalid key, skip
      }
    }
  }
  
  console.log(`Found ${availableKeys.length} private keys to try:\n`);
  availableKeys.forEach(k => {
    console.log(`  ${k.name}: ${k.address}`);
  });
  console.log();
  
  const deployments = await getTokenDeployments(tokenId);
  
  if (deployments.length === 0) {
    console.error("❌ No deployments found");
    process.exit(1);
  }
  
  const results: Array<{
    chain: string;
    curveAddress: string;
    success: boolean;
    message: string;
    usedKey?: string;
  }> = [];
  
  for (const dep of deployments) {
    const curveAddress = dep.curve_address || dep.curveAddress;
    const tokenAddress = dep.token_address || dep.tokenAddress;
    const deploymentStatus = dep.status || 'pending';
    
    if (!curveAddress || deploymentStatus !== 'deployed') {
      continue;
    }
    
    const chainKey = dep.chain?.toLowerCase().includes('base-sepolia') ? 'base-sepolia' :
                    dep.chain?.toLowerCase().includes('bsc-testnet') ? 'bsc-testnet' :
                    dep.chain?.toLowerCase().includes('sepolia') ? 'sepolia' : null;
    
    if (!chainKey || !CHAIN_CONFIGS[chainKey]) {
      continue;
    }
    
    const config = CHAIN_CONFIGS[chainKey];
    
    console.log(`${'='.repeat(60)}`);
    console.log(`${config.name}`);
    console.log(`${'='.repeat(60)}`);
    console.log(`Curve: ${curveAddress}`);
    console.log(`Token: ${tokenAddress}\n`);
    
    // Try each key until one works
    let fixed = false;
    for (const keyInfo of availableKeys) {
      console.log(`Trying ${keyInfo.name} (${keyInfo.address})...`);
      const result = await fixBondingCurve(config, curveAddress, tokenAddress, keyInfo.key, keyInfo.name);
      
      if (result.success) {
        console.log(`✅ ${result.message}`);
        if (result.message !== "Already configured correctly") {
          console.log(`   Used key: ${result.usedKey}`);
        }
        results.push({
          chain: config.name,
          curveAddress,
          success: true,
          message: result.message,
          usedKey: result.usedKey,
        });
        fixed = true;
        break;
      } else {
        console.log(`❌ ${result.message}`);
      }
    }
    
    if (!fixed) {
      console.log(`\n❌ None of the available keys can fix this bonding curve.`);
      console.log(`   You need the private key for the bonding curve owner.`);
      results.push({
        chain: config.name,
        curveAddress,
        success: false,
        message: "No matching private key found",
      });
    }
    
    console.log();
  }
  
  // Summary
  console.log(`${'='.repeat(60)}`);
  console.log("SUMMARY");
  console.log(`${'='.repeat(60)}\n`);
  
  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;
  
  console.log(`✅ Successfully fixed: ${successCount}`);
  console.log(`❌ Failed: ${failCount}\n`);
  
  if (failCount > 0) {
    console.log("Failed chains:");
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.chain}: ${r.message}`);
    });
  }
}

main().catch(console.error);

