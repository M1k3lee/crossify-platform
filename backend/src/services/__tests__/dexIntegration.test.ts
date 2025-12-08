/**
 * DEX Integration Service Tests
 * Tests for Uniswap v4 integration alongside v3
 */

import {
  isUniswapV4Enabled,
  isUniswapV4Available,
  getDEXNameForChain,
  createDEXPool,
} from '../dexIntegration';

// Mock environment variables
const originalEnv = process.env;

describe('DEX Integration - Uniswap v4 Support', () => {
  beforeEach(() => {
    // Reset environment variables
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('isUniswapV4Enabled', () => {
    it('should return false when USE_UNISWAP_V4 is not set', () => {
      delete process.env.USE_UNISWAP_V4;
      expect(isUniswapV4Enabled()).toBe(false);
    });

    it('should return false when USE_UNISWAP_V4 is "false"', () => {
      process.env.USE_UNISWAP_V4 = 'false';
      expect(isUniswapV4Enabled()).toBe(false);
    });

    it('should return true when USE_UNISWAP_V4 is "true"', () => {
      process.env.USE_UNISWAP_V4 = 'true';
      expect(isUniswapV4Enabled()).toBe(true);
    });
  });

  describe('isUniswapV4Available', () => {
    it('should return false for non-Ethereum chains', () => {
      process.env.USE_UNISWAP_V4 = 'true';
      expect(isUniswapV4Available('solana')).toBe(false);
      expect(isUniswapV4Available('bsc')).toBe(false);
      expect(isUniswapV4Available('base')).toBe(false);
    });

    it('should return false when v4 is disabled', () => {
      process.env.USE_UNISWAP_V4 = 'false';
      expect(isUniswapV4Available('ethereum')).toBe(false);
      expect(isUniswapV4Available('sepolia')).toBe(false);
    });

    it('should return true for Ethereum when v4 is enabled', () => {
      process.env.USE_UNISWAP_V4 = 'true';
      expect(isUniswapV4Available('ethereum')).toBe(true);
      expect(isUniswapV4Available('Ethereum Sepolia')).toBe(true);
      expect(isUniswapV4Available('sepolia')).toBe(true);
    });
  });

  describe('getDEXNameForChain', () => {
    it('should return "raydium" for Solana', () => {
      expect(getDEXNameForChain('solana')).toBe('raydium');
    });

    it('should return "pancakeswap" for BSC', () => {
      expect(getDEXNameForChain('bsc')).toBe('pancakeswap');
      expect(getDEXNameForChain('binance')).toBe('pancakeswap');
    });

    it('should return "baseswap" for Base', () => {
      expect(getDEXNameForChain('base')).toBe('baseswap');
    });

    it('should return "uniswap-v3" for Ethereum when v4 is disabled', () => {
      process.env.USE_UNISWAP_V4 = 'false';
      expect(getDEXNameForChain('ethereum')).toBe('uniswap-v3');
      expect(getDEXNameForChain('sepolia')).toBe('uniswap-v3');
    });

    it('should return "uniswap-v4" for Ethereum when v4 is enabled', () => {
      process.env.USE_UNISWAP_V4 = 'true';
      expect(getDEXNameForChain('ethereum')).toBe('uniswap-v4');
      expect(getDEXNameForChain('sepolia')).toBe('uniswap-v4');
    });
  });

  describe('createDEXPool - Feature Flag Behavior', () => {
    // Note: These are integration tests that would require actual blockchain connection
    // For now, we test the logic flow
    
    it('should use v3 when v4 is disabled', async () => {
      process.env.USE_UNISWAP_V4 = 'false';
      process.env.ETHEREUM_RPC_URL = 'https://test.rpc';
      process.env.ETHEREUM_PRIVATE_KEY = '0x123';
      
      // This will fail at RPC connection, but we can verify it tries v3
      const result = await createDEXPool(
        'test-token-id',
        'ethereum',
        '0xTokenAddress',
        '1000000000000000000',
        '1000000000000000000'
      );
      
      // Should attempt v3 (will fail without real RPC, but logic is correct)
      expect(result.dexName).toBe('uniswap-v3');
    });
  });
});

