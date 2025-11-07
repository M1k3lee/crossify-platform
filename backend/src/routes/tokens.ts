import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { dbRun, dbGet, dbAll } from '../db';
import { v4 as uuidv4 } from 'uuid';

export const router = Router();

// Validation schemas
const createTokenSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
  symbol: z.string()
    .min(1, 'Symbol is required')
    .max(10, 'Symbol must be 10 characters or less')
    .regex(/^[A-Z0-9]+$/, 'Symbol must contain only uppercase letters and numbers'),
  decimals: z.number().int().min(0).max(18).default(18),
  initialSupply: z.string()
    .regex(/^\d+$/, 'Initial supply must be a positive number')
    .refine((val) => val && val !== '', {
      message: 'Initial supply is required',
    }),
  logoIpfs: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  twitterUrl: z.preprocess(
    (val) => {
      if (val === '' || val === null || val === undefined) return undefined;
      if (typeof val === 'string') {
        const trimmed = val.trim();
        return trimmed === '' ? undefined : trimmed;
      }
      return val;
    },
    z.union([
      z.string().url('Twitter URL must be a valid URL'),
      z.undefined()
    ]).optional()
  ),
  discordUrl: z.preprocess(
    (val) => {
      if (val === '' || val === null || val === undefined) return undefined;
      if (typeof val === 'string') {
        const trimmed = val.trim();
        return trimmed === '' ? undefined : trimmed;
      }
      return val;
    },
    z.union([
      z.string().url('Discord URL must be a valid URL'),
      z.undefined()
    ]).optional()
  ),
  telegramUrl: z.preprocess(
    (val) => {
      if (val === '' || val === null || val === undefined) return undefined;
      if (typeof val === 'string') {
        const trimmed = val.trim();
        return trimmed === '' ? undefined : trimmed;
      }
      return val;
    },
    z.union([
      z.string().url('Telegram URL must be a valid URL'),
      z.undefined()
    ]).optional()
  ),
  websiteUrl: z.preprocess(
    (val) => {
      // Handle empty strings, null, undefined - convert to undefined
      if (val === '' || val === null || val === undefined) {
        return undefined;
      }
      // If it's a string, trim it
      if (typeof val === 'string') {
        const trimmed = val.trim();
        return trimmed === '' ? undefined : trimmed;
      }
      return val;
    },
    z.union([
      z.string().url('Website URL must be a valid URL'),
      z.undefined()
    ]).optional()
  ),
  basePrice: z.union([z.number().positive(), z.string()]).transform((val) => {
    if (typeof val === 'string') {
      const parsed = parseFloat(val);
      if (isNaN(parsed) || parsed <= 0) {
        throw new Error('Base price must be a positive number');
      }
      return parsed;
    }
    return val;
  }),
  slope: z.union([z.number().nonnegative(), z.string()]).transform((val) => {
    if (typeof val === 'string') {
      const parsed = parseFloat(val);
      if (isNaN(parsed) || parsed < 0) {
        throw new Error('Slope must be a non-negative number');
      }
      return parsed;
    }
    return val;
  }),
  graduationThreshold: z.union([z.number().nonnegative(), z.string()]).default(0).transform((val) => {
    if (typeof val === 'string') {
      const parsed = parseFloat(val);
      if (isNaN(parsed) || parsed < 0) {
        throw new Error('Graduation threshold must be a non-negative number (0 to disable)');
      }
      return parsed;
    }
    // Allow 0 to disable graduation
    return val ?? 0;
  }),
  buyFeePercent: z.union([z.number().min(0).max(100), z.string()]).default(0).transform((val) => 
    typeof val === 'string' ? parseFloat(val) || 0 : val
  ),
  sellFeePercent: z.union([z.number().min(0).max(100), z.string()]).default(0).transform((val) => 
    typeof val === 'string' ? parseFloat(val) || 0 : val
  ),
  crossChainEnabled: z.boolean().optional().default(false),
  advancedSettings: z.object({
    mintable: z.boolean().optional().default(false),
    burnable: z.boolean().optional().default(false),
    pausable: z.boolean().optional().default(false),
    blacklistEnabled: z.boolean().optional().default(false),
    whitelistEnabled: z.boolean().optional().default(false),
    transferRestrictions: z.boolean().optional().default(false),
    transferTaxEnabled: z.boolean().optional().default(false),
    governanceEnabled: z.boolean().optional().default(false),
    vestingEnabled: z.boolean().optional().default(false),
    multiSigEnabled: z.boolean().optional().default(false),
    timelockEnabled: z.boolean().optional().default(false),
  }).optional().default({}),
  distributionSettings: z.any().optional(), // Can be complex object, validate separately if needed
});

