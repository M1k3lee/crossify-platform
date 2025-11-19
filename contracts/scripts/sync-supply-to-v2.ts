/**
 * Sync current supply from bonding curves to GlobalSupplyTrackerV2 using token IDs
 * This ensures V2 has the correct global supply for cross-chain price sync
 * 
 * Usage:
 *   TOKEN_ID=<tokenId> npx ts-node scripts/sync-supply-to-v2.ts
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
  tokenIDRegistry: string;
  chainName: string;
}

const CHAIN_CONFIGS: Record<string, ChainConfig> = {
  'base-sepolia': {
    name: "Base Sepolia",
    rpcUrl: process.env.RPC_URL_BASE_SEPOLIA || "https://base-sepolia-rpc.publicnode.com",
    globalSupplyTrackerV2: process.env.GLOBAL_SUPPLY_TRACKER_V2_BASE_SEPOLIA || "0x7aDD63A32854b5b44091B56e5c37B09Ec32e215C",
    tokenIDRegistry: process.env.TOKEN_ID_REGISTRY_BASE_SEPOLIA || "0x1f1f75d84CB2Ff86ffe2b8Fb3eb0d2e94438433D",
    chainName: "base-sepolia",
  },
  'bsc-testnet': {
    name: "BSC Testnet",
    rpcUrl: process.env.RPC_URL_BSC_TESTNET || "https://bsc-testnet.publicnode.com",
    globalSupplyTrackerV2: process.env.GLOBAL_SUPPLY_TRACKER_V2_BSC_TESTNET || "0xc443F7e5F0e62C4803030E938d5Cc762F0829A02",
    tokenIDRegistry: process.env.TOKEN_ID_REGISTRY_BSC_TESTNET || "0x4f3854445c33E9cf42b40B0AB36f4Dd58c23331f",
    chainName: "bsc-testnet",
  },
  'sepolia': {
    name: "Sepolia",
    rpcUrl: process.env.RPC_URL_SEPOLIA || "https://ethereum-sepolia-rpc.publicnode.com",
    globalSupplyTrackerV2: process.env.GLOBAL_SUPPLY_TRACKER_V2_SEPOLIA || "0xc443F7e5F0e62C4803030E938d5Cc762F0829A02",
    tokenIDRegistry: process.env.TOKEN_ID_REGISTRY_SEPOLIA || "0x4f3854445c33E9cf42b40B0AB36f4Dd58c23331f",
    chainName: "sepolia",
  },
};

/**
 * Convert UUID to bytes32 (keccak256 hash)
 */
function uuidToBytes32(uuidString: string): string {
  const uuidWithoutDashes = uuidString.replace(/-/g, '');
  const bytes = ethers.toUtf8Bytes(uuidWithoutDashes);
  return ethers.keccak256(bytes);
}

async function getTokenDeployments(tokenId: string) {
  try {
    const response = await axios.get(`${API_BASE}/tokens/${tokenId}/status`);
    return response.data.deployments || [];
  } catch (error: any) {
    console.error("❌ Failed to fetch token deployments:", error.message);
    return [];
  }
}

