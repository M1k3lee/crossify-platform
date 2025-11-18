// LayerZero Cross-Chain Provider
// Implements ICrossChainProvider interface for LayerZero protocol

import { ethers } from 'ethers';
import { sendCrossChainSupplyUpdate } from '../crossChainMessaging';

export interface ICrossChainProvider {
  name: string;
  sendMessage(
    tokenId: string,
    sourceChain: string,
    targetChains: string[],
    payload: any
  ): Promise<{ success: boolean; txHashes?: string[]; cost?: number }>;
  
  estimateCost(
    sourceChain: string,
    targetChains: string[]
  ): Promise<number>;
  
  getMetrics(): Promise<{
    messagesSent: number;
    messagesReceived: number;
    failures: number;
    avgLatency: number;
    totalCost: number;
  }>;
}

/**
 * LayerZero Provider
 * Wraps existing LayerZero implementation
 */
export class LayerZeroProvider implements ICrossChainProvider {
  name = 'LayerZero';
  
  private metrics = {
    messagesSent: 0,
    messagesReceived: 0,
    failures: 0,
    totalCost: 0,
    avgLatency: 0,
    latencies: [] as number[]
  };
  
  /**
   * Send cross-chain message via LayerZero
   */
  async sendMessage(
    tokenId: string,
    sourceChain: string,
    targetChains: string[],
    payload: any
  ): Promise<{ success: boolean; txHashes?: string[]; cost?: number }> {
    const startTime = Date.now();
    
    try {
      // Use existing LayerZero implementation
      const result = await sendCrossChainSupplyUpdate(
        tokenId,
        sourceChain,
        payload.newSupply || '0',
        payload.tokenAddress || ''
      );
      
      const latency = Date.now() - startTime;
      this.updateMetrics(result.success, latency, 0); // Cost TBD
      
      return {
        success: result.success,
        txHashes: result.txHashes,
        cost: 0 // TODO: Calculate actual cost
      };
    } catch (error: any) {
      this.updateMetrics(false, Date.now() - startTime, 0);
      throw error;
    }
  }
  
  /**
   * Estimate cost for LayerZero message
   */
  async estimateCost(
    sourceChain: string,
    targetChains: string[]
  ): Promise<number> {
    // LayerZero typically costs ~$0.01-0.05 per message
    // This is a rough estimate
    return targetChains.length * 0.02; // $0.02 per target chain
  }
  
  /**
   * Get metrics for LayerZero
   */
  async getMetrics(): Promise<{
    messagesSent: number;
    messagesReceived: number;
    failures: number;
    avgLatency: number;
    totalCost: number;
  }> {
    return {
      messagesSent: this.metrics.messagesSent,
      messagesReceived: this.metrics.messagesReceived,
      failures: this.metrics.failures,
      avgLatency: this.metrics.avgLatency,
      totalCost: this.metrics.totalCost
    };
  }
  
  /**
   * Update internal metrics
   */
  private updateMetrics(success: boolean, latency: number, cost: number): void {
    if (success) {
      this.metrics.messagesSent++;
      this.metrics.latencies.push(latency);
      
      // Keep only last 100 latencies for average calculation
      if (this.metrics.latencies.length > 100) {
        this.metrics.latencies.shift();
      }
      
      // Calculate average latency
      const sum = this.metrics.latencies.reduce((a, b) => a + b, 0);
      this.metrics.avgLatency = sum / this.metrics.latencies.length;
      
      this.metrics.totalCost += cost;
    } else {
      this.metrics.failures++;
    }
  }
}