const deployTokenSchema = z.object({
  chains: z.array(z.enum(['ethereum', 'bsc', 'solana', 'base'])).min(1),
  deployments: z.array(z.object({
    chain: z.string(),
    tokenAddress: z.string().optional(),
    curveAddress: z.string().optional(),
    status: z.string().optional(),
    txHash: z.string().optional(),
    error: z.string().optional(),
    message: z.string().optional(),
  })).optional(),
});

// POST /tokens/create
router.post('/create', async (req: Request, res: Response) => {
  try {
    console.log('Received token creation request:', JSON.stringify(req.body, null, 2));
    
    // The schema will handle empty strings via transform, but we can preprocess to be safe
    const data = createTokenSchema.parse(req.body);
    
    const tokenId = uuidv4();
    
    console.log('Creating token with ID:', tokenId);
    
    const crossChainEnabled = data.crossChainEnabled ?? false;
    const creatorAddress = req.headers['x-creator-address'] as string || null;
    // Ensure advancedSettings is an object, even if empty, and stringify it
    const advancedSettingsObj = data.advancedSettings || {};
    console.log('📝 Advanced settings received:', JSON.stringify(advancedSettingsObj, null, 2));
    const advancedSettings = JSON.stringify(advancedSettingsObj);
    
    await dbRun(
      `INSERT INTO tokens (
        id, name, symbol, decimals, initial_supply,
        logo_ipfs, description, twitter_url, discord_url, telegram_url, website_url,
        base_price, slope, graduation_threshold, buy_fee_percent, sell_fee_percent,
        cross_chain_enabled, creator_address, advanced_settings
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        tokenId,
        data.name,
        data.symbol,
        data.decimals,
        data.initialSupply,
        data.logoIpfs && data.logoIpfs !== '' ? data.logoIpfs : null,
        data.description && data.description !== '' ? data.description : null,
        data.twitterUrl && data.twitterUrl !== '' ? data.twitterUrl : null,
        data.discordUrl && data.discordUrl !== '' ? data.discordUrl : null,
        data.telegramUrl && data.telegramUrl !== '' ? data.telegramUrl : null,
        data.websiteUrl && data.websiteUrl !== '' ? data.websiteUrl : null,
        data.basePrice,
        data.slope,
        data.graduationThreshold,
        data.buyFeePercent,
        data.sellFeePercent,
        crossChainEnabled ? 1 : 0,
        creatorAddress,
        advancedSettings
      ]
    );
    
    console.log('Token created successfully:', tokenId);
    
    // Record token creation fee (if applicable)
    // In production, this would be called after successful deployment
    // For now, we'll record it when deployment is confirmed
    try {
      const { recordTokenCreationFee } = await import('../services/feeRecorder');
      // Fee will be recorded when deployment is confirmed in the deploy endpoint
    } catch (error) {
      console.warn('Could not record token creation fee:', error);
    }
    
    res.json({
      success: true,
      tokenId,
      message: 'Token created successfully',
    });
  } catch (error) {
    console.error('Error creating token - Full error:', error);
    if (error instanceof z.ZodError) {
      console.error('Validation errors:', JSON.stringify(error.errors, null, 2));
      
      // Format validation errors for better readability
      const formattedErrors = error.errors.map((err) => ({
        path: err.path.join('.'),
        message: err.message,
        code: err.code,
      }));
      
      return res.status(400).json({ 
        error: 'Validation error', 
        details: formattedErrors,
        message: formattedErrors.map(e => `${e.path}: ${e.message}`).join(', ')
      });
    }
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    res.status(500).json({ 
      error: 'Failed to create token', 
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined
    });
  }
});

// POST /tokens/:id/deploy
router.post('/:id/deploy', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = deployTokenSchema.parse(req.body);
    
    // Verify token exists
    const token = await dbGet('SELECT id FROM tokens WHERE id = ?', [id]) as any;
    if (!token) {
      return res.status(404).json({ error: 'Token not found' });
    }
    
    // Save deployments
    for (const deployment of data.deployments || []) {
      const chain = deployment.chain;
      
      // Check if deployment already exists
      const existing = await dbGet(
        'SELECT id FROM token_deployments WHERE token_id = ? AND chain = ?',
        [id, chain]
      ) as any;
      
      if (existing) {
        // Update existing deployment
        await dbRun(
          `UPDATE token_deployments 
           SET token_address = ?, curve_address = ?, status = ?, updated_at = CURRENT_TIMESTAMP
           WHERE token_id = ? AND chain = ?`,
          [
            deployment.tokenAddress || null,
            deployment.curveAddress || null,
            deployment.status || 'pending',
            id,
            chain
          ]
        );
      } else {
        // Create new deployment
        await dbRun(
          `INSERT INTO token_deployments (
            token_id, chain, token_address, curve_address, status
          ) VALUES (?, ?, ?, ?, ?)`,
          [
            id,
            chain,
            deployment.tokenAddress || null,
            deployment.curveAddress || null,
            deployment.status || 'pending'
          ]
        );
      }
      
      // Save transaction if txHash exists
      if (deployment.txHash) {
        await dbRun(
          `INSERT INTO transactions (
            token_id, chain, tx_hash, type, status
          ) VALUES (?, ?, ?, ?, ?)`,
          [id, chain, deployment.txHash, 'deploy', 'confirmed']
        );
      }
      
      // Update global supply if deployment was successful
      if (deployment.status === 'deployed' && deployment.tokenAddress) {
        const { updateGlobalSupply, syncPriceAcrossChains } = await import('../services/globalSupply');
        // Initialize supply to 0 (no tokens sold yet)
        await updateGlobalSupply(id, chain, '0');
        // Sync prices across all chains
        await syncPriceAcrossChains(id);
      }
    }
    
    res.json({
      success: true,
      message: 'Deployments saved successfully',
    });
  } catch (error) {
    console.error('Error saving deployments:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ 
      error: 'Failed to save deployments',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /tokens/marketplace
router.get('/marketplace', async (req: Request, res: Response) => {
  try {
    const { chain, search, sortBy = 'newest' } = req.query;
    
    let query = `
      SELECT 
        t.id, t.name, t.symbol, t.decimals, t.initial_supply, t.logo_ipfs,
        t.description, t.twitter_url, t.discord_url, t.telegram_url, t.website_url,
        t.base_price, t.slope, t.graduation_threshold, t.buy_fee_percent, t.sell_fee_percent,
        t.creator_address, t.cross_chain_enabled, t.advanced_settings, t.created_at,
        GROUP_CONCAT(td.chain) as chains,
        GROUP_CONCAT(td.token_address) as token_addresses,
        GROUP_CONCAT(td.curve_address) as curve_addresses,
        GROUP_CONCAT(td.status) as deployment_statuses,
        GROUP_CONCAT(td.is_graduated) as graduation_statuses,
        GROUP_CONCAT(td.market_cap) as market_caps
      FROM tokens t
      LEFT JOIN token_deployments td ON t.id = td.token_id
      WHERE 1=1
    `;
    
    const params: any[] = [];
    
    if (chain) {
      query += ` AND td.chain = ?`;
      params.push(chain);
    }
    
    if (search) {
      query += ` AND (t.name LIKE ? OR t.symbol LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }
    
    query += ` GROUP BY t.id`;
    
    switch (sortBy) {
      case 'newest':
        query += ` ORDER BY t.created_at DESC`;
        break;
      case 'oldest':
        query += ` ORDER BY t.created_at ASC`;
        break;
      case 'name':
        query += ` ORDER BY t.name ASC`;
        break;
      default:
        query += ` ORDER BY t.created_at DESC`;
    }
    
    const tokens = await dbAll(query, params) as any[];
    
    const formattedTokens = tokens.map(token => {
      const chains = token.chains ? token.chains.split(',') : [];
      const tokenAddresses = token.token_addresses ? token.token_addresses.split(',') : [];
      const curveAddresses = token.curve_addresses ? token.curve_addresses.split(',') : [];
      const statuses = token.deployment_statuses ? token.deployment_statuses.split(',') : [];
      const graduations = token.graduation_statuses ? token.graduation_statuses.split(',') : [];
      
      const marketCaps = token.market_caps ? token.market_caps.split(',') : [];
      const deployments = chains.map((chain: string, idx: number) => ({
        chain,
        tokenAddress: tokenAddresses[idx] || null,
        curveAddress: curveAddresses[idx] || null,
        status: statuses[idx] || 'pending',
        isGraduated: graduations[idx] === '1',
        marketCap: parseFloat(marketCaps[idx] || '0') || 0,
      }));
      
      return {
        id: token.id,
        name: token.name,
        symbol: token.symbol,
        decimals: token.decimals,
        initialSupply: token.initial_supply,
        logoIpfs: token.logo_ipfs,
        description: token.description,
        twitterUrl: token.twitter_url,
        discordUrl: token.discord_url,
        telegramUrl: token.telegram_url,
        websiteUrl: token.website_url,
        basePrice: token.base_price,
        slope: token.slope,
        graduationThreshold: token.graduation_threshold,
        buyFeePercent: token.buy_fee_percent,
        sellFeePercent: token.sell_fee_percent,
        creatorAddress: token.creator_address || null,
        crossChainEnabled: token.cross_chain_enabled === 1,
        advancedSettings: token.advanced_settings ? JSON.parse(token.advanced_settings) : {},
        createdAt: token.created_at,
        deployments,
      };
    });
    
    res.json({
      tokens: formattedTokens,
      count: formattedTokens.length,
    });
  } catch (error) {
    console.error('Error fetching marketplace tokens:', error);
    res.status(500).json({ error: 'Failed to fetch tokens' });
  }
});

// GET /tokens/:id/status - Must be before /:id route
router.get('/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const token = await dbGet('SELECT * FROM tokens WHERE id = ?', [id]) as any;
    if (!token) {
      return res.status(404).json({ error: 'Token not found' });
    }
    
    const deployments = await dbAll(
      'SELECT * FROM token_deployments WHERE token_id = ?',
      [id]
    ) as any[];
    
    res.json({
      token: {
        id: token.id,
        name: token.name,
        symbol: token.symbol,
        decimals: token.decimals,
        initialSupply: token.initial_supply,
        logoIpfs: token.logo_ipfs,
        description: token.description,
        twitterUrl: token.twitter_url,
        discordUrl: token.discord_url,
        telegramUrl: token.telegram_url,
        websiteUrl: token.website_url,
        basePrice: token.base_price,
        slope: token.slope,
        graduationThreshold: token.graduation_threshold,
        buyFeePercent: token.buy_fee_percent,
        sellFeePercent: token.sell_fee_percent,
        creatorAddress: token.creator_address || null,
        crossChainEnabled: token.cross_chain_enabled === 1,
        advancedSettings: token.advanced_settings ? JSON.parse(token.advanced_settings) : {},
        createdAt: token.created_at,
      },
      deployments: deployments.map(d => ({
        chain: d.chain,
        tokenAddress: d.token_address,
        curveAddress: d.curve_address,
        poolAddress: d.pool_address,
        bridgeAddress: d.bridge_address,
        status: d.status,
        isGraduated: d.is_graduated === 1,
        currentSupply: d.current_supply,
        reserveBalance: d.reserve_balance,
        marketCap: d.market_cap || 0,
      })),
    });
  } catch (error) {
    console.error('Error fetching token status:', error);
    res.status(500).json({ error: 'Failed to fetch token status' });
  }
});

