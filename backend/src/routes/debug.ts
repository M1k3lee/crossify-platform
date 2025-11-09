import { Router, Request, Response } from 'express';
import { ethers } from 'ethers';
import * as dotenv from 'dotenv';

dotenv.config();

const router = Router();

// Helper to get RPC URL for a chain
function getRpcUrl(chain: string): string | null {
  switch (chain.toLowerCase()) {
    case 'ethereum':
    case 'eth':
      return process.env.ETHEREUM_RPC_URL || process.env.SEPOLIA_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com';
    case 'base':
    case 'base-sepolia':
      return process.env.BASE_RPC_URL || process.env.BASE_SEPOLIA_RPC_URL || 'https://base-sepolia-rpc.publicnode.com';
    case 'bsc':
    case 'bsc-testnet':
      return process.env.BSC_RPC_URL || process.env.BSC_TESTNET_RPC_URL || 'https://bsc-testnet.publicnode.com';
    default:
      return null;
  }
}

// Helper to get factory address for a chain
function getFactoryAddress(chain: string): string | null {
  switch (chain.toLowerCase()) {
    case 'ethereum':
    case 'eth':
      return process.env.ETHEREUM_FACTORY_ADDRESS || null;
    case 'base':
      return process.env.BASE_FACTORY_ADDRESS || null;
    case 'bsc':
      return process.env.BSC_FACTORY_ADDRESS || null;
    case 'sepolia':
      return process.env.ETHEREUM_FACTORY_ADDRESS || process.env.SEPOLIA_FACTORY_ADDRESS || null;
    case 'base-sepolia':
      return process.env.BASE_FACTORY_ADDRESS || process.env.BASE_SEPOLIA_FACTORY_ADDRESS || null;
    case 'bsc-testnet':
      return process.env.BSC_FACTORY_ADDRESS || process.env.BSC_TESTNET_FACTORY_ADDRESS || null;
    default:
      return null;
  }
}

// TokenFactory ABI for TokenCreated event
const TOKEN_FACTORY_ABI = [
  'event TokenCreated(address indexed tokenAddress, address indexed creator, address indexed curveAddress, string name, string symbol)',
  'function getBondingCurve(address token) external view returns (address)',
];

// BondingCurve ABI
const BONDING_CURVE_ABI = [
  'function getPriceForAmount(uint256 tokenAmount) external view returns (uint256)',
  'function getCurrentPrice() external view returns (uint256)',
  'function getSupplyForPricing() public view returns (uint256)',
  'function totalSupplySold() external view returns (uint256)',
  'function basePrice() external view returns (uint256)',
  'function slope() external view returns (uint256)',
  'function token() external view returns (address)',
];

/**
 * GET /debug/token-info
 * Debug endpoint to investigate token and bonding curve contract
 * 
 * Query params:
 * - tokenAddress: Token contract address
 * - curveAddress: Bonding curve contract address (optional, will query factory if not provided)
 * - chain: Chain name (ethereum, base, bsc, sepolia, base-sepolia, bsc-testnet)
 */
