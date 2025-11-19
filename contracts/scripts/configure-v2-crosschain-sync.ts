/**
 * Configure GlobalSupplyTrackerV2 with cross-chain sync
 * This enables automatic supply synchronization across chains
 * 
 * Usage:
 *   npx ts-node scripts/configure-v2-crosschain-sync.ts
 */

import { ethers } from "ethers";
import * as dotenv from "dotenv";

dotenv.config();

interface ChainConfig {
  name: string;
  rpcUrl: string;
  globalSupplyTrackerV2: string;
  crossChainSync: string;
  chainEID: number;
  chainName: string;
}

const CHAIN_CONFIGS: Record<string, ChainConfig> = {
  'base-sepolia': {
    name: "Base Sepolia",
    rpcUrl: process.env.RPC_URL_BASE_SEPOLIA || "https://base-sepolia-rpc.publicnode.com",
    globalSupplyTrackerV2: process.env.GLOBAL_SUPPLY_TRACKER_V2_BASE_SEPOLIA || "0x7aDD63A32854b5b44091B56e5c37B09Ec32e215C",
    crossChainSync: process.env.CROSS_CHAIN_SYNC_BASE_SEPOLIA || process.env.CROSS_CHAIN_SYNC_BASESEPOLIA || "0x39fB28323572610eC0Df1EF075f4acDD51f77e2E",
    chainEID: 40245,
    chainName: "base-sepolia",
  },
  'bsc-testnet': {
    name: "BSC Testnet",
    rpcUrl: process.env.RPC_URL_BSC_TESTNET || "https://bsc-testnet.publicnode.com",
    globalSupplyTrackerV2: process.env.GLOBAL_SUPPLY_TRACKER_V2_BSC_TESTNET || "0xc443F7e5F0e62C4803030E938d5Cc762F0829A02",
    crossChainSync: process.env.CROSS_CHAIN_SYNC_BSC_TESTNET || process.env.CROSS_CHAIN_SYNC_BSCTESTNET || "0xf5446E2690B2eb161231fB647476A98e1b6b7736",
    chainEID: 40102,
    chainName: "bsc-testnet",
  },
  'sepolia': {
    name: "Sepolia",
    rpcUrl: process.env.RPC_URL_SEPOLIA || "https://ethereum-sepolia-rpc.publicnode.com",
    globalSupplyTrackerV2: process.env.GLOBAL_SUPPLY_TRACKER_V2_SEPOLIA || "0xc443F7e5F0e62C4803030E938d5Cc762F0829A02",
    crossChainSync: process.env.CROSS_CHAIN_SYNC_SEPOLIA || "0x1eC9ee96EbD41111ad7b99f29D9a61e46b721C65",
    chainEID: 40161,
    chainName: "sepolia",
  },
};

