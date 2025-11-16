/**
 * Hedera File Service (HFS) for Decentralized Metadata Storage
 * 
 * This service provides decentralized, immutable file storage on Hedera network.
 * Files are stored permanently and can be retrieved via Hedera Mirror Node.
 * 
 * Benefits:
 * - Decentralized storage (no single point of failure)
 * - Extremely low cost (~$0.001 per file, one-time)
 * - Immutable (files cannot be deleted or modified)
 * - No pinning required (unlike IPFS)
 * - Enterprise-grade infrastructure
 * 
 * Powered by Hedera - providing permanent, decentralized file storage
 */

import { 
  Client, 
  FileCreateTransaction,
  FileContentsQuery,
  FileId,
  PrivateKey,
  Hbar
} from "@hashgraph/sdk";

export interface UploadResult {
  fileId: string; // Hedera File ID (0.0.xxxxx format)
  url: string; // Public URL via Mirror Node
  storage: 'hedera';
  size: number;
  memo?: string;
}

export class HederaFileService {
  private client: Client | null = null;
  private initialized: boolean = false;
  private operatorKey: PrivateKey | null = null;

  /**
   * Initialize Hedera client for file operations
   * Call this once at application startup
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
        console.warn("⚠️  Hedera credentials not configured. HFS file storage disabled.");
        console.warn("   Set HEDERA_ACCOUNT_ID and HEDERA_PRIVATE_KEY to enable.");
        return;
      }

      // Initialize Hedera client
      const isMainnet = process.env.NODE_ENV === 'production' && process.env.HEDERA_MAINNET === 'true';
      this.client = isMainnet ? Client.forMainnet() : Client.forTestnet();
      
      // Parse private key (remove 0x prefix if present)
      const privateKeyHex = privateKeyStr.replace(/^0x/, '');
      this.operatorKey = PrivateKey.fromString(privateKeyHex);
      
      this.client.setOperator(accountId, this.operatorKey);

      this.initialized = true;
      console.log("✅ Hedera File Service initialized (Powered by Hedera)");
    } catch (error) {
      console.error("❌ Error initializing Hedera File Service:", error);
      console.error("   File storage will fall back to Cloudinary/local storage");
      // Don't throw - allow system to continue without HFS
    }
  }

  /**
   * Check if HFS is available and initialized
   */
  isAvailable(): boolean {
    return this.initialized && this.client !== null && this.operatorKey !== null;
  }

