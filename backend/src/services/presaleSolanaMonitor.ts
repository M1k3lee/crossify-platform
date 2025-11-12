import { Connection, PublicKey, ParsedTransactionWithMeta } from '@solana/web3.js';
import { pgGet, pgAll, pgRun } from '../db/postgres';

interface PresaleConfig {
  id: string;
  solana_address: string;
  presale_price: number;
  status: string;
}

interface TransactionRecord {
  solana_tx_hash: string;
  buyer_address: string;
  sol_amount: number;
  token_amount: string;
  referral_code?: string;
  referral_address?: string;
}

export class PresaleSolanaMonitor {
  private connection: Connection;
  private monitoringPresales: Map<string, NodeJS.Timeout> = new Map();
  private processedTransactions: Set<string> = new Set();

  constructor() {
    const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
    this.connection = new Connection(rpcUrl, 'confirmed');
    console.log('✅ PresaleSolanaMonitor initialized with RPC:', rpcUrl);
  }

  /**
   * Start monitoring a presale address for incoming SOL transactions
   */
  async startMonitoring(presaleId: string, solanaAddress: string): Promise<void> {
    if (this.monitoringPresales.has(presaleId)) {
      console.log(`⚠️  Already monitoring presale ${presaleId}`);
      return;
    }

    console.log(`🔍 Starting to monitor presale ${presaleId} at address ${solanaAddress}`);

    // Load processed transactions to avoid duplicates
    await this.loadProcessedTransactions(presaleId);

    // Poll for new transactions every 10 seconds
    const interval = setInterval(async () => {
      try {
        await this.checkForNewTransactions(presaleId, solanaAddress);
      } catch (error) {
        console.error(`❌ Error monitoring presale ${presaleId}:`, error);
      }
    }, 10000); // Check every 10 seconds

    this.monitoringPresales.set(presaleId, interval);

    // Do an initial check
    await this.checkForNewTransactions(presaleId, solanaAddress);
  }

  /**
   * Stop monitoring a presale
   */
  stopMonitoring(presaleId: string): void {
    const interval = this.monitoringPresales.get(presaleId);
    if (interval) {
      clearInterval(interval);
      this.monitoringPresales.delete(presaleId);
      console.log(`🛑 Stopped monitoring presale ${presaleId}`);
    }
  }

  /**
   * Check for new transactions to the presale address
   */
  private async checkForNewTransactions(presaleId: string, solanaAddress: string): Promise<void> {
    try {
      const publicKey = new PublicKey(solanaAddress);
      
      // Get recent signatures (last 50)
      const signatures = await this.connection.getSignaturesForAddress(publicKey, { limit: 50 });
      
      if (signatures.length === 0) {
        return;
      }

      // Get presale config
      const config = await pgGet<PresaleConfig>(
        'SELECT * FROM presale_config WHERE id = $1',
        [presaleId]
      );

      if (!config || config.status !== 'active') {
        console.log(`⚠️  Presale ${presaleId} is not active, skipping transaction check`);
        return;
      }

      // Process each signature
      for (const signatureInfo of signatures) {
        const txHash = signatureInfo.signature;
        
        // Skip if already processed
        if (this.processedTransactions.has(txHash)) {
          continue;
        }

        try {
          // Get transaction details
          const tx = await this.connection.getParsedTransaction(txHash, {
            maxSupportedTransactionVersion: 0,
          });

          if (!tx) {
            continue;
          }

          // Check if this transaction sent SOL to our presale address
          const transaction = await this.parseTransaction(tx, solanaAddress, config.presale_price);
          
          if (transaction) {
            await this.recordTransaction(presaleId, transaction);
            this.processedTransactions.add(txHash);
            console.log(`✅ Recorded new presale transaction: ${txHash}`);
          }
        } catch (error) {
          console.error(`❌ Error processing transaction ${txHash}:`, error);
        }
      }
    } catch (error) {
      console.error(`❌ Error checking for new transactions:`, error);
      throw error;
    }
  }