// GET /tokens/:id/metadata - Must be before /:id route
router.get('/:id/metadata', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const token = await dbGet('SELECT * FROM tokens WHERE id = ?', [id]) as any;
    if (!token) {
      return res.status(404).json({ error: 'Token not found' });
    }
    
    res.json({
      name: token.name,
      symbol: token.symbol,
      description: token.description,
      logoUrl: token.logo_ipfs ? `https://ipfs.io/ipfs/${token.logo_ipfs}` : null,
      twitterUrl: token.twitter_url,
      discordUrl: token.discord_url,
      telegramUrl: token.telegram_url,
      websiteUrl: token.website_url,
    });
  } catch (error) {
    console.error('Error fetching token metadata:', error);
    res.status(500).json({ error: 'Failed to fetch token metadata' });
  }
});

// GET /tokens/:id/global-supply
router.get('/:id/global-supply', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const { getGlobalSupply, getSupplyByChain } = await import('../services/globalSupply');
    const globalSupply = await getGlobalSupply(id);
    const supplyByChain = await getSupplyByChain(id);
    
    res.json({
      tokenId: id,
      globalSupply,
      supplyByChain,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching global supply:', error);
    res.status(500).json({ error: 'Failed to fetch global supply' });
  }
});

// GET /tokens/:id/price-sync - Must be before /:id route
router.get('/:id/price-sync', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Get token parameters for virtual liquidity pricing
    const token = await dbGet('SELECT base_price, slope FROM tokens WHERE id = ?', [id]) as any;
    if (!token) {
      return res.status(404).json({ error: 'Token not found' });
    }
    
    // Get global supply for virtual liquidity pricing
    const { getGlobalSupply, getSupplyByChain, calculatePriceWithGlobalSupply } = await import('../services/globalSupply');
    const globalSupply = await getGlobalSupply(id);
    const globalPrice = await calculatePriceWithGlobalSupply(id, token.base_price, token.slope);
    const supplyByChain = await getSupplyByChain(id);
    
    const deployments = await dbAll(
      'SELECT chain, token_address, market_cap, current_supply FROM token_deployments WHERE token_id = ? AND status = ?',
      [id, 'deployed']
    ) as any[];
    
    const prices: Record<string, number> = {};
    const marketCaps: Record<string, number> = {};
    
    // All chains use the same global price (virtual liquidity)
    for (const dep of deployments) {
      prices[dep.chain] = globalPrice; // Same price across all chains!
      const localSupply = parseFloat(dep.current_supply || '0');
      marketCaps[dep.chain] = globalPrice * localSupply; // Market cap = price * local supply
    }
    
    // Calculate variance (should be near 0% with virtual liquidity)
    const priceValues = Object.values(prices);
    const avgPrice = priceValues.reduce((a, b) => a + b, 0) / priceValues.length || 0;
    const variance = priceValues.length > 1
      ? Math.sqrt(priceValues.reduce((sum, p) => sum + Math.pow(p - avgPrice, 2), 0) / priceValues.length) / avgPrice * 100
      : 0;
    
    res.json({
      tokenId: id,
      prices,
      marketCaps,
      globalSupply,
      globalPrice,
      supplyByChain,
      variance,
      inSync: variance < 0.5, // In sync if variance < 0.5%
      lastSync: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching price sync:', error);
    res.status(500).json({ error: 'Failed to fetch price sync' });
  }
});

