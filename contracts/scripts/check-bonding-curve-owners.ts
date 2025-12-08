/**
 * Check bonding curve owners for a token
 * 
 * Usage:
 *   TOKEN_ID=<tokenId> npx ts-node scripts/check-bonding-curve-owners.ts
 */

import { ethers } from "ethers";
import * as dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const API_BASE = process.env.API_BASE_URL || "https://crossify-platform-production.up.railway.app/api";

interface ChainConfig {
  name: string;
  rpcUrl: string;
}

const CHAIN_CONFIGS: Record<string, ChainConfig> = {
  'base-sepolia': {
    name: "Base Sepolia",
    rpcUrl: process.env.RPC_URL_BASE_SEPOLIA || "https://base-sepolia-rpc.publicnode.com",
  },
  'bsc-testnet': {
    name: "BSC Testnet",
    rpcUrl: process.env.RPC_URL_BSC_TESTNET || "https://bsc-testnet.publicnode.com",
  },
  'sepolia': {
    name: "Sepolia",
    rpcUrl: process.env.RPC_URL_SEPOLIA || "https://ethereum-sepolia-rpc.publicnode.com",
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

async function checkCurveOwner(config: ChainConfig, curveAddress: string) {
  const provider = new ethers.JsonRpcProvider(config.rpcUrl);
  
  const bondingCurveABI = [
    "function owner() external view returns (address)",
  ];
  
  try {
    const curveContract = new ethers.Contract(curveAddress, bondingCurveABI, provider);
    const owner = await curveContract.owner();
    return owner;
  } catch (error: any) {
    return null;
  }
}

async function main() {
  const tokenId = process.env.TOKEN_ID;
  
  if (!tokenId) {
    console.error("❌ ERROR: TOKEN_ID environment variable not set");
    process.exit(1);
  }
  
  console.log(`\n🔍 Checking bonding curve owners for token: ${tokenId}\n`);
  
  const deployments = await getTokenDeployments(tokenId);
  
  if (deployments.length === 0) {
    console.error("❌ No deployments found");
    process.exit(1);
  }
  
  // Check available private keys
  const availableKeys: Record<string, string> = {};
  if (process.env.PRIVATE_KEY) {
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY.replace(/^0x/, ''));
    availableKeys[wallet.address.toLowerCase()] = "PRIVATE_KEY";
  }
  if (process.env.ETHEREUM_PRIVATE_KEY) {
    const wallet = new ethers.Wallet(process.env.ETHEREUM_PRIVATE_KEY.replace(/^0x/, ''));
    availableKeys[wallet.address.toLowerCase()] = "ETHEREUM_PRIVATE_KEY";
  }
  if (process.env.PRIVATE_KEY_BASE_SEPOLIA) {
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY_BASE_SEPOLIA.replace(/^0x/, ''));
    availableKeys[wallet.address.toLowerCase()] = "PRIVATE_KEY_BASE_SEPOLIA";
  }
  if (process.env.PRIVATE_KEY_BSC_TESTNET) {
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY_BSC_TESTNET.replace(/^0x/, ''));
    availableKeys[wallet.address.toLowerCase()] = "PRIVATE_KEY_BSC_TESTNET";
  }
  if (process.env.PRIVATE_KEY_SEPOLIA) {
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY_SEPOLIA.replace(/^0x/, ''));
    availableKeys[wallet.address.toLowerCase()] = "PRIVATE_KEY_SEPOLIA";
  }
  
  console.log(`Available private keys (${Object.keys(availableKeys).length}):`);
  Object.entries(availableKeys).forEach(([addr, key]) => {
    console.log(`  ${key}: ${addr}`);
  });
  console.log();
  
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
    const owner = await checkCurveOwner(config, curveAddress);
    
    console.log(`${'='.repeat(60)}`);
    console.log(`${config.name}`);
    console.log(`${'='.repeat(60)}`);
    console.log(`Curve: ${curveAddress}`);
    console.log(`Token: ${tokenAddress}`);
    console.log(`Owner: ${owner || 'Unknown'}`);
    
    if (owner && availableKeys[owner.toLowerCase()]) {
      console.log(`✅ We have the private key: ${availableKeys[owner.toLowerCase()]}`);
    } else if (owner) {
      console.log(`❌ We don't have the private key for this owner`);
    }
    console.log();
  }
}

main().catch(console.error);








