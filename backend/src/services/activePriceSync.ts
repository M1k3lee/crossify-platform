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
  'function owner() external view returns (address)',
];

interface ChainConfig {
  rpcUrl: string;
  globalSupplyTrackerAddress?: string;
  privateKey?: string;
  chainName: string; // For GlobalSupplyTracker updateSupply call
}

export function getChainConfig(chain: string): ChainConfig | null {
  const chainLower = chain.toLowerCase();
  
  const configs: Record<string, ChainConfig> = {
    'sepolia': {
      rpcUrl: process.env.ETHEREUM_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com',
      // Prefer V2, fallback to V1 for backward compatibility
      globalSupplyTrackerAddress: process.env.GLOBAL_SUPPLY_TRACKER_V2_SEPOLIA || process.env.GLOBAL_SUPPLY_TRACKER_SEPOLIA,
      privateKey: process.env.ETHEREUM_PRIVATE_KEY || process.env.PRIVATE_KEY,
      chainName: 'sepolia',
    },
    'base-sepolia': {
      rpcUrl: process.env.BASE_RPC_URL || 'https://base-sepolia-rpc.publicnode.com',
      globalSupplyTrackerAddress: process.env.GLOBAL_SUPPLY_TRACKER_V2_BASE_SEPOLIA || process.env.GLOBAL_SUPPLY_TRACKER_BASE_SEPOLIA || process.env.GLOBAL_SUPPLY_TRACKER_BASESEPOLIA,
      privateKey: process.env.BASE_PRIVATE_KEY || process.env.PRIVATE_KEY,
      chainName: 'base-sepolia',
    },
    'bsc-testnet': {
      rpcUrl: process.env.BSC_RPC_URL || 'https://bsc-testnet.publicnode.com',
      globalSupplyTrackerAddress: process.env.GLOBAL_SUPPLY_TRACKER_V2_BSC_TESTNET || process.env.GLOBAL_SUPPLY_TRACKER_BSC_TESTNET || process.env.GLOBAL_SUPPLY_TRACKER_BSCTESTNET,
      privateKey: process.env.BSC_PRIVATE_KEY || process.env.PRIVATE_KEY,
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
    if (!config) {
      return {
        success: false,
        message: `Chain configuration not found for ${chain}. Supported chains: sepolia, base-sepolia, bsc-testnet`,
      };
    }
    
    if (!config.globalSupplyTrackerAddress) {
      return {
        success: false,
        message: `GlobalSupplyTracker address not configured for ${chain}. Set GLOBAL_SUPPLY_TRACKER_${chain.toUpperCase().replace('-', '_')} environment variable`,
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
    
    // Check if our wallet is the owner (owner can also update)
    const signer = new ethers.Wallet(config.privateKey, provider);
    const trackerOwner = await trackerContract.owner().catch(() => null);
    const isOwner = trackerOwner && trackerOwner.toLowerCase() === signer.address.toLowerCase();
    
    if (!isAuthorized && !isOwner) {
      return {
        success: false,
        message: `Bonding curve ${curveAddress} is not authorized and wallet ${signer.address} is not the owner (owner: ${trackerOwner || 'unknown'})`,
        actualSupply,
        trackerSupply,
      };
    }

    // Update GlobalSupplyTracker with actual supply
    const trackerWithSigner = new ethers.Contract(
      config.globalSupplyTrackerAddress,
      GLOBAL_SUPPLY_TRACKER_ABI,
      signer
    );

    console.log(`🔄 Syncing supply for ${tokenId} on ${chain}: ${trackerSupply} → ${actualSupply}`);
    console.log(`   Wallet: ${signer.address}`);
    console.log(`   Tracker Owner: ${trackerOwner || 'unknown'}`);
    console.log(`   Is Owner: ${isOwner}`);
    console.log(`   Curve Authorized: ${isAuthorized}`);

    try {
      // Estimate gas first to catch errors early
      try {
        const gasEstimate = await trackerWithSigner.updateSupply.estimateGas(
          tokenAddress,
          config.chainName,
          actualSupplyWei
        );
        console.log(`   Estimated gas: ${gasEstimate.toString()}`);
      } catch (estimateError: any) {
        console.error(`   Gas estimation failed:`, estimateError);
        // Try to extract revert reason
        const revertReason = estimateError.reason || estimateError.data || estimateError.message;
        return {
          success: false,
          message: `Gas estimation failed (transaction would revert): ${revertReason}`,
          actualSupply,
          trackerSupply,
        };
      }

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
      
      // Try to extract revert reason
      let errorMessage = error.message || 'Unknown error';
      if (error.reason) {
        errorMessage = error.reason;
      } else if (error.data) {
        // Try to decode error data
        try {
          const decoded = ethers.AbiCoder.defaultAbiCoder().decode(['string'], error.data);
          errorMessage = decoded[0] || errorMessage;
        } catch {
          // If decoding fails, use original message
        }
      }
      
      return {
        success: false,
        message: `Transaction failed: ${errorMessage}`,
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

    // Filter out non-EVM chains (Hedera, Solana, etc.)
    const evmChains = deployments.filter(dep => {
      const chainLower = dep.chain.toLowerCase();
      return !chainLower.includes('hedera') && !chainLower.includes('solana');
    });

    if (evmChains.length === 0) {
      return {
        success: false,
        message: 'No EVM chains found (Hedera/Solana not supported)',
        results: [],
      };
    }

    console.log(`🔄 Syncing prices for token ${tokenId} across ${evmChains.length} EVM chains...`);

    // Use Promise.allSettled to continue even if some chains fail
    const results = await Promise.allSettled(
      evmChains.map(async (dep) => {
        try {
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
            actualSupply: result.actualSupply,
            trackerSupply: result.trackerSupply,
          };
        } catch (error: any) {
          console.error(`❌ Error syncing ${dep.chain} for token ${tokenId}:`, error);
          return {
            chain: dep.chain,
            success: false,
            message: `Error: ${error.message || 'Unknown error'}`,
          };
        }
      })
    );

    // Process results from Promise.allSettled
    const processedResults = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        const dep = deployments[index];
        console.error(`❌ Promise rejected for ${dep?.chain}:`, result.reason);
        return {
          chain: dep?.chain || 'unknown',
          success: false,
          message: `Promise rejected: ${result.reason?.message || 'Unknown error'}`,
          actualSupply: undefined,
          trackerSupply: undefined,
        };
      }
    });

    const successCount = processedResults.filter(r => r.success).length;
    const allSuccess = successCount === processedResults.length;

    // Log detailed results
    console.log(`📊 Sync results for token ${tokenId}:`);
    processedResults.forEach(r => {
      console.log(`   ${r.success ? '✅' : '❌'} ${r.chain}: ${r.message}`);
    });

    return {
      success: allSuccess,
      message: `Synced ${successCount}/${processedResults.length} chains`,
      results: processedResults,
    };
  } catch (error: any) {
    console.error(`❌ Error syncing token prices for ${tokenId}:`, error);
    console.error(`   Stack:`, error.stack);
    return {
      success: false,
      message: `Fatal error: ${error.message || 'Unknown error'}`,
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

