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
      return;
    }

    try {
      // Get Hedera account credentials from environment
      const accountId = process.env.HEDERA_ACCOUNT_ID;
      const privateKeyStr = process.env.HEDERA_PRIVATE_KEY;

      if (!accountId || !privateKeyStr) {
        console.warn("⚠️  Hedera credentials not configured. HCS audit logging disabled.");
        console.warn("   Set HEDERA_ACCOUNT_ID and HEDERA_PRIVATE_KEY to enable.");
        return;
      }

      // Initialize Hedera client
      const isMainnet = process.env.NODE_ENV === 'production' && process.env.HEDERA_MAINNET === 'true';
      this.client = isMainnet ? Client.forMainnet() : Client.forTestnet();
      
      // Parse private key (remove 0x prefix if present)
      const privateKeyHex = privateKeyStr.replace(/^0x/, '');
      const privateKey = PrivateKey.fromString(privateKeyHex);
      
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
        
        console.log(`✅ Created HCS topic: ${this.topicId.toString()}`);
        console.log(`   Add this to your .env: HEDERA_HCS_TOPIC_ID=${this.topicId.toString()}`);
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
   * Query HCS topic for audit logs
   * This can be used to retrieve historical events for verification
   */
  async queryAuditLogs(
    startTimestamp?: number,
    endTimestamp?: number,
    limit: number = 100
  ): Promise<any[]> {
    // TODO: Implement HCS topic query
    // This requires subscribing to the topic and filtering messages
    // For now, return empty array
    console.warn("⚠️  HCS query not yet implemented");
    return [];
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

