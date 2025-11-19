// Active Price Sync Service
// Actively syncs prices by updating GlobalSupplyTracker contracts with actual supply from bonding curves
// This ensures prices stay synchronized across chains

import { ethers } from 'ethers';
import { dbAll, dbGet } from '../db/adapter';

const BONDING_CURVE_ABI = [
  'function totalSupplySold() external view returns (uint256)',
  'function getCurrentPrice() external view returns (uint256)',
  'function token() external view returns (address)',
];

const GLOBAL_SUPPLY_TRACKER_ABI = [
  'function updateSupply(address tokenId, string memory chain, uint256 newSupply) external payable',
  'function getGlobalSupply(address tokenId) external view returns (uint256)',
  'function chainSupply(address tokenId, string memory chain) external view returns (uint256)',
  'function authorizedUpdaters(address) external view returns (bool)',
];

interface ChainConfig {
  rpcUrl: string;
  globalSupplyTrackerAddress?: string;
  privateKey?: string;
  chainName: string; // For GlobalSupplyTracker updateSupply call
}

function getChainConfig(chain: string): ChainConfig | null {
  const chainLower = chain.toLowerCase();
  
  const configs: Record<string, ChainConfig> = {
    'sepolia': {
      rpcUrl: process.env.ETHEREUM_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com',
      globalSupplyTrackerAddress: process.env.GLOBAL_SUPPLY_TRACKER_SEPOLIA,
      privateKey: process.env.ETHEREUM_PRIVATE_KEY,
      chainName: 'sepolia',
    },
    'base-sepolia': {
      rpcUrl: process.env.BASE_RPC_URL || 'https://base-sepolia-rpc.publicnode.com',
      globalSupplyTrackerAddress: process.env.GLOBAL_SUPPLY_TRACKER_BASESEPOLIA,
      privateKey: process.env.BASE_PRIVATE_KEY,
      chainName: 'base-sepolia',
    },
    'bsc-testnet': {
      rpcUrl: process.env.BSC_RPC_URL || 'https://bsc-testnet.publicnode.com',
      globalSupplyTrackerAddress: process.env.GLOBAL_SUPPLY_TRACKER_BSCTESTNET,
      privateKey: process.env.BSC_PRIVATE_KEY,
      chainName: 'bsc-testnet',
    },
  };
  
  return configs[chainLower] || null;
}

/**
 * Sync supply for a specific token deployment by reading actual supply from bonding curve
 * and updating the GlobalSupplyTracker contract
 */
export async function syncSupplyForDeployment(
  tokenId: string,
  chain: string,
  curveAddress: string,
  tokenAddress: string
): Promise<{ success: boolean; message: string; actualSupply?: string; trackerSupply?: string }> {
  try {
    const config = getChainConfig(chain);
    if (!config || !config.globalSupplyTrackerAddress) {
      return {
        success: false,
        message: `Chain configuration not found for ${chain}`,
      };
    }

    // Create provider
    const provider = new ethers.JsonRpcProvider(config.rpcUrl);
    
    // Get actual supply from bonding curve
    const curveContract = new ethers.Contract(curveAddress, BONDING_CURVE_ABI, provider);
    const actualSupplyWei = await curveContract.totalSupplySold();
    const actualSupply = ethers.formatEther(actualSupplyWei);

    // Get current supply from GlobalSupplyTracker
    const trackerContract = new ethers.Contract(
      config.globalSupplyTrackerAddress,
      GLOBAL_SUPPLY_TRACKER_ABI,
      provider
    );
    
    const trackerSupplyWei = await trackerContract.chainSupply(tokenAddress, config.chainName);
    const trackerSupply = ethers.formatEther(trackerSupplyWei);

    // Check if update is needed
    if (actualSupplyWei === trackerSupplyWei) {
      return {
        success: true,
        message: `Supply already in sync: ${actualSupply}`,
        actualSupply,
        trackerSupply,
      };
    }

    // Check if we have a private key to send transaction
    if (!config.privateKey) {
      return {
        success: false,
        message: `No private key configured for ${chain}. Supply needs update: ${actualSupply} (tracker has: ${trackerSupply})`,
        actualSupply,
        trackerSupply,
      };
    }

    // Check if the bonding curve is authorized
    const isAuthorized = await trackerContract.authorizedUpdaters(curveAddress);
    if (!isAuthorized) {
      return {
        success: false,
        message: `Bonding curve ${curveAddress} is not authorized in GlobalSupplyTracker`,
        actualSupply,
        trackerSupply,
      };
    }

    // Update GlobalSupplyTracker with actual supply
    const signer = new ethers.Wallet(config.privateKey, provider);
    const trackerWithSigner = new ethers.Contract(
      config.globalSupplyTrackerAddress,
      GLOBAL_SUPPLY_TRACKER_ABI,
      signer
    );

    console.log(`🔄 Syncing supply for ${tokenId} on ${chain}: ${trackerSupply} → ${actualSupply}`);

    try {
      const tx = await trackerWithSigner.updateSupply(
        tokenAddress,
        config.chainName,
        actualSupplyWei,
        {
          gasLimit: 500000, // Reasonable gas limit for updateSupply
        }
      );

      console.log(`📤 Sent supply update transaction: ${tx.hash}`);
      
      // Wait for confirmation
      const receipt = await tx.wait();
      console.log(`✅ Supply update confirmed: ${receipt.hash}`);

      return {
        success: true,
        message: `Supply synced successfully: ${trackerSupply} → ${actualSupply}`,
        actualSupply,
        trackerSupply,
      };
    } catch (error: any) {
      console.error(`❌ Failed to update supply:`, error);
      return {
        success: false,
        message: `Transaction failed: ${error.message}`,
        actualSupply,
        trackerSupply,
      };
    }
  } catch (error: any) {
    console.error(`Error syncing supply for ${tokenId} on ${chain}:`, error);
    return {
      success: false,
      message: error.message || 'Unknown error',
    };
  }
}

