// Bridge service for cross-chain liquidity operations
import { ethers } from 'ethers';
import { dbGet, dbAll, dbRun } from '../db/adapter';

// CrossChainLiquidityBridge ABI (simplified - only what we need)
const LIQUIDITY_BRIDGE_ABI = [
  'function requestLiquidity(address token, uint32 targetChainEID, uint256 amount) external returns (bytes32)',
  'function bridgeLiquidity(bytes32 requestId, uint256 nativeAmount, bytes calldata message) external payable',
  'function updateReserve(address token, uint32 chainEID, uint256 newReserve) external',
  'function hasSufficientReserves(address token, uint32 chainEID, uint256 requiredAmount) external view returns (bool)',
  'function getMinReserve(address token, uint32 chainEID) external view returns (uint256)',
  'function chainReserves(address, uint32) external view returns (uint256)',
  'function pendingRequests(bytes32) external view returns (address token, uint32 targetChainEID, uint32 sourceChainEID, uint256 amount, uint256 requestedAt, bool fulfilled)',
  'event LiquidityRequested(address indexed token, uint32 targetChainEID, uint32 sourceChainEID, uint256 amount, bytes32 requestId)',
  'event LiquidityBridged(address indexed token, uint32 sourceChainEID, uint32 targetChainEID, uint256 amount, bytes32 requestId)',
  'event ReserveUpdated(address indexed token, uint32 chainEID, uint256 newReserve)',
];

// LayerZero EID mapping (Endpoint IDs)
const CHAIN_EIDS: Record<string, number> = {
  'ethereum': 30110, // Ethereum Mainnet
  'sepolia': 40161, // Sepolia Testnet
  'bsc': 30102, // BSC Mainnet
  'bsc-testnet': 40102, // BSC Testnet
  'base': 30145, // Base Mainnet
  'base-sepolia': 40245, // Base Sepolia Testnet
};

interface ChainConfig {
  rpcUrl: string;
  bridgeAddress: string | null;
  chainId: number;
  chainEID: number;
  privateKey?: string;
}

/**
 * Get chain configuration for bridge operations
 */
function getChainConfig(chain: string): ChainConfig | null {
  const chainLower = chain.toLowerCase();
  
  // Get bridge contract address from environment
  const bridgeAddress = process.env[`${chain.toUpperCase().replace('-', '_')}_LIQUIDITY_BRIDGE_ADDRESS`] || null;
  
  // Get RPC URL and private key
  let rpcUrl: string;
  let chainId: number;
  let chainEID: number;
  
  switch (chainLower) {
    case 'ethereum':
    case 'eth':
      rpcUrl = process.env.ETHEREUM_RPC_URL || 'https://eth.llamarpc.com';
      chainId = 1;
      chainEID = CHAIN_EIDS.ethereum;
      break;
    case 'sepolia':
      rpcUrl = process.env.SEPOLIA_RPC_URL || process.env.ETHEREUM_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com';
      chainId = 11155111;
      chainEID = CHAIN_EIDS.sepolia;
      break;
    case 'bsc':
      rpcUrl = process.env.BSC_RPC_URL || 'https://bsc-dataseed.binance.org';
      chainId = 56;
      chainEID = CHAIN_EIDS.bsc;
      break;
    case 'bsc-testnet':
      rpcUrl = process.env.BSC_TESTNET_RPC_URL || process.env.BSC_RPC_URL || 'https://bsc-testnet.publicnode.com';
      chainId = 97;
      chainEID = CHAIN_EIDS['bsc-testnet'];
      break;
    case 'base':
      rpcUrl = process.env.BASE_RPC_URL || 'https://mainnet.base.org';
      chainId = 8453;
      chainEID = CHAIN_EIDS.base;
      break;
    case 'base-sepolia':
      rpcUrl = process.env.BASE_SEPOLIA_RPC_URL || process.env.BASE_RPC_URL || 'https://base-sepolia-rpc.publicnode.com';
      chainId = 84532;
      chainEID = CHAIN_EIDS['base-sepolia'];
      break;
    default:
      return null;
  }
  
  const privateKey = process.env[`${chain.toUpperCase().replace('-', '_')}_PRIVATE_KEY`] || 
                     process.env.BRIDGE_PRIVATE_KEY || undefined;
  
  return {
    rpcUrl,
    bridgeAddress,
    chainId,
    chainEID,
    privateKey,
  };
}

/**
 * Get bridge contract instance for a chain
 */