// GET /tokens/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const token = await dbGet('SELECT * FROM tokens WHERE id = ?', [id]) as any;
    if (!token) {
      return res.status(404).json({ error: 'Token not found' });
    }
    
    const deployments = await dbAll(
      'SELECT * FROM token_deployments WHERE token_id = ?',
      [id]
    ) as any[];
    
    // Parse advanced settings, with fallback to empty object
    let advancedSettings = {};
    if (token.advanced_settings) {
      try {
        advancedSettings = JSON.parse(token.advanced_settings);
      } catch (e) {
        console.error('Error parsing advanced_settings:', e);
        advancedSettings = {};
      }
    }
    console.log(`📖 Token ${id} advanced settings:`, JSON.stringify(advancedSettings, null, 2));
    
    res.json({
      ...token,
      creatorAddress: token.creator_address || null,
      crossChainEnabled: token.cross_chain_enabled === 1,
      advancedSettings,
      deployments: deployments.map(d => ({
        chain: d.chain,
        tokenAddress: d.token_address || null,
        curveAddress: d.curve_address || null,
        poolAddress: d.pool_address || null,
        bridgeAddress: d.bridge_address || null,
        status: d.status || 'pending',
        isGraduated: d.is_graduated === 1,
        currentSupply: d.current_supply || '0',
        reserveBalance: d.reserve_balance || '0',
        marketCap: d.market_cap || 0,
        paused: false, // TODO: Get actual pause status from contract
      })),
    });
  } catch (error) {
    console.error('Error fetching token:', error);
    res.status(500).json({ error: 'Failed to fetch token' });
  }
});

