import { Connection, Keypair, PublicKey, SystemProgram, Transaction, sendAndConfirmTransaction, LAMPORTS_PER_SOL } from '@solana/web3.js';
import bs58 from 'bs58';
import { pgGet, pgRun, pgAll } from '../db/postgres';

interface PresaleConfig {
  id: string;
  solana_address: string;
  liquidity_percentage: number;
  dev_percentage: number;
  marketing_percentage: number;
  liquidity_wallet: string | null;
  dev_wallet: string | null;
  marketing_wallet: string | null;
  auto_split_enabled: boolean;
  split_threshold_sol: number;
}

interface FundSplit {
  liquidity_amount: number;
  dev_amount: number;
  marketing_amount: number;
  total_amount: number;
}

export class PresaleFundSplitter {
  private connection: Connection;
  private operatorWallet: Keypair | null = null;

  constructor() {
    const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
    this.connection = new Connection(rpcUrl, 'confirmed');
    
    // Load operator wallet (separate from presale wallet for security)
    // This wallet needs permission to transfer from presale wallet
    const operatorKey = process.env.SOLANA_OPERATOR_PRIVATE_KEY || process.env.SOLANA_PRIVATE_KEY;
    if (operatorKey) {
      try {
        if (operatorKey.length >= 80 && operatorKey.length <= 100) {
          const decoded = bs58.decode(operatorKey);
          if (decoded.length === 64) {
            this.operatorWallet = Keypair.fromSecretKey(decoded);
            console.log('✅ PresaleFundSplitter: Operator wallet loaded');
          }
        } else {
          const keyArray = JSON.parse(operatorKey);
          if (Array.isArray(keyArray) && keyArray.length === 64) {
            this.operatorWallet = Keypair.fromSecretKey(new Uint8Array(keyArray));
            console.log('✅ PresaleFundSplitter: Operator wallet loaded (JSON format)');
          }
        }
      } catch (error) {
        console.warn('⚠️  PresaleFundSplitter: Could not load operator wallet:', error);
      }
    } else {
      console.warn('⚠️  PresaleFundSplitter: SOLANA_OPERATOR_PRIVATE_KEY not set. Fund splitting will be disabled.');
    }
  }

  /**
   * Calculate how much SOL should go to each wallet based on tokenomics
   */
  calculateSplit(amount: number, config: PresaleConfig): FundSplit {
    const liquidityAmount = (amount * config.liquidity_percentage) / 100;
    const devAmount = (amount * config.dev_percentage) / 100;
    const marketingAmount = (amount * config.marketing_percentage) / 100;
    
    // Round to avoid floating point issues
    const total = liquidityAmount + devAmount + marketingAmount;
    const difference = amount - total; // Handle rounding errors
    
    return {
      liquidity_amount: Math.round(liquidityAmount * 1e9) / 1e9, // Round to 9 decimals
      dev_amount: Math.round(devAmount * 1e9) / 1e9,
      marketing_amount: Math.round((marketingAmount + difference) * 1e9) / 1e9, // Add difference to marketing
      total_amount: amount,
    };
  }

