// Unified Cross-Chain Manager
// Manages multiple cross-chain protocols (LayerZero, Supra) in parallel

import { ethers } from 'ethers';
import { dbGet, dbRun } from '../../db/adapter';

export enum Protocol {
  LAYERZERO = 'layerzero',
  SUPRA = 'supra',
  BOTH = 'both',
  AUTO = 'auto'
}

export interface CrossChainResult {
  success: boolean;
  protocol: string;
  txHashes?: string[];
  cost?: number;
  latency?: number;
  error?: string;
}

export interface ProtocolMetrics {
  messagesSent: number;
  messagesReceived: number;
  failures: number;
  totalCost: number;
  avgLatency: number;
  lastUpdate: number;
}

/**
 * Unified Cross-Chain Manager
 * Routes messages to LayerZero, Supra, or both based on configuration
 */
export class UnifiedCrossChainManager {
  private layerZeroProvider: any; // LayerZeroProvider instance
  private supraProvider: any; // SupraProvider instance
  private defaultProtocol: Protocol;
  private metrics: Map<string, ProtocolMetrics>;
  
  constructor() {
    this.defaultProtocol = Protocol.AUTO;
    this.metrics = new Map();
    
    // Initialize metrics
    this.metrics.set(Protocol.LAYERZERO, {
      messagesSent: 0,
      messagesReceived: 0,
      failures: 0,
      totalCost: 0,
      avgLatency: 0,
      lastUpdate: Date.now()
    });
    
    this.metrics.set(Protocol.SUPRA, {
      messagesSent: 0,
      messagesReceived: 0,
      failures: 0,
      totalCost: 0,
      avgLatency: 0,
      lastUpdate: Date.now()
    });
    
    // Lazy load providers (to avoid circular dependencies)
    this.loadProviders();
  }
  
  /**
   * Load cross-chain providers
   */
  private async loadProviders() {
    try {
      // Dynamic import to avoid circular dependencies
      const { LayerZeroProvider } = await import('./LayerZeroProvider');
      const { SupraProvider } = await import('./SupraProvider');
      
      this.layerZeroProvider = new LayerZeroProvider();
      this.supraProvider = new SupraProvider();
    } catch (error) {
      console.warn('⚠️  Could not load cross-chain providers:', error);
    }
  }
  
  /**
   * Send cross-chain message using selected protocol(s)
   */
  async sendMessage(
    tokenId: string,
    sourceChain: string,
    targetChains: string[],
    payload: any,
    protocol?: Protocol
  ): Promise<{ success: boolean; results: CrossChainResult[] }> {
    const selectedProtocol = protocol || await this.getTokenProtocol(tokenId) || this.defaultProtocol;
    const results: CrossChainResult[] = [];
    const startTime = Date.now();
    
    // Send via LayerZero if selected
    if (selectedProtocol === Protocol.LAYERZERO || selectedProtocol === Protocol.BOTH) {
      try {
        const result = await this.sendViaLayerZero(
          tokenId,
          sourceChain,
          targetChains,
          payload
        );
        results.push(result);
        this.updateMetrics(Protocol.LAYERZERO, result, Date.now() - startTime);
      } catch (error: any) {
        results.push({
          success: false,
          protocol: Protocol.LAYERZERO,
          error: error.message
        });
        this.updateMetrics(Protocol.LAYERZERO, { success: false }, 0);
      }
    }
    
    // Send via Supra if selected
    if (selectedProtocol === Protocol.SUPRA || selectedProtocol === Protocol.BOTH) {
      try {
        const result = await this.sendViaSupra(
          tokenId,
          sourceChain,
          targetChains,
          payload
        );
        results.push(result);
        this.updateMetrics(Protocol.SUPRA, result, Date.now() - startTime);
      } catch (error: any) {
        results.push({
          success: false,
          protocol: Protocol.SUPRA,
          error: error.message
        });
        this.updateMetrics(Protocol.SUPRA, { success: false }, 0);
      }
    }
    
    // Auto-select best protocol if AUTO
    if (selectedProtocol === Protocol.AUTO) {
      const bestProtocol = await this.selectBestProtocol(sourceChain, targetChains);
      try {
        const result = bestProtocol === Protocol.LAYERZERO
          ? await this.sendViaLayerZero(tokenId, sourceChain, targetChains, payload)
          : await this.sendViaSupra(tokenId, sourceChain, targetChains, payload);
        
        results.push(result);
        this.updateMetrics(bestProtocol, result, Date.now() - startTime);
      } catch (error: any) {
        results.push({
          success: false,
          protocol: bestProtocol,
          error: error.message
        });
        this.updateMetrics(bestProtocol, { success: false }, 0);
      }
    }
    
    return {
      success: results.some(r => r.success),
      results
    };
  }
  
