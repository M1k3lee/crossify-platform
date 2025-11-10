// CFY Token Fee Collection Service
// Handles collection of platform fees and distribution to CFY token contract

import { ethers } from 'ethers';
import { dbRun, dbGet } from '../db/adapter';

// CFY Token Contract ABI (simplified - only functions we need)
const CFY_TOKEN_ABI = [
  'function collectFees(uint256 amount, string memory feeType) external payable',
  'function getFeeDiscount(address holder) external view returns (uint256)',
  'function balanceOf(address account) external view returns (uint256)',
  'function decimals() external view returns (uint8)',
  'function feeCollector() external view returns (address)',
];

interface CFYFeeCollectionConfig {
  cfyTokenAddress: string;
  feeCollectorAddress: string;
  rpcUrl: string;
  chainId: number;
}

/**
 * CFY Fee Collection Service
 * Handles fee collection using CFY token and applies holder discounts
 */
export class CFYFeeCollectionService {
  private provider: ethers.JsonRpcProvider;
  private cfyTokenContract: ethers.Contract;
  private feeCollectorWallet: ethers.Wallet;
  private config: CFYFeeCollectionConfig;

  constructor(config: CFYFeeCollectionConfig) {
    this.config = config;
    this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
    
    // Initialize fee collector wallet
    const privateKey = process.env.FEE_COLLECTOR_PRIVATE_KEY || process.env.PRIVATE_KEY;
    if (!privateKey) {
      throw new Error('FEE_COLLECTOR_PRIVATE_KEY or PRIVATE_KEY environment variable is required');
    }
    this.feeCollectorWallet = new ethers.Wallet(privateKey, this.provider);
    
    // Initialize CFY token contract
    this.cfyTokenContract = new ethers.Contract(
      config.cfyTokenAddress,
      CFY_TOKEN_ABI,
      this.feeCollectorWallet
    );
  }

  /**
   * Calculate fee discount for a user based on their CFY balance
   */
  async getFeeDiscount(userAddress: string): Promise<number> {
    try {
      const discount = await this.cfyTokenContract.getFeeDiscount(userAddress);
      // Discount is in basis points (10000 = 100%)
      return Number(discount) / 100; // Convert to percentage
    } catch (error) {
      console.error('Error getting fee discount:', error);
      return 0; // No discount if error
    }
  }

  /**
   * Calculate fee after discount
   */
  async calculateFeeWithDiscount(baseFee: number, userAddress: string): Promise<number> {
    const discountPercent = await this.getFeeDiscount(userAddress);
    const discountAmount = (baseFee * discountPercent) / 100;
    return baseFee - discountAmount;
  }

  /**
   * Check if user has CFY balance
   */
  async hasCFYBalance(userAddress: string, minBalance?: string): Promise<boolean> {
    try {
      const balance = await this.cfyTokenContract.balanceOf(userAddress);
      if (minBalance) {
        const minBalanceWei = ethers.parseEther(minBalance);
        return balance >= minBalanceWei;
      }
      return balance > 0n;
    } catch (error) {
      console.error('Error checking CFY balance:', error);
      return false;
    }
  }

  /**
   * Collect platform fee and send to CFY token contract
   * @param amount Fee amount in native tokens (ETH/BNB)
   * @param feeType Type of fee (e.g., 'token_creation', 'mint', 'cross_chain_sync')
   * @param userAddress User address (for discount calculation)
   */
  async collectFee(
    amount: string,
    feeType: string,
    userAddress?: string
  ): Promise<{ success: boolean; txHash?: string; discountApplied?: number; finalAmount?: string }> {
    try {
      // Convert amount to wei
      const amountWei = ethers.parseEther(amount);
      
      // Get discount if user address provided
      let discountPercent = 0;
      let finalAmount = amountWei;
      
      if (userAddress) {
        discountPercent = await this.getFeeDiscount(userAddress);
        if (discountPercent > 0) {
          const discountAmount = (amountWei * BigInt(Math.floor(discountPercent * 100))) / 10000n;
          finalAmount = amountWei - discountAmount;
        }
      }

      // Check if fee collector has enough balance
      const balance = await this.provider.getBalance(this.feeCollectorWallet.address);
      if (balance < finalAmount) {
        throw new Error(`Insufficient balance in fee collector. Required: ${ethers.formatEther(finalAmount)}, Available: ${ethers.formatEther(balance)}`);
      }

      // Send fee to CFY token contract
      const tx = await this.cfyTokenContract.collectFees(finalAmount, feeType, {
        value: finalAmount,
      });

      await tx.wait();

      // Record fee in database
      await this.recordFee(amount, feeType, userAddress, discountPercent, tx.hash);

      return {
        success: true,
        txHash: tx.hash,
        discountApplied: discountPercent,
        finalAmount: ethers.formatEther(finalAmount),
      };
    } catch (error: any) {
      console.error('Error collecting fee:', error);
      return {
        success: false,
      };
    }
  }