async function configureV2(
  config: ChainConfig,
  ownerPrivateKey: string
): Promise<{ success: boolean; message: string }> {
  const provider = new ethers.JsonRpcProvider(config.rpcUrl);
  const wallet = new ethers.Wallet(ownerPrivateKey.replace(/^0x/, ''), provider);
  
  const trackerABI = [
    "function owner() external view returns (address)",
    "function crossChainEnabled() external view returns (bool)",
    "function crossChainSync() external view returns (address)",
    "function currentChainEID() external view returns (uint32)",
    "function getChainEID(string memory) external view returns (uint32)",
    "function setCrossChainSync(address) external",
    "function setCurrentChainEID(uint32) external",
    "function setChainEID(string memory, uint32) external",
    "function setMinFeeReserve(uint256) external",
  ];
  
  try {
    const tracker = new ethers.Contract(config.globalSupplyTrackerV2, trackerABI, wallet);
    
    // Verify wallet is owner
    const owner = await tracker.owner();
    if (owner.toLowerCase() !== wallet.address.toLowerCase()) {
      return {
        success: false,
        message: `Wallet ${wallet.address} is not the owner of GlobalSupplyTrackerV2 (owner: ${owner})`,
      };
    }
    
    // Check current configuration
    const currentEnabled = await tracker.crossChainEnabled();
    const currentSync = await tracker.crossChainSync();
    const currentEID = await tracker.currentChainEID();
    
    console.log(`   Current Cross-Chain Enabled: ${currentEnabled}`);
    console.log(`   Current Cross-Chain Sync: ${currentSync}`);
    console.log(`   Current Chain EID: ${currentEID}`);
    console.log(`   Target Cross-Chain Sync: ${config.crossChainSync}`);
    console.log(`   Target Chain EID: ${config.chainEID}\n`);
    
    const steps: string[] = [];
    
    // Step 1: Set cross-chain sync address
    if (currentSync.toLowerCase() !== config.crossChainSync.toLowerCase()) {
      console.log(`   🔧 Step 1: Setting cross-chain sync address...`);
      const tx1 = await tracker.setCrossChainSync(config.crossChainSync);
      console.log(`   ⏳ Transaction sent: ${tx1.hash}`);
      await tx1.wait();
      console.log(`   ✅ Transaction confirmed`);
      steps.push(`Set cross-chain sync: ${tx1.hash}`);
    } else {
      console.log(`   ✅ Cross-chain sync address already configured`);
      steps.push("Cross-chain sync address already set");
    }
    
    // Step 2: Set current chain EID
    if (currentEID !== config.chainEID) {
      console.log(`   🔧 Step 2: Setting current chain EID...`);
      const tx2 = await tracker.setCurrentChainEID(config.chainEID);
      console.log(`   ⏳ Transaction sent: ${tx2.hash}`);
      await tx2.wait();
      console.log(`   ✅ Transaction confirmed`);
      steps.push(`Set chain EID: ${tx2.hash}`);
    } else {
      console.log(`   ✅ Chain EID already configured`);
      steps.push("Chain EID already set");
    }
    
    // Step 3: Set chain EID mapping
    console.log(`   🔧 Step 3: Setting chain EID mapping...`);
    const tx3 = await tracker.setChainEID(config.chainName, config.chainEID);
    console.log(`   ⏳ Transaction sent: ${tx3.hash}`);
    await tx3.wait();
    console.log(`   ✅ Transaction confirmed`);
    steps.push(`Set chain EID mapping: ${tx3.hash}`);
    
    // Step 4: Set minimum fee reserve (0.001 ETH for cross-chain messages)
    console.log(`   🔧 Step 4: Setting minimum fee reserve...`);
    const minFeeReserve = ethers.parseEther("0.001");
    const tx4 = await tracker.setMinFeeReserve(minFeeReserve);
    console.log(`   ⏳ Transaction sent: ${tx4.hash}`);
    await tx4.wait();
    console.log(`   ✅ Transaction confirmed`);
    steps.push(`Set min fee reserve: ${tx4.hash}`);
    
    // Verify configuration
    const finalEnabled = await tracker.crossChainEnabled();
    const finalSync = await tracker.crossChainSync();
    const finalEID = await tracker.currentChainEID();
    
    console.log(`\n   ✅ Final Configuration:`);
    console.log(`      Cross-Chain Enabled: ${finalEnabled}`);
    console.log(`      Cross-Chain Sync: ${finalSync}`);
    console.log(`      Chain EID: ${finalEID}`);
    
    if (finalEnabled && finalSync.toLowerCase() === config.crossChainSync.toLowerCase()) {
      return {
        success: true,
        message: `Configuration complete. Steps: ${steps.join(', ')}`,
      };
    } else {
      return {
        success: false,
        message: `Configuration incomplete. Enabled: ${finalEnabled}, Sync: ${finalSync}`,
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
  const ownerPrivateKey = process.env.PRIVATE_KEY || process.env.ETHEREUM_PRIVATE_KEY;
  
  if (!ownerPrivateKey) {
    console.error("❌ ERROR: PRIVATE_KEY or ETHEREUM_PRIVATE_KEY not found!");
    process.exit(1);
  }
  
  console.log(`\n🔧 Configuring GlobalSupplyTrackerV2 for cross-chain sync...\n`);
  
  const results: Array<{ chain: string; success: boolean; message: string }> = [];
  
  for (const [chainKey, config] of Object.entries(CHAIN_CONFIGS)) {
    console.log(`${'='.repeat(60)}`);
    console.log(`${config.name}`);
    console.log(`${'='.repeat(60)}\n`);
    
    const result = await configureV2(config, ownerPrivateKey);
    
    const resultStatus = result.success ? "✅" : "❌";
    console.log(`\n${resultStatus} ${result.message}\n`);
    
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
  
  console.log(`✅ Successfully configured: ${successCount}`);
  console.log(`❌ Failed: ${failCount}\n`);
  
  if (failCount > 0) {
    console.log("Failed chains:");
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.chain}: ${r.message}`);
    });
  }
  
  if (successCount > 0) {
    console.log("\n✅ GlobalSupplyTrackerV2 is now configured for cross-chain sync!");
    console.log("   When supply updates on one chain, it will automatically sync to all other chains.");
    console.log("   Prices will stay synchronized across all chains in real-time!");
  }
}

main().catch(console.error);