/**
 * Sync prices for a token across all chains
 * Reads actual supply from each bonding curve and updates GlobalSupplyTracker
 */
export async function syncTokenPrices(tokenId: string): Promise<{
  success: boolean;
  message: string;
  results: Array<{ chain: string; success: boolean; message: string }>;
}> {
  try {
    // Get all deployments for this token
    const deployments = await dbAll(
      `SELECT chain, curve_address, token_address FROM token_deployments 
       WHERE token_id = ? AND status = 'deployed' AND curve_address IS NOT NULL`,
      [tokenId]
    ) as Array<{ chain: string; curve_address: string; token_address: string }>;

    if (deployments.length === 0) {
      return {
        success: false,
        message: 'No deployed token found',
        results: [],
      };
    }

    console.log(`🔄 Syncing prices for token ${tokenId} across ${deployments.length} chains...`);

    const results = await Promise.all(
      deployments.map(async (dep) => {
        const result = await syncSupplyForDeployment(
          tokenId,
          dep.chain,
          dep.curve_address,
          dep.token_address
        );
        return {
          chain: dep.chain,
          success: result.success,
          message: result.message,
        };
      })
    );

    const successCount = results.filter(r => r.success).length;
    const allSuccess = successCount === results.length;

    return {
      success: allSuccess,
      message: `Synced ${successCount}/${results.length} chains`,
      results,
    };
  } catch (error: any) {
    console.error(`Error syncing token prices for ${tokenId}:`, error);
    return {
      success: false,
      message: error.message || 'Unknown error',
      results: [],
    };
  }
}

/**
 * Sync all tokens with multiple deployments
 */
export async function syncAllTokenPrices(): Promise<{
  synced: number;
  failed: number;
  results: Array<{ tokenId: string; success: boolean; message: string }>;
}> {
  try {
    // Get all tokens with multiple deployments
    const tokens = await dbAll(`
      SELECT DISTINCT t.id as token_id
      FROM tokens t
      INNER JOIN token_deployments td ON t.id = td.token_id
      WHERE td.status = 'deployed' AND td.curve_address IS NOT NULL
      GROUP BY t.id
      HAVING COUNT(DISTINCT td.chain) > 1
    `) as Array<{ token_id: string }>;

    console.log(`🔄 Syncing prices for ${tokens.length} tokens...`);

    const results = await Promise.all(
      tokens.map(async (token) => {
        const result = await syncTokenPrices(token.token_id);
        return {
          tokenId: token.token_id,
          success: result.success,
          message: result.message,
        };
      })
    );

    const synced = results.filter(r => r.success).length;
    const failed = results.length - synced;

    return {
      synced,
      failed,
      results,
    };
  } catch (error: any) {
    console.error('Error syncing all token prices:', error);
    return {
      synced: 0,
      failed: 0,
      results: [],
    };
  }
}

/**
 * Start periodic price sync service
 */
export function startActivePriceSync(intervalMs: number = 2 * 60 * 1000): NodeJS.Timeout {
  console.log(`🔄 Starting active price sync service (interval: ${intervalMs}ms)`);
  
  // Initial sync
  syncAllTokenPrices().catch(console.error);
  
  // Periodic sync
  return setInterval(() => {
    console.log('🔄 Running periodic price sync...');
    syncAllTokenPrices().catch(console.error);
  }, intervalMs);
}

