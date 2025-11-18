/**
 * Standalone script to verify price sync for all tokens
 * Doesn't require Hardhat config - uses environment variables directly
 * 
 * Usage:
 *   npx ts-node scripts/verify-all-tokens-standalone.ts
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

async function getAllTokens(): Promise<any[]> {
  try {
    const response = await axios.get(`${API_BASE}/tokens/marketplace`);
    return response.data.tokens || [];
  } catch (error: any) {
    console.error("❌ Failed to fetch tokens:", error.message);
    return [];
  }
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
    "function authorizedUpdaters(address updater) external view returns (bool)",
  ];
  
  const issues: string[] = [];
  
  try {
    const curveContract = new ethers.Contract(curveAddress, bondingCurveABI, provider);
    const trackerContract = new ethers.Contract(config.globalSupplyTracker, trackerABI, provider);
    
    const trackerAddress = await curveContract.globalSupplyTracker();
    const useGlobalSupply = await curveContract.useGlobalSupply();
    const isAuthorized = await trackerContract.authorizedUpdaters(curveAddress);
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
  console.log("\n🔍 Verifying price sync for all tokens...\n");
  
  // Get all tokens
  const tokens = await getAllTokens();
  console.log(`Found ${tokens.length} tokens\n`);
  
  if (tokens.length === 0) {
    console.log("No tokens found.");
    return;
  }
  
  // Filter tokens with multiple deployments
  // The marketplace API returns deployments in token.deployments array
  const multiChainTokens = tokens.filter((token: any) => {
    const deployments = token.deployments || [];
    const deployedChains = deployments.filter((d: any) => 
      d.status === 'deployed' && d.curveAddress && d.tokenAddress
    );
    return deployedChains.length > 1;
  }).map((token: any) => ({
    ...token,
    deployments: (token.deployments || []).filter((d: any) => 
      d.status === 'deployed' && d.curveAddress && d.tokenAddress
    ),
  }));
  
  console.log(`Tokens with multiple deployments: ${multiChainTokens.length}\n`);
  
  if (multiChainTokens.length === 0) {
    console.log("No tokens with multiple deployments found.");
    return;
  }
  
  const results: any[] = [];
  
  // Check each token (limit to first 10 for now)
  for (const token of multiChainTokens.slice(0, 10)) {
    const tokenId = token.id;
    const tokenName = token.name || token.symbol || tokenId;
    const deployments = token.deployments || [];
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Token: ${tokenName} (${tokenId.substring(0, 8)}...)`);
    console.log(`${'='.repeat(60)}\n`);
    
    const chainResults: any[] = [];
    
    for (const dep of deployments) {
      if (!dep.curveAddress || !dep.tokenAddress) continue;
      
      const chainKey = dep.chain?.toLowerCase().includes('base-sepolia') ? 'base-sepolia' :
                      dep.chain?.toLowerCase().includes('bsc-testnet') ? 'bsc-testnet' :
                      dep.chain?.toLowerCase().includes('sepolia') ? 'sepolia' : null;
      
      if (!chainKey || !CHAIN_CONFIGS[chainKey]) {
        console.warn(`⚠️  Unknown chain: ${dep.chain}`);
        continue;
      }
      
      const config = CHAIN_CONFIGS[chainKey];
      console.log(`Checking ${config.name}...`);
      
      const result = await checkBondingCurve(
        config,
        dep.curveAddress,
        dep.tokenAddress
      );
      
      const status = result.configured ? "✅" : "❌";
      console.log(`   ${status} Price: $${(parseFloat(result.price || "0") * 3000).toFixed(6)}`);
      console.log(`   ${status} Configured: ${result.configured ? "Yes" : "No"}`);
      console.log(`   useGlobalSupply: ${result.useGlobalSupply ? "✅" : "❌"}`);
      console.log(`   Authorized: ${result.authorized ? "✅" : "❌"}`);
      console.log(`   Local Supply: ${result.localSupply || "0"}`);
      console.log(`   Global Supply: ${result.globalSupply || "0"}`);
      
      if (result.issues && result.issues.length > 0) {
        console.log(`   Issues:`);
        result.issues.forEach(issue => console.log(`      - ${issue}`));
      }
      
      chainResults.push({
        chain: config.name,
        ...result,
      });
    }
    
    const allConfigured = chainResults.every(r => r.configured);
    const prices = chainResults.map(r => parseFloat(r.price || "0"));
    const avgPrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
    const variance = prices.length > 1
      ? Math.sqrt(prices.reduce((sum, p) => sum + Math.pow(p - avgPrice, 2), 0) / prices.length) / (avgPrice || 1) * 100
      : 0;
    const pricesMatch = variance < 0.5;
    
    results.push({
      tokenId,
      tokenName,
      chains: chainResults,
      allConfigured,
      pricesMatch,
      variance,
    });
    
    if (!allConfigured || !pricesMatch) {
      console.log(`\n⚠️  Issues found for ${tokenName}`);
      if (!allConfigured) {
        console.log(`   - Some chains not configured correctly`);
      }
      if (!pricesMatch) {
        console.log(`   - Price variance: ${variance.toFixed(2)}%`);
      }
    } else {
      console.log(`\n✅ ${tokenName} is properly configured and synced!`);
    }
  }
  
  // Summary
  console.log(`\n${'='.repeat(60)}`);
  console.log("SUMMARY");
  console.log(`${'='.repeat(60)}\n`);
  
  const allGood = results.filter(r => r.allConfigured && r.pricesMatch);
  const needsFix = results.filter(r => !r.allConfigured || !r.pricesMatch);
  
  console.log(`✅ Properly configured: ${allGood.length}`);
  console.log(`❌ Needs fixing: ${needsFix.length}\n`);
  
  if (needsFix.length > 0) {
    console.log("Tokens that need fixing:\n");
    for (const token of needsFix) {
      console.log(`  - ${token.tokenName} (${token.tokenId.substring(0, 8)}...)`);
      if (!token.allConfigured) {
        console.log(`    → Run: TOKEN_ID=${token.tokenId} npx ts-node scripts/verify-price-sync-standalone.ts ${token.tokenId}`);
        console.log(`    → Then: TOKEN_ID=${token.tokenId} npx hardhat run scripts/fix-all-chains-for-token.ts`);
      }
      if (!token.pricesMatch) {
        console.log(`    → Price variance: ${token.variance.toFixed(2)}%`);
      }
    }
  }
}

main().catch(console.error);