  /**
   * Parse a Solana transaction to extract presale payment details
   */
  private async parseTransaction(
    tx: ParsedTransactionWithMeta,
    presaleAddress: string,
    presalePrice: number
  ): Promise<TransactionRecord | null> {
    if (!tx.meta || tx.meta.err) {
      return null; // Transaction failed
    }

    const presalePubkey = new PublicKey(presaleAddress);
    let solAmount = 0;
    let buyerAddress = '';

    // Check preBalances and postBalances to find SOL transfers
    if (tx.meta.preBalances && tx.meta.postBalances && tx.transaction.message.accountKeys) {
      for (let i = 0; i < tx.transaction.message.accountKeys.length; i++) {
        const accountKey = tx.transaction.message.accountKeys[i];
        const accountPubkey = typeof accountKey === 'string' 
          ? new PublicKey(accountKey) 
          : accountKey.pubkey;

        // Check if this is the presale address
        if (accountPubkey.equals(presalePubkey)) {
          const preBalance = tx.meta.preBalances[i];
          const postBalance = tx.meta.postBalances[i];
          const balanceChange = (postBalance - preBalance) / 1e9; // Convert lamports to SOL

          if (balanceChange > 0) {
            solAmount = balanceChange;
            
            // Find the sender (account that decreased balance)
            for (let j = 0; j < tx.transaction.message.accountKeys.length; j++) {
              const senderKey = tx.transaction.message.accountKeys[j];
              const senderPubkey = typeof senderKey === 'string'
                ? new PublicKey(senderKey)
                : senderKey.pubkey;
              
              if (j !== i && tx.meta.preBalances[j] > tx.meta.postBalances[j]) {
                buyerAddress = senderPubkey.toString();
                break;
              }
            }
            break;
          }
        }
      }
    }

    // Also check instruction data for transfer instructions
    if (tx.transaction.message.instructions) {
      for (const instruction of tx.transaction.message.instructions) {
        if ('parsed' in instruction && instruction.parsed?.type === 'transfer') {
          const parsed = instruction.parsed;
          if (parsed.info?.destination === presaleAddress) {
            const amount = parsed.info.lamports / 1e9; // Convert to SOL
            if (amount > 0) {
              solAmount = amount;
              buyerAddress = parsed.info.authority || parsed.info.source || '';
            }
          }
        }
      }
    }

    if (solAmount <= 0 || !buyerAddress) {
      return null; // No valid SOL transfer found
    }

    // Calculate token amount based on presale price
    const tokenAmount = (solAmount / presalePrice).toFixed(0);

    // Check for referral code in transaction memo (if present)
    let referralCode: string | undefined;
    let referralAddress: string | undefined;

    // Look for memo instruction
    if (tx.transaction.message.instructions) {
      for (const instruction of tx.transaction.message.instructions) {
        if ('parsed' in instruction && instruction.parsed?.type === 'memo') {
          const memo = instruction.parsed?.memo || '';
          // Check if memo contains a referral code (format: REF:CODE or ref:CODE)
          const refMatch = memo.match(/ref[:\s]+(\w+)/i);
          if (refMatch) {
            referralCode = refMatch[1];
            // Look up affiliate by code
            const affiliate = await pgGet<{ affiliate_address: string }>(
              'SELECT affiliate_address FROM presale_affiliates WHERE referral_code = $1',
              [referralCode]
            );
            if (affiliate) {
              referralAddress = affiliate.affiliate_address;
            }
          }
        }
      }
    }

    return {
      solana_tx_hash: tx.transaction.signatures[0],
      buyer_address: buyerAddress,
      sol_amount: solAmount,
      token_amount: tokenAmount,
      referral_code: referralCode,
      referral_address: referralAddress,
    };
  }

