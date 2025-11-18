/**
 * Hedera Consensus Service (HCS) Audit Logging
 * 
 * This service provides immutable, timestamped audit logs for all cross-chain
 * price synchronization events and bonding curve transactions.
 * 
 * HCS acts as a "decentralized Kafka" that provides:
 * - Immutable, timestamped event logs
 * - Cryptographically verifiable ordering
 * - No smart contract required (just message submission)
 * - Extremely low cost (~$0.0001 per message)
 * 
 * Powered by Hedera - providing enterprise-grade audit trails for cross-chain operations
 */

import { 
  Client, 
  TopicCreateTransaction, 
  TopicMessageSubmitTransaction, 
  TopicId,
  PrivateKey,
  AccountId,
  AccountInfoQuery
} from "@hashgraph/sdk";

export interface PriceSyncEvent {
  tokenAddress: string;
  sourceChain: string;
  targetChains: string[];
  oldGlobalSupply: string;
  newGlobalSupply: string;
  timestamp: number;
  layerZeroTxHash?: string;
  ccipTxHash?: string;
}

export interface BondingCurveTransaction {
  tokenAddress: string;
  chain: string;
  transactionType: "BUY" | "SELL";
  amount: string;
  price: string;
  newSupply: string;
  txHash: string;
  userAddress: string;
  timestamp: number;
}

export class HederaAuditService {
  private client: Client | null = null;
  private topicId: TopicId | null = null;
  private initialized: boolean = false;