  /**
   * Split funds from presale wallet to allocation wallets
   * This requires the operator wallet to have access to the presale wallet
   * OR the presale wallet's private key to be the operator wallet
   */
  async splitFunds(presaleId: string, amount?: number): Promise<{
    success: boolean;
    splitId?: number;
    txHashes?: string[];
    error?: string;
  }> {
    if (!this.operatorWallet) {
      return {
        success: false,
        error: 'Operator wallet not configured. Set SOLANA_OPERATOR_PRIVATE_KEY environment variable.',
      };
    }

    try {
      // Get presale config
      const config = await pgGet<PresaleConfig>(
        `SELECT id, solana_address, liquidity_percentage, dev_percentage, marketing_percentage,
                liquidity_wallet, dev_wallet, marketing_wallet, auto_split_enabled, split_threshold_sol
         FROM presale_config WHERE id = $1`,
        [presaleId]
      );

      if (!config) {
        return { success: false, error: `Presale ${presaleId} not found` };
      }

      // Check if wallets are configured
      if (!config.liquidity_wallet || !config.dev_wallet || !config.marketing_wallet) {
        return {
          success: false,
          error: 'Allocation wallets not configured. Please set liquidity_wallet, dev_wallet, and marketing_wallet.',
        };
      }

      const presalePubkey = new PublicKey(config.solana_address);
      
      // Get presale wallet balance
      const balance = await this.connection.getBalance(presalePubkey);
      const balanceSOL = balance / LAMPORTS_PER_SOL;

      // Determine amount to split
      let amountToSplit: number;
      if (amount) {
        amountToSplit = amount;
      } else {
        // Use accumulated unsplit funds or current balance
        const unsplit = await pgGet<{ accumulated_sol: number }>(
          'SELECT accumulated_sol FROM presale_unsplit_funds WHERE presale_id = $1',
          [presaleId]
        );
        amountToSplit = unsplit?.accumulated_sol || balanceSOL;
      }

      // Check threshold
      if (amountToSplit < config.split_threshold_sol) {
        return {
          success: false,
          error: `Amount ${amountToSplit} SOL is below threshold ${config.split_threshold_sol} SOL`,
        };
      }

      // Check if we have enough balance
      if (balanceSOL < amountToSplit) {
        return {
          success: false,
          error: `Insufficient balance. Presale wallet has ${balanceSOL} SOL, requested ${amountToSplit} SOL`,
        };
      }

      // Calculate split amounts
      const split = this.calculateSplit(amountToSplit, config);

      // Create split record
      const splitResult = await pgRun(
        `INSERT INTO presale_fund_splits 
         (presale_id, total_sol_amount, liquidity_amount, dev_amount, marketing_amount, status)
         VALUES ($1, $2, $3, $4, $5, 'pending')
         RETURNING id`,
        [presaleId, split.total_amount, split.liquidity_amount, split.dev_amount, split.marketing_amount]
      );

      const splitId = splitResult.lastID;

      // IMPORTANT: For this to work, the operator wallet must be the presale wallet
      // OR you need to set up a multi-sig or program that allows the operator to transfer
      // For now, we assume operator wallet = presale wallet (or has authority)
      const fromWallet = this.operatorWallet; // In production, this should be the presale wallet's keypair

      const txHashes: string[] = [];
      const liquidityPubkey = new PublicKey(config.liquidity_wallet!);
      const devPubkey = new PublicKey(config.dev_wallet!);
      const marketingPubkey = new PublicKey(config.marketing_wallet!);

      // Create transactions for each transfer
      // Note: We'll do them separately to track each one
      let liquidityTxHash: string | null = null;
      let devTxHash: string | null = null;
      let marketingTxHash: string | null = null;

      try {
        // Transfer to liquidity wallet
        if (split.liquidity_amount > 0) {
          const liquidityTx = new Transaction().add(
            SystemProgram.transfer({
              fromPubkey: fromWallet.publicKey,
              toPubkey: liquidityPubkey,
              lamports: Math.floor(split.liquidity_amount * LAMPORTS_PER_SOL),
            })
          );
          liquidityTxHash = await sendAndConfirmTransaction(
            this.connection,
            liquidityTx,
            [fromWallet],
            { commitment: 'confirmed' }
          );
          txHashes.push(liquidityTxHash);
          console.log(`✅ Transferred ${split.liquidity_amount} SOL to liquidity wallet: ${liquidityTxHash}`);
        }

        // Transfer to dev wallet
        if (split.dev_amount > 0) {
          const devTx = new Transaction().add(
            SystemProgram.transfer({
              fromPubkey: fromWallet.publicKey,
              toPubkey: devPubkey,
              lamports: Math.floor(split.dev_amount * LAMPORTS_PER_SOL),
            })
          );
          devTxHash = await sendAndConfirmTransaction(
            this.connection,
            devTx,
            [fromWallet],
            { commitment: 'confirmed' }
          );
          txHashes.push(devTxHash);
          console.log(`✅ Transferred ${split.dev_amount} SOL to dev wallet: ${devTxHash}`);
        }

        // Transfer to marketing wallet
        if (split.marketing_amount > 0) {
          const marketingTx = new Transaction().add(
            SystemProgram.transfer({
              fromPubkey: fromWallet.publicKey,
              toPubkey: marketingPubkey,
              lamports: Math.floor(split.marketing_amount * LAMPORTS_PER_SOL),
            })
          );
          marketingTxHash = await sendAndConfirmTransaction(
            this.connection,
            marketingTx,
            [fromWallet],
            { commitment: 'confirmed' }
          );
          txHashes.push(marketingTxHash);
          console.log(`✅ Transferred ${split.marketing_amount} SOL to marketing wallet: ${marketingTxHash}`);
        }

        // Update split record
        await pgRun(
          `UPDATE presale_fund_splits 
           SET liquidity_tx_hash = $1, dev_tx_hash = $2, marketing_tx_hash = $3,
               status = 'completed', completed_at = CURRENT_TIMESTAMP
           WHERE id = $4`,
          [liquidityTxHash, devTxHash, marketingTxHash, splitId]
        );

        // Clear accumulated unsplit funds
        await pgRun(
          `UPDATE presale_unsplit_funds 
           SET accumulated_sol = 0, last_updated_at = CURRENT_TIMESTAMP
           WHERE presale_id = $1`,
          [presaleId]
        );

        return {
          success: true,
          splitId,
          txHashes,
        };
      } catch (error: any) {
        // Update split record with error
        await pgRun(
          `UPDATE presale_fund_splits 
           SET status = 'failed', error_message = $1
           WHERE id = $2`,
          [error.message || String(error), splitId]
        );

        return {
          success: false,
          splitId,
          error: error.message || String(error),
        };
      }
    } catch (error: any) {
      console.error('❌ Error splitting funds:', error);
      return {
        success: false,
        error: error.message || String(error),
      };
    }
  }

