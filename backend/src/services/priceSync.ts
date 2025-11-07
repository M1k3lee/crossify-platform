import { getRedisClient, cachePrice, getAllPrices } from './redis';
import { db } from '../db';
import { ethers } from 'ethers';
import { Connection, PublicKey } from '@solana/web3.js';

const PRICE_SYNC_INTERVAL = 10000; // 10 seconds
const MAX_VARIANCE = 0.005; // 0.5%

interface PriceData {
  chain: string;
  price: number;
  timestamp: number;
}

const priceAlerts: Map<string, PriceData[]> = new Map();

async function fetchEthereumPrice(tokenId: string, tokenAddress: string): Promise<number | null> {
  try {
    // Simplified: In production, use Uniswap V3 oracle or Chainlink
    // For MVP, we'll simulate or use a simple price fetch
    const rpcUrl = process.env.ETHEREUM_RPC_URL;
    if (!rpcUrl) return null;
    
    // This is a placeholder - implement actual price fetching from DEX
    // For now, return a mock price or fetch from contract
    return null;
  } catch (error) {
    console.error(`Error fetching Ethereum price for ${tokenId}:`, error);
    return null;
  }
}

async function fetchBSCPrice(tokenId: string, tokenAddress: string): Promise<number | null> {
  try {
    // Similar to Ethereum - fetch from PancakeSwap or other DEX
    return null;
  } catch (error) {
    console.error(`Error fetching BSC price for ${tokenId}:`, error);
    return null;
  }
}

async function fetchSolanaPrice(tokenId: string, tokenAddress: string): Promise<number | null> {
  try {
    // Fetch from Raydium or Jupiter
    return null;
  } catch (error) {
    console.error(`Error fetching Solana price for ${tokenId}:`, error);
    return null;
  }
}

async function fetchBasePrice(tokenId: string, tokenAddress: string): Promise<number | null> {
  try {
    // Fetch from Uniswap V3 on Base
    return null;
  } catch (error) {
    console.error(`Error fetching Base price for ${tokenId}:`, error);
    return null;
  }
}

async function fetchPrice(tokenId: string, chain: string, tokenAddress: string): Promise<number | null> {
  switch (chain) {
    case 'ethereum':
      return fetchEthereumPrice(tokenId, tokenAddress);
    case 'bsc':
      return fetchBSCPrice(tokenId, tokenAddress);
    case 'solana':
      return fetchSolanaPrice(tokenId, tokenAddress);
    case 'base':
      return fetchBasePrice(tokenId, tokenAddress);
    default:
      return null;
  }
}

function calculateVariance(prices: number[]): number {
  if (prices.length < 2) return 0;
  const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
  const variance = prices.reduce((sum, price) => sum + Math.pow(price - avg, 2), 0) / prices.length;
  return Math.sqrt(variance) / avg; // Coefficient of variation
}

async function checkPriceVariance(tokenId: string, prices: Record<string, number>) {
  const priceValues = Object.values(prices);
  if (priceValues.length < 2) return;

  const variance = calculateVariance(priceValues);
  
  if (variance > MAX_VARIANCE) {
    console.warn(`⚠️ Price variance alert for token ${tokenId}: ${(variance * 100).toFixed(2)}%`);
    // Store alert for API endpoint
    priceAlerts.set(tokenId, Object.entries(prices).map(([chain, price]) => ({
      chain,
      price,
      timestamp: Date.now(),
    })));
  }
}

async function syncPrices() {
  try {
    // Get all deployed tokens
    const tokens = db.prepare(`
      SELECT DISTINCT t.id, td.chain, td.token_address
      FROM tokens t
      JOIN token_deployments td ON t.id = td.token_id
      WHERE td.status = 'deployed' AND td.token_address IS NOT NULL
    `).all() as Array<{ id: string; chain: string; token_address: string }>;

    for (const { id, chain, token_address } of tokens) {
      const price = await fetchPrice(id, chain, token_address);
      if (price !== null) {
        await cachePrice(id, chain, price);
      }
    }

    // Check variance for each token across chains
    const tokenIds = [...new Set(tokens.map(t => t.id))];
    for (const tokenId of tokenIds) {
      const prices = await getAllPrices(tokenId);
      if (Object.keys(prices).length >= 2) {
        await checkPriceVariance(tokenId, prices);
      }
    }
  } catch (error) {
    console.error('Error in price sync:', error);
  }
}

export function startPriceSyncService() {
  // Initial sync
  syncPrices();
  
  // Periodic sync
  setInterval(syncPrices, PRICE_SYNC_INTERVAL);
}

export function getPriceAlerts(tokenId: string): PriceData[] | null {
  return priceAlerts.get(tokenId) || null;
}