  /**
   * Initialize HCS client and topic
   * Call this once at application startup
   * 
   * Powered by Hedera Consensus Service
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      console.log("ℹ️  Hedera Audit Service already initialized");
      return;
    }

    console.log("🔍 Initializing Hedera Audit Service (HCS)...");
    
    try {
      // Get Hedera account credentials from environment
      const accountId = process.env.HEDERA_ACCOUNT_ID;
      const privateKeyStr = process.env.HEDERA_PRIVATE_KEY;

      console.log(`🔍 Checking Hedera credentials...`);
      console.log(`   HEDERA_ACCOUNT_ID: ${accountId ? '✅ Set' : '❌ Not set'}`);
      console.log(`   HEDERA_PRIVATE_KEY: ${privateKeyStr ? '✅ Set' : '❌ Not set'}`);

      if (!accountId || !privateKeyStr) {
        console.warn("⚠️  Hedera credentials not configured. HCS audit logging disabled.");
        console.warn("   Set HEDERA_ACCOUNT_ID and HEDERA_PRIVATE_KEY to enable.");
        return;
      }

      // Initialize Hedera client
      const isMainnet = process.env.NODE_ENV === 'production' && process.env.HEDERA_MAINNET === 'true';
      this.client = isMainnet ? Client.forMainnet() : Client.forTestnet();
      
      // Parse private key - Hedera SDK supports multiple formats
      // Use fromStringED25519() for hex-encoded strings (recommended by SDK)
      let privateKey: PrivateKey;
      try {
        // Remove 0x prefix if present
        const privateKeyHex = privateKeyStr.replace(/^0x/, '').trim();
        
        // Try multiple parsing methods (in order of preference)
        if (privateKeyHex.length === 64) {
          // 64 hex chars = 32 bytes (ED25519 private key)
          // Use fromStringED25519() for hex strings (recommended by SDK)
          try {
            privateKey = PrivateKey.fromStringED25519(privateKeyHex);
            console.log('✅ Parsed Hedera private key using fromStringED25519() (64 hex chars)');
          } catch (ed25519Error) {
            // Fallback to fromBytes if fromStringED25519 fails
            try {
              const keyBytes = Buffer.from(privateKeyHex, 'hex');
              if (keyBytes.length === 32) {
                privateKey = PrivateKey.fromBytes(keyBytes);
                console.log('✅ Parsed Hedera private key as hex bytes (32 bytes)');
              } else {
                throw new Error(`Invalid key length: ${keyBytes.length} bytes (expected 32)`);
              }
            } catch (bytesError) {
              // Try as DER string format
              try {
                privateKey = PrivateKey.fromString(privateKeyStr);
                console.log('✅ Parsed Hedera private key as DER string');
              } catch (derError) {
                throw new Error(`Failed to parse as ED25519: ${ed25519Error instanceof Error ? ed25519Error.message : ed25519Error}. Failed as bytes: ${bytesError instanceof Error ? bytesError.message : bytesError}. Failed as DER: ${derError instanceof Error ? derError.message : derError}`);
              }
            }
          }
        } else if (privateKeyHex.length === 128) {
          // 128 hex chars = 64 bytes (ED25519 keypair - private + public)
          // Extract first 32 bytes (private key) and use fromStringED25519
          const privateKeyHexOnly = privateKeyHex.substring(0, 64);
          try {
            privateKey = PrivateKey.fromStringED25519(privateKeyHexOnly);
            console.log('✅ Parsed Hedera private key from 64-byte keypair using fromStringED25519()');
          } catch (ed25519Error) {
            // Fallback to fromBytes
            const privateKeyBytes = Buffer.from(privateKeyHexOnly, 'hex');
            privateKey = PrivateKey.fromBytes(privateKeyBytes);
            console.log('✅ Parsed Hedera private key from 64-byte keypair (extracted first 32 bytes)');
          }
        } else {
          // Try parsing as string (DER format or other)
          try {
            privateKey = PrivateKey.fromString(privateKeyStr);
            console.log('✅ Parsed Hedera private key as string');
          } catch (stringError) {
            throw new Error(`Invalid private key length: ${privateKeyHex.length} hex chars. Expected 64 (32 bytes) or 128 (64 bytes). Also tried DER format but failed: ${stringError instanceof Error ? stringError.message : stringError}`);
          }
        }
      } catch (parseError) {
        console.error('❌ Failed to parse Hedera private key:', parseError instanceof Error ? parseError.message : parseError);
        console.error('   Private key length:', privateKeyStr.replace(/^0x/, '').length, 'hex characters');
        console.error('   Account ID:', accountId);
        console.error('   ⚠️  Make sure the private key matches account', accountId);
        throw new Error(`Invalid Hedera private key format: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
      }
      
      // Verify the private key matches the account by checking the public key
      try {
        const publicKey = privateKey.publicKey;
        const expectedAccountId = AccountId.fromString(accountId);
        console.log(`🔍 Verifying private key matches account ${accountId}...`);
        console.log(`   Public key: ${publicKey.toString()}`);
        
        // Set operator and verify it works
        this.client.setOperator(accountId, privateKey);
        
        // Try a simple query to verify the key works
        const accountInfo = await new AccountInfoQuery()
          .setAccountId(accountId)
          .execute(this.client);
        
        console.log(`✅ Private key verified! Account balance: ${accountInfo.balance.toString()} tinybars`);
        
        if (accountInfo.balance < 100000000) { // Less than 0.1 HBAR
          console.warn(`⚠️  Account has low balance: ${(Number(accountInfo.balance) / 100000000).toFixed(2)} HBAR`);
          console.warn(`   Topic creation requires ~0.01 HBAR. Consider funding the account.`);
        }
      } catch (verifyError: any) {
        console.error('❌ Failed to verify private key with account:', verifyError.message);
        if (verifyError.message?.includes('INVALID_SIGNATURE') || verifyError.message?.includes('INVALID_ACCOUNT_ID')) {
          throw new Error(`Private key does not match account ${accountId}. Please verify the private key in HashPack and ensure it's for account ${accountId}. Error: ${verifyError.message}`);
        }
        throw verifyError;
      }

      // Get or create HCS topic
      const topicIdEnv = process.env.HEDERA_HCS_TOPIC_ID;
      if (topicIdEnv) {
        this.topicId = TopicId.fromString(topicIdEnv);
        console.log(`✅ Using existing HCS topic: ${this.topicId.toString()}`);
      } else {
        // Create new topic (one-time setup)
        console.log("📝 Creating new HCS topic for audit logs...");
        const topicCreateTx = new TopicCreateTransaction()
          .setTopicMemo("Crossify.io Cross-Chain Price Sync Audit Log");
        
        const topicCreateResponse = await topicCreateTx.execute(this.client);
        const receipt = await topicCreateResponse.getReceipt(this.client);
        this.topicId = receipt.topicId;
        
        if (this.topicId) {
          const topicIdStr = this.topicId.toString();
          console.log(`\n${'='.repeat(70)}`);
          console.log(`✅ HEDERA HCS TOPIC CREATED`);
          console.log(`${'='.repeat(70)}`);
          console.log(`📋 Topic ID: ${topicIdStr}`);
          console.log(`\n🔧 ADD THIS TO RAILWAY ENVIRONMENT VARIABLES:`);
          console.log(`   HEDERA_HCS_TOPIC_ID=${topicIdStr}`);
          console.log(`\n📍 View on HashScan:`);
          const hashscanUrl = isMainnet 
            ? `https://hashscan.io/topic/${topicIdStr}`
            : `https://hashscan.io/testnet/topic/${topicIdStr}`;
          console.log(`   ${hashscanUrl}`);
          console.log(`${'='.repeat(70)}\n`);
        } else {
          throw new Error('Topic creation failed - no topic ID returned');
        }
      }

      this.initialized = true;
      console.log("✅ Hedera Audit Service initialized (Powered by Hedera)");
    } catch (error) {
      console.error("❌ Error initializing Hedera Audit Service:", error);
      console.error("   Audit logging will be disabled");
      // Don't throw - allow system to continue without audit logging
    }
  }

  /**
   * Log a price synchronization event to HCS
   * This creates an immutable, timestamped record of cross-chain price updates
   * 
   * Powered by Hedera Consensus Service
   */
  async logPriceSyncEvent(event: PriceSyncEvent): Promise<void> {
    if (!this.initialized || !this.client || !this.topicId) {
      return; // Silently fail if not initialized
    }

    try {
      const message = JSON.stringify({
        type: "PRICE_SYNC",
        version: "1.0",
        ...event,
        verified: true,
        timestamp: new Date().toISOString(),
        poweredBy: "Hedera Consensus Service",
      });

      const transaction = new TopicMessageSubmitTransaction()
        .setTopicId(this.topicId)
        .setMessage(message);

      const response = await transaction.execute(this.client);
      const receipt = await response.getReceipt(this.client);
      
      console.log(`📝 Logged price sync event to HCS (Powered by Hedera): ${receipt.status}`);
    } catch (error) {
      console.error("❌ Error logging price sync event to HCS:", error);
      // Don't throw - audit logging failure shouldn't break main flow
    }
  }

