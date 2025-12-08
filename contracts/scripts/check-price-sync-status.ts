/**
 * Check price sync status for a token across all chains
 * Verifies:
 * 1. Bonding curves have useGlobalSupply enabled
 * 2. Bonding curves are authorized in GlobalSupplyTracker
 * 3. GlobalSupplyTracker has correct global supply
 * 4. Actual prices from contracts match expected global price
 */

import { ethers } from "hardhat";
import hre from "hardhat";
import axios from "axios";

const API_BASE = process.env.API_BASE_URL || "http://localhost:8080/api";

interface ChainConfig {
  name: string;
  rpcUrl: string;
  globalSupplyTracker: string;
  crossChainSync: string;
}

const CHAIN_CONFIGS: Record<string, ChainConfig> = {
  baseSepolia: {
    name: "Base Sepolia",
    rpcUrl: process.env.RPC_URL_BASE_SEPOLIA || "https://base-sepolia-rpc.publicnode.com",
    globalSupplyTracker: process.env.GLOBAL_SUPPLY_TRACKER_BASE_SEPOLIA || "",
    crossChainSync: process.env.CROSS_CHAIN_SYNC_BASE_SEPOLIA || "",
  },
  bscTestnet: {
    name: "BSC Testnet",
    rpcUrl: process.env.RPC_URL_BSC_TESTNET || "https://bsc-testnet.publicnode.com",
    globalSupplyTracker: process.env.GLOBAL_SUPPLY_TRACKER_BSC_TESTNET || "",
    crossChainSync: process.env.CROSS_CHAIN_SYNC_BSC_TESTNET || "",
  },
  sepolia: {
    name: "Sepolia",
    rpcUrl: process.env.RPC_URL_SEPOLIA || "https://ethereum-sepolia-rpc.publicnode.com",
    globalSupplyTracker: process.env.GLOBAL_SUPPLY_TRACKER_SEPOLIA || "",
    crossChainSync: process.env.CROSS_CHAIN_SYNC_SEPOLIA || "",
  },
};

async function getTokenDeployments(tokenId: string) {
  try {
    const response = await axios.get(`${API_BASE}/tokens/${tokenId}/status`);
    return response.data.deployments || [];
  } catch (error) {
    console.error("❌ Failed to fetch token deployments:", error);
    return [];
  }
}

async function checkBondingCurve(
  chainName: string,
  config: ChainConfig,
  curveAddress: string,
  tokenAddress: string
) {
  const provider = new ethers.JsonRpcProvider(config.rpcUrl);
  
  // Bonding Curve ABI
  const bondingCurveABI = [
    "function useGlobalSupply() external view returns (bool)",
    "function globalSupplyTracker() external view returns (address)",
    "function getCurrentPrice() external view returns (uint256)",
    "function totalSupplySold() external view returns (uint256)",
    "function basePrice() external view returns (uint256)",
    "function slope() external view returns (uint256)",
  ];
  
  // GlobalSupplyTracker ABI
  const trackerABI = [
    "function getGlobalSupply(address token) external view returns (uint256)",
    "function isAuthorized(address updater) external view returns (bool)",
    "function getChainSupply(address token, string memory chainName) external view returns (uint256)",
  ];
  
  try {
    const curveContract = new ethers.Contract(curveAddress, bondingCurveABI, provider);
    const trackerContract = new ethers.Contract(config.globalSupplyTracker, trackerABI, provider);
    
    // Check configuration
    const useGlobalSupply = await curveContract.useGlobalSupply();
    const trackerAddress = await curveContract.globalSupplyTracker();
    const isAuthorized = await trackerContract.isAuthorized(curveAddress);
    
    // Get supply and prices
    const localSupply = await curveContract.totalSupplySold();
    const globalSupply = await trackerContract.getGlobalSupply(tokenAddress);
    const currentPrice = await curveContract.getCurrentPrice();
    const basePrice = await curveContract.basePrice();
    const slope = await curveContract.slope();
    
    // Calculate expected price with global supply
    const supplyInTokens = globalSupply / ethers.parseEther("1");
    const expectedPrice = basePrice + (slope * supplyInTokens);
    
    return {
      chainName,
      curveAddress,
      useGlobalSupply,
      trackerAddress,
      isAuthorized: isAuthorized,
      localSupply: ethers.formatEther(localSupply),
      globalSupply: ethers.formatEther(globalSupply),
      currentPrice: ethers.formatEther(currentPrice),
      expectedPrice: ethers.formatEther(expectedPrice),
      priceMatch: currentPrice.toString() === expectedPrice.toString(),
      configured: useGlobalSupply && trackerAddress.toLowerCase() === config.globalSupplyTracker.toLowerCase() && isAuthorized,
    };
  } catch (error: any) {
    return {
      chainName,
      curveAddress,
      error: error.message,
      configured: false,
    };
  }
}

