/**
 * Authorize bonding curves for a specific token in GlobalSupplyTracker
 * Uses the GlobalSupplyTracker owner's private key
 * 
 * Usage:
 *   TOKEN_ID=<tokenId> npx ts-node scripts/authorize-token-curves.ts
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

async function authorizeCurve(
  config: ChainConfig,
  curveAddress: string,
  ownerPrivateKey: string
): Promise<{ success: boolean; message: string }> {
  const provider = new ethers.JsonRpcProvider(config.rpcUrl);
  const wallet = new ethers.Wallet(ownerPrivateKey.replace(/^0x/, ''), provider);
  
  const trackerABI = [
    "function owner() external view returns (address)",
    "function authorizedUpdaters(address) external view returns (bool)",
    "function authorizeUpdater(address) external",
  ];
  
  try {
    const trackerContract = new ethers.Contract(config.globalSupplyTracker, trackerABI, wallet);
    
    // Verify wallet is owner
    const owner = await trackerContract.owner();
    console.log(`   Tracker Owner: ${owner}`);
    console.log(`   Wallet Address: ${wallet.address}`);
    
    if (owner.toLowerCase() !== wallet.address.toLowerCase()) {
      return {
        success: false,
        message: `Wallet ${wallet.address} is not the owner of GlobalSupplyTracker (owner: ${owner})`,
      };
    }
    
    // Check if already authorized (using public mapping)
    const isAuthorized = await trackerContract.authorizedUpdaters(curveAddress);
    
    if (isAuthorized) {
      return {
        success: true,
        message: "Already authorized",
      };
    }
    
    // Authorize
    console.log(`   🔧 Authorizing bonding curve ${curveAddress}...`);
    const tx = await trackerContract.authorizeUpdater(curveAddress);
    console.log(`   ⏳ Transaction sent: ${tx.hash}`);
    await tx.wait();
    console.log(`   ✅ Transaction confirmed`);
    
    return {
      success: true,
      message: `Authorized successfully. Tx: ${tx.hash}`,
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
    console.error("   Usage: TOKEN_ID=<tokenId> npx ts-node scripts/authorize-token-curves.ts");
    process.exit(1);
  }
  
  // Owner's private key (GlobalSupplyTracker owner)
  const ownerPrivateKey = process.env.ETHEREUM_PRIVATE_KEY || process.env.PRIVATE_KEY;
  
  if (!ownerPrivateKey) {
    console.error("❌ ERROR: ETHEREUM_PRIVATE_KEY or PRIVATE_KEY not found!");
    console.error("   The GlobalSupplyTracker owner's private key is needed to authorize bonding curves.");
    process.exit(1);
  }
  
  console.log(`\n🔧 Authorizing bonding curves for token: ${tokenId}\n`);
  
  const deployments = await getTokenDeployments(tokenId);
  
  if (deployments.length === 0) {
    console.error("❌ No deployments found for this token");
    process.exit(1);
  }
  
  console.log(`Found ${deployments.length} deployments\n`);
  
  const results: Array<{ chain: string; success: boolean; message: string }> = [];
  
  for (const dep of deployments) {
    // Handle both snake_case and camelCase field names
    const curveAddress = dep.curve_address || dep.curveAddress;
    const tokenAddress = dep.token_address || dep.tokenAddress;
    const deploymentStatus = dep.status || 'pending';
    
    if (!curveAddress || deploymentStatus !== 'deployed') {
      console.log(`⚠️  Skipping deployment: curve=${curveAddress}, status=${deploymentStatus}`);
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
    console.log(`Curve: ${curveAddress}`);
    console.log(`Token: ${tokenAddress}\n`);
    
    const result = await authorizeCurve(config, curveAddress, ownerPrivateKey);
    
    const resultStatus = result.success ? "✅" : "❌";
    console.log(`${resultStatus} ${result.message}\n`);
    
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
  
  console.log(`✅ Successfully authorized: ${successCount}`);
  console.log(`❌ Failed: ${failCount}\n`);
  
  if (failCount > 0) {
    console.log("Failed chains:");
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.chain}: ${r.message}`);
    });
  }
  
  console.log("\n⚠️  Note: This only authorizes curves in GlobalSupplyTracker.");
  console.log("   To enable useGlobalSupply on bonding curves, you need the bonding curve owner's key.");
  console.log("   Run: TOKEN_ID=<tokenId> npx hardhat run scripts/fix-all-chains-for-token.ts");
}

main().catch(console.error);