  /**
   * Log a bonding curve transaction to HCS
   * This creates an immutable record of all buy/sell transactions
   * 
   * Powered by Hedera Consensus Service
   */
  async logBondingCurveTransaction(event: BondingCurveTransaction): Promise<void> {
    if (!this.initialized || !this.client || !this.topicId) {
      console.warn('⚠️  Hedera HCS not initialized - cannot log transaction. Check HEDERA_HCS_TOPIC_ID configuration.');
      return; // Silently fail if not initialized
    }

    try {
      // Normalize tokenAddress to lowercase for consistent querying
      const normalizedEvent = {
        ...event,
        tokenAddress: event.tokenAddress?.toLowerCase() || '',
      };
      
      const message = JSON.stringify({
        type: "BONDING_CURVE_TX",
        version: "1.0",
        ...normalizedEvent,
        verified: true,
        timestamp: new Date().toISOString(),
        poweredBy: "Hedera Consensus Service",
      });

      console.log(`📝 Submitting transaction to HCS topic ${this.topicId.toString()}:`, {
        transactionType: normalizedEvent.transactionType,
        tokenAddress: normalizedEvent.tokenAddress,
        chain: normalizedEvent.chain,
        amount: normalizedEvent.amount,
      });

      const transaction = new TopicMessageSubmitTransaction()
        .setTopicId(this.topicId)
        .setMessage(message);

      const response = await transaction.execute(this.client);
      const receipt = await response.getReceipt(this.client);
      
      console.log(`✅ Logged bonding curve transaction to HCS (Powered by Hedera):`, {
        status: receipt.status,
        topicId: this.topicId.toString(),
        transactionType: normalizedEvent.transactionType,
        tokenAddress: normalizedEvent.tokenAddress,
      });
    } catch (error: any) {
      console.error("❌ Error logging bonding curve transaction to HCS:", error);
      if (error.message) {
        console.error("   Error message:", error.message);
      }
      if (error.stack) {
        console.error("   Stack trace:", error.stack);
      }
      // Don't throw - audit logging failure shouldn't break main flow
    }
  }