// POST /tokens/:id/mint - Mint tokens (if mintable)
router.post('/:id/mint', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { chain, amount, recipient, txHash, platformFeeAmount } = req.body;
    const creatorAddress = req.headers['x-creator-address'] as string;

    if (!chain || !amount || !recipient) {
      return res.status(400).json({ error: 'Missing required fields: chain, amount, recipient' });
    }

    const token = await dbGet('SELECT * FROM tokens WHERE id = ?', [id]) as any;
    if (!token) {
      return res.status(404).json({ error: 'Token not found' });
    }

    // Verify creator
    if (token.creator_address && token.creator_address.toLowerCase() !== creatorAddress?.toLowerCase()) {
      return res.status(403).json({ error: 'Only token creator can mint tokens' });
    }

    const advancedSettings = token.advanced_settings ? JSON.parse(token.advanced_settings) : {};
    if (!advancedSettings.mintable) {
      return res.status(400).json({ error: 'Token is not mintable' });
    }

    // Frontend now handles the actual on-chain minting
    // This endpoint just records the transaction and platform fee

    // Save transaction if txHash provided
    if (txHash) {
      await dbRun(
        `INSERT INTO transactions (
          token_id, chain, tx_hash, type, status, metadata
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          id,
          chain,
          txHash,
          'mint',
          'confirmed',
          JSON.stringify({
            amount,
            recipient,
            platformFeeAmount: platformFeeAmount || null,
          }),
        ]
      );
      
      // Record mint fee
      if (platformFeeAmount) {
        try {
          const { recordMintFee } = await import('../services/feeRecorder');
          // Calculate USD value (simplified - use oracle in production)
          const ethPrice = 2500; // Default price - should use oracle
          const tokenPrice = 0.001; // Simplified - should get actual token price
          const amountUsd = parseFloat(platformFeeAmount) * tokenPrice;
          await recordMintFee(
            id,
            chain,
            platformFeeAmount,
            amountUsd,
            creatorAddress || '',
            recipient,
            txHash
          );
        } catch (error) {
          console.warn('Could not record mint fee:', error);
        }
      }
    }

    res.json({
      success: true,
      message: 'Mint transaction recorded',
      txHash: txHash || null,
      platformFeeAmount: platformFeeAmount || null,
    });
  } catch (error) {
    console.error('Error minting tokens:', error);
    res.status(500).json({ error: 'Failed to mint tokens' });
  }
});

// POST /tokens/:id/burn - Burn tokens (if burnable)
router.post('/:id/burn', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { chain, amount, txHash } = req.body;
    const creatorAddress = req.headers['x-creator-address'] as string;

    if (!chain || !amount) {
      return res.status(400).json({ error: 'Missing required fields: chain, amount' });
    }

    const token = await dbGet('SELECT * FROM tokens WHERE id = ?', [id]) as any;
    if (!token) {
      return res.status(404).json({ error: 'Token not found' });
    }

    // Verify creator
    if (token.creator_address && token.creator_address.toLowerCase() !== creatorAddress?.toLowerCase()) {
      return res.status(403).json({ error: 'Only token creator can burn tokens' });
    }

    const advancedSettings = token.advanced_settings ? JSON.parse(token.advanced_settings) : {};
    if (!advancedSettings.burnable) {
      return res.status(400).json({ error: 'Token is not burnable' });
    }

    // Frontend now handles the actual on-chain burning
    // This endpoint just records the transaction

    // Save transaction if txHash provided
    if (txHash) {
      await dbRun(
        `INSERT INTO transactions (
          token_id, chain, tx_hash, type, status, metadata
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          id,
          chain,
          txHash,
          'burn',
          'confirmed',
          JSON.stringify({ amount }),
        ]
      );
    }

    res.json({
      success: true,
      message: 'Burn transaction recorded',
      txHash: txHash || null,
    });
  } catch (error) {
    console.error('Error burning tokens:', error);
    res.status(500).json({ error: 'Failed to burn tokens' });
  }
});