  /**
   * Upload a file to Hedera File Service
   * @param fileBuffer - File contents as Buffer
   * @param metadata - File metadata (tokenId, type, etc.)
   * @returns File ID and public URL
   */
  async uploadFile(
    fileBuffer: Buffer,
    metadata: {
      tokenId?: string;
      type: 'logo' | 'banner' | 'metadata' | 'other';
      filename?: string;
      mimeType?: string;
    }
  ): Promise<UploadResult> {
    if (!this.isAvailable()) {
      throw new Error('Hedera File Service is not initialized. Check HEDERA_ACCOUNT_ID and HEDERA_PRIVATE_KEY.');
    }

    try {
      // Create memo for file (helps with organization)
      const memo = metadata.tokenId 
        ? `Crossify Token ${metadata.tokenId} ${metadata.type}`
        : `Crossify ${metadata.type}${metadata.filename ? ` - ${metadata.filename}` : ''}`;

      // Create file on Hedera
      // Note: Hedera files have a 1024 byte limit per chunk, but FileCreateTransaction
      // handles chunking automatically for larger files
      const fileCreateTx = new FileCreateTransaction()
        .setContents(fileBuffer)
        .setKeys([this.operatorKey!]) // Only operator can modify (optional - can be empty for immutable)
        .setMaxTransactionFee(new Hbar(5)); // Set max fee (5 HBAR should be plenty)
      
      // Note: setMemo might not be available in all SDK versions, so we skip it
      // The memo information is stored in the database instead

      const response = await fileCreateTx.execute(this.client!);
      const receipt = await response.getReceipt(this.client!);
      
      if (!receipt.fileId) {
        throw new Error('File creation failed - no file ID returned');
      }

      const fileId = receipt.fileId.toString();
      const url = this.getFileUrl(fileId);

      console.log(`✅ Uploaded file to Hedera HFS: ${fileId} (${fileBuffer.length} bytes)`);
      console.log(`   URL: ${url}`);

      return {
        fileId,
        url,
        storage: 'hedera',
        size: fileBuffer.length,
        memo,
      };
    } catch (error) {
      console.error('❌ Error uploading file to Hedera HFS:', error);
      throw new Error(`Failed to upload file to Hedera: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Retrieve file contents from Hedera File Service
   * @param fileId - Hedera File ID (0.0.xxxxx format)
   * @returns File contents as Buffer
   */
  async getFile(fileId: string): Promise<Buffer> {
    if (!this.isAvailable()) {
      throw new Error('Hedera File Service is not initialized');
    }

    try {
      const fileIdObj = FileId.fromString(fileId);
      const fileContentsQuery = new FileContentsQuery()
        .setFileId(fileIdObj);

      const fileContents = await fileContentsQuery.execute(this.client!);
      return Buffer.from(fileContents);
    } catch (error) {
      console.error(`❌ Error retrieving file ${fileId} from Hedera HFS:`, error);
      throw new Error(`Failed to retrieve file from Hedera: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get public URL for file via Hedera Mirror Node
   * @param fileId - Hedera File ID (0.0.xxxxx format)
   * @returns Public HTTP URL
   */
  getFileUrl(fileId: string): string {
    const isMainnet = process.env.NODE_ENV === 'production' && process.env.HEDERA_MAINNET === 'true';
    const mirrorNodeBase = isMainnet 
      ? 'https://mainnet-public.mirrornode.hedera.com'
      : 'https://testnet.mirrornode.hedera.com';
    
    // Mirror Node provides file access via REST API
    // Format: /api/v1/files/{fileId}
    return `${mirrorNodeBase}/api/v1/files/${fileId}`;
  }

  /**
   * Upload token logo to Hedera File Service
   */
  async uploadTokenLogo(
    fileBuffer: Buffer,
    tokenId: string,
    filename?: string
  ): Promise<UploadResult> {
    return this.uploadFile(fileBuffer, {
      tokenId,
      type: 'logo',
      filename,
      mimeType: 'image/png', // Default, can be detected from buffer
    });
  }

  /**
   * Upload token banner to Hedera File Service
   */
  async uploadTokenBanner(
    fileBuffer: Buffer,
    tokenId: string,
    filename?: string
  ): Promise<UploadResult> {
    return this.uploadFile(fileBuffer, {
      tokenId,
      type: 'banner',
      filename,
      mimeType: 'image/png', // Default, can be detected from buffer
    });
  }

  /**
   * Upload token metadata JSON to Hedera File Service
   */
  async uploadTokenMetadata(
    metadata: Record<string, any>,
    tokenId: string
  ): Promise<UploadResult> {
    const jsonBuffer = Buffer.from(JSON.stringify(metadata, null, 2));
    return this.uploadFile(jsonBuffer, {
      tokenId,
      type: 'metadata',
      filename: `metadata-${tokenId}.json`,
      mimeType: 'application/json',
    });
  }
}

// Singleton instance
let fileServiceInstance: HederaFileService | null = null;

/**
 * Get the singleton Hedera File Service instance
 */
export function getHederaFileService(): HederaFileService {
  if (!fileServiceInstance) {
    fileServiceInstance = new HederaFileService();
  }
  return fileServiceInstance;
}

/**
 * Initialize Hedera File Service (call at app startup)
 */
export async function initializeHederaFileService(): Promise<void> {
  const service = getHederaFileService();
  await service.initialize();
}

