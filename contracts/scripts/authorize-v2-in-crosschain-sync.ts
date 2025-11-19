/**
 * Authorize GlobalSupplyTrackerV2 in CrossChainSync contracts
 * This allows V2 to send cross-chain supply updates
 * 
 * Usage:
 *   npx ts-node scripts/authorize-v2-in-crosschain-sync.ts
 */

import { ethers } from "ethers";
import * as dotenv from "dotenv";

dotenv.config();

interface ChainConfig {
  name: string;
  rpcUrl: string;
  globalSupplyTrackerV2: string;
  crossChainSync: string;
}

const CHAIN_CONFIGS: Record<string, ChainConfig> = {
  'base-sepolia': {
    name: "Base Sepolia",
    rpcUrl: process.env.RPC_URL_BASE_SEPOLIA || "https://base-sepolia-rpc.publicnode.com",
    globalSupplyTrackerV2: process.env.GLOBAL_SUPPLY_TRACKER_V2_BASE_SEPOLIA || "0x7aDD63A32854b5b44091B56e5c37B09Ec32e215C",
    crossChainSync: process.env.CROSS_CHAIN_SYNC_BASE_SEPOLIA || process.env.CROSS_CHAIN_SYNC_BASESEPOLIA || "0x39fB28323572610eC0Df1EF075f4acDD51f77e2E",
  },
  'bsc-testnet': {
    name: "BSC Testnet",
    rpcUrl: process.env.RPC_URL_BSC_TESTNET || "https://bsc-testnet.publicnode.com",
    globalSupplyTrackerV2: process.env.GLOBAL_SUPPLY_TRACKER_V2_BSC_TESTNET || "0xc443F7e5F0e62C4803030E938d5Cc762F0829A02",
    crossChainSync: process.env.CROSS_CHAIN_SYNC_BSC_TESTNET || process.env.CROSS_CHAIN_SYNC_BSCTESTNET || "0xf5446E2690B2eb161231fB647476A98e1b6b7736",
  },
  'sepolia': {
    name: "Sepolia",
    rpcUrl: process.env.RPC_URL_SEPOLIA || "https://ethereum-sepolia-rpc.publicnode.com",
    globalSupplyTrackerV2: process.env.GLOBAL_SUPPLY_TRACKER_V2_SEPOLIA || "0xc443F7e5F0e62C4803030E938d5Cc762F0829A02",
    crossChainSync: process.env.CROSS_CHAIN_SYNC_SEPOLIA || "0x1eC9ee96EbD41111ad7b99f29D9a61e46b721C65",
  },
};

async function authorizeV2(
  config: ChainConfig,
  ownerPrivateKey: string
): Promise<{ success: boolean; message: string }> {
  const provider = new ethers.JsonRpcProvider(config.rpcUrl);
  const wallet = new ethers.Wallet(ownerPrivateKey.replace(/^0x/, ''), provider);
  
  const syncABI = [
    "function owner() external view returns (address)",
    "function authorizedTokens(address) external view returns (bool)",
    "function authorizeAddress(address) external",
  ];
  
  try {
    const sync = new ethers.Contract(config.crossChainSync, syncABI, wallet);
    
    // Verify wallet is owner
    const owner = await sync.owner();
    if (owner.toLowerCase() !== wallet.address.toLowerCase()) {
      return {
        success: false,
        message: `Wallet ${wallet.address} is not the owner of CrossChainSync (owner: ${owner})`,
      };
    }
    
    // Check if already authorized
    const isAuthorized = await sync.authorizedTokens(config.globalSupplyTrackerV2);
    if (isAuthorized) {
      return {
        success: true,
        message: "Already authorized",
      };
    }
    
    // Authorize
    console.log(`   🔧 Authorizing GlobalSupplyTrackerV2...`);
    const tx = await sync.authorizeAddress(config.globalSupplyTrackerV2);
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
  // CrossChainSync is owned by a different wallet (0x78B056f4cFb69bE85E52850000902eB0B5b418BC)
  // Try to get the owner's private key from environment
  const ownerPrivateKey = process.env.CROSS_CHAIN_SYNC_OWNER_PRIVATE_KEY || 
                          process.env.GLOBAL_SUPPLY_TRACKER_OWNER_PRIVATE_KEY ||
                          process.env.PRIVATE_KEY || 
                          process.env.ETHEREUM_PRIVATE_KEY;
  
  if (!ownerPrivateKey) {
    console.error("❌ ERROR: Private key not found!");
    console.error("   CrossChainSync contracts are owned by wallet 0x78B056f4cFb69bE85E52850000902eB0B5b418BC");
    console.error("   Set CROSS_CHAIN_SYNC_OWNER_PRIVATE_KEY or GLOBAL_SUPPLY_TRACKER_OWNER_PRIVATE_KEY");
    process.exit(1);
  }
  
  console.log(`\n🔧 Authorizing GlobalSupplyTrackerV2 in CrossChainSync...\n`);
  
  const results: Array<{ chain: string; success: boolean; message: string }> = [];
  
  for (const [chainKey, config] of Object.entries(CHAIN_CONFIGS)) {
    console.log(`${'='.repeat(60)}`);
    console.log(`${config.name}`);
    console.log(`${'='.repeat(60)}`);
    console.log(`V2: ${config.globalSupplyTrackerV2}`);
    console.log(`CrossChainSync: ${config.crossChainSync}\n`);
    
    const result = await authorizeV2(config, ownerPrivateKey);
    
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
    console.log("✅ GlobalSupplyTrackerV2 is now authorized to send cross-chain messages!");
    console.log("   When supply updates, V2 will automatically sync to all other chains via LayerZero.");
  }
}

main().catch(console.error);