// POST /tokens/:id/pause - Pause/unpause token (if pausable)
router.post('/:id/pause', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { chain, paused, txHash } = req.body;
    const creatorAddress = req.headers['x-creator-address'] as string;

    if (!chain || typeof paused !== 'boolean') {
      return res.status(400).json({ error: 'Missing required fields: chain, paused' });
    }

    const token = await dbGet('SELECT * FROM tokens WHERE id = ?', [id]) as any;
    if (!token) {
      return res.status(404).json({ error: 'Token not found' });
    }

    // Verify creator
    if (token.creator_address && token.creator_address.toLowerCase() !== creatorAddress?.toLowerCase()) {
      return res.status(403).json({ error: 'Only token creator can pause/unpause token' });
    }

    const advancedSettings = token.advanced_settings ? JSON.parse(token.advanced_settings) : {};
    if (!advancedSettings.pausable) {
      return res.status(400).json({ error: 'Token is not pausable' });
    }

    // Frontend now handles the actual on-chain pause/unpause
    // This endpoint just records the transaction

    // Save transaction if txHash provided
    if (txHash) {
      await dbRun(
        `INSERT INTO transactions (
          token_id, chain, tx_hash, type, status, metadata
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          id,
          chain,
          txHash,
          paused ? 'pause' : 'unpause',
          'confirmed',
          JSON.stringify({ paused }),
        ]
      );
    }

    res.json({
      success: true,
      message: `Token ${paused ? 'paused' : 'unpaused'} successfully`,
      txHash: txHash || null,
    });
  } catch (error) {
    console.error('Error pausing token:', error);
    res.status(500).json({ error: 'Failed to pause/unpause token' });
  }
});

// POST /tokens/:id/sync-price - Manually trigger price sync
router.post('/:id/sync-price', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const creatorAddress = req.headers['x-creator-address'] as string;

    const token = await dbGet('SELECT * FROM tokens WHERE id = ?', [id]) as any;
    if (!token) {
      return res.status(404).json({ error: 'Token not found' });
    }

    // Verify creator (optional - could allow anyone to trigger sync)
    if (token.creator_address && token.creator_address.toLowerCase() !== creatorAddress?.toLowerCase()) {
      return res.status(403).json({ error: 'Only token creator can trigger price sync' });
    }

    if (!token.cross_chain_enabled) {
      return res.status(400).json({ error: 'Token does not have cross-chain sync enabled' });
    }

    // TODO: Implement actual price sync trigger via CrossChainSync contract
    res.json({
      success: true,
      message: 'Price sync initiated across all chains',
    });
  } catch (error) {
    console.error('Error syncing price:', error);
    res.status(500).json({ error: 'Failed to sync price' });
  }
});

// POST /tokens/:id/update-fees - Update buy/sell fees on bonding curve
router.post('/:id/update-fees', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { chain, buyFeePercent, sellFeePercent, txHash } = req.body;
    const creatorAddress = req.headers['x-creator-address'] as string;

    if (!chain || buyFeePercent === undefined || sellFeePercent === undefined) {
      return res.status(400).json({ error: 'Missing required fields: chain, buyFeePercent, sellFeePercent' });
    }

    if (buyFeePercent < 0 || buyFeePercent > 10) {
      return res.status(400).json({ error: 'Buy fee must be between 0 and 10%' });
    }

    if (sellFeePercent < 0 || sellFeePercent > 10) {
      return res.status(400).json({ error: 'Sell fee must be between 0 and 10%' });
    }

    const token = await dbGet('SELECT * FROM tokens WHERE id = ?', [id]) as any;
    if (!token) {
      return res.status(404).json({ error: 'Token not found' });
    }

    // Verify creator
    if (token.creator_address && token.creator_address.toLowerCase() !== creatorAddress?.toLowerCase()) {
      return res.status(403).json({ error: 'Only token creator can update fees' });
    }

    // Get deployment for the chain
    const deployment = await dbGet(
      'SELECT * FROM token_deployments WHERE token_id = ? AND chain = ?',
      [id, chain]
    ) as any;

    if (!deployment || !deployment.curve_address) {
      return res.status(404).json({ error: `Token not deployed on ${chain} or bonding curve not found` });
    }

    // TODO: Implement actual fee update via smart contract
    // The frontend now handles the on-chain call directly
    // This endpoint just updates the database to reflect the change

    // Update in database
    await dbRun(
      'UPDATE tokens SET buy_fee_percent = ?, sell_fee_percent = ? WHERE id = ?',
      [buyFeePercent, sellFeePercent, id]
    );

    // Save transaction if txHash provided
    if (txHash) {
      await dbRun(
        `INSERT INTO transactions (
          token_id, chain, tx_hash, type, status
        ) VALUES (?, ?, ?, ?, ?)`,
        [id, chain, txHash, 'update_fees', 'confirmed']
      );
    }

    res.json({
      success: true,
      message: 'Fees updated successfully',
      txHash: txHash || null,
    });
  } catch (error) {
    console.error('Error updating fees:', error);
    res.status(500).json({ error: 'Failed to update fees' });
  }
});

