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
    tokenIDRegistry: process.env.TOKEN_ID_REGISTRY_BASE_SEPOLIA || "",
    chainName: "base-sepolia",
  },
  'bsc-testnet': {
    name: "BSC Testnet",
    network: "bscTestnet",
    rpcUrl: process.env.RPC_URL_BSC_TESTNET || "https://bsc-testnet.publicnode.com",
    tokenIDRegistry: process.env.TOKEN_ID_REGISTRY_BSC_TESTNET || "",
    chainName: "bsc-testnet",
  },
  'sepolia': {
    name: "Sepolia",
    network: "sepolia",
    rpcUrl: process.env.RPC_URL_SEPOLIA || "https://ethereum-sepolia-rpc.publicnode.com",
    tokenIDRegistry: process.env.TOKEN_ID_REGISTRY_SEPOLIA || "",
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
    // Get all tokens (you may need to paginate or filter)
    const response = await axios.get(`${API_BASE}/tokens`);
    return response.data.tokens || [];
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
  const ownerPrivateKey = process.env.ETHEREUM_PRIVATE_KEY || process.env.PRIVATE_KEY;
  
  if (!ownerPrivateKey) {
    console.error("❌ ERROR: ETHEREUM_PRIVATE_KEY or PRIVATE_KEY not found!");
    process.exit(1);
  }
  
  console.log(`\n🔧 Registering tokens in TokenIDRegistry...\n`);
  
  // Get all tokens from API
  const tokens = await getAllTokens();
  console.log(`Found ${tokens.length} tokens in database\n`);
  
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
      
      if (!deployment || !deployment.token_address || deployment.status !== 'deployed') {
        skipped++;
        continue;
      }
      
      const result = await registerToken(
        config,
        token.id,
        deployment.token_address,
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