router.get('/token-info', async (req: Request, res: Response) => {
  try {
    const { tokenAddress, curveAddress, chain } = req.query;

    if (!tokenAddress || !chain) {
      return res.status(400).json({
        error: 'Missing required parameters',
        required: ['tokenAddress', 'chain'],
        optional: ['curveAddress'],
      });
    }

    const chainStr = chain as string;
    const rpcUrl = getRpcUrl(chainStr);
    const factoryAddress = getFactoryAddress(chainStr);

    if (!rpcUrl) {
      return res.status(400).json({
        error: `No RPC URL configured for chain: ${chainStr}`,
      });
    }

    console.log(`🔍 Debugging token ${tokenAddress} on ${chainStr}`);
    console.log(`   RPC: ${rpcUrl}`);
    console.log(`   Factory: ${factoryAddress || 'NOT CONFIGURED'}`);

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const result: any = {
      chain: chainStr,
      tokenAddress: tokenAddress as string,
      rpcUrl,
      factoryAddress: factoryAddress || 'NOT CONFIGURED',
      timestamp: new Date().toISOString(),
    };

    // 1. Check if token contract exists
    try {
      const tokenCode = await provider.getCode(tokenAddress as string);
      result.tokenContract = {
        exists: !!(tokenCode && tokenCode !== '0x'),
        codeSize: tokenCode ? (tokenCode.length - 2) / 2 : 0, // Bytes (hex chars / 2)
      };
    } catch (error: any) {
      result.tokenContract = {
        exists: false,
        error: error.message,
      };
    }

    // 2. Find which factory created this token (query TokenCreated events)
    if (factoryAddress) {
      try {
        const factoryContract = new ethers.Contract(factoryAddress, TOKEN_FACTORY_ABI, provider);
        
        // Query TokenCreated events for this token
        const filter = factoryContract.filters.TokenCreated(tokenAddress);
        const events = await factoryContract.queryFilter(filter);
        
        if (events.length > 0) {
          const event = events[0];
          if ('args' in event && event.args) {
            result.factoryInfo = {
              factoryAddress,
              creator: event.args.creator,
              curveAddressFromEvent: event.args.curveAddress,
              tokenName: event.args.name,
              tokenSymbol: event.args.symbol,
              blockNumber: event.blockNumber,
              transactionHash: event.transactionHash,
            };
            
            // Use curve address from event if not provided
            if (!curveAddress && event.args.curveAddress) {
              result.curveAddress = event.args.curveAddress;
            }
          }
        } else {
          result.factoryInfo = {
            factoryAddress,
            note: 'No TokenCreated event found for this token. Token may have been created by a different factory or this factory is not the creator.',
          };
          
          // Try to get curve address from factory's getBondingCurve function
          try {
            const curveAddr = await factoryContract.getBondingCurve(tokenAddress);
            if (curveAddr && curveAddr !== ethers.ZeroAddress) {
              result.curveAddress = curveAddr;
              result.factoryInfo.curveAddressFromFactory = curveAddr;
            }
          } catch (error: any) {
            result.factoryInfo.getBondingCurveError = error.message;
          }
        }
      } catch (error: any) {
        result.factoryInfo = {
          factoryAddress,
          error: error.message,
        };
      }
    } else {
      result.factoryInfo = {
        note: 'Factory address not configured - cannot determine which factory created this token',
      };
    }

    // 3. Use provided curveAddress or the one from factory event
    const actualCurveAddress = (curveAddress as string) || result.curveAddress || result.factoryInfo?.curveAddressFromEvent || result.factoryInfo?.curveAddressFromFactory;
    
    if (!actualCurveAddress) {
      return res.status(400).json({
        ...result,
        error: 'Cannot determine bonding curve address. Please provide curveAddress parameter or ensure factory address is configured.',
      });
    }

    result.curveAddress = actualCurveAddress;

    // 4. Check bonding curve contract
    try {
      const curveCode = await provider.getCode(actualCurveAddress);
      result.bondingCurve = {
        address: actualCurveAddress,
        exists: !!(curveCode && curveCode !== '0x'),
        codeSize: curveCode ? (curveCode.length - 2) / 2 : 0,
      };

      if (curveCode && curveCode !== '0x') {
        // Try to call bonding curve functions
        const curveContract = new ethers.Contract(actualCurveAddress, BONDING_CURVE_ABI, provider);
        
        try {
          const basePrice = await curveContract.basePrice();
          const slope = await curveContract.slope();
          const totalSupplySold = await curveContract.totalSupplySold();
          const tokenAddr = await curveContract.token();
          
          result.bondingCurve.parameters = {
            basePrice: ethers.formatEther(basePrice),
            slope: ethers.formatEther(slope),
            totalSupplySold: ethers.formatEther(totalSupplySold),
            tokenAddress: tokenAddr,
          };

          // Try to get supply for pricing
          try {
            const supplyForPricing = await curveContract.getSupplyForPricing();
            result.bondingCurve.supplyForPricing = ethers.formatEther(supplyForPricing);
            
            // Check if supply is reasonable (not corrupted)
            const supplyBN = BigInt(supplyForPricing.toString());
            const maxReasonableSupply = ethers.parseEther('1000000000'); // 1 billion
            result.bondingCurve.supplyValidation = {
              value: ethers.formatEther(supplyForPricing),
              isReasonable: supplyBN <= maxReasonableSupply,
              note: supplyBN > maxReasonableSupply 
                ? '⚠️ Supply is unreasonably high - may indicate corrupted global supply data'
                : '✅ Supply is within reasonable range',
            };
          } catch (error: any) {
            result.bondingCurve.supplyForPricingError = error.message;
          }

          // Try to get current price
          try {
            const currentPrice = await curveContract.getCurrentPrice();
            result.bondingCurve.currentPrice = {
              wei: currentPrice.toString(),
              eth: ethers.formatEther(currentPrice),
            };
          } catch (error: any) {
            result.bondingCurve.currentPriceError = error.message;
          }

          // Test price calculation for 122 tokens (the problematic amount)
          try {
            const testAmount = ethers.parseEther('122');
            const priceForAmount = await curveContract.getPriceForAmount(testAmount);
            const priceEth = parseFloat(ethers.formatEther(priceForAmount));
            const maxReasonableWei = ethers.parseEther('100'); // 100 ETH/BNB max
            
            result.bondingCurve.priceTest = {
              tokenAmount: '122',
              priceWei: priceForAmount.toString(),
              priceEth: priceEth.toString(),
              isValid: priceForAmount <= maxReasonableWei && priceEth < 100,
              validation: priceForAmount > maxReasonableWei
                ? `❌ Price too high: ${priceEth} ETH (exceeds 100 ETH limit)`
                : priceEth > 10
                ? `⚠️ Price high but within limit: ${priceEth} ETH`
                : `✅ Price is reasonable: ${priceEth} ETH`,
            };
          } catch (error: any) {
            result.bondingCurve.priceTestError = error.message;
          }

        } catch (error: any) {
          result.bondingCurve.parameterError = error.message;
        }
      }
    } catch (error: any) {
      result.bondingCurve = {
        address: actualCurveAddress,
        error: error.message,
      };
    }

    // 5. Environment variables summary
    result.environmentVariables = {
      rpcUrl: rpcUrl ? '✅ Configured' : '❌ Not configured',
      factoryAddress: factoryAddress ? '✅ Configured' : '❌ Not configured',
      factoryAddressValue: factoryAddress || 'NOT SET',
    };

    res.json(result);
  } catch (error: any) {
    console.error('Error in token-info debug endpoint:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
});

/**
 * GET /debug/factory-info
 * Debug endpoint to check factory configuration
 */
router.get('/factory-info', async (req: Request, res: Response) => {
  try {
    const chains = ['ethereum', 'sepolia', 'base', 'base-sepolia', 'bsc', 'bsc-testnet'];
    const result: any = {
      timestamp: new Date().toISOString(),
      chains: {},
    };

    for (const chain of chains) {
      const rpcUrl = getRpcUrl(chain);
      const factoryAddress = getFactoryAddress(chain);

      result.chains[chain] = {
        rpcUrl: rpcUrl || 'NOT CONFIGURED',
        factoryAddress: factoryAddress || 'NOT CONFIGURED',
        configured: !!(rpcUrl && factoryAddress),
      };

      // Try to verify factory contract if configured
      if (rpcUrl && factoryAddress) {
        try {
          const provider = new ethers.JsonRpcProvider(rpcUrl);
          const code = await provider.getCode(factoryAddress);
          result.chains[chain].factoryContract = {
            exists: !!(code && code !== '0x'),
            codeSize: code ? (code.length - 2) / 2 : 0,
          };
        } catch (error: any) {
          result.chains[chain].factoryContract = {
            error: error.message,
          };
        }
      }
    }

    res.json(result);
  } catch (error: any) {
    console.error('Error in factory-info debug endpoint:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

export default router;