async function syncSupplyToV2(
  config: ChainConfig,
  tokenId: string,
  tokenAddress: string,
  curveAddress: string,
  ownerPrivateKey: string
): Promise<{ success: boolean; message: string }> {
  const provider = new ethers.JsonRpcProvider(config.rpcUrl);
  const wallet = new ethers.Wallet(ownerPrivateKey.replace(/^0x/, ''), provider);
  
  const bondingCurveABI = [
    "function totalSupplySold() external view returns (uint256)",
  ];
  
  const trackerABI = [
    "function owner() external view returns (address)",
    "function updateSupplyByTokenId(bytes32 tokenId, string memory chain, uint256 newSupply) external payable",
    "function getGlobalSupply(bytes32 tokenId) external view returns (uint256)",
    "function getChainSupply(bytes32 tokenId, string memory chain) external view returns (uint256)",
  ];
  
  const registryABI = [
    "function getTokenId(address tokenAddress) external view returns (bytes32)",
  ];
  
  try {
    // Get actual supply from bonding curve
    const curveContract = new ethers.Contract(curveAddress, bondingCurveABI, provider);
    const localSupplyWei = await curveContract.totalSupplySold();
    const localSupply = ethers.formatEther(localSupplyWei);
    
    // Get token ID from registry
    const registry = new ethers.Contract(config.tokenIDRegistry, registryABI, provider);
    const tokenIdBytes32 = await registry.getTokenId(tokenAddress);
    
    if (tokenIdBytes32 === ethers.ZeroHash) {
      return {
        success: false,
        message: `Token ${tokenAddress} is not registered in TokenIDRegistry`,
      };
    }
    
    // Get current supply from V2
    const tracker = new ethers.Contract(config.globalSupplyTrackerV2, trackerABI, wallet);
    const currentGlobalSupply = await tracker.getGlobalSupply(tokenIdBytes32);
    const currentChainSupply = await tracker.getChainSupply(tokenIdBytes32, config.chainName);
    
    console.log(`   Local Supply: ${localSupply} tokens`);
    console.log(`   Current Global Supply: ${ethers.formatEther(currentGlobalSupply)} tokens`);
    console.log(`   Current Chain Supply: ${ethers.formatEther(currentChainSupply)} tokens`);
    console.log(`   Token ID: ${tokenIdBytes32}`);
    
    // Check if update is needed
    if (localSupplyWei === currentChainSupply) {
      return {
        success: true,
        message: `Already synced (${localSupply} tokens)`,
      };
    }
    
    // Verify wallet is owner
    const owner = await tracker.owner();
    if (owner.toLowerCase() !== wallet.address.toLowerCase()) {
      return {
        success: false,
        message: `Wallet ${wallet.address} is not the owner of GlobalSupplyTrackerV2 (owner: ${owner})`,
      };
    }
    
    // Update using token ID (recommended method)
    console.log(`   🔧 Updating GlobalSupplyTrackerV2 using token ID...`);
    const tx = await tracker.updateSupplyByTokenId(
      tokenIdBytes32,
      config.chainName,
      localSupplyWei
    );
    console.log(`   ⏳ Transaction sent: ${tx.hash}`);
    await tx.wait();
    console.log(`   ✅ Transaction confirmed`);
    
    // Verify update
    const newGlobalSupply = await tracker.getGlobalSupply(tokenIdBytes32);
    const newChainSupply = await tracker.getChainSupply(tokenIdBytes32, config.chainName);
    
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
  const tokenId = process.env.TOKEN_ID || "ea23015c-d3c7-40e1-8cb3-94d2cbd813b9";
  const ownerPrivateKey = process.env.PRIVATE_KEY || process.env.ETHEREUM_PRIVATE_KEY;
  
  if (!ownerPrivateKey) {
    console.error("❌ ERROR: PRIVATE_KEY or ETHEREUM_PRIVATE_KEY not found!");
    process.exit(1);
  }
  
  console.log(`\n🔄 Syncing supply to GlobalSupplyTrackerV2 for token: ${tokenId}\n`);
  
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
    
    if (!curveAddress || !tokenAddress || status !== 'deployed') {
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
    console.log(`Curve: ${curveAddress}`);
    console.log(`Token: ${tokenAddress}\n`);
    
    const result = await syncSupplyToV2(config, tokenId, tokenAddress, curveAddress, ownerPrivateKey);
    
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
  
  if (successCount > 0) {
    console.log("✅ Supply synced to GlobalSupplyTrackerV2 using token IDs!");
    console.log("   Prices should now be correctly synchronized across all chains.");
    console.log("   Global supply is now the sum of all chains for this token.");
  }
}

main().catch(console.error);