  /**
   * Accumulate funds for splitting (called when new transactions are detected)
   * This tracks how much SOL is waiting to be split
   */
  async accumulateFunds(presaleId: string, solAmount: number, transactionId?: number): Promise<void> {
    try {
      await pgRun(
        `INSERT INTO presale_unsplit_funds (presale_id, accumulated_sol, last_transaction_id, last_updated_at)
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
         ON CONFLICT (presale_id) 
         DO UPDATE SET 
           accumulated_sol = presale_unsplit_funds.accumulated_sol + $2,
           last_transaction_id = COALESCE($3, presale_unsplit_funds.last_transaction_id),
           last_updated_at = CURRENT_TIMESTAMP`,
        [presaleId, solAmount, transactionId || null]
      );
    } catch (error) {
      console.error('❌ Error accumulating funds:', error);
    }
  }

  /**
   * Check if auto-split should be triggered
   */
  async checkAndAutoSplit(presaleId: string): Promise<void> {
    try {
      const config = await pgGet<PresaleConfig>(
        `SELECT id, auto_split_enabled, split_threshold_sol
         FROM presale_config WHERE id = $1`,
        [presaleId]
      );

      if (!config || !config.auto_split_enabled) {
        return; // Auto-split disabled
      }

      const unsplit = await pgGet<{ accumulated_sol: number }>(
        'SELECT accumulated_sol FROM presale_unsplit_funds WHERE presale_id = $1',
        [presaleId]
      );

      if (unsplit && unsplit.accumulated_sol >= config.split_threshold_sol) {
        console.log(`🔄 Auto-splitting ${unsplit.accumulated_sol} SOL for presale ${presaleId}`);
        const result = await this.splitFunds(presaleId);
        if (result.success) {
          console.log(`✅ Auto-split completed: ${result.txHashes?.join(', ')}`);
        } else {
          console.error(`❌ Auto-split failed: ${result.error}`);
        }
      }
    } catch (error) {
      console.error('❌ Error checking auto-split:', error);
    }
  }

  /**
   * Get split history for a presale
   */
  async getSplitHistory(presaleId: string, limit: number = 50) {
    return await pgAll(
      `SELECT * FROM presale_fund_splits 
       WHERE presale_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2`,
      [presaleId, limit]
    );
  }

  /**
   * Get current unsplit funds
   */
  async getUnsplitFunds(presaleId: string) {
    return await pgGet(
      'SELECT * FROM presale_unsplit_funds WHERE presale_id = $1',
      [presaleId]
    );
  }
}

// Singleton instance
let splitterInstance: PresaleFundSplitter | null = null;

export function getPresaleFundSplitter(): PresaleFundSplitter {
  if (!splitterInstance) {
    splitterInstance = new PresaleFundSplitter();
  }
  return splitterInstance;
}




