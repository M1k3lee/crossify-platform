// Blockchain service factory
import { EthereumService } from './ethereum';
import { BSCService } from './bsc';
import { BaseService } from './base';
import { SolanaService } from './solana';

export interface BlockchainService {
  deployToken(params: {
    name: string;
    symbol: string;
    decimals: number;
    initialSupply: string;
    metadataUri?: string;
  }): Promise<string>;
  
  deployBondingCurve(params: {
    tokenAddress: string;
    basePrice: number;
    slope: number;
    graduationThreshold: number;
    buyFeePercent: number;
    sellFeePercent: number;
  }): Promise<string>;
  
  buyFromCurve(params: {
    curveAddress: string;
    amount: string;
    buyerAddress: string;
  }): Promise<string>;
  
  sellToCurve(params: {
    curveAddress: string;
    amount: string;
    sellerAddress: string;
  }): Promise<string>;
  
  migrateToDEX(params: {
    curveAddress: string;
    tokenAddress: string;
  }): Promise<{ poolAddress: string; txHash: string }>;
  
  getPrice(tokenAddress: string): Promise<number>;
  getBalance(address: string): Promise<string>;
}

export function getBlockchainService(chain: string): BlockchainService {
  switch (chain.toLowerCase()) {
    case 'ethereum':
      return new EthereumService();
    case 'bsc':
      return new BSCService();
    case 'base':
      return new BaseService();
    case 'solana':
      return new SolanaService();
    default:
      throw new Error(`Unsupported chain: ${chain}`);
  }
}








