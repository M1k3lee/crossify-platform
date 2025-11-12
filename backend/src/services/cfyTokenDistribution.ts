import { Connection, Keypair, PublicKey, Transaction, sendAndConfirmTransaction } from '@solana/web3.js';
import { 
  getAssociatedTokenAddress, 
  createTransferInstruction, 
  getAccount,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
} from '@solana/spl-token';
import bs58 from 'bs58';
import { pgGet, pgRun, pgAll } from '../db/postgres';

interface DistributionRecord {
  buyer_address: string;
  token_amount: string;
  status: 'pending' | 'distributed' | 'failed';
  tx_hash?: string;
  error_message?: string;
}

interface BatchDistributionResult {
  success: boolean;
  distributed: number;
  failed: number;
  txHashes: string[];
  errors: string[];
}

/**
 * CFY Token Distribution Service
 * Handles automated distribution of CFY tokens to presale buyers
 */
export class CFYTokenDistributionService {
  private connection: Connection;
  private distributorWallet: Keypair | null = null;
  private tokenMintAddress: PublicKey | null = null;

  constructor() {
    const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
    this.connection = new Connection(rpcUrl, 'confirmed');
    
    // Load distributor wallet (must hold CFY tokens)
    const distributorKey = process.env.SOLANA_DISTRIBUTOR_PRIVATE_KEY || process.env.SOLANA_OPERATOR_PRIVATE_KEY || process.env.SOLANA_PRIVATE_KEY;
    if (distributorKey) {
      try {
        if (distributorKey.length >= 80 && distributorKey.length <= 100) {
          const decoded = bs58.decode(distributorKey);
          if (decoded.length === 64) {
            this.distributorWallet = Keypair.fromSecretKey(decoded);
            console.log('✅ CFYTokenDistributionService: Distributor wallet loaded');
          }
        } else {
          const keyArray = JSON.parse(distributorKey);
          if (Array.isArray(keyArray) && keyArray.length === 64) {
            this.distributorWallet = Keypair.fromSecretKey(new Uint8Array(keyArray));
            console.log('✅ CFYTokenDistributionService: Distributor wallet loaded (JSON format)');
          }
        }
      } catch (error) {
        console.warn('⚠️  CFYTokenDistributionService: Could not load distributor wallet:', error);
      }
    } else {
      console.warn('⚠️  CFYTokenDistributionService: SOLANA_DISTRIBUTOR_PRIVATE_KEY not set. Token distribution will be disabled.');
    }

    // Load token mint address
    const tokenMint = process.env.CFY_TOKEN_MINT_ADDRESS;
    if (tokenMint) {
      try {
        this.tokenMintAddress = new PublicKey(tokenMint);
        console.log('✅ CFYTokenDistributionService: Token mint address loaded:', tokenMint);
      } catch (error) {
        console.warn('⚠️  CFYTokenDistributionService: Invalid CFY_TOKEN_MINT_ADDRESS:', error);
      }
    } else {
      console.warn('⚠️  CFYTokenDistributionService: CFY_TOKEN_MINT_ADDRESS not set.');
    }
  }

