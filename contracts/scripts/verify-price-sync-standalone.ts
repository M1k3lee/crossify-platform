/**
 * Standalone script to verify price sync configuration
 * Doesn't require Hardhat config - uses environment variables directly
 * 
 * Usage:
 *   npx ts-node scripts/verify-price-sync-standalone.ts
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

async function checkBondingCurve(
  config: ChainConfig,
  curveAddress: string,
  tokenAddress: string
) {
  const provider = new ethers.JsonRpcProvider(config.rpcUrl);
  
  const bondingCurveABI = [
    "function useGlobalSupply() external view returns (bool)",
    "function globalSupplyTracker() external view returns (address)",
    "function getCurrentPrice() external view returns (uint256)",
    "function totalSupplySold() external view returns (uint256)",
  ];
  
  const trackerABI = [
    "function getGlobalSupply(address token) external view returns (uint256)",
    "function isAuthorized(address updater) external view returns (bool)",
  ];
  
  const issues: string[] = [];
  
  try {
    const curveContract = new ethers.Contract(curveAddress, bondingCurveABI, provider);
    const trackerContract = new ethers.Contract(config.globalSupplyTracker, trackerABI, provider);
    
    const trackerAddress = await curveContract.globalSupplyTracker();
    const useGlobalSupply = await curveContract.useGlobalSupply();
    const isAuthorized = await trackerContract.isAuthorized(curveAddress);
    const currentPrice = await curveContract.getCurrentPrice();
    const localSupply = await curveContract.totalSupplySold();
    const globalSupply = await trackerContract.getGlobalSupply(tokenAddress);
    
    if (trackerAddress === ethers.ZeroAddress) {
      issues.push("GlobalSupplyTracker not set");
    } else if (trackerAddress.toLowerCase() !== config.globalSupplyTracker.toLowerCase()) {
      issues.push(`Wrong tracker: ${trackerAddress}`);
    }
    
    if (!useGlobalSupply) {
      issues.push("useGlobalSupply disabled");
    }
    
    if (!isAuthorized) {
      issues.push("Not authorized in tracker");
    }
    
    return {
      configured: issues.length === 0,
      useGlobalSupply,
      authorized: isAuthorized,
      price: ethers.formatEther(currentPrice),
      localSupply: ethers.formatEther(localSupply),
      globalSupply: ethers.formatEther(globalSupply),
      issues,
    };
  } catch (error: any) {
    return {
      configured: false,
      error: error.message,
      issues: [`Error: ${error.message}`],
    };
  }
}

async function main() {
  const tokenId = process.argv[2];
  
  if (!tokenId) {
    console.error("❌ Usage: npx ts-node scripts/verify-price-sync-standalone.ts <tokenId>");
    console.error("   Or set TOKEN_ID environment variable");
    process.exit(1);
  }
  
  console.log(`\n🔍 Verifying price sync for token: ${tokenId}\n`);
  
  const deployments = await getTokenDeployments(tokenId);
  
  if (deployments.length === 0) {
    console.error("❌ No deployments found");
    process.exit(1);
  }
  
  console.log(`Found ${deployments.length} deployments\n`);
  
  const results: any[] = [];
  
  for (const dep of deployments) {
    if (!dep.curve_address || !dep.token_address || dep.status !== 'deployed') {
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
    console.log(`Curve: ${dep.curve_address}`);
    console.log(`Token: ${dep.token_address}\n`);
    
    const result = await checkBondingCurve(config, dep.curve_address, dep.token_address);
    
    const status = result.configured ? "✅" : "❌";
    console.log(`${status} Configured: ${result.configured ? "Yes" : "No"}`);
    console.log(`   useGlobalSupply: ${result.useGlobalSupply ? "✅" : "❌"}`);
    console.log(`   Authorized: ${result.authorized ? "✅" : "❌"}`);
    console.log(`   Price: $${(parseFloat(result.price || "0") * 3000).toFixed(6)}`);
    console.log(`   Local Supply: ${result.localSupply || "0"}`);
    console.log(`   Global Supply: ${result.globalSupply || "0"}`);
    
    if (result.issues && result.issues.length > 0) {
      console.log(`\n   Issues:`);
      result.issues.forEach(issue => console.log(`      - ${issue}`));
    }
    
    results.push({
      chain: config.name,
      ...result,
    });
    
    console.log("");
  }
  
  // Summary
  console.log(`${'='.repeat(60)}`);
  console.log("SUMMARY");
  console.log(`${'='.repeat(60)}\n`);
  
  const allConfigured = results.every(r => r.configured);
  const prices = results.map(r => parseFloat(r.price || "0"));
  const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
  const variance = prices.length > 1
    ? Math.sqrt(prices.reduce((sum, p) => sum + Math.pow(p - avgPrice, 2), 0) / prices.length) / avgPrice * 100
    : 0;
  
  console.log(`Configuration: ${allConfigured ? "✅ All configured" : "❌ Needs fixing"}`);
  console.log(`Price Variance: ${variance.toFixed(2)}%`);
  console.log(`Prices: ${prices.map(p => `$${(p * 3000).toFixed(6)}`).join(", ")}\n`);
  
  if (!allConfigured) {
    console.log("To fix, run:");
    console.log(`  TOKEN_ID=${tokenId} npx hardhat run scripts/fix-all-chains-for-token.ts`);
  }
}

main().catch(console.error);



