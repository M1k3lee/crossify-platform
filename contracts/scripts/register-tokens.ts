/**
 * Register existing tokens in TokenIDRegistry
 * Converts database UUIDs to bytes32 and registers all token addresses
 * 
 * Usage:
 *   TOKEN_ID_REGISTRY=<address> npx ts-node scripts/register-tokens.ts
 */

import { ethers } from "ethers";
import * as dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const API_BASE = process.env.API_BASE_URL || "https://crossify-platform-production.up.railway.app/api";

interface ChainConfig {
  name: string;
  network: string;
  rpcUrl: string;
  tokenIDRegistry: string;
  chainName: string;
}

const CHAIN_CONFIGS: Record<string, ChainConfig> = {
  'base-sepolia': {
    name: "Base Sepolia",
    network: "baseSepolia",
    rpcUrl: process.env.RPC_URL_BASE_SEPOLIA || "https://base-sepolia-rpc.publicnode.com",
    tokenIDRegistry: process.env.TOKEN_ID_REGISTRY_BASE_SEPOLIA || "0x1f1f75d84CB2Ff86ffe2b8Fb3eb0d2e94438433D",
    chainName: "base-sepolia",
  },
  'bsc-testnet': {
    name: "BSC Testnet",
    network: "bscTestnet",
    rpcUrl: process.env.RPC_URL_BSC_TESTNET || "https://bsc-testnet.publicnode.com",
    tokenIDRegistry: process.env.TOKEN_ID_REGISTRY_BSC_TESTNET || "0x4f3854445c33E9cf42b40B0AB36f4Dd58c23331f",
    chainName: "bsc-testnet",
  },
  'sepolia': {
    name: "Sepolia",
    network: "sepolia",
    rpcUrl: process.env.RPC_URL_SEPOLIA || "https://ethereum-sepolia-rpc.publicnode.com",
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

/**
 * Get all tokens from API
 */
async function getAllTokens(): Promise<Array<{ id: string; deployments: any[] }>> {
  try {
    // Try to get tokens from status endpoint for a known token first
    // If that works, we can expand to get all tokens
    const knownTokenId = process.env.TOKEN_ID || "ea23015c-d3c7-40e1-8cb3-94d2cbd813b9";
    
    try {
      const response = await axios.get(`${API_BASE}/tokens/${knownTokenId}/status`);
      if (response.data && response.data.deployments) {
        return [{
          id: knownTokenId,
          deployments: response.data.deployments || []
        }];
      }
    } catch (e) {
      // Continue to try other methods
    }
    
    // Try the tokens endpoint
    try {
      const response = await axios.get(`${API_BASE}/tokens`);
      return response.data.tokens || response.data || [];
    } catch (e) {
      console.warn("⚠️  Could not fetch tokens from API, will try to register known token");
      // Return empty array, we'll handle known tokens manually
      return [];
    }
  } catch (error: any) {
    console.error("❌ Failed to fetch tokens:", error.message);
    return [];
  }
}

/**
 * Register a token in TokenIDRegistry
 */
async function registerToken(
  config: ChainConfig,
  tokenId: string,
  tokenAddress: string,
  ownerPrivateKey: string
): Promise<{ success: boolean; message: string }> {
  if (!config.tokenIDRegistry) {
    return {
      success: false,
      message: `TokenIDRegistry address not configured for ${config.name}`,
    };
  }

  const provider = new ethers.JsonRpcProvider(config.rpcUrl);
  const wallet = new ethers.Wallet(ownerPrivateKey.replace(/^0x/, ''), provider);
  
  const registryABI = [
    "function owner() external view returns (address)",
    "function registerToken(address tokenAddress, bytes32 tokenId, string memory chain) external",
    "function isRegistered(address tokenAddress) external view returns (bool)",
  ];
  
  try {
    const registry = new ethers.Contract(config.tokenIDRegistry, registryABI, wallet);
    
    // Check if already registered
    const isRegistered = await registry.isRegistered(tokenAddress);
    if (isRegistered) {
      return {
        success: true,
        message: "Already registered",
      };
    }
    
    // Verify wallet is owner
    const owner = await registry.owner();
    if (owner.toLowerCase() !== wallet.address.toLowerCase()) {
      return {
        success: false,
        message: `Wallet ${wallet.address} is not the owner of TokenIDRegistry (owner: ${owner})`,
      };
    }
    
    // Convert UUID to bytes32
    const tokenIdBytes32 = uuidToBytes32(tokenId);
    
    // Register
    console.log(`   🔧 Registering token ${tokenId} (${tokenAddress})...`);
    const tx = await registry.registerToken(tokenAddress, tokenIdBytes32, config.chainName);
    console.log(`   ⏳ Transaction sent: ${tx.hash}`);
    await tx.wait();
    console.log(`   ✅ Transaction confirmed`);
    
    return {
      success: true,
      message: `Registered successfully. Tx: ${tx.hash}`,
    };
    
  } catch (error: any) {
    return {
      success: false,
      message: error.message,
    };
  }
}

async function main() {
  // Use the deployer's private key (same one used to deploy TokenIDRegistry)
  // This should be the PRIVATE_KEY from .env, not the GlobalSupplyTracker owner's key
  const ownerPrivateKey = process.env.PRIVATE_KEY || process.env.ETHEREUM_PRIVATE_KEY;
  
  if (!ownerPrivateKey) {
    console.error("❌ ERROR: PRIVATE_KEY or ETHEREUM_PRIVATE_KEY not found!");
    console.error("   Use the same private key that was used to deploy TokenIDRegistry");
    process.exit(1);
  }
  
  console.log(`\n🔧 Registering tokens in TokenIDRegistry...\n`);
  
  // Get all tokens from API
  let tokens = await getAllTokens();
  
  // If no tokens found, try to register the known token manually
  if (tokens.length === 0) {
    const knownTokenId = process.env.TOKEN_ID || "ea23015c-d3c7-40e1-8cb3-94d2cbd813b9";
    console.log(`⚠️  No tokens found from API, trying to register known token: ${knownTokenId}\n`);
    
    try {
      const response = await axios.get(`${API_BASE}/tokens/${knownTokenId}/status`);
      if (response.data && response.data.deployments) {
        tokens = [{
          id: knownTokenId,
          deployments: response.data.deployments || []
        }];
      }
    } catch (e: any) {
      console.error(`❌ Failed to fetch token ${knownTokenId}: ${e.message}`);
      console.log("\n💡 Tip: Set TOKEN_ID environment variable to register a specific token");
      return;
    }
  }
  
  console.log(`Found ${tokens.length} token(s) to register\n`);
  
  if (tokens.length === 0) {
    console.log("No tokens to register");
    return;
  }
  
  // Register tokens on each chain
  for (const chainKey of Object.keys(CHAIN_CONFIGS)) {
    const config = CHAIN_CONFIGS[chainKey];
    
    if (!config.tokenIDRegistry) {
      console.warn(`⚠️  Skipping ${config.name}: TokenIDRegistry not configured`);
      continue;
    }
    
    console.log(`${'='.repeat(60)}`);
    console.log(`${config.name}`);
    console.log(`${'='.repeat(60)}\n`);
    
    let registered = 0;
    let skipped = 0;
    let failed = 0;
    
    for (const token of tokens) {
      // Find deployment for this chain
      const deployment = token.deployments?.find(
        (d: any) => d.chain?.toLowerCase().includes(chainKey.replace('-', '')) ||
                    d.chain?.toLowerCase() === chainKey
      );
      
      if (!deployment) {
        skipped++;
        continue;
      }
      
      const tokenAddress = deployment.token_address || deployment.tokenAddress;
      const status = deployment.status || 'unknown';
      
      if (!tokenAddress || status !== 'deployed') {
        console.log(`   ⚠️  Skipping: tokenAddress=${tokenAddress || 'N/A'}, status=${status}`);
        skipped++;
        continue;
      }
      
      console.log(`   Token ID: ${token.id}`);
      console.log(`   Token Address: ${tokenAddress}`);
      console.log(`   Status: ${status}\n`);
      
      const result = await registerToken(
        config,
        token.id,
        tokenAddress,
        ownerPrivateKey
      );
      
      if (result.success) {
        registered++;
      } else {
        failed++;
        console.error(`   ❌ Failed: ${result.message}`);
      }
    }
    
    console.log(`\n✅ Registered: ${registered}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    console.log(`❌ Failed: ${failed}\n`);
  }
}

main().catch(console.error);

