/**
 * Sync global supply for a specific token by updating GlobalSupplyTracker
 * with current supply from each bonding curve
 * 
 * Usage:
 *   TOKEN_ID=<tokenId> npx ts-node scripts/sync-global-supply-for-token.ts
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
  chainName: string;
}

const CHAIN_CONFIGS: Record<string, ChainConfig> = {
  'base-sepolia': {
    name: "Base Sepolia",
    rpcUrl: process.env.RPC_URL_BASE_SEPOLIA || "https://base-sepolia-rpc.publicnode.com",
    globalSupplyTracker: process.env.GLOBAL_SUPPLY_TRACKER_BASE_SEPOLIA || "0x1eC9ee96EbD41111ad7b99f29D9a61e46b721C65",
    chainName: "base-sepolia",
  },
  'bsc-testnet': {
    name: "BSC Testnet",
    rpcUrl: process.env.RPC_URL_BSC_TESTNET || "https://bsc-testnet.publicnode.com",
    globalSupplyTracker: process.env.GLOBAL_SUPPLY_TRACKER_BSC_TESTNET || "0xe84Ae64735261F441e0bcB12bCf60630c5239ef4",
    chainName: "bsc-testnet",
  },
  'sepolia': {
    name: "Sepolia",
    rpcUrl: process.env.RPC_URL_SEPOLIA || "https://ethereum-sepolia-rpc.publicnode.com",
    globalSupplyTracker: process.env.GLOBAL_SUPPLY_TRACKER_SEPOLIA || "0x130195A8D09dfd99c36D5903B94088EDBD66533e",
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

async function syncSupplyForChain(
  config: ChainConfig,
  curveAddress: string,
  tokenAddress: string,
  ownerPrivateKey: string
): Promise<{ success: boolean; message: string }> {
  const provider = new ethers.JsonRpcProvider(config.rpcUrl);
  const wallet = new ethers.Wallet(ownerPrivateKey.replace(/^0x/, ''), provider);
  
  const bondingCurveABI = [
    "function totalSupplySold() external view returns (uint256)",
  ];
  
  const trackerABI = [
    "function owner() external view returns (address)",
    "function updateSupply(address token, string memory chainName, uint256 newSupply) external",
    "function globalSupply(address) external view returns (uint256)",
    "function chainSupply(address, string) external view returns (uint256)",
  ];
  
  try {
    const curveContract = new ethers.Contract(curveAddress, bondingCurveABI, provider);
    const trackerContract = new ethers.Contract(config.globalSupplyTracker, trackerABI, wallet);
    
    // Get current supply from bonding curve
    const localSupply = await curveContract.totalSupplySold();
    const localSupplyFormatted = ethers.formatEther(localSupply);
    
    // Get current global supply from tracker
    const currentGlobalSupply = await trackerContract.globalSupply(tokenAddress);
    const currentChainSupply = await trackerContract.chainSupply(tokenAddress, config.chainName);
    
    console.log(`   Local Supply: ${localSupplyFormatted} tokens`);
    console.log(`   Current Global Supply: ${ethers.formatEther(currentGlobalSupply)} tokens`);
    console.log(`   Current Chain Supply: ${ethers.formatEther(currentChainSupply)} tokens`);
    
    // Check if update is needed
    if (localSupply === currentChainSupply && localSupply === currentGlobalSupply) {
      return {
        success: true,
        message: `Already synced (${localSupplyFormatted} tokens)`,
      };
    }
    
    // Verify wallet is owner
    const owner = await trackerContract.owner();
    if (owner.toLowerCase() !== wallet.address.toLowerCase()) {
      return {
        success: false,
        message: `Wallet ${wallet.address} is not the owner of GlobalSupplyTracker (owner: ${owner})`,
      };
    }
    
    // Update supply
    console.log(`   🔧 Updating GlobalSupplyTracker...`);
    const tx = await trackerContract.updateSupply(
      tokenAddress,
      config.chainName,
      localSupply
    );
    console.log(`   ⏳ Transaction sent: ${tx.hash}`);
    await tx.wait();
    console.log(`   ✅ Transaction confirmed`);
    
    // Verify update
    const newGlobalSupply = await trackerContract.globalSupply(tokenAddress);
    const newChainSupply = await trackerContract.chainSupply(tokenAddress, config.chainName);
    
    return {
      success: true,
      message: `Synced successfully. Global: ${ethers.formatEther(newGlobalSupply)}, Chain: ${ethers.formatEther(newChainSupply)}. Tx: ${tx.hash}`,
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
    console.error("   Usage: TOKEN_ID=<tokenId> npx ts-node scripts/sync-global-supply-for-token.ts");
    process.exit(1);
  }
  
  // Owner's private key (GlobalSupplyTracker owner)
  const ownerPrivateKey = process.env.ETHEREUM_PRIVATE_KEY || process.env.PRIVATE_KEY;
  
  if (!ownerPrivateKey) {
    console.error("❌ ERROR: ETHEREUM_PRIVATE_KEY or PRIVATE_KEY not found!");
    console.error("   The GlobalSupplyTracker owner's private key is needed to update supply.");
    process.exit(1);
  }
  
  console.log(`\n🔄 Syncing global supply for token: ${tokenId}\n`);
  
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
    
    if (!curveAddress || !tokenAddress || deploymentStatus !== 'deployed') {
      console.log(`⚠️  Skipping deployment: curve=${curveAddress}, token=${tokenAddress}, status=${deploymentStatus}`);
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
    
    const result = await syncSupplyForChain(config, curveAddress, tokenAddress, ownerPrivateKey);
    
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
  
  console.log(`✅ Successfully synced: ${successCount}`);
  console.log(`❌ Failed: ${failCount}\n`);
  
  if (failCount > 0) {
    console.log("Failed chains:");
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.chain}: ${r.message}`);
    });
  }
  
  if (successCount > 0) {
    console.log("\n✅ Global supply synced! Prices should now be synchronized across chains.");
  }
}

main().catch(console.error);

