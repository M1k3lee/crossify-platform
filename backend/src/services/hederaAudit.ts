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
  PrivateKey 
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
      let privateKey: PrivateKey;
      try {
        // Remove 0x prefix if present
        const privateKeyHex = privateKeyStr.replace(/^0x/, '').trim();
        
        // Try parsing as hex string (most common format)
        if (privateKeyHex.length === 64) {
          // Convert hex string to bytes and create ED25519 private key
          const keyBytes = Buffer.from(privateKeyHex, 'hex');
          privateKey = PrivateKey.fromBytes(keyBytes);
          console.log('✅ Parsed Hedera private key as hex bytes');
        } else {
          // Try parsing as string (DER format or other)
          privateKey = PrivateKey.fromString(privateKeyStr);
          console.log('✅ Parsed Hedera private key as string');
        }
      } catch (parseError) {
        console.error('❌ Failed to parse Hedera private key:', parseError instanceof Error ? parseError.message : parseError);
        throw new Error(`Invalid Hedera private key format: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
      }
      
      this.client.setOperator(accountId, privateKey);

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
      return; // Silently fail if not initialized
    }

    try {
      const message = JSON.stringify({
        type: "BONDING_CURVE_TX",
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
      
      console.log(`📝 Logged bonding curve transaction to HCS (Powered by Hedera): ${receipt.status}`);
    } catch (error) {
      console.error("❌ Error logging bonding curve transaction to HCS:", error);
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

          // Filter by token address if provided
          if (tokenAddress) {
            const logTokenAddress = logData.tokenAddress?.toLowerCase();
            const filterTokenAddress = tokenAddress.toLowerCase();
            
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