function getBridgeContract(chain: string): { contract: ethers.Contract; signer: ethers.Wallet } | null {
  const config = getChainConfig(chain);
  if (!config || !config.bridgeAddress || !config.privateKey) {
    return null;
  }
  
  try {
    const provider = new ethers.JsonRpcProvider(config.rpcUrl);
    const wallet = new ethers.Wallet(config.privateKey, provider);
    const contract = new ethers.Contract(config.bridgeAddress, LIQUIDITY_BRIDGE_ABI, wallet);
    
    return { contract, signer: wallet };
  } catch (error) {
    console.error(`Error creating bridge contract for ${chain}:`, error);
    return null;
  }
}

/**
 * Request liquidity from another chain
 */
export async function requestLiquidity(
  tokenId: string,
  targetChain: string,
  amount: string
): Promise<{ success: boolean; requestId?: string; message: string }> {
  try {
    // Get token deployment info
    const deployment = await dbGet(
      `SELECT token_address, curve_address FROM token_deployments WHERE token_id = ? AND chain = ?`,
      [tokenId, targetChain]
    ) as any;
    
    if (!deployment || !deployment.token_address) {
      return {
        success: false,
        message: `Token not deployed on ${targetChain}`,
      };
    }
    
    const bridge = getBridgeContract(targetChain);
    if (!bridge) {
      return {
        success: false,
        message: `Bridge contract not configured for ${targetChain}. Please set ${targetChain.toUpperCase().replace('-', '_')}_LIQUIDITY_BRIDGE_ADDRESS and private key.`,
      };
    }
    
    const config = getChainConfig(targetChain);
    if (!config) {
      return {
        success: false,
        message: `Invalid chain configuration for ${targetChain}`,
      };
    }
    
    // Convert amount to wei
    const amountWei = ethers.parseEther(amount);
    
    // Call requestLiquidity on the bridge contract
    const tx = await bridge.contract.requestLiquidity(
      deployment.token_address,
      config.chainEID,
      amountWei
    );
    
    // Wait for transaction
    const receipt = await tx.wait();
    
    // Extract request ID from event
    const event = receipt.logs.find((log: any) => {
      try {
        const parsed = bridge.contract.interface.parseLog(log);
        return parsed?.name === 'LiquidityRequested';
      } catch {
        return false;
      }
    });
    
    let requestId: string | undefined;
    if (event) {
      const parsed = bridge.contract.interface.parseLog(event);
      requestId = parsed?.args.requestId;
    }
    
    // Record request in database
    await dbRun(
      `INSERT INTO liquidity_requests (token_id, target_chain, source_chain, amount, request_id, status, created_at)
       VALUES (?, ?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP)`,
      [tokenId, targetChain, null, amount, requestId || tx.hash]
    );
    
    return {
      success: true,
      requestId: requestId || tx.hash,
      message: `Liquidity request created. Request ID: ${requestId || tx.hash}`,
    };
  } catch (error: any) {
    console.error('Error requesting liquidity:', error);
    return {
      success: false,
      message: error.message || 'Failed to request liquidity',
    };
  }
}

/**
 * Execute liquidity bridge from source to target chain
 */
export async function executeBridge(
  tokenId: string,
  sourceChain: string,
  targetChain: string,
  amount: string,
  requestId?: string
): Promise<{ success: boolean; txHash?: string; message: string }> {
  try {
    // Get source chain bridge contract
    const sourceBridge = getBridgeContract(sourceChain);
    if (!sourceBridge) {
      return {
        success: false,
        message: `Bridge contract not configured for source chain ${sourceChain}`,
      };
    }
    
    // Get deployment info
    const deployment = await dbGet(
      `SELECT token_address FROM token_deployments WHERE token_id = ? AND chain = ?`,
      [tokenId, targetChain]
    ) as any;
    
    if (!deployment) {
      return {
        success: false,
        message: `Token not deployed on target chain ${targetChain}`,
      };
    }
    
    const config = getChainConfig(sourceChain);
    if (!config) {
      return {
        success: false,
        message: `Invalid chain configuration for ${sourceChain}`,
      };
    }
    
    // Convert amount to wei
    const amountWei = ethers.parseEther(amount);
    
    // Estimate gas
    const gasEstimate = await sourceBridge.contract.bridgeLiquidity.estimateGas(
      requestId || ethers.ZeroHash,
      amountWei,
      '0x' // Empty message for now
    );
    
    // Execute bridge
    const tx = await sourceBridge.contract.bridgeLiquidity(
      requestId || ethers.ZeroHash,
      amountWei,
      '0x',
      { value: amountWei, gasLimit: gasEstimate * BigInt(120) / BigInt(100) } // 20% buffer
    );
    
    const receipt = await tx.wait();
    
    // Update database
    await dbRun(
      `UPDATE liquidity_requests 
       SET status = 'bridging', tx_hash = ?, updated_at = CURRENT_TIMESTAMP
       WHERE token_id = ? AND target_chain = ?`,
      [tx.hash, tokenId, targetChain]
    );
    
    // Update reserve on target chain (this would be done via LayerZero message in production)
    // For now, we'll update the database
    const targetDeployment = await dbGet(
      `SELECT reserve_balance FROM token_deployments WHERE token_id = ? AND chain = ?`,
      [tokenId, targetChain]
    ) as any;
    
    if (targetDeployment) {
      const newReserve = (parseFloat(targetDeployment.reserve_balance || '0') + parseFloat(amount)).toString();
      await dbRun(
        `UPDATE token_deployments SET reserve_balance = ?, updated_at = CURRENT_TIMESTAMP WHERE token_id = ? AND chain = ?`,
        [newReserve, tokenId, targetChain]
      );
    }
    
    return {
      success: true,
      txHash: tx.hash,
      message: `Bridge executed successfully. TX: ${tx.hash}`,
    };
  } catch (error: any) {
    console.error('Error executing bridge:', error);
    return {
      success: false,
      message: error.message || 'Failed to execute bridge',
    };
  }
}

