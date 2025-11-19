// Auto-Configure Bonding Curves Service
// Automatically configures bonding curves to use global supply for price synchronization

import { ethers } from 'ethers';
import { dbAll } from '../db/adapter';

const BONDING_CURVE_ABI = [
  'function useGlobalSupply() external view returns (bool)',
  'function globalSupplyTracker() external view returns (address)',
  'function setGlobalSupplyTracker(address) external',
  'function setUseGlobalSupply(bool) external',
  'function owner() external view returns (address)',
  'function totalSupplySold() external view returns (uint256)',
];

const GLOBAL_SUPPLY_TRACKER_ABI = [
  'function authorizedUpdaters(address) external view returns (bool)',
  'function authorizeUpdater(address) external',
  'function owner() external view returns (address)',
  'function getGlobalSupply(address token) external view returns (uint256)',
  'function getGlobalSupplyByAddress(address token) external view returns (uint256)',
];

interface ChainConfig {
  rpcUrl: string;
  globalSupplyTrackerAddress?: string;
  privateKey?: string;
  chainName: string;
}

function getChainConfig(chain: string): ChainConfig | null {
  const chainLower = chain.toLowerCase();
  
  const configs: Record<string, ChainConfig> = {
    'sepolia': {
      rpcUrl: process.env.ETHEREUM_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com',
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

interface ConfigurationResult {
  chain: string;
  curveAddress: string;
  success: boolean;
  message: string;
  changes: string[];
  errors: string[];
}

/**
 * Automatically configure a bonding curve to use global supply
 */
export async function configureBondingCurve(
  chain: string,
  curveAddress: string,
  tokenAddress: string
): Promise<ConfigurationResult> {
  const result: ConfigurationResult = {
    chain,
    curveAddress,
    success: false,
    message: '',
    changes: [],
    errors: [],
  };

  try {
    const config = getChainConfig(chain);
    if (!config) {
      result.errors.push(`Chain configuration not found for ${chain}`);
      result.message = `Unsupported chain: ${chain}`;
      return result;
    }

    if (!config.globalSupplyTrackerAddress) {
      result.errors.push(`GlobalSupplyTracker address not configured for ${chain}`);
      result.message = `GlobalSupplyTracker not configured for ${chain}`;
      return result;
    }

    const provider = new ethers.JsonRpcProvider(config.rpcUrl);
    const curveContract = new ethers.Contract(curveAddress, BONDING_CURVE_ABI, provider);

    // Check current configuration
    const [currentUseGlobalSupply, currentTrackerAddress, curveOwner] = await Promise.all([
      curveContract.useGlobalSupply().catch(() => false),
      curveContract.globalSupplyTracker().catch(() => ethers.ZeroAddress),
      curveContract.owner().catch(() => null),
    ]);

    // Check if we need to make changes
    const needsTrackerUpdate = 
      currentTrackerAddress === ethers.ZeroAddress || 
      currentTrackerAddress.toLowerCase() !== config.globalSupplyTrackerAddress.toLowerCase();
    const needsEnableGlobalSupply = !currentUseGlobalSupply;

    // Check authorization
    let isAuthorized = false;
    if (currentTrackerAddress && currentTrackerAddress !== ethers.ZeroAddress) {
      try {
        const trackerContract = new ethers.Contract(currentTrackerAddress, GLOBAL_SUPPLY_TRACKER_ABI, provider);
        isAuthorized = await trackerContract.authorizedUpdaters(curveAddress).catch(() => false);
      } catch (e) {
        // Tracker might not exist or have different ABI
        isAuthorized = false;
      }
    }
    
    // Also check the target tracker (in case it's different from current)
    let targetTrackerAuthorized = false;
    if (config.globalSupplyTrackerAddress) {
      try {
        const targetTrackerContract = new ethers.Contract(
          config.globalSupplyTrackerAddress,
          GLOBAL_SUPPLY_TRACKER_ABI,
          provider
        );
        targetTrackerAuthorized = await targetTrackerContract.authorizedUpdaters(curveAddress).catch(() => false);
      } catch (e) {
        targetTrackerAuthorized = false;
      }
    }

    // If everything is already configured, return success
    const needsAuthorization = !isAuthorized && !targetTrackerAuthorized;
    if (!needsTrackerUpdate && !needsEnableGlobalSupply && !needsAuthorization) {
      result.success = true;
      result.message = 'Already configured correctly';
      // Still try to authorize if not already authorized (might have been authorized elsewhere)
      if (!isAuthorized && !targetTrackerAuthorized && config.globalSupplyTrackerAddress && config.privateKey) {
        // Check if we can authorize (wallet is tracker owner)
        try {
          const trackerContract = new ethers.Contract(
            config.globalSupplyTrackerAddress,
            GLOBAL_SUPPLY_TRACKER_ABI,
            provider
          );
          const trackerOwner = await trackerContract.owner().catch(() => null);
          const wallet = new ethers.Wallet(config.privateKey, provider);
          
          if (trackerOwner && trackerOwner.toLowerCase() === wallet.address.toLowerCase()) {
            // Try to authorize even though config says it's already configured
            // This handles the case where authorization failed silently
            console.log(`🔧 Attempting to authorize bonding curve (even though config says already configured)...`);
            const trackerWithSigner = new ethers.Contract(
              config.globalSupplyTrackerAddress,
              GLOBAL_SUPPLY_TRACKER_ABI,
              wallet
            );
            const tx3 = await trackerWithSigner.authorizeUpdater(curveAddress, {
              gasLimit: 200000,
            }).catch(() => null);
            if (tx3) {
              await tx3.wait();
              result.changes.push('Authorized in GlobalSupplyTracker');
              console.log(`✅ Authorized: ${tx3.hash}`);
            }
          }
        } catch (error: any) {
          // Authorization might fail if already authorized - that's okay
          console.log(`⚠️ Authorization check: ${error.message}`);
        }
      }
      return result;
    }

    // Check if we have a private key to make changes
    if (!config.privateKey) {
      result.errors.push(`No private key configured for ${chain}. Cannot make changes.`);
      result.message = `Configuration needed but no private key available for ${chain}`;
      return result;
    }

    // Check if the private key matches the curve owner
    const wallet = new ethers.Wallet(config.privateKey, provider);
    
    // If owner() returned null, the contract might not have an owner function
    // In that case, check if the curve is already authorized in the tracker
    // If it's authorized, we can skip the owner check (it was already configured)
    if (!curveOwner) {
      console.log(`⚠️  Bonding curve ${curveAddress} on ${chain} does not have owner() function or it failed`);
      
      // Check if curve is already authorized in tracker - if so, it's already configured
      try {
        const trackerContract = new ethers.Contract(
          config.globalSupplyTrackerAddress,
          GLOBAL_SUPPLY_TRACKER_ABI,
          provider
        );
        const isAuthorized = await trackerContract.authorizedUpdaters(curveAddress).catch(() => false);
        
        if (isAuthorized && currentUseGlobalSupply && currentTrackerAddress.toLowerCase() === config.globalSupplyTrackerAddress.toLowerCase()) {
          // Already configured correctly, skip owner check
          console.log(`✅ Curve is already authorized and configured, skipping owner check`);
          result.success = true;
          result.message = 'Already configured correctly (owner check skipped)';
          return result;
        }
      } catch (error: any) {
        console.warn(`Could not check tracker authorization: ${error.message}`);
      }
      
      // If not authorized, we can't configure without knowing the owner
      result.errors.push(`Bonding curve owner() returned null. Cannot determine owner to configure.`);
      result.message = `Cannot configure: owner check failed (returned null)`;
      return result;
    }
    
    if (curveOwner.toLowerCase() !== wallet.address.toLowerCase()) {
      result.errors.push(`Private key wallet (${wallet.address}) is not the owner of bonding curve (${curveOwner})`);
      result.message = `Cannot configure: wallet is not the owner`;
      return result;
    }

    // Make changes
    const curveWithSigner = new ethers.Contract(curveAddress, BONDING_CURVE_ABI, wallet);

    // Step 1: Set GlobalSupplyTracker address
    if (needsTrackerUpdate) {
      try {
        console.log(`🔧 Setting GlobalSupplyTracker for ${chain}...`);
        const tx1 = await curveWithSigner.setGlobalSupplyTracker(config.globalSupplyTrackerAddress, {
          gasLimit: 200000,
        });
        await tx1.wait();
        result.changes.push(`Set GlobalSupplyTracker to ${config.globalSupplyTrackerAddress}`);
        console.log(`✅ GlobalSupplyTracker set: ${tx1.hash}`);
      } catch (error: any) {
        result.errors.push(`Failed to set GlobalSupplyTracker: ${error.message}`);
        throw error;
      }
    }

    // Step 2: Enable useGlobalSupply
    if (needsEnableGlobalSupply) {
      try {
        console.log(`🔧 Enabling useGlobalSupply for ${chain}...`);
        const tx2 = await curveWithSigner.setUseGlobalSupply(true, {
          gasLimit: 100000,
        });
        await tx2.wait();
        result.changes.push('Enabled useGlobalSupply');
        console.log(`✅ useGlobalSupply enabled: ${tx2.hash}`);
      } catch (error: any) {
        result.errors.push(`Failed to enable useGlobalSupply: ${error.message}`);
        throw error;
      }
    }

    // Step 3: Authorize in GlobalSupplyTracker (use the target tracker address)
    if (needsAuthorization && config.globalSupplyTrackerAddress) {
      try {
        const trackerContract = new ethers.Contract(
          config.globalSupplyTrackerAddress,
          GLOBAL_SUPPLY_TRACKER_ABI,
          provider
        );
        const trackerOwner = await trackerContract.owner().catch(() => null);

        // Check if our wallet is the tracker owner
        if (trackerOwner && trackerOwner.toLowerCase() === wallet.address.toLowerCase()) {
          console.log(`🔧 Authorizing bonding curve in GlobalSupplyTracker for ${chain}...`);
          const trackerWithSigner = new ethers.Contract(
            config.globalSupplyTrackerAddress,
            GLOBAL_SUPPLY_TRACKER_ABI,
            wallet
          );
          const tx3 = await trackerWithSigner.authorizeUpdater(curveAddress, {
            gasLimit: 200000,
          });
          await tx3.wait();
          result.changes.push('Authorized in GlobalSupplyTracker');
          console.log(`✅ Authorized: ${tx3.hash}`);
        } else if (trackerOwner) {
          result.errors.push(`Cannot authorize: wallet is not the owner of GlobalSupplyTracker (owner: ${trackerOwner})`);
        } else {
          result.errors.push(`Cannot authorize: could not get GlobalSupplyTracker owner`);
        }
      } catch (error: any) {
        result.errors.push(`Failed to authorize: ${error.message}`);
        // Don't throw - authorization might not be critical if already authorized elsewhere
      }
    }

    result.success = result.errors.length === 0;
    result.message = result.changes.length > 0
      ? `Configured: ${result.changes.join(', ')}`
      : 'No changes needed';

    return result;
  } catch (error: any) {
    result.errors.push(error.message || 'Unknown error');
    result.message = `Configuration failed: ${error.message || 'Unknown error'}`;
    return result;
  }
}

/**
 * Configure all bonding curves for a token
 */
export async function configureTokenBondingCurves(tokenId: string): Promise<{
  success: boolean;
  message: string;
  results: ConfigurationResult[];
}> {
  try {
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

    console.log(`🔧 Auto-configuring bonding curves for token ${tokenId} across ${evmChains.length} EVM chains...`);

    const results = await Promise.allSettled(
      evmChains.map(async (dep) => {
        return await configureBondingCurve(dep.chain, dep.curve_address, dep.token_address);
      })
    );

    const processedResults = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        const dep = evmChains[index];
        return {
          chain: dep?.chain || 'unknown',
          curveAddress: dep?.curve_address || 'unknown',
          success: false,
          message: `Promise rejected: ${result.reason?.message || 'Unknown error'}`,
          changes: [],
          errors: [result.reason?.message || 'Unknown error'],
        };
      }
    });

    const successCount = processedResults.filter(r => r.success).length;
    const allSuccess = successCount === processedResults.length;

    console.log(`📊 Configuration results for token ${tokenId}:`);
    processedResults.forEach(r => {
      console.log(`   ${r.success ? '✅' : '❌'} ${r.chain}: ${r.message}`);
      if (r.changes.length > 0) {
        console.log(`      Changes: ${r.changes.join(', ')}`);
      }
      if (r.errors.length > 0) {
        console.log(`      Errors: ${r.errors.join(', ')}`);
      }
    });

    return {
      success: allSuccess,
      message: `Configured ${successCount}/${processedResults.length} chains`,
      results: processedResults,
    };
  } catch (error: any) {
    console.error(`❌ Error configuring bonding curves for token ${tokenId}:`, error);
    return {
      success: false,
      message: `Fatal error: ${error.message || 'Unknown error'}`,
      results: [],
    };
  }
}

