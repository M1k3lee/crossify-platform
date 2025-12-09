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
    console.log("🔍 [HCS] initialize() method called");
    console.log(`🔍 [HCS] this.initialized = ${this.initialized}`);
    
    if (this.initialized) {
      console.log("ℹ️  [HCS] Hedera Audit Service already initialized - skipping");
      return;
    }

    console.log("🔍 [HCS] Initializing Hedera Audit Service (HCS)...");
    
    try {
      // Get Hedera account credentials from environment
      const accountId = process.env.HEDERA_ACCOUNT_ID;
      const privateKeyStr = process.env.HEDERA_PRIVATE_KEY;

      console.log(`🔍 [HCS] Checking Hedera credentials...`);
      
      // Log credential status with simpler, safer logging
      if (accountId) {
        console.log(`🔍 [HCS] HEDERA_ACCOUNT_ID: ✅ Set`);
        console.log(`🔍 [HCS] Account ID value: ${accountId}`);
      } else {
        console.log(`🔍 [HCS] HEDERA_ACCOUNT_ID: ❌ Not set`);
      }
      
      if (privateKeyStr) {
        console.log(`🔍 [HCS] HEDERA_PRIVATE_KEY: ✅ Set`);
        console.log(`🔍 [HCS] Private key length: ${privateKeyStr.length} chars`);
        if (privateKeyStr.length > 0) {
          const preview = privateKeyStr.substring(0, Math.min(10, privateKeyStr.length));
          console.log(`🔍 [HCS] Private key preview: ${preview}...`);
        }
      } else {
        console.log(`🔍 [HCS] HEDERA_PRIVATE_KEY: ❌ Not set`);
      }

      console.log(`🔍 [HCS] About to check if credentials exist...`);
      console.log(`🔍 [HCS] accountId truthy: ${!!accountId}`);
      console.log(`🔍 [HCS] privateKeyStr truthy: ${!!privateKeyStr}`);
      
      if (!accountId || !privateKeyStr) {
        console.warn("⚠️  [HCS] Hedera credentials not configured. HCS audit logging disabled.");
        console.warn("⚠️  [HCS] Set HEDERA_ACCOUNT_ID and HEDERA_PRIVATE_KEY to enable.");
        console.log(`🔍 [HCS] Returning early due to missing credentials`);
        return;
      }
      
      console.log(`🔍 [HCS] ✓ Both credentials present, continuing...`);
      console.log(`🔍 [HCS] ✓ Credentials check passed, initializing client...`);

      // Initialize Hedera client
      // Support both HEDERA_MAINNET and HEDERA_NETWORK for flexibility
      const hederaNetwork = process.env.HEDERA_NETWORK?.toLowerCase();
      console.log(`🔍 [HCS] HEDERA_NETWORK env var: ${process.env.HEDERA_NETWORK || 'not set'}`);
      console.log(`🔍 [HCS] NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
      console.log(`🔍 [HCS] HEDERA_MAINNET: ${process.env.HEDERA_MAINNET || 'not set'}`);
      
      const isMainnet = (process.env.NODE_ENV === 'production' && process.env.HEDERA_MAINNET === 'true') ||
                        hederaNetwork === 'mainnet';
      const isTestnet = hederaNetwork === 'testnet' || !isMainnet;
      
      console.log(`🔍 [HCS] isMainnet = ${isMainnet}, isTestnet = ${isTestnet}`);
      
      this.client = isMainnet ? Client.forMainnet() : Client.forTestnet();
      console.log(`🔍 [HCS] Client created: ${this.client ? 'success' : 'failed'}`);
      
      console.log(`🌐 [HCS] Hedera network: ${isMainnet ? 'Mainnet' : 'Testnet'}${hederaNetwork ? ` (from HEDERA_NETWORK=${hederaNetwork})` : ''}`);
      
      console.log(`🔍 [HCS] Starting private key parsing...`);
      
      // Parse private key - Hedera SDK supports multiple formats
      // Use fromStringED25519() for hex-encoded strings (recommended by SDK)
      let privateKey: PrivateKey;
      try {
        // Remove 0x prefix if present
        const privateKeyHex = privateKeyStr.replace(/^0x/, '').trim();
        
        // Try multiple parsing methods (in order of preference)
        // Hedera supports both ECDSA and ED25519 keys
        if (privateKeyHex.length === 64) {
          // 64 hex chars = 32 bytes (could be ECDSA or ED25519)
          // Try ECDSA first (common in HashPack), then ED25519
          let parsed = false;
          
          // Try ECDSA first (HashPack often uses ECDSA)
          try {
            privateKey = PrivateKey.fromStringECDSA(privateKeyHex);
            console.log('✅ Parsed Hedera private key using fromStringECDSA() (64 hex chars)');
            parsed = true;
          } catch (ecdsaError) {
            // Try ED25519 next
            try {
              privateKey = PrivateKey.fromStringED25519(privateKeyHex);
              console.log('✅ Parsed Hedera private key using fromStringED25519() (64 hex chars)');
              parsed = true;
            } catch (ed25519Error) {
              // Fallback to fromBytes if both fail
              try {
                const keyBytes = Buffer.from(privateKeyHex, 'hex');
                if (keyBytes.length === 32) {
                  privateKey = PrivateKey.fromBytes(keyBytes);
                  console.log('✅ Parsed Hedera private key as hex bytes (32 bytes)');
                  parsed = true;
                } else {
                  throw new Error(`Invalid key length: ${keyBytes.length} bytes (expected 32)`);
                }
              } catch (bytesError) {
                // Try as DER string format
                try {
                  privateKey = PrivateKey.fromString(privateKeyStr);
                  console.log('✅ Parsed Hedera private key as DER string');
                  parsed = true;
                } catch (derError) {
                  throw new Error(`Failed to parse as ECDSA: ${ecdsaError instanceof Error ? ecdsaError.message : ecdsaError}. Failed as ED25519: ${ed25519Error instanceof Error ? ed25519Error.message : ed25519Error}. Failed as bytes: ${bytesError instanceof Error ? bytesError.message : bytesError}. Failed as DER: ${derError instanceof Error ? derError.message : derError}`);
                }
              }
            }
          }
          
          if (!parsed) {
            throw new Error('Failed to parse private key with any method');
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
        } else if (privateKeyHex.length === 40) {
          // 40 hex chars = 20 bytes (might be incomplete or Ethereum-style address)
          // This is likely an error - Hedera keys need 32 bytes
          throw new Error(`Invalid private key length: ${privateKeyHex.length} hex chars (${privateKeyHex.length / 2} bytes). Hedera private keys must be 64 hex chars (32 bytes) or 128 hex chars (64 bytes for keypair). Your key appears incomplete or in wrong format.`);
        } else {
          // Try parsing as string (DER format or other)
          try {
            privateKey = PrivateKey.fromString(privateKeyStr);
            console.log('✅ Parsed Hedera private key as DER string format');
          } catch (stringError) {
            throw new Error(`Invalid private key length: ${privateKeyHex.length} hex chars. Expected 64 (32 bytes) or 128 (64 bytes). Also tried DER format but failed: ${stringError instanceof Error ? stringError.message : stringError}. Current length: ${privateKeyHex.length} hex characters.`);
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
        
        const balanceTinybars = Number(accountInfo.balance.toTinybars());
        console.log(`✅ Private key verified! Account balance: ${balanceTinybars} tinybars`);
        
        if (balanceTinybars < 100000000) { // Less than 0.1 HBAR
          console.warn(`⚠️  Account has low balance: ${(balanceTinybars / 100000000).toFixed(2)} HBAR`);
          console.warn(`   Topic creation requires ~0.01 HBAR. Consider funding the account.`);
        }
      } catch (verifyError: any) {
        console.error('❌ [HCS] Failed to verify private key with account:', verifyError.message);
        console.error('❌ [HCS] Error name:', verifyError.name);
        console.error('❌ [HCS] Full error:', JSON.stringify(verifyError, Object.getOwnPropertyNames(verifyError)));
        
        // Extract public key from private key for debugging
        try {
          const publicKeyFromPrivate = privateKey.publicKey;
          console.error('❌ [HCS] Public key derived from private key:', publicKeyFromPrivate.toString());
        } catch (pubKeyError) {
          console.error('❌ [HCS] Could not extract public key from private key:', pubKeyError);
        }
        
        if (verifyError.message?.includes('INVALID_SIGNATURE') || 
            verifyError.message?.includes('INVALID_ACCOUNT_ID') ||
            verifyError.message?.includes('does not match')) {
          const errorMsg = `Private key does not match account ${accountId}. Please verify the private key in HashPack and ensure it's for account ${accountId}. Error: ${verifyError.message}`;
          console.error('❌ [HCS]', errorMsg);
          console.error('❌ [HCS] To fix this:');
          console.error('   1. Open HashPack wallet');
          console.error(`   2. Ensure you are using account ${accountId}`);
          console.error('   3. Export the private key for that specific account');
          console.error('   4. Make sure the private key is the full key (64 hex chars without 0x prefix, or DER format)');
          console.error('   5. Verify the key format matches what HashPack exports');
          throw new Error(errorMsg);
        }
        throw verifyError;
      }

      // Get or create HCS topic
      console.log(`🔍 [HCS] Checking for existing topic ID...`);
      const topicIdEnv = process.env.HEDERA_HCS_TOPIC_ID;
      console.log(`🔍 [HCS] Topic ID from env: ${topicIdEnv || 'not set'}`);
      
      if (topicIdEnv) {
        console.log(`🔍 [HCS] Using existing topic ID: ${topicIdEnv}`);
        this.topicId = TopicId.fromString(topicIdEnv);
        console.log(`✅ [HCS] Using existing HCS topic: ${this.topicId.toString()}`);
      } else {
        console.log(`🔍 [HCS] No topic ID in env, will create new topic...`);
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
      console.log("✅ [HCS] Hedera Audit Service initialized (Powered by Hedera)");
      console.log(`✅ [HCS] Topic ID: ${this.topicId ? this.topicId.toString() : 'null'}`);
      console.log(`✅ [HCS] Client: ${this.client ? 'initialized' : 'null'}`);
    } catch (error) {
      console.error("❌ [HCS] Error initializing Hedera Audit Service:", error);
      if (error instanceof Error) {
        console.error(`❌ [HCS] Error name: ${error.name}`);
        console.error(`❌ [HCS] Error message: ${error.message}`);
        if (error.stack) {
          console.error(`❌ [HCS] Stack trace:\n${error.stack}`);
        }
        if ((error as any).cause) {
          console.error(`❌ [HCS] Error cause:`, (error as any).cause);
        }
      } else {
        console.error(`❌ [HCS] Unknown error type:`, typeof error, error);
      }
      console.error("❌ [HCS] Audit logging will be disabled");
      // Don't throw - allow system to continue without audit logging
    } finally {
      console.log(`🔍 [HCS] initialize() method ending. this.initialized = ${this.initialized}`);
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
      // Use same network detection logic as initialization
      const hederaNetwork = process.env.HEDERA_NETWORK?.toLowerCase();
      const isMainnet = (process.env.NODE_ENV === 'production' && process.env.HEDERA_MAINNET === 'true') ||
                        hederaNetwork === 'mainnet';
      const mirrorNodeBase = isMainnet 
        ? 'https://mainnet-public.mirrornode.hedera.com'
        : 'https://testnet.mirrornode.hedera.com';
      
      console.log(`📡 [HCS] Querying Mirror Node: ${mirrorNodeBase} (network: ${isMainnet ? 'mainnet' : 'testnet'})`);
      
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
      
      console.log(`📡 [HCS] Querying HCS topic messages: ${url}`);
      console.log(`📡 [HCS] Topic ID: ${topicIdStr}, Token filter: ${tokenAddress || 'none'}, Limit: ${limit}`);
      
      const response = await fetch(url);
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ [HCS] Mirror Node API error: ${response.status} ${response.statusText}`);
        console.error(`❌ [HCS] Error response: ${errorText}`);
        throw new Error(`Mirror Node API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as { messages?: any[] };
      const messages = data.messages || [];
      
      console.log(`📡 [HCS] Received ${messages.length} total messages from Mirror Node API`);

      // Parse and filter messages
      const auditLogs: any[] = [];
      
      for (const message of messages) {
        try {
          // Decode message (base64 encoded)
          const messageBytes = Buffer.from(message.message, 'base64');
          const messageText = messageBytes.toString('utf-8');
          const logData = JSON.parse(messageText);
          
          console.log(`📡 [HCS] Parsed message ${message.sequence_number}: type=${logData.type}, tokenAddress=${logData.tokenAddress || 'none'}`);

          // Filter by token address if provided (normalize both to lowercase for comparison)
          if (tokenAddress) {
            const logTokenAddress = (logData.tokenAddress || '').toLowerCase().trim();
            const filterTokenAddress = tokenAddress.toLowerCase().trim();
            
            console.log(`📡 [HCS] Comparing: "${logTokenAddress}" vs "${filterTokenAddress}"`);
            
            if (logTokenAddress !== filterTokenAddress) {
              console.log(`📡 [HCS] Skipping message ${message.sequence_number} - token address mismatch`);
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
          
          console.log(`✅ [HCS] Added audit log: ${logData.type} for token ${logData.tokenAddress}`);
        } catch (parseError) {
          console.warn(`⚠️  [HCS] Failed to parse HCS message ${message.sequence_number}:`, parseError);
          // Continue with other messages
        }
      }

      console.log(`✅ [HCS] Retrieved ${auditLogs.length} audit logs from HCS (filtered from ${messages.length} total messages)`);
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

  /**
   * Get the current HCS topic ID (if initialized)
   */
  getTopicId(): string | null {
    return this.topicId ? this.topicId.toString() : null;
  }

  /**
   * Check if the service is initialized and ready
   */
  isInitialized(): boolean {
    return this.initialized && this.topicId !== null;
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

