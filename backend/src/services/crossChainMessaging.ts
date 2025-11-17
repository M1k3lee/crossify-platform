// Cross-Chain Messaging Service
// Sends LayerZero messages to sync supply across chains via smart contracts

import { ethers } from 'ethers';
import { dbAll, dbGet } from '../db/adapter';

// GlobalSupplyTracker ABI (simplified - only what we need)
const GLOBAL_SUPPLY_TRACKER_ABI = [
  'function updateSupply(address tokenId, string memory chain, uint256 newSupply) external payable',
  'function crossChainEnabled() external view returns (bool)',
  'function crossChainSync() external view returns (address)',
];

// CrossChainSync ABI (simplified)
const CROSS_CHAIN_SYNC_ABI = [
  'function syncSupplyUpdate(address token, uint256 newSupply, uint32 sourceEID) external payable',
  'function authorizedTokens(address) external view returns (bool)',
];

interface ChainConfig {
  rpcUrl: string;
  globalSupplyTrackerAddress?: string;
  crossChainSyncAddress?: string;
  chainEID?: number; // LayerZero Endpoint ID
}

/**
 * Get chain configuration
 */
function getChainConfig(chain: string): ChainConfig | null {
  const chainLower = chain.toLowerCase();
  
  const configs: Record<string, ChainConfig> = {
    'sepolia': {
      rpcUrl: process.env.ETHEREUM_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com',
      globalSupplyTrackerAddress: process.env.GLOBAL_SUPPLY_TRACKER_SEPOLIA,
      crossChainSyncAddress: process.env.CROSS_CHAIN_SYNC_SEPOLIA,
      chainEID: 40161, // LayerZero Sepolia EID
    },
    'base-sepolia': {
      rpcUrl: process.env.BASE_RPC_URL || 'https://base-sepolia-rpc.publicnode.com',
      globalSupplyTrackerAddress: process.env.GLOBAL_SUPPLY_TRACKER_BASESEPOLIA,
      crossChainSyncAddress: process.env.CROSS_CHAIN_SYNC_BASESEPOLIA,
      chainEID: 40245, // LayerZero Base Sepolia EID
    },
    'bsc-testnet': {
      rpcUrl: process.env.BSC_RPC_URL || 'https://bsc-testnet.publicnode.com',
      globalSupplyTrackerAddress: process.env.GLOBAL_SUPPLY_TRACKER_BSCTESTNET,
      crossChainSyncAddress: process.env.CROSS_CHAIN_SYNC_BSCTESTNET,
      chainEID: 40102, // LayerZero BSC Testnet EID
    },
  };
  
  return configs[chainLower] || null;
}

/**
 * Send cross-chain supply update via LayerZero
 * This actually calls the smart contracts to send on-chain messages
 */