  /**
   * Record fee in database
   */
  private async recordFee(
    amount: string,
    feeType: string,
    userAddress: string | undefined,
    discountPercent: number,
    txHash: string
  ): Promise<void> {
    try {
      await dbRun(
        `INSERT INTO platform_fees (
          token_id, chain, fee_type, amount, native_amount, 
          from_address, to_address, tx_hash, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          null, // token_id (null for platform fees)
          this.config.chainId === 8453 ? 'base' : 'ethereum',
          feeType,
          amount, // USD amount (if calculated)
          amount, // Native amount
          userAddress || null,
          this.config.cfyTokenAddress,
          txHash,
          'pending',
        ]
      );
    } catch (error) {
      console.error('Error recording fee:', error);
    }
  }

  /**
   * Collect fee in CFY tokens (alternative method)
   * User pays fee directly in CFY tokens
   */
  async collectFeeInCFY(
    cfyAmount: string,
    feeType: string,
    userAddress: string
  ): Promise<{ success: boolean; txHash?: string }> {
    try {
      // This would require the user to approve CFY tokens first
      // For now, we'll use the native token method
      // In production, would implement ERC20 transfer and burn
      
      throw new Error('CFY token payment not yet implemented. Use native token payment.');
    } catch (error: any) {
      console.error('Error collecting fee in CFY:', error);
      return {
        success: false,
      };
    }
  }

  /**
   * Get fee collector address
   */
  getFeeCollectorAddress(): string {
    return this.feeCollectorWallet.address;
  }

  /**
   * Get CFY token address
   */
  getCFYTokenAddress(): string {
    return this.config.cfyTokenAddress;
  }
}

// Factory function to create CFY fee collection service
export function createCFYFeeCollectionService(chain: string): CFYFeeCollectionService | null {
  try {
    const chainConfig = getChainConfig(chain);
    if (!chainConfig) {
      console.warn(`CFY fee collection not configured for chain: ${chain}`);
      return null;
    }

    return new CFYFeeCollectionService(chainConfig);
  } catch (error) {
    console.error('Error creating CFY fee collection service:', error);
    return null;
  }
}

/**
 * Get chain configuration for CFY fee collection
 */
function getChainConfig(chain: string): CFYFeeCollectionConfig | null {
  const cfyTokenAddress = process.env.CFY_TOKEN_ADDRESS;
  const feeCollectorAddress = process.env.FEE_COLLECTOR_ADDRESS;

  if (!cfyTokenAddress || !feeCollectorAddress) {
    return null;
  }

  switch (chain.toLowerCase()) {
    case 'ethereum':
    case 'eth':
      return {
        cfyTokenAddress,
        feeCollectorAddress,
        rpcUrl: process.env.ETHEREUM_RPC_URL || 'https://eth.llamarpc.com',
        chainId: 1,
      };
    case 'base':
      return {
        cfyTokenAddress,
        feeCollectorAddress,
        rpcUrl: process.env.BASE_RPC_URL || 'https://mainnet.base.org',
        chainId: 8453,
      };
    case 'bsc':
      return {
        cfyTokenAddress,
        feeCollectorAddress,
        rpcUrl: process.env.BSC_RPC_URL || 'https://bsc-dataseed.binance.org',
        chainId: 56,
      };
    default:
      return null;
  }
}

/**
 * Calculate platform fee with CFY discount
 */
export async function calculatePlatformFee(
  baseFee: number,
  userAddress: string,
  chain: string
): Promise<{ originalFee: number; discountPercent: number; finalFee: number }> {
  const feeService = createCFYFeeCollectionService(chain);
  
  if (!feeService) {
    return {
      originalFee: baseFee,
      discountPercent: 0,
      finalFee: baseFee,
    };
  }

  const discountPercent = await feeService.getFeeDiscount(userAddress);
  const finalFee = baseFee * (1 - discountPercent / 100);

  return {
    originalFee: baseFee,
    discountPercent,
    finalFee,
  };
}