  /**
   * Record a transaction in the database
   */
  private async recordTransaction(presaleId: string, transaction: TransactionRecord): Promise<void> {
    try {
      // Insert transaction
      const txResult = await pgRun(
        `INSERT INTO presale_transactions 
         (presale_id, solana_tx_hash, buyer_address, sol_amount, token_amount, referral_code, referral_address, status, confirmed_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'confirmed', CURRENT_TIMESTAMP)
         ON CONFLICT (solana_tx_hash) DO NOTHING
         RETURNING id`,
        [
          presaleId,
          transaction.solana_tx_hash,
          transaction.buyer_address,
          transaction.sol_amount,
          transaction.token_amount,
          transaction.referral_code || null,
          transaction.referral_address || null,
        ]
      );

      if (!txResult.lastID) {
        // Transaction already exists
        return;
      }

      const transactionId = txResult.lastID;

      // Update or create allocation
      await pgRun(
        `INSERT INTO presale_allocations 
         (presale_id, buyer_address, total_sol_contributed, total_tokens_allocated, transaction_count, first_contribution_at, last_contribution_at)
         VALUES ($1, $2, $3, $4, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         ON CONFLICT (presale_id, buyer_address) 
         DO UPDATE SET
           total_sol_contributed = presale_allocations.total_sol_contributed + $3,
           total_tokens_allocated = (presale_allocations.total_tokens_allocated::bigint + $4::bigint)::text,
           transaction_count = presale_allocations.transaction_count + 1,
           last_contribution_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP`,
        [
          presaleId,
          transaction.buyer_address,
          transaction.sol_amount,
          transaction.token_amount,
        ]
      );

      // Update presale totals
      await pgRun(
        `UPDATE presale_config 
         SET total_raised_sol = total_raised_sol + $1,
             total_contributors = (SELECT COUNT(DISTINCT buyer_address) FROM presale_allocations WHERE presale_id = $2),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [transaction.sol_amount, presaleId]
      );

      // Handle affiliate rewards if referral code exists
      if (transaction.referral_code && transaction.referral_address) {
        await this.processAffiliateReward(
          presaleId,
          transaction.referral_code,
          transaction.referral_address,
          transaction.sol_amount,
          transaction.buyer_address,
          transactionId
        );
      }

      // Accumulate funds for splitting and check if auto-split should trigger
      try {
        const { getPresaleFundSplitter } = await import('./presaleFundSplitter');
        const splitter = getPresaleFundSplitter();
        
        // Accumulate funds
        await splitter.accumulateFunds(presaleId, transaction.sol_amount, transactionId);
        
        // Check if auto-split should trigger
        await splitter.checkAndAutoSplit(presaleId);
      } catch (error) {
        console.error('⚠️  Error in fund splitting (non-fatal):', error);
        // Don't throw - fund splitting failure shouldn't break transaction recording
      }
    } catch (error) {
      console.error('❌ Error recording transaction:', error);
      throw error;
    }
  }

  /**
   * Process affiliate reward for a referral
   */
  private async processAffiliateReward(
    presaleId: string,
    referralCode: string,
    affiliateAddress: string,
    solAmount: number,
    buyerAddress: string,
    transactionId: number
  ): Promise<void> {
    try {
      // Get presale config for reward percentage
      const config = await pgGet<{ affiliate_reward_percentage: number }>(
        'SELECT affiliate_reward_percentage FROM presale_config WHERE id = $1',
        [presaleId]
      );

      if (!config) {
        return;
      }

      const rewardAmount = (solAmount * config.affiliate_reward_percentage) / 100;

      // Get or create affiliate record
      const affiliate = await pgGet<{ id: number }>(
        'SELECT id FROM presale_affiliates WHERE presale_id = $1 AND referral_code = $2',
        [presaleId, referralCode]
      );

      let affiliateId: number;
      if (affiliate) {
        affiliateId = affiliate.id;
        // Update affiliate stats
        await pgRun(
          `UPDATE presale_affiliates 
           SET total_referrals = total_referrals + 1,
               total_volume_sol = total_volume_sol + $1,
               total_rewards_sol = total_rewards_sol + $2,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $3`,
          [solAmount, rewardAmount, affiliateId]
        );
      } else {
        // Create new affiliate record
        const result = await pgRun(
          `INSERT INTO presale_affiliates 
           (presale_id, referral_code, affiliate_address, total_referrals, total_volume_sol, total_rewards_sol)
           VALUES ($1, $2, $3, 1, $4, $5)
           RETURNING id`,
          [presaleId, referralCode, affiliateAddress, solAmount, rewardAmount]
        );
        affiliateId = result.lastID;
      }

      // Record referral
      await pgRun(
        `INSERT INTO presale_referrals 
         (presale_id, affiliate_id, referral_code, buyer_address, sol_amount, reward_amount_sol, transaction_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [presaleId, affiliateId, referralCode, buyerAddress, solAmount, rewardAmount, transactionId]
      );

      console.log(`✅ Processed affiliate reward: ${rewardAmount} SOL for referral ${referralCode}`);
    } catch (error) {
      console.error('❌ Error processing affiliate reward:', error);
    }
  }

  /**
   * Load already processed transactions to avoid duplicates
   */
  private async loadProcessedTransactions(presaleId: string): Promise<void> {
    try {
      const transactions = await pgAll<{ solana_tx_hash: string }>(
        'SELECT solana_tx_hash FROM presale_transactions WHERE presale_id = $1',
        [presaleId]
      );

      transactions.forEach(tx => {
        this.processedTransactions.add(tx.solana_tx_hash);
      });

      console.log(`📋 Loaded ${transactions.length} processed transactions for presale ${presaleId}`);
    } catch (error) {
      console.error('❌ Error loading processed transactions:', error);
    }
  }

  /**
   * Manually process a transaction by hash (for testing or manual entry)
   */
  async processTransactionManually(presaleId: string, txHash: string): Promise<void> {
    try {
      const config = await pgGet<PresaleConfig>(
        'SELECT * FROM presale_config WHERE id = $1',
        [presaleId]
      );

      if (!config) {
        throw new Error(`Presale ${presaleId} not found`);
      }

      const tx = await this.connection.getParsedTransaction(txHash, {
        maxSupportedTransactionVersion: 0,
      });

      if (!tx) {
        throw new Error(`Transaction ${txHash} not found`);
      }

      const transaction = await this.parseTransaction(tx, config.solana_address, config.presale_price);
      
      if (transaction) {
        await this.recordTransaction(presaleId, transaction);
        this.processedTransactions.add(txHash);
        console.log(`✅ Manually processed transaction: ${txHash}`);
      } else {
        throw new Error(`Transaction ${txHash} does not contain a valid presale payment`);
      }
    } catch (error) {
      console.error(`❌ Error manually processing transaction:`, error);
      throw error;
    }
  }
}

// Singleton instance
let monitorInstance: PresaleSolanaMonitor | null = null;

export function getPresaleMonitor(): PresaleSolanaMonitor {
  if (!monitorInstance) {
    monitorInstance = new PresaleSolanaMonitor();
  }
  return monitorInstance;
}