/**
 * Check if chain has sufficient reserves
 */
export async function checkReserves(
  tokenId: string,
  chain: string,
  requiredAmount: string
): Promise<{ hasSufficient: boolean; currentReserve: string; requiredAmount: string }> {
  try {
    const bridge = getBridgeContract(chain);
    if (!bridge) {
      // Fallback to database check
      const deployment = await dbGet(
        `SELECT reserve_balance FROM token_deployments WHERE token_id = ? AND chain = ?`,
        [tokenId, chain]
      ) as any;
      
      const currentReserve = deployment?.reserve_balance || '0';
      return {
        hasSufficient: parseFloat(currentReserve) >= parseFloat(requiredAmount),
        currentReserve,
        requiredAmount,
      };
    }
    
    const deployment = await dbGet(
      `SELECT token_address FROM token_deployments WHERE token_id = ? AND chain = ?`,
      [tokenId, chain]
    ) as any;
    
    if (!deployment) {
      return {
        hasSufficient: false,
        currentReserve: '0',
        requiredAmount,
      };
    }
    
    const config = getChainConfig(chain);
    if (!config) {
      return {
        hasSufficient: false,
        currentReserve: '0',
        requiredAmount,
      };
    }
    
    const requiredWei = ethers.parseEther(requiredAmount);
    const hasSufficient = await bridge.contract.hasSufficientReserves(
      deployment.token_address,
      config.chainEID,
      requiredWei
    );
    
    const currentReserve = await bridge.contract.chainReserves(
      deployment.token_address,
      config.chainEID
    );
    
    return {
      hasSufficient,
      currentReserve: ethers.formatEther(currentReserve),
      requiredAmount,
    };
  } catch (error: any) {
    console.error('Error checking reserves:', error);
    return {
      hasSufficient: false,
      currentReserve: '0',
      requiredAmount,
    };
  }
}

/**
 * Update reserve on bridge contract (called after buy/sell operations)
 */
export async function updateReserve(
  tokenId: string,
  chain: string,
  newReserve: string
): Promise<{ success: boolean; message: string }> {
  try {
    const bridge = getBridgeContract(chain);
    if (!bridge) {
      // Just update database if bridge not configured
      await dbRun(
        `UPDATE token_deployments SET reserve_balance = ?, updated_at = CURRENT_TIMESTAMP WHERE token_id = ? AND chain = ?`,
        [newReserve, tokenId, chain]
      );
      return {
        success: true,
        message: 'Reserve updated in database (bridge contract not configured)',
      };
    }
    
    const deployment = await dbGet(
      `SELECT token_address FROM token_deployments WHERE token_id = ? AND chain = ?`,
      [tokenId, chain]
    ) as any;
    
    if (!deployment) {
      return {
        success: false,
        message: `Token not deployed on ${chain}`,
      };
    }
    
    const config = getChainConfig(chain);
    if (!config) {
      return {
        success: false,
        message: `Invalid chain configuration`,
      };
    }
    
    const reserveWei = ethers.parseEther(newReserve);
    const tx = await bridge.contract.updateReserve(
      deployment.token_address,
      config.chainEID,
      reserveWei
    );
    
    await tx.wait();
    
    // Also update database
    await dbRun(
      `UPDATE token_deployments SET reserve_balance = ?, updated_at = CURRENT_TIMESTAMP WHERE token_id = ? AND chain = ?`,
      [newReserve, tokenId, chain]
    );
    
    return {
      success: true,
      message: `Reserve updated on chain. TX: ${tx.hash}`,
    };
  } catch (error: any) {
    console.error('Error updating reserve:', error);
    return {
      success: false,
      message: error.message || 'Failed to update reserve',
    };
  }
}

/**
 * Get chain EID for a chain
 */
export function getChainEID(chain: string): number | null {
  const config = getChainConfig(chain);
  return config?.chainEID || null;
}