  /**
   * Distribute tokens to a single buyer
   */
  async distributeToBuyer(
    buyerAddress: string,
    tokenAmount: string,
    presaleId: string,
    allocationId?: number
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    if (!this.distributorWallet || !this.tokenMintAddress) {
      return {
        success: false,
        error: 'Distributor wallet or token mint address not configured',
      };
    }

    try {
      const buyerPubkey = new PublicKey(buyerAddress);
      const amount = BigInt(tokenAmount);

      // Get or create associated token account for buyer
      const buyerTokenAccount = await getAssociatedTokenAddress(
        this.tokenMintAddress,
        buyerPubkey,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      // Check if token account exists
      let tokenAccountExists = false;
      try {
        await getAccount(this.connection, buyerTokenAccount);
        tokenAccountExists = true;
      } catch (error) {
        // Account doesn't exist, will create it
        tokenAccountExists = false;
      }

      // Get distributor's token account
      const distributorTokenAccount = await getAssociatedTokenAddress(
        this.tokenMintAddress,
        this.distributorWallet.publicKey,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      // Build transaction
      const transaction = new Transaction();

      // Create associated token account if it doesn't exist
      if (!tokenAccountExists) {
        transaction.add(
          createAssociatedTokenAccountInstruction(
            this.distributorWallet.publicKey,
            buyerTokenAccount,
            buyerPubkey,
            this.tokenMintAddress,
            TOKEN_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID
          )
        );
      }

      // Add transfer instruction
      transaction.add(
        createTransferInstruction(
          distributorTokenAccount,
          buyerTokenAccount,
          this.distributorWallet.publicKey,
          amount,
          [],
          TOKEN_PROGRAM_ID
        )
      );

      // Send transaction
      const txHash = await sendAndConfirmTransaction(
        this.connection,
        transaction,
        [this.distributorWallet],
        { commitment: 'confirmed' }
      );

      // Update allocation record
      if (allocationId) {
        await pgRun(
          `UPDATE presale_allocations 
           SET tokens_claimed = true, tokens_claimed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
           WHERE id = $1`,
          [allocationId]
        );
      }

      console.log(`✅ Distributed ${tokenAmount} CFY to ${buyerAddress}: ${txHash}`);
      return { success: true, txHash };
    } catch (error: any) {
      console.error(`❌ Error distributing tokens to ${buyerAddress}:`, error);
      return {
        success: false,
        error: error.message || String(error),
      };
    }
  }

  /**
   * Batch distribute tokens to multiple buyers
   * Uses multiple transactions (Solana has transaction size limits)
   */
  async batchDistribute(
    presaleId: string,
    batchSize: number = 10,
    maxRecipients?: number
  ): Promise<BatchDistributionResult> {
    if (!this.distributorWallet || !this.tokenMintAddress) {
      return {
        success: false,
        distributed: 0,
        failed: 0,
        txHashes: [],
        errors: ['Distributor wallet or token mint address not configured'],
      };
    }

    try {
      // Get all unclaimed allocations
      const query = maxRecipients
        ? `SELECT id, buyer_address, total_tokens_allocated 
           FROM presale_allocations 
           WHERE presale_id = $1 AND tokens_claimed = false 
           ORDER BY first_contribution_at ASC 
           LIMIT $2`
        : `SELECT id, buyer_address, total_tokens_allocated 
           FROM presale_allocations 
           WHERE presale_id = $1 AND tokens_claimed = false 
           ORDER BY first_contribution_at ASC`;

      const allocations = await pgAll<{
        id: number;
        buyer_address: string;
        total_tokens_allocated: string;
      }>(query, maxRecipients ? [presaleId, maxRecipients] : [presaleId]);

      if (allocations.length === 0) {
        return {
          success: true,
          distributed: 0,
          failed: 0,
          txHashes: [],
          errors: [],
        };
      }

      console.log(`📦 Starting batch distribution for ${allocations.length} buyers...`);

      const result: BatchDistributionResult = {
        success: true,
        distributed: 0,
        failed: 0,
        txHashes: [],
        errors: [],
      };

      // Process in batches
      for (let i = 0; i < allocations.length; i += batchSize) {
        const batch = allocations.slice(i, i + batchSize);
        console.log(`📤 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(allocations.length / batchSize)} (${batch.length} recipients)...`);

        // Distribute to each buyer in the batch
        for (const allocation of batch) {
          const distResult = await this.distributeToBuyer(
            allocation.buyer_address,
            allocation.total_tokens_allocated,
            presaleId,
            allocation.id
          );

          if (distResult.success) {
            result.distributed++;
            if (distResult.txHash) {
              result.txHashes.push(distResult.txHash);
            }
          } else {
            result.failed++;
            result.errors.push(`${allocation.buyer_address}: ${distResult.error || 'Unknown error'}`);
          }

          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        // Delay between batches
        if (i + batchSize < allocations.length) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      console.log(`✅ Batch distribution complete: ${result.distributed} distributed, ${result.failed} failed`);
      return result;
    } catch (error: any) {
      console.error('❌ Error in batch distribution:', error);
      return {
        success: false,
        distributed: 0,
        failed: 0,
        txHashes: [],
        errors: [error.message || String(error)],
      };
    }
  }

  /**
   * Distribute TGE (Token Generation Event) tokens
   * Releases 20% of each buyer's allocation immediately
   */
  async distributeTGE(presaleId: string, tgePercentage: number = 20): Promise<BatchDistributionResult> {
    if (!this.distributorWallet || !this.tokenMintAddress) {
      return {
        success: false,
        distributed: 0,
        failed: 0,
        txHashes: [],
        errors: ['Distributor wallet or token mint address not configured'],
      };
    }

    try {
      // Get all allocations
      const allocations = await pgAll<{
        id: number;
        buyer_address: string;
        total_tokens_allocated: string;
      }>(
        `SELECT id, buyer_address, total_tokens_allocated 
         FROM presale_allocations 
         WHERE presale_id = $1 
         ORDER BY first_contribution_at ASC`,
        [presaleId]
      );

      if (allocations.length === 0) {
        return {
          success: true,
          distributed: 0,
          failed: 0,
          txHashes: [],
          errors: [],
        };
      }

      console.log(`🎉 Starting TGE distribution (${tgePercentage}%) for ${allocations.length} buyers...`);

      const result: BatchDistributionResult = {
        success: true,
        distributed: 0,
        failed: 0,
        txHashes: [],
        errors: [],
      };

      // Calculate TGE amount for each buyer
      for (const allocation of allocations) {
        const totalAmount = BigInt(allocation.total_tokens_allocated);
        const tgeAmount = (totalAmount * BigInt(tgePercentage)) / BigInt(100);
        const tgeAmountString = tgeAmount.toString();

        const distResult = await this.distributeToBuyer(
          allocation.buyer_address,
          tgeAmountString,
          presaleId,
          allocation.id
        );

        if (distResult.success) {
          result.distributed++;
          if (distResult.txHash) {
            result.txHashes.push(distResult.txHash);
          }
        } else {
          result.failed++;
          result.errors.push(`${allocation.buyer_address}: ${distResult.error || 'Unknown error'}`);
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      console.log(`✅ TGE distribution complete: ${result.distributed} distributed, ${result.failed} failed`);
      return result;
    } catch (error: any) {
      console.error('❌ Error in TGE distribution:', error);
      return {
        success: false,
        distributed: 0,
        failed: 0,
        txHashes: [],
        errors: [error.message || String(error)],
      };
    }
  }

  /**
   * Get distribution status for a presale
   */
  async getDistributionStatus(presaleId: string) {
    const stats = await pgGet<{
      total_buyers: number;
      claimed_buyers: number;
      unclaimed_buyers: number;
      total_tokens: string;
      claimed_tokens: string;
      unclaimed_tokens: string;
    }>(
      `SELECT 
        COUNT(*) as total_buyers,
        COUNT(*) FILTER (WHERE tokens_claimed = true) as claimed_buyers,
        COUNT(*) FILTER (WHERE tokens_claimed = false) as unclaimed_buyers,
        SUM(total_tokens_allocated::bigint)::text as total_tokens,
        SUM(total_tokens_allocated::bigint) FILTER (WHERE tokens_claimed = true)::text as claimed_tokens,
        SUM(total_tokens_allocated::bigint) FILTER (WHERE tokens_claimed = false)::text as unclaimed_tokens
       FROM presale_allocations 
       WHERE presale_id = $1`,
      [presaleId]
    );

    return stats || {
      total_buyers: 0,
      claimed_buyers: 0,
      unclaimed_buyers: 0,
      total_tokens: '0',
      claimed_tokens: '0',
      unclaimed_tokens: '0',
    };
  }

  /**
   * Get list of unclaimed allocations
   */
  async getUnclaimedAllocations(presaleId: string, limit: number = 100) {
    return await pgAll(
      `SELECT id, buyer_address, total_tokens_allocated, total_sol_contributed, first_contribution_at
       FROM presale_allocations 
       WHERE presale_id = $1 AND tokens_claimed = false 
       ORDER BY first_contribution_at ASC 
       LIMIT $2`,
      [presaleId, limit]
    );
  }
}

// Singleton instance
let distributionInstance: CFYTokenDistributionService | null = null;

export function getCFYTokenDistributionService(): CFYTokenDistributionService {
  if (!distributionInstance) {
    distributionInstance = new CFYTokenDistributionService();
  }
  return distributionInstance;
}