  /**
   * Query HCS topic for audit logs via Hedera Mirror Node API
   * This retrieves historical events for verification
   */
  async queryAuditLogs(
    tokenAddress?: string,
    startTimestamp?: number,
    endTimestamp?: number,
    limit: number = 100
  ): Promise<any[]> {
    if (!this.topicId) {
      console.warn("⚠️  HCS topic not configured");
      return [];
    }

    try {
      const isMainnet = process.env.NODE_ENV === 'production' && process.env.HEDERA_MAINNET === 'true';
      const mirrorNodeBase = isMainnet 
        ? 'https://mainnet-public.mirrornode.hedera.com'
        : 'https://testnet.mirrornode.hedera.com';
      
      const topicIdStr = this.topicId.toString();
      
      // Build query parameters
      const params = new URLSearchParams({
        limit: limit.toString(),
        order: 'desc', // Most recent first
      });

      if (startTimestamp) {
        params.append('timestamp', `gte:${startTimestamp}`);
      }
      if (endTimestamp) {
        params.append('timestamp', `lte:${endTimestamp}`);
      }

      // Query Mirror Node API for topic messages
      const url = `${mirrorNodeBase}/api/v1/topics/${topicIdStr}/messages?${params.toString()}`;
      
      console.log(`📡 Querying HCS topic messages: ${url}`);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Mirror Node API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as { messages?: any[] };
      const messages = data.messages || [];

      // Parse and filter messages
      const auditLogs: any[] = [];
      
      for (const message of messages) {
        try {
          // Decode message (base64 encoded)
          const messageBytes = Buffer.from(message.message, 'base64');
          const messageText = messageBytes.toString('utf-8');
          const logData = JSON.parse(messageText);

          // Filter by token address if provided (normalize both to lowercase for comparison)
          if (tokenAddress) {
            const logTokenAddress = (logData.tokenAddress || '').toLowerCase().trim();
            const filterTokenAddress = tokenAddress.toLowerCase().trim();
            
            if (logTokenAddress !== filterTokenAddress) {
              continue; // Skip messages not for this token
            }
          }

          // Add metadata from HCS message
          auditLogs.push({
            ...logData,
            hcsMessageId: message.sequence_number,
            hcsTimestamp: message.consensus_timestamp,
            hcsTopicId: topicIdStr,
            hashscanUrl: this.getHashScanUrl(message.sequence_number, topicIdStr),
          });
        } catch (parseError) {
          console.warn(`⚠️  Failed to parse HCS message ${message.sequence_number}:`, parseError);
          // Continue with other messages
        }
      }

      console.log(`✅ Retrieved ${auditLogs.length} audit logs from HCS`);
      return auditLogs;
    } catch (error) {
      console.error("❌ Error querying HCS audit logs:", error);
      return [];
    }
  }

  /**
   * Get HashScan URL for a specific HCS message
   */
  private getHashScanUrl(sequenceNumber: number, topicId: string): string {
    const isMainnet = process.env.NODE_ENV === 'production' && process.env.HEDERA_MAINNET === 'true';
    const base = isMainnet ? 'https://hashscan.io' : 'https://hashscan.io/testnet';
    return `${base}/topic/${topicId}?sequence=${sequenceNumber}`;
  }
}

// Singleton instance
let auditServiceInstance: HederaAuditService | null = null;

/**
 * Get the singleton Hedera Audit Service instance
 */
export function getHederaAuditService(): HederaAuditService {
  if (!auditServiceInstance) {
    auditServiceInstance = new HederaAuditService();
  }
  return auditServiceInstance;
}

/**
 * Initialize Hedera Audit Service (call at app startup)
 */
export async function initializeHederaAudit(): Promise<void> {
  const service = getHederaAuditService();
  await service.initialize();
}

