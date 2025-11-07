import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import bs58 from 'bs58';
import { BlockchainService } from './index';

export class SolanaService implements BlockchainService {
  private connection: Connection;
  private wallet: Keypair;

  constructor() {
    const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
    this.connection = new Connection(rpcUrl, 'confirmed');
    
    // In production, load from env var
    const privateKey = process.env.SOLANA_PRIVATE_KEY;
    if (privateKey) {
      try {
        // First, try as base58-encoded string (most common Solana format)
        // Base58 strings are typically 88 characters for a 64-byte key
        if (privateKey.length >= 80 && privateKey.length <= 100) {
          try {
            const decoded = bs58.decode(privateKey);
            if (decoded.length === 64) {
              this.wallet = Keypair.fromSecretKey(decoded);
              console.log('✅ Solana private key loaded successfully (base58 format)');
            } else {
              throw new Error(`Invalid base58 key length: ${decoded.length} bytes (expected 64)`);
            }
          } catch (base58Error) {
            throw new Error('Failed to decode base58 key');
          }
        } else {
          // Try to parse as JSON array (common format)
          const keyArray = JSON.parse(privateKey);
          if (Array.isArray(keyArray) && keyArray.length === 64) {
            this.wallet = Keypair.fromSecretKey(new Uint8Array(keyArray));
            console.log('✅ Solana private key loaded successfully (JSON array format)');
          } else {
            throw new Error('Invalid JSON array format');
          }
        }
      } catch (jsonError) {
        try {
          // Try as hex string
          const hexKey = privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey;
          if (hexKey.length === 128) { // 64 bytes = 128 hex chars
            this.wallet = Keypair.fromSecretKey(Buffer.from(hexKey, 'hex'));
            console.log('✅ Solana private key loaded successfully (hex format)');
          } else {
            throw new Error('Invalid hex key length');
          }
        } catch (hexError) {
          try {
            // Try as base64
            const decoded = Buffer.from(privateKey, 'base64');
            if (decoded.length === 64) {
              this.wallet = Keypair.fromSecretKey(decoded);
              console.log('✅ Solana private key loaded successfully (base64 format)');
            } else {
              throw new Error('Invalid base64 key length');
            }
          } catch (base64Error) {
            console.error('❌ Failed to parse SOLANA_PRIVATE_KEY in any supported format:', base64Error);
            console.warn('⚠️  Using generated keypair for development. Set a valid key for production.');
            // Generate new keypair for dev (not for production)
            this.wallet = Keypair.generate();
          }
        }
      }
    } else {
      // No private key provided - generate new keypair for dev
      // This is fine for development/testing but should be set in production
      console.warn('⚠️  SOLANA_PRIVATE_KEY not set. Using generated keypair for development.');
      this.wallet = Keypair.generate();
    }
  }

  async deployToken(params: any): Promise<string> {
    // Deploy SPL token
    throw new Error('Solana token deployment not yet implemented');
  }

  async deployBondingCurve(params: any): Promise<string> {
    throw new Error('Solana bonding curve deployment not yet implemented');
  }

  async buyFromCurve(params: any): Promise<string> {
    throw new Error('Solana buy transaction not yet implemented');
  }

  async sellToCurve(params: any): Promise<string> {
    throw new Error('Solana sell transaction not yet implemented');
  }

  async migrateToDEX(params: any): Promise<{ poolAddress: string; txHash: string }> {
    throw new Error('Solana migration not yet implemented');
  }

  async getPrice(tokenAddress: string): Promise<number> {
    throw new Error('Solana price fetching not yet implemented');
  }

  async getBalance(address: string): Promise<string> {
    try {
      const pubkey = new PublicKey(address);
      const balance = await this.connection.getBalance(pubkey);
      return (balance / 1e9).toString(); // Convert lamports to SOL
    } catch (error) {
      throw new Error(`Failed to get balance: ${error}`);
    }
  }
}





