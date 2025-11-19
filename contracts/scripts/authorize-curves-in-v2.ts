/**
 * Authorize bonding curves in GlobalSupplyTrackerV2
 * This enables them to update supply using token IDs
 * 
 * Usage:
 *   TOKEN_ID=<tokenId> npx ts-node scripts/authorize-curves-in-v2.ts
 */

import { ethers } from "ethers";
import * as dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const API_BASE = process.env.API_BASE_URL || "https://crossify-platform-production.up.railway.app/api";

interface ChainConfig {
  name: string;
  rpcUrl: string;
  globalSupplyTrackerV2: string;
}

const CHAIN_CONFIGS: Record<string, ChainConfig> = {
  'base-sepolia': {
    name: "Base Sepolia",
    rpcUrl: process.env.RPC_URL_BASE_SEPOLIA || "https://base-sepolia-rpc.publicnode.com",
    globalSupplyTrackerV2: process.env.GLOBAL_SUPPLY_TRACKER_V2_BASE_SEPOLIA || "0x7aDD63A32854b5b44091B56e5c37B09Ec32e215C",
  },
  'bsc-testnet': {
    name: "BSC Testnet",
    rpcUrl: process.env.RPC_URL_BSC_TESTNET || "https://bsc-testnet.publicnode.com",
    globalSupplyTrackerV2: process.env.GLOBAL_SUPPLY_TRACKER_V2_BSC_TESTNET || "0xc443F7e5F0e62C4803030E938d5Cc762F0829A02",
  },
  'sepolia': {
    name: "Sepolia",
    rpcUrl: process.env.RPC_URL_SEPOLIA || "https://ethereum-sepolia-rpc.publicnode.com",
    globalSupplyTrackerV2: process.env.GLOBAL_SUPPLY_TRACKER_V2_SEPOLIA || "0xc443F7e5F0e62C4803030E938d5Cc762F0829A02",
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
    const tracker = new ethers.Contract(config.globalSupplyTrackerV2, trackerABI, wallet);
    
    // Verify wallet is owner
    const owner = await tracker.owner();
    if (owner.toLowerCase() !== wallet.address.toLowerCase()) {
      return {
        success: false,
        message: `Wallet ${wallet.address} is not the owner of GlobalSupplyTrackerV2 (owner: ${owner})`,
      };
    }
    
    // Check if already authorized
    const isAuthorized = await tracker.authorizedUpdaters(curveAddress);
    if (isAuthorized) {
      return {
        success: true,
        message: "Already authorized",
      };
    }
    
    // Authorize
    console.log(`   🔧 Authorizing bonding curve ${curveAddress}...`);
    const tx = await tracker.authorizeUpdater(curveAddress);
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
  const tokenId = process.env.TOKEN_ID || "ea23015c-d3c7-40e1-8cb3-94d2cbd813b9";
  const ownerPrivateKey = process.env.PRIVATE_KEY || process.env.ETHEREUM_PRIVATE_KEY;
  
  if (!ownerPrivateKey) {
    console.error("❌ ERROR: PRIVATE_KEY or ETHEREUM_PRIVATE_KEY not found!");
    console.error("   Use the GlobalSupplyTrackerV2 owner's private key (same as deployer)");
    process.exit(1);
  }
  
  console.log(`\n🔧 Authorizing bonding curves in GlobalSupplyTrackerV2 for token: ${tokenId}\n`);
  
  const deployments = await getTokenDeployments(tokenId);
  
  if (deployments.length === 0) {
    console.error("❌ No deployments found for this token");
    process.exit(1);
  }
  
  console.log(`Found ${deployments.length} deployments\n`);
  
  const results: Array<{ chain: string; success: boolean; message: string }> = [];
  
  for (const dep of deployments) {
    const curveAddress = dep.curve_address || dep.curveAddress;
    const status = dep.status || 'unknown';
    
    if (!curveAddress || status !== 'deployed') {
      continue;
    }
    
    const chainKey = dep.chain?.toLowerCase().includes('base-sepolia') || dep.chain?.toLowerCase().includes('base') ? 'base-sepolia' :
                    dep.chain?.toLowerCase().includes('bsc-testnet') || dep.chain?.toLowerCase().includes('bsc') ? 'bsc-testnet' :
                    dep.chain?.toLowerCase().includes('sepolia') || dep.chain?.toLowerCase().includes('ethereum') ? 'sepolia' : null;
    
    if (!chainKey || !CHAIN_CONFIGS[chainKey]) {
      continue;
    }
    
    const config = CHAIN_CONFIGS[chainKey];
    
    console.log(`${'='.repeat(60)}`);
    console.log(`${config.name}`);
    console.log(`${'='.repeat(60)}`);
    console.log(`Curve: ${curveAddress}\n`);
    
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
  
  if (successCount > 0) {
    console.log("✅ Bonding curves are now authorized in GlobalSupplyTrackerV2!");
    console.log("   They will automatically use token IDs when calling updateSupply(address, ...)");
    console.log("   Prices should now sync correctly across all chains!");
  }
}

main().catch(console.error);

