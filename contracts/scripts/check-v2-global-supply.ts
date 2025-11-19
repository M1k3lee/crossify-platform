/**
 * Check global supply in GlobalSupplyTrackerV2 for a token
 */

import { ethers } from "ethers";
import * as dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const API_BASE = process.env.API_BASE_URL || "https://crossify-platform-production.up.railway.app/api";

const CHAIN_CONFIGS = {
  'base-sepolia': {
    name: "Base Sepolia",
    rpcUrl: process.env.RPC_URL_BASE_SEPOLIA || "https://base-sepolia-rpc.publicnode.com",
    globalSupplyTrackerV2: "0x7aDD63A32854b5b44091B56e5c37B09Ec32e215C",
    tokenIDRegistry: "0x1f1f75d84CB2Ff86ffe2b8Fb3eb0d2e94438433D",
  },
  'bsc-testnet': {
    name: "BSC Testnet",
    rpcUrl: process.env.RPC_URL_BSC_TESTNET || "https://bsc-testnet.publicnode.com",
    globalSupplyTrackerV2: "0xc443F7e5F0e62C4803030E938d5Cc762F0829A02",
    tokenIDRegistry: "0x4f3854445c33E9cf42b40B0AB36f4Dd58c23331f",
  },
  'sepolia': {
    name: "Sepolia",
    rpcUrl: process.env.RPC_URL_SEPOLIA || "https://ethereum-sepolia-rpc.publicnode.com",
    globalSupplyTrackerV2: "0xc443F7e5F0e62C4803030E938d5Cc762F0829A02",
    tokenIDRegistry: "0x4f3854445c33E9cf42b40B0AB36f4Dd58c23331f",
  },
};

function uuidToBytes32(uuidString: string): string {
  const uuidWithoutDashes = uuidString.replace(/-/g, '');
  const bytes = ethers.toUtf8Bytes(uuidWithoutDashes);
  return ethers.keccak256(bytes);
}

async function main() {
  const tokenId = process.env.TOKEN_ID || "ea23015c-d3c7-40e1-8cb3-94d2cbd813b9";
  const tokenIdBytes32 = uuidToBytes32(tokenId);
  
  console.log(`\n🔍 Checking GlobalSupplyTrackerV2 for token: ${tokenId}`);
  console.log(`   Token ID (bytes32): ${tokenIdBytes32}\n`);
  
  // Check on each chain (they should all show the same global supply)
  for (const [chainKey, config] of Object.entries(CHAIN_CONFIGS)) {
    console.log(`${'='.repeat(60)}`);
    console.log(`${config.name}`);
    console.log(`${'='.repeat(60)}`);
    
    try {
      const provider = new ethers.JsonRpcProvider(config.rpcUrl);
      
      const trackerABI = [
        "function getGlobalSupply(bytes32 tokenId) external view returns (uint256)",
        "function getChainSupply(bytes32 tokenId, string memory chain) external view returns (uint256)",
      ];
      
      const tracker = new ethers.Contract(config.globalSupplyTrackerV2, trackerABI, provider);
      
      const globalSupply = await tracker.getGlobalSupply(tokenIdBytes32);
      const baseSepoliaSupply = await tracker.getChainSupply(tokenIdBytes32, "base-sepolia");
      const sepoliaSupply = await tracker.getChainSupply(tokenIdBytes32, "sepolia");
      const bscSupply = await tracker.getChainSupply(tokenIdBytes32, "bsc-testnet");
      
      console.log(`   Global Supply: ${ethers.formatEther(globalSupply)} tokens`);
      console.log(`   Base Sepolia Supply: ${ethers.formatEther(baseSepoliaSupply)} tokens`);
      console.log(`   Sepolia Supply: ${ethers.formatEther(sepoliaSupply)} tokens`);
      console.log(`   BSC Testnet Supply: ${ethers.formatEther(bscSupply)} tokens`);
      
      const expectedGlobal = baseSepoliaSupply + sepoliaSupply + bscSupply;
      console.log(`   Expected Global (sum): ${ethers.formatEther(expectedGlobal)} tokens`);
      
      if (globalSupply === expectedGlobal) {
        console.log(`   ✅ Global supply matches sum of all chains!`);
      } else {
        console.log(`   ⚠️  Global supply mismatch! Expected: ${ethers.formatEther(expectedGlobal)}, Actual: ${ethers.formatEther(globalSupply)}`);
      }
      
    } catch (error: any) {
      console.error(`   ❌ Error: ${error.message}`);
    }
    
    console.log();
  }
}

main().catch(console.error);

