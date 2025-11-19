/**
 * Update existing bonding curves to use GlobalSupplyTrackerV2
 * This script updates the globalSupplyTracker address on bonding curves
 * 
 * Usage:
 *   TOKEN_ID=<tokenId> npx ts-node scripts/update-bonding-curves-to-v2.ts
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
  chainName: string;
}

const CHAIN_CONFIGS: Record<string, ChainConfig> = {
  'base-sepolia': {
    name: "Base Sepolia",
    rpcUrl: process.env.RPC_URL_BASE_SEPOLIA || "https://base-sepolia-rpc.publicnode.com",
    globalSupplyTrackerV2: process.env.GLOBAL_SUPPLY_TRACKER_V2_BASE_SEPOLIA || "0x7aDD63A32854b5b44091B56e5c37B09Ec32e215C",
    chainName: "base-sepolia",
  },
  'bsc-testnet': {
    name: "BSC Testnet",
    rpcUrl: process.env.RPC_URL_BSC_TESTNET || "https://bsc-testnet.publicnode.com",
    globalSupplyTrackerV2: process.env.GLOBAL_SUPPLY_TRACKER_V2_BSC_TESTNET || "0xc443F7e5F0e62C4803030E938d5Cc762F0829A02",
    chainName: "bsc-testnet",
  },
  'sepolia': {
    name: "Sepolia",
    rpcUrl: process.env.RPC_URL_SEPOLIA || "https://ethereum-sepolia-rpc.publicnode.com",
    globalSupplyTrackerV2: process.env.GLOBAL_SUPPLY_TRACKER_V2_SEPOLIA || "0xc443F7e5F0e62C4803030E938d5Cc762F0829A02",
    chainName: "sepolia",
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

async function updateBondingCurve(
  config: ChainConfig,
  curveAddress: string,
  ownerPrivateKey: string
): Promise<{ success: boolean; message: string }> {
  const provider = new ethers.JsonRpcProvider(config.rpcUrl);
  const wallet = new ethers.Wallet(ownerPrivateKey.replace(/^0x/, ''), provider);
  
  const bondingCurveABI = [
    "function owner() external view returns (address)",
    "function globalSupplyTracker() external view returns (address)",
    "function setGlobalSupplyTracker(address) external",
  ];
  
  try {
    const curveContract = new ethers.Contract(curveAddress, bondingCurveABI, wallet);
    
    // Check current tracker
    const currentTracker = await curveContract.globalSupplyTracker();
    const curveOwner = await curveContract.owner();
    
    console.log(`   Current Tracker: ${currentTracker}`);
    console.log(`   New Tracker (V2): ${config.globalSupplyTrackerV2}`);
    console.log(`   Curve Owner: ${curveOwner}`);
    console.log(`   Wallet Address: ${wallet.address}`);
    
    // Check if already using V2
    if (currentTracker.toLowerCase() === config.globalSupplyTrackerV2.toLowerCase()) {
      return {
        success: true,
        message: "Already using GlobalSupplyTrackerV2",
      };
    }
    
    // Verify wallet is owner
    if (curveOwner.toLowerCase() !== wallet.address.toLowerCase()) {
      return {
        success: false,
        message: `Wallet ${wallet.address} is not the owner of bonding curve (owner: ${curveOwner})`,
      };
    }
    
    // Update to V2
    console.log(`   🔧 Updating bonding curve to use GlobalSupplyTrackerV2...`);
    const tx = await curveContract.setGlobalSupplyTracker(config.globalSupplyTrackerV2);
    console.log(`   ⏳ Transaction sent: ${tx.hash}`);
    await tx.wait();
    console.log(`   ✅ Transaction confirmed`);
    
    // Verify update
    const newTracker = await curveContract.globalSupplyTracker();
    if (newTracker.toLowerCase() === config.globalSupplyTrackerV2.toLowerCase()) {
      return {
        success: true,
        message: `Updated successfully to V2. Tx: ${tx.hash}`,
      };
    } else {
      return {
        success: false,
        message: `Update transaction succeeded but tracker address mismatch`,
      };
    }
    
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
    console.error("   Use the bonding curve owner's private key");
    process.exit(1);
  }
  
  console.log(`\n🔧 Updating bonding curves to GlobalSupplyTrackerV2 for token: ${tokenId}\n`);
  
  const deployments = await getTokenDeployments(tokenId);
  
  if (deployments.length === 0) {
    console.error("❌ No deployments found for this token");
    process.exit(1);
  }
  
  console.log(`Found ${deployments.length} deployments\n`);
  
  const results: Array<{ chain: string; success: boolean; message: string }> = [];
  
  for (const dep of deployments) {
    const curveAddress = dep.curve_address || dep.curveAddress;
    const tokenAddress = dep.token_address || dep.tokenAddress;
    const status = dep.status || 'unknown';
    
    if (!curveAddress || status !== 'deployed') {
      console.log(`⚠️  Skipping ${dep.chain}: curve=${curveAddress || 'N/A'}, status=${status}`);
      continue;
    }
    
    const chainKey = dep.chain?.toLowerCase().includes('base-sepolia') || dep.chain?.toLowerCase().includes('base') ? 'base-sepolia' :
                    dep.chain?.toLowerCase().includes('bsc-testnet') || dep.chain?.toLowerCase().includes('bsc') ? 'bsc-testnet' :
                    dep.chain?.toLowerCase().includes('sepolia') || dep.chain?.toLowerCase().includes('ethereum') ? 'sepolia' : null;
    
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
    
    const result = await updateBondingCurve(config, curveAddress, ownerPrivateKey);
    
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
  
  console.log(`✅ Successfully updated: ${successCount}`);
  console.log(`❌ Failed: ${failCount}\n`);
  
  if (failCount > 0) {
    console.log("Failed chains:");
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.chain}: ${r.message}`);
    });
  }
  
  if (successCount > 0) {
    console.log("\n✅ Bonding curves updated! They will now use GlobalSupplyTrackerV2 for cross-chain price sync.");
    console.log("   Prices should now sync correctly across all chains using token IDs.");
  }
}

main().catch(console.error);