  /**
   * Send message via LayerZero
   */
  private async sendViaLayerZero(
    tokenId: string,
    sourceChain: string,
    targetChains: string[],
    payload: any
  ): Promise<CrossChainResult> {
    if (!this.layerZeroProvider) {
      await this.loadProviders();
    }
    
    const startTime = Date.now();
    
    try {
      const result = await this.layerZeroProvider.sendMessage(
        tokenId,
        sourceChain,
        targetChains,
        payload
      );
      
      return {
        success: result.success,
        protocol: Protocol.LAYERZERO,
        txHashes: result.txHashes,
        cost: result.cost,
        latency: Date.now() - startTime
      };
    } catch (error: any) {
      return {
        success: false,
        protocol: Protocol.LAYERZERO,
        error: error.message,
        latency: Date.now() - startTime
      };
    }
  }
  
  /**
   * Send message via Supra
   */
  private async sendViaSupra(
    tokenId: string,
    sourceChain: string,
    targetChains: string[],
    payload: any
  ): Promise<CrossChainResult> {
    if (!this.supraProvider) {
      await this.loadProviders();
    }
    
    const startTime = Date.now();
    
    try {
      const result = await this.supraProvider.sendMessage(
        tokenId,
        sourceChain,
        targetChains,
        payload
      );
      
      return {
        success: result.success,
        protocol: Protocol.SUPRA,
        txHashes: result.txHashes,
        cost: result.cost,
        latency: Date.now() - startTime
      };
    } catch (error: any) {
      return {
        success: false,
        protocol: Protocol.SUPRA,
        error: error.message,
        latency: Date.now() - startTime
      };
    }
  }
  
  /**
   * Select best protocol based on metrics
   */
  private async selectBestProtocol(
    sourceChain: string,
    targetChains: string[]
  ): Promise<Protocol> {
    const lzMetrics = this.metrics.get(Protocol.LAYERZERO)!;
    const supraMetrics = this.metrics.get(Protocol.SUPRA)!;
    
    // Simple heuristic: prefer protocol with lower failure rate
    const lzFailureRate = lzMetrics.messagesSent > 0
      ? lzMetrics.failures / lzMetrics.messagesSent
      : 0;
    
    const supraFailureRate = supraMetrics.messagesSent > 0
      ? supraMetrics.failures / supraMetrics.messagesSent
      : 1; // Default to high if no messages sent
    
    // If Supra has lower failure rate and is available, use it
    if (supraFailureRate < lzFailureRate && this.supraProvider) {
      return Protocol.SUPRA;
    }
    
    // Default to LayerZero (battle-tested)
    return Protocol.LAYERZERO;
  }
  
  /**
   * Get token's preferred protocol from database
   */
  private async getTokenProtocol(tokenId: string): Promise<Protocol | null> {
    try {
      const token = await dbGet(
        `SELECT cross_chain_protocol FROM tokens WHERE id = ?`,
        [tokenId]
      ) as any;
      
      if (token?.cross_chain_protocol) {
        return token.cross_chain_protocol as Protocol;
      }
    } catch (error) {
      console.warn('Could not get token protocol:', error);
    }
    
    return null;
  }
  
  /**
   * Update metrics for a protocol
   */
  private updateMetrics(
    protocol: Protocol,
    result: Partial<CrossChainResult>,
    latency: number
  ): void {
    const metrics = this.metrics.get(protocol)!;
    
    if (result.success) {
      metrics.messagesSent++;
      if (result.cost) {
        metrics.totalCost += result.cost;
      }
      if (latency > 0) {
        // Update average latency
        metrics.avgLatency = (metrics.avgLatency * (metrics.messagesSent - 1) + latency) / metrics.messagesSent;
      }
    } else {
      metrics.failures++;
    }
    
    metrics.lastUpdate = Date.now();
    this.metrics.set(protocol, metrics);
  }
  
  /**
   * Get metrics for all protocols
   */
  async getAllMetrics(): Promise<Record<string, ProtocolMetrics>> {
    const allMetrics: Record<string, ProtocolMetrics> = {};
    
    for (const [protocol, metrics] of this.metrics) {
      allMetrics[protocol] = { ...metrics };
    }
    
    return allMetrics;
  }
  
  /**
   * Get metrics for a specific protocol
   */
  getProtocolMetrics(protocol: Protocol): ProtocolMetrics | undefined {
    return this.metrics.get(protocol);
  }
  
  /**
   * Set default protocol
   */
  setDefaultProtocol(protocol: Protocol): void {
    this.defaultProtocol = protocol;
  }
}

// Singleton instance
let managerInstance: UnifiedCrossChainManager | null = null;

export function getUnifiedCrossChainManager(): UnifiedCrossChainManager {
  if (!managerInstance) {
    managerInstance = new UnifiedCrossChainManager();
  }
  return managerInstance;
}

