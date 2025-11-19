/**
 * Verify price sync configuration for all tokens with multiple deployments
 * 
 * Usage:
 *   npx hardhat run scripts/verify-all-tokens-price-sync.ts --network baseSepolia
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
}

const CHAIN_CONFIGS: Record<string, ChainConfig> = {
  baseSepolia: {
    name: "Base Sepolia",
    network: "baseSepolia",
    rpcUrl: process.env.RPC_URL_BASE_SEPOLIA || "https://base-sepolia-rpc.publicnode.com",
    globalSupplyTracker: process.env.GLOBAL_SUPPLY_TRACKER_BASE_SEPOLIA || "0x1eC9ee96EbD41111ad7b99f29D9a61e46b721C65",
  },
  bscTestnet: {
    name: "BSC Testnet",
    network: "bscTestnet",
    rpcUrl: process.env.RPC_URL_BSC_TESTNET || "https://bsc-testnet.publicnode.com",
    globalSupplyTracker: process.env.GLOBAL_SUPPLY_TRACKER_BSC_TESTNET || "0xe84Ae64735261F441e0bcB12bCf60630c5239ef4",
  },
  sepolia: {
    name: "Sepolia",
    network: "sepolia",
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

async function checkBondingCurve(
  config: ChainConfig,
  curveAddress: string,
  tokenAddress: string
): Promise<{
  configured: boolean;
  useGlobalSupply: boolean;
  authorized: boolean;
  price: string;
  localSupply: string;
  globalSupply: string;
  issues: string[];
}> {
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
  let useGlobalSupply = false;
  let authorized = false;
  let price = "0";
  let localSupply = "0";
  let globalSupply = "0";
  
  try {
    const curveContract = new ethers.Contract(curveAddress, bondingCurveABI, provider);
    const trackerAddress = await curveContract.globalSupplyTracker();
    useGlobalSupply = await curveContract.useGlobalSupply();
    
    if (trackerAddress === ethers.ZeroAddress) {
      issues.push("GlobalSupplyTracker not set");
    } else if (trackerAddress.toLowerCase() !== config.globalSupplyTracker.toLowerCase()) {
      issues.push(`Wrong tracker address: ${trackerAddress} (expected ${config.globalSupplyTracker})`);
    } else {
      const trackerContract = new ethers.Contract(config.globalSupplyTracker, trackerABI, provider);
      authorized = await trackerContract.isAuthorized(curveAddress);
      globalSupply = ethers.formatEther(await trackerContract.getGlobalSupply(tokenAddress));
      
      if (!authorized) {
        issues.push("Not authorized in GlobalSupplyTracker");
      }
    }
    
    if (!useGlobalSupply) {
      issues.push("useGlobalSupply is disabled");
    }
    
    const currentPrice = await curveContract.getCurrentPrice();
    price = ethers.formatEther(currentPrice);
    localSupply = ethers.formatEther(await curveContract.totalSupplySold());
    
  } catch (error: any) {
    issues.push(`Error: ${error.message}`);
  }
  
  return {
    configured: issues.length === 0,
    useGlobalSupply,
    authorized,
    price,
    localSupply,
    globalSupply,
    issues,
  };
}

async function main() {
  console.log("\n🔍 Verifying price sync for all tokens...\n");
  
  // Get all tokens
  const tokens = await getAllTokens();
  console.log(`Found ${tokens.length} tokens\n`);
  
  // Filter tokens with multiple deployments
  const multiChainTokens = tokens.filter((token: any) => {
    const deployments = token.deployments || [];
    return deployments.length > 1 && deployments.some((d: any) => d.status === 'deployed');
  });
  
  console.log(`Tokens with multiple deployments: ${multiChainTokens.length}\n`);
  
  if (multiChainTokens.length === 0) {
    console.log("No tokens with multiple deployments found.");
    return;
  }
  
  const results: Array<{
    tokenId: string;
    tokenName: string;
    chains: Array<{
      chain: string;
      configured: boolean;
      price: string;
      issues: string[];
    }>;
    allConfigured: boolean;
    pricesMatch: boolean;
  }> = [];
  
  // Check each token
  for (const token of multiChainTokens.slice(0, 10)) { // Limit to first 10 for now
    const tokenId = token.id;
    const tokenName = token.name || token.symbol || tokenId;
    const deployments = (token.deployments || []).filter((d: any) => d.status === 'deployed');
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Token: ${tokenName} (${tokenId.substring(0, 8)}...)`);
    console.log(`${'='.repeat(60)}\n`);
    
    const chainResults: Array<{
      chain: string;
      configured: boolean;
      price: string;
      issues: string[];
    }> = [];
    
    for (const dep of deployments) {
      if (!dep.curve_address || !dep.token_address) continue;
      
      const chainKey = dep.chain?.toLowerCase().includes('base-sepolia') ? 'baseSepolia' :
                      dep.chain?.toLowerCase().includes('bsc-testnet') ? 'bscTestnet' :
                      dep.chain?.toLowerCase().includes('sepolia') ? 'sepolia' : null;
      
      if (!chainKey || !CHAIN_CONFIGS[chainKey]) {
        console.warn(`⚠️  Unknown chain: ${dep.chain}`);
        continue;
      }
      
      const config = CHAIN_CONFIGS[chainKey];
      console.log(`Checking ${config.name}...`);
      
      const result = await checkBondingCurve(
        config,
        dep.curve_address,
        dep.token_address
      );
      
      const status = result.configured ? "✅" : "❌";
      console.log(`   ${status} Price: $${(parseFloat(result.price) * 3000).toFixed(6)}`);
      console.log(`   ${status} Configured: ${result.configured ? "Yes" : "No"}`);
      
      if (result.issues.length > 0) {
        console.log(`   Issues:`);
        result.issues.forEach(issue => console.log(`      - ${issue}`));
      }
      
      chainResults.push({
        chain: config.name,
        configured: result.configured,
        price: result.price,
        issues: result.issues,
      });
    }
    
    const allConfigured = chainResults.every(r => r.configured);
    const prices = chainResults.map(r => parseFloat(r.price));
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    const variance = prices.length > 1
      ? Math.sqrt(prices.reduce((sum, p) => sum + Math.pow(p - avgPrice, 2), 0) / prices.length) / avgPrice * 100
      : 0;
    const pricesMatch = variance < 0.5;
    
    results.push({
      tokenId,
      tokenName,
      chains: chainResults,
      allConfigured,
      pricesMatch,
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
        console.log(`    → Run fix scripts for chains with issues`);
      }
      if (!token.pricesMatch) {
        console.log(`    → Prices need to sync`);
      }
    }
    
    console.log(`\nTo fix, run:`);
    console.log(`  npx hardhat run scripts/fix-bonding-curve-config.ts --network <network>`);
    console.log(`  npx hardhat run scripts/initialize-global-supply.ts --network <network>`);
  }
}

main().catch(console.error);