async function main() {
  const tokenId = process.argv[2];
  
  if (!tokenId) {
    console.error("❌ Usage: npx hardhat run scripts/check-price-sync-status.ts --network <network> <tokenId>");
    process.exit(1);
  }
  
  console.log(`\n🔍 Checking price sync status for token: ${tokenId}\n`);
  
  // Get deployments
  const deployments = await getTokenDeployments(tokenId);
  
  if (deployments.length === 0) {
    console.error("❌ No deployments found for token");
    process.exit(1);
  }
  
  const results: any[] = [];
  
  // Check each chain
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
    const result = await checkBondingCurve(
      config.name,
      config,
      dep.curve_address,
      dep.token_address
    );
    
    results.push(result);
  }
  
  // Display results
  console.log("📊 Price Sync Status:\n");
  
  let allConfigured = true;
  let allPricesMatch = true;
  const prices: number[] = [];
  
  for (const result of results) {
    if (result.error) {
      console.log(`❌ ${result.chainName}: Error - ${result.error}`);
      allConfigured = false;
      continue;
    }
    
    const status = result.configured ? "✅" : "❌";
    const priceStatus = result.priceMatch ? "✅" : "⚠️";
    
    console.log(`${status} ${result.chainName}:`);
    console.log(`   Configured: ${result.configured ? "Yes" : "No"}`);
    if (!result.configured) {
      console.log(`   - useGlobalSupply: ${result.useGlobalSupply}`);
      console.log(`   - Tracker set: ${result.trackerAddress !== ethers.ZeroAddress}`);
      console.log(`   - Authorized: ${result.isAuthorized}`);
    }
    console.log(`   Local Supply: ${result.localSupply}`);
    console.log(`   Global Supply: ${result.globalSupply}`);
    console.log(`   ${priceStatus} Current Price: ${result.currentPrice} ETH`);
    if (!result.priceMatch) {
      console.log(`   ⚠️  Expected Price: ${result.expectedPrice} ETH`);
      allPricesMatch = false;
    }
    console.log("");
    
    if (!result.configured) allConfigured = false;
    prices.push(parseFloat(result.currentPrice));
  }
  
  // Summary
  console.log("📈 Summary:");
  if (allConfigured && allPricesMatch) {
    console.log("✅ All chains are configured correctly and prices match!");
  } else {
    if (!allConfigured) {
      console.log("❌ Some chains are not configured correctly");
      console.log("   Run: npx hardhat run scripts/fix-bonding-curve-config.ts --network <network>");
    }
    if (!allPricesMatch) {
      console.log("⚠️  Prices don't match across chains");
      console.log("   This may indicate:");
      console.log("   - GlobalSupplyTracker not updated");
      console.log("   - Cross-chain messages not received");
      console.log("   - Need to trigger a buy transaction to sync");
    }
  }
  
  // Price variance
  if (prices.length > 1) {
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    const variance = Math.sqrt(
      prices.reduce((sum, p) => sum + Math.pow(p - avgPrice, 2), 0) / prices.length
    ) / avgPrice * 100;
    
    console.log(`\n📊 Price Variance: ${variance.toFixed(2)}%`);
    if (variance > 0.5) {
      console.log("⚠️  High variance detected - prices need to sync");
    } else {
      console.log("✅ Prices are in sync");
    }
  }
}

main().catch(console.error);