export async function sendCrossChainSupplyUpdate(
  tokenId: string,
  sourceChain: string,
  newSupply: string,
  tokenAddress: string
): Promise<{ success: boolean; message: string; txHashes?: string[] }> {
  try {
    console.log(`📡 Sending cross-chain supply update for token ${tokenId}:`, {
      sourceChain,
      newSupply,
      tokenAddress,
    });

    // Get all deployments for this token
    const deployments = await dbAll(
      `SELECT chain, token_address, curve_address FROM token_deployments WHERE token_id = ? AND token_address IS NOT NULL`,
      [tokenId]
    ) as Array<{ chain: string; token_address: string; curve_address: string }>;

    if (deployments.length < 2) {
      return {
        success: false,
        message: 'Token must be deployed on at least 2 chains for cross-chain sync',
      };
    }

    // Get source chain config
    const sourceConfig = getChainConfig(sourceChain);
    if (!sourceConfig || !sourceConfig.globalSupplyTrackerAddress) {
      console.warn(`⚠️  Cross-chain sync not configured for source chain: ${sourceChain}`);
      return {
        success: false,
        message: `Cross-chain sync not configured for ${sourceChain}`,
      };
    }

    // Check if we have a private key for sending transactions
    const privateKey = getPrivateKeyForChain(sourceChain);
    if (!privateKey) {
      console.warn(`⚠️  No private key configured for ${sourceChain} - cannot send cross-chain messages`);
      return {
        success: false,
        message: `No private key configured for ${sourceChain}`,
      };
    }

    // Create provider and signer
    const provider = new ethers.JsonRpcProvider(sourceConfig.rpcUrl);
    const signer = new ethers.Wallet(privateKey, provider);

    // Get GlobalSupplyTracker contract
    const trackerContract = new ethers.Contract(
      sourceConfig.globalSupplyTrackerAddress,
      GLOBAL_SUPPLY_TRACKER_ABI,
      signer
    );

    // Check if cross-chain is enabled
    let crossChainEnabled = false;
    try {
      crossChainEnabled = await trackerContract.crossChainEnabled();
    } catch (error) {
      console.warn('Could not check crossChainEnabled:', error);
    }

    if (!crossChainEnabled) {
      console.warn(`⚠️  Cross-chain sync not enabled on GlobalSupplyTracker for ${sourceChain}`);
      return {
        success: false,
        message: `Cross-chain sync not enabled on ${sourceChain}`,
      };
    }

    // Convert supply to BigInt
    const supplyWei = ethers.parseEther(newSupply);

    // Estimate gas for the transaction
    let gasEstimate: bigint;
    try {
      gasEstimate = await trackerContract.updateSupply.estimateGas(
        tokenAddress,
        sourceChain,
        supplyWei
      );
    } catch (error: any) {
      console.error('Gas estimation failed:', error);
      return {
        success: false,
        message: `Gas estimation failed: ${error.message}`,
      };
    }

    // Send transaction with LayerZero message
    // Note: The GlobalSupplyTracker contract should handle sending LayerZero messages internally
    try {
      const tx = await trackerContract.updateSupply(
        tokenAddress,
        sourceChain,
        supplyWei,
        {
          gasLimit: gasEstimate * BigInt(120) / BigInt(100), // 20% buffer
          // Add value for LayerZero fees if needed
          // value: ethers.parseEther('0.001'), // Example: 0.001 ETH for LayerZero fees
        }
      );

      console.log(`📤 Sent cross-chain supply update transaction: ${tx.hash}`);
      
      // Wait for confirmation (optional - can be async)
      const receipt = await tx.wait();
      console.log(`✅ Cross-chain supply update confirmed: ${receipt.hash}`);

      return {
        success: true,
        message: 'Cross-chain supply update sent successfully',
        txHashes: [receipt.hash],
      };
    } catch (error: any) {
      console.error('Failed to send cross-chain update:', error);
      return {
        success: false,
        message: `Transaction failed: ${error.message}`,
      };
    }
  } catch (error: any) {
    console.error('Error in sendCrossChainSupplyUpdate:', error);
    return {
      success: false,
      message: error.message || 'Unknown error',
    };
  }
}

/**
 * Get private key for a chain
 */
function getPrivateKeyForChain(chain: string): string | null {
  const chainLower = chain.toLowerCase();
  
  if (chainLower === 'sepolia' || chainLower.includes('ethereum')) {
    return process.env.ETHEREUM_PRIVATE_KEY || null;
  }
  if (chainLower === 'base-sepolia' || chainLower.includes('base')) {
    return process.env.BASE_PRIVATE_KEY || null;
  }
  if (chainLower === 'bsc-testnet' || chainLower.includes('bsc')) {
    return process.env.BSC_PRIVATE_KEY || null;
  }
  
  return null;
}

/**
 * Check if cross-chain messaging is configured
 */
export function isCrossChainMessagingConfigured(): boolean {
  const chains = ['sepolia', 'base-sepolia', 'bsc-testnet'];
  
  for (const chain of chains) {
    const config = getChainConfig(chain);
    if (config?.globalSupplyTrackerAddress && getPrivateKeyForChain(chain)) {
      return true;
    }
  }
  
  return false;
}

