import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { dbRun, dbGet, dbAll } from '../db/adapter';
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
  githubUrl: z.preprocess(
    (val) => {
      if (val === '' || val === null || val === undefined) return undefined;
      if (typeof val === 'string') {
        const trimmed = val.trim();
        return trimmed === '' ? undefined : trimmed;
      }
      return val;
    },
    z.union([z.string().url('GitHub URL must be a valid URL'), z.undefined()]).optional()
  ),
  mediumUrl: z.preprocess(
    (val) => {
      if (val === '' || val === null || val === undefined) return undefined;
      if (typeof val === 'string') {
        const trimmed = val.trim();
        return trimmed === '' ? undefined : trimmed;
      }
      return val;
    },
    z.union([z.string().url('Medium URL must be a valid URL'), z.undefined()]).optional()
  ),
  redditUrl: z.preprocess(
    (val) => {
      if (val === '' || val === null || val === undefined) return undefined;
      if (typeof val === 'string') {
        const trimmed = val.trim();
        return trimmed === '' ? undefined : trimmed;
      }
      return val;
    },
    z.union([z.string().url('Reddit URL must be a valid URL'), z.undefined()]).optional()
  ),
  youtubeUrl: z.preprocess(
    (val) => {
      if (val === '' || val === null || val === undefined) return undefined;
      if (typeof val === 'string') {
        const trimmed = val.trim();
        return trimmed === '' ? undefined : trimmed;
      }
      return val;
    },
    z.union([z.string().url('YouTube URL must be a valid URL'), z.undefined()]).optional()
  ),
  linkedinUrl: z.preprocess(
    (val) => {
      if (val === '' || val === null || val === undefined) return undefined;
      if (typeof val === 'string') {
        const trimmed = val.trim();
        return trimmed === '' ? undefined : trimmed;
      }
      return val;
    },
    z.union([z.string().url('LinkedIn URL must be a valid URL'), z.undefined()]).optional()
  ),
  bannerImageIpfs: z.string().optional().nullable(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Primary color must be a valid hex color').optional(),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Accent color must be a valid hex color').optional(),
  backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Background color must be a valid hex color').optional(),
  layoutTemplate: z.string().optional(),
  customSettings: z.any().optional(),
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
    
    try {
      await dbRun(
        `INSERT INTO tokens (
          id, name, symbol, decimals, initial_supply,
          logo_ipfs, description, twitter_url, discord_url, telegram_url, website_url,
          github_url, medium_url, reddit_url, youtube_url, linkedin_url,
          base_price, slope, graduation_threshold, buy_fee_percent, sell_fee_percent,
          cross_chain_enabled, creator_address, advanced_settings,
          banner_image_ipfs, primary_color, accent_color, background_color, layout_template, custom_settings
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
          data.githubUrl && data.githubUrl !== '' ? data.githubUrl : null,
          data.mediumUrl && data.mediumUrl !== '' ? data.mediumUrl : null,
          data.redditUrl && data.redditUrl !== '' ? data.redditUrl : null,
          data.youtubeUrl && data.youtubeUrl !== '' ? data.youtubeUrl : null,
          data.linkedinUrl && data.linkedinUrl !== '' ? data.linkedinUrl : null,
          data.basePrice,
          data.slope,
          data.graduationThreshold,
          data.buyFeePercent,
          data.sellFeePercent,
          crossChainEnabled ? 1 : 0,
          creatorAddress,
          advancedSettings,
          data.bannerImageIpfs && data.bannerImageIpfs !== '' ? data.bannerImageIpfs : null,
          data.primaryColor || '#3B82F6',
          data.accentColor || '#8B5CF6',
          data.backgroundColor || null,
          data.layoutTemplate || 'default',
          data.customSettings ? JSON.stringify(data.customSettings) : null
        ]
      );
      
      console.log('✅ Token created successfully in database:', tokenId);
      
      // Verify token was actually inserted
      const verification = await dbGet('SELECT id, name FROM tokens WHERE id = ?', [tokenId]) as any;
      if (!verification) {
        console.error('❌ CRITICAL: Token insert succeeded but token not found in database!');
        throw new Error('Token creation failed: Database insert verification failed');
      }
      console.log('✅ Token verified in database:', verification.name);
    } catch (dbError: any) {
      console.error('❌ Database error while creating token:', dbError);
      console.error('   Error message:', dbError.message);
      console.error('   Error code:', dbError.code);
      if (dbError.stack) {
        console.error('   Stack:', dbError.stack);
      }
      throw new Error(`Failed to save token to database: ${dbError.message}`);
    }
    
    // Calculate platform fee with CFY discount (if applicable)
    // Base fee: 0.01 ETH (or equivalent)
    const baseFee = 0.01;
    let calculatedFee = baseFee;
    let discountPercent = 0;
    
    if (creatorAddress) {
      try {
        const { calculatePlatformFee } = await import('../services/cfyFeeCollection');
        // Use Base chain by default (or detect from request)
        const chain = 'base'; // Default to Base
        const feeCalculation = await calculatePlatformFee(baseFee, creatorAddress, chain);
        calculatedFee = feeCalculation.finalFee;
        discountPercent = feeCalculation.discountPercent;
        
        if (discountPercent > 0) {
          console.log(`✅ CFY discount applied: ${discountPercent}% (Final fee: ${calculatedFee} ETH)`);
        }
      } catch (error) {
        console.warn('Could not calculate CFY fee discount:', error);
        // Continue with base fee if CFY service is unavailable
      }
    }
    
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
      feeInfo: {
        baseFee,
        finalFee: calculatedFee,
        discountPercent,
        currency: 'ETH', // Or BNB/SOL based on chain
      },
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
    
    console.log(`📋 Saving deployments for token ${id}...`);
    console.log(`📋 Deployments data:`, JSON.stringify(data, null, 2));
    
    // Verify token exists - CRITICAL CHECK
    const token = await dbGet('SELECT id, name, symbol FROM tokens WHERE id = ?', [id]) as any;
    if (!token) {
      console.error(`❌ CRITICAL: Token ${id} not found in database when saving deployments!`);
      console.error(`   This means the token creation failed or the token was deleted.`);
      console.error(`   Cannot save deployments without a token record.`);
      return res.status(404).json({ 
        error: 'Token not found',
        message: `Token ${id} does not exist in database. Token creation may have failed.`,
        tokenId: id
      });
    }
    
    console.log(`✅ Token found: ${token.name} (${token.symbol})`);
    
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
        
        // Record token creation fee (collect via CFY contract if enabled)
        try {
          const token = await dbGet('SELECT creator_address FROM tokens WHERE id = ?', [id]) as any;
          const creatorAddress = token?.creator_address;
          
          if (creatorAddress) {
            const { recordTokenCreationFee } = await import('../services/feeRecorder');
            const { createCFYFeeCollectionService } = await import('../services/cfyFeeCollection');
            
            // Try to collect fee via CFY contract
            const feeService = createCFYFeeCollectionService(chain);
            if (feeService) {
              // Base fee: 0.01 ETH
              const baseFee = '0.01';
              const feeResult = await feeService.collectFee(baseFee, 'token_creation', creatorAddress);
              
              if (feeResult.success) {
                console.log(`✅ Fee collected via CFY contract: ${feeResult.finalAmount} ETH (Discount: ${feeResult.discountApplied || 0}%)`);
                // Record fee with transaction hash
                await recordTokenCreationFee(id, chain, baseFee, feeResult.txHash);
              } else {
                // Fallback: record fee without CFY collection
                console.warn('CFY fee collection failed, recording fee without contract interaction');
                await recordTokenCreationFee(id, chain, baseFee);
              }
            } else {
              // CFY service not configured, record fee normally
              await recordTokenCreationFee(id, chain, '0.01');
            }
          }
        } catch (error) {
          console.error('Error recording token creation fee:', error);
          // Don't fail deployment if fee recording fails
        }
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

// GET /tokens/my-tokens - Get tokens for a specific creator (must be before /marketplace)
// This endpoint now syncs tokens from the blockchain before querying the database
router.get('/my-tokens', async (req: Request, res: Response) => {
  try {
    const creatorAddress = req.query.address as string;
    // Default to testnet chains in development, mainnet in production
    // Frontend can override by passing chains parameter
    const defaultChains = process.env.NODE_ENV === 'production' 
      ? ['base', 'ethereum', 'bsc']
      : ['base-sepolia', 'sepolia', 'bsc-testnet'];
    const chains = req.query.chains ? (req.query.chains as string).split(',') : defaultChains;
    const sync = req.query.sync !== 'false'; // Default to true, can be disabled with ?sync=false
    
    if (!creatorAddress) {
      return res.status(400).json({ error: 'Creator address is required' });
    }
    
    // Sync tokens from blockchain if enabled
    if (sync) {
      try {
        const { syncTokensFromBlockchain } = await import('../services/blockchainTokenSync');
        const syncResult = await syncTokensFromBlockchain(creatorAddress, chains);
        console.log(`✅ Synced ${syncResult.synced} tokens from blockchain for ${creatorAddress}`);
      } catch (error) {
        console.error('Error syncing tokens from blockchain:', error);
        // Continue with database query even if sync fails
      }
    }
    
    // Query database for tokens
    let query = `
      SELECT 
        t.id, t.name, t.symbol, t.decimals, t.initial_supply, t.logo_ipfs,
        t.description, t.twitter_url, t.discord_url, t.telegram_url, t.website_url,
        t.base_price, t.slope, t.graduation_threshold, t.buy_fee_percent, t.sell_fee_percent,
        t.creator_address, t.cross_chain_enabled, t.advanced_settings, t.created_at,
        COALESCE(t.archived, 0) as archived, COALESCE(t.pinned, 0) as pinned, COALESCE(t.deleted, 0) as deleted,
        GROUP_CONCAT(td.chain) as chains,
        GROUP_CONCAT(td.token_address) as token_addresses,
        GROUP_CONCAT(td.curve_address) as curve_addresses,
        GROUP_CONCAT(td.status) as deployment_statuses,
        GROUP_CONCAT(td.is_graduated) as graduation_statuses,
        GROUP_CONCAT(td.market_cap) as market_caps
      FROM tokens t
      LEFT JOIN token_deployments td ON t.id = td.token_id
      WHERE LOWER(t.creator_address) = LOWER(?)
        AND (t.deleted IS NULL OR t.deleted = 0)
      GROUP BY t.id, t.name, t.symbol, t.decimals, t.initial_supply, t.logo_ipfs,
        t.description, t.twitter_url, t.discord_url, t.telegram_url, t.website_url,
        t.base_price, t.slope, t.graduation_threshold, t.buy_fee_percent, t.sell_fee_percent,
        t.creator_address, t.cross_chain_enabled, t.advanced_settings, t.created_at,
        COALESCE(t.archived, 0), COALESCE(t.pinned, 0), COALESCE(t.deleted, 0)
      ORDER BY t.pinned DESC, t.created_at DESC
    `;
    
    const params: any[] = [creatorAddress];
    
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
        logoUrl: token.logo_ipfs ? `https://ipfs.io/ipfs/${token.logo_ipfs}` : null,
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
        archived: token.archived === 1,
        pinned: token.pinned === 1,
        deleted: token.deleted === 1,
        deployments,
      };
    });
    
    res.json({
      tokens: formattedTokens,
      count: formattedTokens.length,
    });
  } catch (error) {
    console.error('Error fetching user tokens:', error);
    res.status(500).json({ error: 'Failed to fetch user tokens' });
  }
});

// PATCH /tokens/:id/status - Update token status (archive, pin, delete, visible_in_marketplace)
router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { archived, pinned, deleted, visibleInMarketplace } = req.body;
    const creatorAddress = req.headers['x-creator-address'] as string;
    
    if (!creatorAddress) {
      return res.status(401).json({ error: 'Creator address is required' });
    }
    
    // Verify token ownership
    const token = await dbGet('SELECT creator_address FROM tokens WHERE id = ?', [id]) as any;
    if (!token) {
      return res.status(404).json({ error: 'Token not found' });
    }
    
    if (!token.creator_address || token.creator_address.toLowerCase() !== creatorAddress.toLowerCase()) {
      return res.status(403).json({ error: 'Unauthorized: You are not the creator of this token' });
    }
    
    // Build update query dynamically based on provided fields
    const updates: string[] = [];
    const params: any[] = [];
    
    if (archived !== undefined) {
      updates.push('archived = ?');
      params.push(archived ? 1 : 0);
    }
    
    if (pinned !== undefined) {
      updates.push('pinned = ?');
      params.push(pinned ? 1 : 0);
    }
    
    if (deleted !== undefined) {
      updates.push('deleted = ?');
      params.push(deleted ? 1 : 0);
    }
    
    if (visibleInMarketplace !== undefined) {
      updates.push('visible_in_marketplace = ?');
      params.push(visibleInMarketplace ? 1 : 0);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No status fields provided' });
    }
    
    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);
    
    await dbRun(
      `UPDATE tokens SET ${updates.join(', ')} WHERE id = ?`,
      params
    );
    
    res.json({
      success: true,
      message: 'Token status updated successfully',
    });
  } catch (error) {
    console.error('Error updating token status:', error);
    res.status(500).json({ error: 'Failed to update token status' });
  }
});

// GET /tokens/marketplace
router.get('/marketplace', async (req: Request, res: Response) => {
  try {
    // Sync tokens from blockchain before querying (ensures tokens are discovered after deployments)
    // Wait for sync to complete (with timeout) to ensure tokens are available
    try {
      const { syncAllTokensFromBlockchain } = await import('../services/startupSync');
      console.log('🔄 Marketplace: Starting token sync...');
      
      // Run sync with timeout (max 10 seconds wait)
      const syncPromise = syncAllTokensFromBlockchain();
      const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 10000));
      
      await Promise.race([syncPromise, timeoutPromise]);
      console.log('✅ Marketplace: Token sync completed (or timed out)');
    } catch (error) {
      console.error('❌ Marketplace: Error syncing tokens:', error);
      // Continue even if sync fails - maybe tokens already exist in DB
    }

    const { chain, search, sortBy = 'newest' } = req.query;
    
    console.log(`📊 Marketplace: Querying tokens (chain: ${chain || 'all'}, search: ${search || 'none'})`);
    
    // First, check if there are any tokens at all
    const tokenCount = await dbAll('SELECT COUNT(*) as count FROM tokens WHERE (deleted IS NULL OR deleted = 0)', []) as any[];
    const totalTokens = tokenCount[0]?.count || 0;
    console.log(`📊 Marketplace: Total tokens in database (not deleted): ${totalTokens}`);
    
    // IMPORTANT: Show ALL tokens that are not deleted and visible, even if they have no deployments
    // This ensures tokens appear in marketplace immediately after creation, before sync completes
    // Note: We're using GROUP_CONCAT for backward compatibility, but deployments will be fetched separately
    let query = `
      SELECT 
        t.id, t.name, t.symbol, t.decimals, t.initial_supply, t.logo_ipfs,
        t.description, t.twitter_url, t.discord_url, t.telegram_url, t.website_url,
        t.base_price, t.slope, t.graduation_threshold, t.buy_fee_percent, t.sell_fee_percent,
        t.creator_address, t.cross_chain_enabled, t.advanced_settings, t.created_at,
        t.deleted,
        COALESCE(t.visible_in_marketplace, 1) as visible_in_marketplace,
        GROUP_CONCAT(td.chain ORDER BY td.chain) as chains,
        GROUP_CONCAT(td.token_address ORDER BY td.chain) as token_addresses,
        GROUP_CONCAT(td.curve_address ORDER BY td.chain) as curve_addresses,
        GROUP_CONCAT(td.status ORDER BY td.chain) as deployment_statuses,
        GROUP_CONCAT(td.is_graduated ORDER BY td.chain) as graduation_statuses,
        GROUP_CONCAT(td.market_cap ORDER BY td.chain) as market_caps
      FROM tokens t
      LEFT JOIN token_deployments td ON t.id = td.token_id
      WHERE (t.deleted IS NULL OR t.deleted = 0)
        AND (t.visible_in_marketplace IS NULL OR t.visible_in_marketplace = 1)
    `;
    
    const params: any[] = [];
    
    // Chain filter - only filter by deployment chain if specified
    if (chain) {
      query = `
        SELECT 
          t.id, t.name, t.symbol, t.decimals, t.initial_supply, t.logo_ipfs,
          t.description, t.twitter_url, t.discord_url, t.telegram_url, t.website_url,
          t.base_price, t.slope, t.graduation_threshold, t.buy_fee_percent, t.sell_fee_percent,
          t.creator_address, t.cross_chain_enabled, t.advanced_settings, t.created_at,
          t.deleted,
          COALESCE(t.visible_in_marketplace, 1) as visible_in_marketplace,
          GROUP_CONCAT(td.chain ORDER BY td.chain) as chains,
          GROUP_CONCAT(td.token_address ORDER BY td.chain) as token_addresses,
          GROUP_CONCAT(td.curve_address ORDER BY td.chain) as curve_addresses,
          GROUP_CONCAT(td.status ORDER BY td.chain) as deployment_statuses,
          GROUP_CONCAT(td.is_graduated ORDER BY td.chain) as graduation_statuses,
          GROUP_CONCAT(td.market_cap ORDER BY td.chain) as market_caps
        FROM tokens t
        INNER JOIN token_deployments td ON t.id = td.token_id AND td.chain = ?
        WHERE (t.deleted IS NULL OR t.deleted = 0)
          AND (t.visible_in_marketplace IS NULL OR t.visible_in_marketplace = 1)
      `;
      params.push(chain);
    }
    
    // Add search filter if specified
    if (search) {
      query += ` AND (LOWER(t.name) LIKE LOWER(?) OR LOWER(t.symbol) LIKE LOWER(?))`;
      params.push(`%${search}%`, `%${search}%`);
    }
    
    // Add GROUP BY clause - required for aggregate functions (GROUP_CONCAT/STRING_AGG)
    query += `
      GROUP BY t.id, t.name, t.symbol, t.decimals, t.initial_supply, t.logo_ipfs,
        t.description, t.twitter_url, t.discord_url, t.telegram_url, t.website_url,
        t.base_price, t.slope, t.graduation_threshold, t.buy_fee_percent, t.sell_fee_percent,
        t.creator_address, t.cross_chain_enabled, t.advanced_settings, t.created_at,
        t.deleted, t.visible_in_marketplace
    `;
    
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
    
    // Log the actual query being executed (for debugging)
    console.log(`📊 Marketplace: Executing query with params:`, params);
    console.log(`📊 Marketplace: Query (first 500 chars):`, query.substring(0, 500));
    
    // If using PostgreSQL, log that we're using the adapter
    const { isUsingPostgreSQL } = await import('../db/adapter');
    if (isUsingPostgreSQL()) {
      console.log(`📊 Marketplace: Using PostgreSQL - query will be converted by adapter`);
    }
    
    let tokens: any[] = [];
    try {
      // Log the full query for debugging (truncated to first 1000 chars)
      console.log(`📊 Marketplace: Full query (first 1000 chars):`, query.substring(0, 1000));
      console.log(`📊 Marketplace: Query params:`, JSON.stringify(params));
      
      tokens = await dbAll(query, params) as any[];
      console.log(`📊 Marketplace: Query executed successfully, found ${tokens.length} tokens`);
    } catch (queryError: any) {
      console.error(`❌ Marketplace: Query failed:`, queryError.message);
      console.error(`❌ Marketplace: Query error code:`, queryError.code);
      console.error(`❌ Marketplace: Query error details:`, JSON.stringify(queryError, null, 2));
      if (queryError.stack) {
        console.error(`❌ Marketplace: Query error stack:`, queryError.stack);
      }
      
      // Log the problematic query
      console.error(`❌ Marketplace: Failed query (first 2000 chars):`, query.substring(0, 2000));
      
      // Check if there are any tokens at all in the database
      try {
        const allTokensResult = await dbAll('SELECT COUNT(*) as count FROM tokens', []) as any[];
        console.log(`📊 Marketplace: Total tokens in database: ${allTokensResult[0]?.count || 0}`);
      } catch (countError) {
        console.error(`❌ Marketplace: Could not count tokens:`, countError);
      }
      
      throw queryError; // Re-throw to trigger error handler
    }
    
    console.log(`📊 Marketplace: Found ${tokens.length} tokens after query`);
    
    // Debug: Log detailed information about tokens and deployments
    if (tokens.length > 0) {
      console.log(`📊 Marketplace: Sample of first 3 tokens:`);
      tokens.slice(0, 3).forEach((token, idx) => {
        console.log(`   Token ${idx + 1}: ${token.name} (${token.symbol}) - ID: ${token.id}`);
        console.log(`     - chains: ${token.chains || 'none'}`);
        console.log(`     - token_addresses: ${token.token_addresses || 'none'}`);
        console.log(`     - curve_addresses: ${token.curve_addresses || 'none'}`);
        console.log(`     - deployment_statuses: ${token.deployment_statuses || 'none'}`);
        console.log(`     - deleted: ${token.deleted}, visible: ${token.visible_in_marketplace}`);
      });
      
      // Check for duplicate token IDs
      const tokenIds = tokens.map(t => t.id);
      const uniqueTokenIds = new Set(tokenIds);
      if (tokenIds.length !== uniqueTokenIds.size) {
        console.warn(`⚠️ Marketplace: Found ${tokenIds.length - uniqueTokenIds.size} duplicate token IDs in query results!`);
        const duplicates = tokenIds.filter((id, idx) => tokenIds.indexOf(id) !== idx);
        console.warn(`⚠️ Marketplace: Duplicate token IDs:`, [...new Set(duplicates)]);
      }
    } else {
      // Check if there are any tokens at all in the database
      const allTokensResult = await dbAll('SELECT COUNT(*) as count FROM tokens', []) as any[];
      const allDeploymentsResult = await dbAll('SELECT COUNT(*) as count FROM token_deployments', []) as any[];
      const deletedTokensResult = await dbAll('SELECT COUNT(*) as count FROM tokens WHERE deleted = 1', []) as any[];
      const hiddenTokensResult = await dbAll('SELECT COUNT(*) as count FROM tokens WHERE visible_in_marketplace = 0', []) as any[];
      
      console.log(`📊 Marketplace: Database statistics:`);
      console.log(`   - Total tokens: ${allTokensResult[0]?.count || 0}`);
      console.log(`   - Total deployments: ${allDeploymentsResult[0]?.count || 0}`);
      console.log(`   - Deleted tokens: ${deletedTokensResult[0]?.count || 0}`);
      console.log(`   - Hidden tokens (visible_in_marketplace=0): ${hiddenTokensResult[0]?.count || 0}`);
      console.log(`   - Visible tokens (not deleted, visible=1): ${totalTokens}`);
      
      // Show sample tokens for debugging
      const sampleTokens = await dbAll('SELECT id, name, symbol, deleted, visible_in_marketplace FROM tokens LIMIT 5', []) as any[];
      if (sampleTokens.length > 0) {
        console.log(`📊 Marketplace: Sample tokens:`, sampleTokens.map((t: any) => ({
          id: t.id,
          name: t.name,
          symbol: t.symbol,
          deleted: t.deleted,
          visible: t.visible_in_marketplace
        })));
      }
    }
    
    // Fetch deployments separately for better accuracy and alignment
    // This avoids issues with GROUP_CONCAT array alignment
    const tokenIds = tokens.map(t => t.id);
    let deploymentsByTokenId: Record<string, any[]> = {};
    
    if (tokenIds.length > 0) {
      try {
        // Query deployments for all tokens at once
        const placeholders = tokenIds.map(() => '?').join(',');
        const deploymentsQuery = `
          SELECT 
            token_id, chain, token_address, curve_address, status, 
            is_graduated, market_cap
          FROM token_deployments
          WHERE token_id IN (${placeholders})
          ORDER BY token_id, chain
        `;
        const allDeployments = await dbAll(deploymentsQuery, tokenIds) as any[];
        
        console.log(`📊 Marketplace: Fetched ${allDeployments.length} deployments for ${tokenIds.length} tokens`);
        
        // Group deployments by token_id
        deploymentsByTokenId = allDeployments.reduce((acc, dep) => {
          if (!acc[dep.token_id]) {
            acc[dep.token_id] = [];
          }
          acc[dep.token_id].push({
            chain: dep.chain,
            tokenAddress: dep.token_address || null,
            curveAddress: dep.curve_address || null,
            status: dep.status || 'pending',
            isGraduated: dep.is_graduated === 1 || dep.is_graduated === true || dep.is_graduated === '1' || dep.is_graduated === 'true',
            marketCap: parseFloat(dep.market_cap || '0') || 0,
          });
          return acc;
        }, {} as Record<string, any[]>);
        
        // Log deployment counts per token
        Object.entries(deploymentsByTokenId).slice(0, 3).forEach(([tokenId, deps]) => {
          console.log(`📊 Marketplace: Token ${tokenId} has ${deps.length} deployments:`, deps.map(d => d.chain).join(', '));
        });
      } catch (deploymentsError: any) {
        console.warn('⚠️ Could not fetch deployments separately, falling back to GROUP_CONCAT data:', deploymentsError.message);
        // Fall back to GROUP_CONCAT data if separate query fails
      }
    }
    
    const formattedTokens = tokens.map(token => {
      // Use deployments from separate query if available, otherwise fall back to GROUP_CONCAT
      let deployments: any[] = [];
      
      if (deploymentsByTokenId[token.id] && deploymentsByTokenId[token.id].length > 0) {
        // Use deployments from separate query (more reliable)
        deployments = deploymentsByTokenId[token.id];
      } else {
        // Fall back to GROUP_CONCAT data (legacy support or if separate query failed)
        const chainsStr = token.chains as string | null | undefined;
        const tokenAddressesStr = token.token_addresses as string | null | undefined;
        const curveAddressesStr = token.curve_addresses as string | null | undefined;
        const statusesStr = token.deployment_statuses as string | null | undefined;
        const graduationsStr = token.graduation_statuses as string | null | undefined;
        const marketCapsStr = token.market_caps as string | null | undefined;
        
        const chains = chainsStr ? chainsStr.split(',').filter((c: string) => c && c !== 'null' && c.trim() !== '') : [];
        const tokenAddresses = tokenAddressesStr ? tokenAddressesStr.split(',').filter((a: string) => a && a !== 'null' && a.trim() !== '') : [];
        const curveAddresses = curveAddressesStr ? curveAddressesStr.split(',').filter((a: string) => a && a !== 'null' && a.trim() !== '') : [];
        const statuses = statusesStr ? statusesStr.split(',').filter((s: string) => s && s !== 'null' && s.trim() !== '') : [];
        const graduations = graduationsStr ? graduationsStr.split(',').filter((g: string) => g && g !== 'null' && g.trim() !== '') : [];
        const marketCaps = marketCapsStr ? marketCapsStr.split(',').filter((m: string) => m && m !== 'null' && m.trim() !== '') : [];
        
        // Create deployments array by matching chains with their corresponding data
        const processedChains = new Set<string>();
        
        for (let idx = 0; idx < chains.length; idx++) {
          const chain = chains[idx] as string;
          if (!processedChains.has(chain)) {
            processedChains.add(chain);
            deployments.push({
              chain,
              tokenAddress: tokenAddresses[idx] || null,
              curveAddress: curveAddresses[idx] || null,
              status: statuses[idx] || 'pending',
              isGraduated: graduations[idx] === '1' || graduations[idx] === 'true' || graduations[idx] === 't',
              marketCap: parseFloat(marketCaps[idx] || '0') || 0,
            });
          }
        }
      }
      
      // Sort deployments by chain name for consistency
      deployments.sort((a, b) => a.chain.localeCompare(b.chain));
      
      return {
        id: token.id,
        name: token.name,
        symbol: token.symbol,
        decimals: token.decimals,
        initialSupply: token.initial_supply,
        logoIpfs: token.logo_ipfs,
        logoUrl: token.logo_ipfs ? `https://ipfs.io/ipfs/${token.logo_ipfs}` : null,
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
        archived: (token.archived ?? 0) === 1,
        pinned: (token.pinned ?? 0) === 1,
        deleted: (token.deleted ?? 0) === 1,
        visibleInMarketplace: (token.visible_in_marketplace ?? 1) === 1,
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
    
    console.log(`📋 Fetching token status for ID: ${id}`);
    
    const token = await dbGet('SELECT * FROM tokens WHERE id = ?', [id]) as any;
    if (!token) {
      console.error(`❌ Token ${id} not found in database`);
      
      // Check if token exists with different case or similar ID
      const allTokens = await dbAll('SELECT id, name, symbol FROM tokens LIMIT 10', []) as any[];
      console.log(`📊 Sample tokens in database:`, allTokens.map(t => ({ id: t.id, name: t.name, symbol: t.symbol })));
      
      return res.status(404).json({ 
        error: 'Token not found',
        tokenId: id,
        message: `Token with ID "${id}" does not exist in database`
      });
    }
    
    console.log(`✅ Token found: ${token.name} (${token.symbol})`);
    
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
        githubUrl: token.github_url,
        mediumUrl: token.medium_url,
        redditUrl: token.reddit_url,
        youtubeUrl: token.youtube_url,
        linkedinUrl: token.linkedin_url,
        basePrice: token.base_price,
        slope: token.slope,
        graduationThreshold: token.graduation_threshold,
        buyFeePercent: token.buy_fee_percent,
        sellFeePercent: token.sell_fee_percent,
        creatorAddress: token.creator_address || null,
        crossChainEnabled: token.cross_chain_enabled === 1,
        advancedSettings: token.advanced_settings ? JSON.parse(token.advanced_settings) : {},
        createdAt: token.created_at,
        customization: {
          bannerImageIpfs: token.banner_image_ipfs,
          primaryColor: token.primary_color || '#3B82F6',
          accentColor: token.accent_color || '#8B5CF6',
          backgroundColor: token.background_color,
          layoutTemplate: token.layout_template || 'default',
          customSettings: token.custom_settings ? JSON.parse(token.custom_settings) : null,
        },
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
      bannerUrl: token.banner_image_ipfs ? `https://ipfs.io/ipfs/${token.banner_image_ipfs}` : null,
      twitterUrl: token.twitter_url,
      discordUrl: token.discord_url,
      telegramUrl: token.telegram_url,
      websiteUrl: token.website_url,
      githubUrl: token.github_url,
      mediumUrl: token.medium_url,
      redditUrl: token.reddit_url,
      youtubeUrl: token.youtube_url,
      linkedinUrl: token.linkedin_url,
      primaryColor: token.primary_color || '#3B82F6',
      accentColor: token.accent_color || '#8B5CF6',
      backgroundColor: token.background_color,
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

// GET /tokens/:id/price-history
router.get('/:id/price-history', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { timeframe = '24h', chain } = req.query;
    
    // Calculate time range based on timeframe
    const now = Date.now();
    let startTime: number;
    let interval: number; // in milliseconds
    
    switch (timeframe) {
      case '1h':
        startTime = now - 60 * 60 * 1000;
        interval = 60 * 1000; // 1 minute intervals
        break;
      case '24h':
        startTime = now - 24 * 60 * 60 * 1000;
        interval = 60 * 60 * 1000; // 1 hour intervals
        break;
      case '7d':
        startTime = now - 7 * 24 * 60 * 60 * 1000;
        interval = 24 * 60 * 60 * 1000; // 1 day intervals
        break;
      case '30d':
        startTime = now - 30 * 24 * 60 * 60 * 1000;
        interval = 24 * 60 * 60 * 1000; // 1 day intervals
        break;
      default:
        startTime = now - 24 * 60 * 60 * 1000;
        interval = 60 * 60 * 1000;
    }
    
    // Get transactions with price data
    // SQLite stores dates as ISO strings, so we compare directly
    const startTimeISO = new Date(startTime).toISOString();
    
    let query = `
      SELECT 
        type,
        price,
        amount,
        created_at,
        chain
      FROM transactions
      WHERE token_id = ? 
        AND status = 'confirmed'
        AND price IS NOT NULL
        AND price > 0
        AND created_at >= ?
    `;
    const params: any[] = [id, startTimeISO];
    
    if (chain) {
      query += ' AND chain = ?';
      params.push(chain);
    }
    
    query += ' ORDER BY created_at ASC';
    
    const transactions = await dbAll(query, params) as any[];
    
    // Group transactions by time interval and calculate OHLC
    const buckets: Map<number, { open: number; high: number; low: number; close: number; volume: number }> = new Map();
    
    transactions.forEach(tx => {
      const txTime = typeof tx.created_at === 'string' 
        ? new Date(tx.created_at).getTime() 
        : tx.created_at;
      const bucketTime = Math.floor(txTime / interval) * interval;
      
      if (!buckets.has(bucketTime)) {
        buckets.set(bucketTime, {
          open: tx.price,
          high: tx.price,
          low: tx.price,
          close: tx.price,
          volume: parseFloat(tx.amount || '0'),
        });
      } else {
        const bucket = buckets.get(bucketTime)!;
        bucket.high = Math.max(bucket.high, tx.price);
        bucket.low = Math.min(bucket.low, tx.price);
        bucket.close = tx.price;
        bucket.volume += parseFloat(tx.amount || '0');
      }
    });
    
    // Convert to array
    const data: Array<{ time: number; open: number; high: number; low: number; close: number; volume: number }> = [];
    const sortedBuckets = Array.from(buckets.entries()).sort((a, b) => a[0] - b[0]);
    
    // Fill gaps with previous close price
    let lastClose = sortedBuckets.length > 0 ? sortedBuckets[0][1].close : 0;
    for (let time = startTime; time <= now; time += interval) {
      const bucket = buckets.get(time);
      if (bucket) {
        data.push({
          time,
          open: bucket.open,
          high: bucket.high,
          low: bucket.low,
          close: bucket.close,
          volume: bucket.volume,
        });
        lastClose = bucket.close;
      } else if (data.length > 0) {
        // Fill gap with last close price
        data.push({
          time,
          open: lastClose,
          high: lastClose,
          low: lastClose,
          close: lastClose,
          volume: 0,
        });
      }
    }
    
    // If no transactions, return current price from deployments
    if (data.length === 0) {
      const deployments = await dbAll(
        'SELECT * FROM token_deployments WHERE token_id = ?',
        [id]
      ) as any[];
      
      if (deployments.length > 0) {
        const dep = deployments[0];
        const price = dep.market_cap / (parseFloat(dep.current_supply || '1') * Math.pow(10, 18)) || 0.001;
        
        // Create flat line with current price
        for (let time = startTime; time <= now; time += interval) {
          data.push({
            time,
            open: price,
            high: price,
            low: price,
            close: price,
            volume: 0,
          });
        }
      }
    }
    
    res.json({
      data,
      timeframe,
      interval,
    });
  } catch (error) {
    console.error('Error fetching price history:', error);
    res.status(500).json({ error: 'Failed to fetch price history' });
  }
});

// GET /tokens/:id/market-depth
router.get('/:id/market-depth', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { chain } = req.query;
    
    // Get token and deployment info
    const token = await dbGet('SELECT base_price, slope FROM tokens WHERE id = ?', [id]) as any;
    if (!token) {
      return res.status(404).json({ error: 'Token not found' });
    }
    
    // Get deployments - include pending ones but prefer deployed
    let deploymentQuery = 'SELECT * FROM token_deployments WHERE token_id = ?';
    const deploymentParams: any[] = [id];
    
    if (chain) {
      deploymentQuery += ' AND chain = ?';
      deploymentParams.push(chain);
    }
    
    // Order by status: deployed first, then pending
    deploymentQuery += ' ORDER BY CASE WHEN status = ? THEN 0 ELSE 1 END';
    deploymentParams.push('deployed');
    
    const deployments = await dbAll(deploymentQuery, deploymentParams) as any[];
    
    // If no deployments at all, return empty data instead of 404
    if (deployments.length === 0) {
      return res.json({
        marketDepth: chain ? {
          chain: chain as string,
          currentPrice: 0,
          currentSupply: 0,
          basePrice: parseFloat(token.base_price || '0'),
          slope: parseFloat(token.slope || '0'),
          buyOrders: [],
          sellOrders: [],
        } : [],
      });
    }
    
    // Filter to only deployed ones for market depth calculation
    const deployedDeployments = deployments.filter(d => d.status === 'deployed');
    
    // If no deployed deployments, return empty market depth
    if (deployedDeployments.length === 0) {
      return res.json({
        marketDepth: chain ? {
          chain: chain as string,
          currentPrice: 0,
          currentSupply: 0,
          basePrice: parseFloat(token.base_price || '0'),
          slope: parseFloat(token.slope || '0'),
          buyOrders: [],
          sellOrders: [],
        } : deployments.map((dep: any) => ({
          chain: dep.chain,
          currentPrice: 0,
          currentSupply: 0,
          basePrice: parseFloat(token.base_price || '0'),
          slope: parseFloat(token.slope || '0'),
          buyOrders: [],
          sellOrders: [],
        })),
      });
    }
    
    // Calculate market depth for each deployment (only deployed ones)
    const marketDepth = deployedDeployments.map(dep => {
      const currentSupply = parseFloat(dep.current_supply || '0');
      const basePrice = parseFloat(token.base_price || '0');
      const slope = parseFloat(token.slope || '0');
      
      // Calculate current price (per token in wei, convert to readable)
      const currentPriceWei = basePrice + (slope * currentSupply);
      const currentPrice = currentPriceWei / Math.pow(10, 18);
      
      // Generate buy orders (what users would pay for different amounts)
      const buyOrders: Array<{ price: number; amount: number; total: number }> = [];
      const sellOrders: Array<{ price: number; amount: number; total: number }> = [];
      
      // Buy orders: simulate buying different amounts
      // Formula: price = basePrice + (slope * (supply + amount/2))
      for (let i = 1; i <= 20; i++) {
        const amountWei = (currentSupply * 0.05 * i); // 5% increments in wei
        const amountTokens = amountWei / Math.pow(10, 18);
        
        // Average price for this amount (using bonding curve formula)
        const avgPrice = basePrice + (slope * (currentSupply + amountWei / 2));
        const totalCost = (avgPrice * amountWei) / Math.pow(10, 18);
        
        buyOrders.push({
          price: avgPrice / Math.pow(10, 18), // Convert to readable price
          amount: amountTokens,
          total: totalCost,
        });
      }
      
      // Sell orders: simulate selling different amounts
      // For selling, price decreases as supply decreases
      const availableSupply = currentSupply;
      for (let i = 1; i <= 20 && (availableSupply * 0.05 * i) < availableSupply; i++) {
        const amountWei = (availableSupply * 0.05 * i); // 5% of available in wei
        const amountTokens = amountWei / Math.pow(10, 18);
        
        // Price after selling (supply decreases)
        const supplyAfterSell = currentSupply - amountWei;
        if (supplyAfterSell < 0) break;
        
        const avgPrice = basePrice + (slope * (supplyAfterSell + amountWei / 2));
        const totalReceived = (avgPrice * amountWei) / Math.pow(10, 18);
        
        sellOrders.push({
          price: avgPrice / Math.pow(10, 18), // Convert to readable price
          amount: amountTokens,
          total: totalReceived,
        });
      }
      
      return {
        chain: dep.chain,
        currentPrice,
        currentSupply: currentSupply / Math.pow(10, 18),
        basePrice,
        slope,
        buyOrders: buyOrders.sort((a, b) => b.price - a.price), // Highest price first
        sellOrders: sellOrders.sort((a, b) => a.price - b.price), // Lowest price first
      };
    });
    
    res.json({
      marketDepth: chain ? marketDepth[0] : marketDepth,
    });
  } catch (error) {
    console.error('Error fetching market depth:', error);
    res.status(500).json({ error: 'Failed to fetch market depth' });
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
      advancedSettings,
      archived: (token.archived ?? 0) === 1,
      pinned: (token.pinned ?? 0) === 1,
      deleted: (token.deleted ?? 0) === 1,
      visibleInMarketplace: (token.visible_in_marketplace ?? 1) === 1,
      createdAt: token.created_at,
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

    // Verify creator - allow if creator_address is null (legacy tokens) or matches
    if (!creatorAddress) {
      return res.status(401).json({ error: 'Creator address is required in x-creator-address header' });
    }
    
    if (token.creator_address) {
      // Normalize addresses for comparison (lowercase, no whitespace)
      const dbCreator = token.creator_address.toLowerCase().trim();
      const reqCreator = creatorAddress.toLowerCase().trim();
      
      if (dbCreator !== reqCreator) {
        console.error(`❌ Creator mismatch for token ${id}:`, {
          dbCreator,
          reqCreator,
          tokenCreator: token.creator_address,
          headerCreator: creatorAddress,
        });
        return res.status(403).json({ 
          error: 'Only token creator can mint tokens',
          details: `Token creator: ${token.creator_address}, Requested by: ${creatorAddress}`
        });
      }
    } else {
      // Legacy token without creator_address - log warning but allow (for backwards compatibility)
      console.warn(`⚠️ Token ${id} has no creator_address set. Allowing mint from ${creatorAddress}`);
    }
    
    console.log(`✅ Creator verified for token ${id}: ${creatorAddress}`);

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

// PUT /tokens/:id/customize - Update token customization settings
router.put('/:id/customize', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      bannerImageIpfs,
      primaryColor,
      accentColor,
      backgroundColor,
      layoutTemplate,
      customSettings,
      githubUrl,
      mediumUrl,
      redditUrl,
      youtubeUrl,
      linkedinUrl,
    } = req.body;
    const creatorAddress = req.headers['x-creator-address'] as string;

    const token = await dbGet('SELECT * FROM tokens WHERE id = ?', [id]) as any;
    if (!token) {
      return res.status(404).json({ error: 'Token not found' });
    }

    // Verify creator
    if (token.creator_address && token.creator_address.toLowerCase() !== creatorAddress?.toLowerCase()) {
      return res.status(403).json({ error: 'Only token creator can update customization' });
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];

    if (bannerImageIpfs !== undefined) {
      updates.push('banner_image_ipfs = ?');
      values.push(bannerImageIpfs && bannerImageIpfs !== '' ? bannerImageIpfs : null);
    }
    if (primaryColor !== undefined) {
      updates.push('primary_color = ?');
      values.push(primaryColor || '#3B82F6');
    }
    if (accentColor !== undefined) {
      updates.push('accent_color = ?');
      values.push(accentColor || '#8B5CF6');
    }
    if (backgroundColor !== undefined) {
      updates.push('background_color = ?');
      values.push(backgroundColor && backgroundColor !== '' ? backgroundColor : null);
    }
    if (layoutTemplate !== undefined) {
      updates.push('layout_template = ?');
      values.push(layoutTemplate || 'default');
    }
    if (customSettings !== undefined) {
      updates.push('custom_settings = ?');
      values.push(customSettings ? JSON.stringify(customSettings) : null);
    }
    if (githubUrl !== undefined) {
      updates.push('github_url = ?');
      values.push(githubUrl && githubUrl !== '' ? githubUrl : null);
    }
    if (mediumUrl !== undefined) {
      updates.push('medium_url = ?');
      values.push(mediumUrl && mediumUrl !== '' ? mediumUrl : null);
    }
    if (redditUrl !== undefined) {
      updates.push('reddit_url = ?');
      values.push(redditUrl && redditUrl !== '' ? redditUrl : null);
    }
    if (youtubeUrl !== undefined) {
      updates.push('youtube_url = ?');
      values.push(youtubeUrl && youtubeUrl !== '' ? youtubeUrl : null);
    }
    if (linkedinUrl !== undefined) {
      updates.push('linkedin_url = ?');
      values.push(linkedinUrl && linkedinUrl !== '' ? linkedinUrl : null);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    await dbRun(
      `UPDATE tokens SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    res.json({
      success: true,
      message: 'Customization updated successfully',
    });
  } catch (error) {
    console.error('Error updating customization:', error);
    res.status(500).json({ error: 'Failed to update customization' });
  }
});

// GET /tokens/:id/customize - Get token customization settings
router.get('/:id/customize', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const token = await dbGet(
      `SELECT 
        banner_image_ipfs, primary_color, accent_color, background_color,
        layout_template, custom_settings,
        github_url, medium_url, reddit_url, youtube_url, linkedin_url
      FROM tokens WHERE id = ?`,
      [id]
    ) as any;

    if (!token) {
      return res.status(404).json({ error: 'Token not found' });
    }

    res.json({
      bannerImageIpfs: token.banner_image_ipfs,
      primaryColor: token.primary_color || '#3B82F6',
      accentColor: token.accent_color || '#8B5CF6',
      backgroundColor: token.background_color,
      layoutTemplate: token.layout_template || 'default',
      customSettings: token.custom_settings ? JSON.parse(token.custom_settings) : null,
      githubUrl: token.github_url,
      mediumUrl: token.medium_url,
      redditUrl: token.reddit_url,
      youtubeUrl: token.youtube_url,
      linkedinUrl: token.linkedin_url,
    });
  } catch (error) {
    console.error('Error fetching customization:', error);
    res.status(500).json({ error: 'Failed to fetch customization' });
  }
});

// POST /tokens/:id/sections - Add or update custom section
router.post('/:id/sections', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { sectionType, title, content, sectionOrder, enabled } = req.body;
    const creatorAddress = req.headers['x-creator-address'] as string;

    if (!sectionType) {
      return res.status(400).json({ error: 'sectionType is required' });
    }

    const token = await dbGet('SELECT * FROM tokens WHERE id = ?', [id]) as any;
    if (!token) {
      return res.status(404).json({ error: 'Token not found' });
    }

    // Verify creator
    if (token.creator_address && token.creator_address.toLowerCase() !== creatorAddress?.toLowerCase()) {
      return res.status(403).json({ error: 'Only token creator can manage sections' });
    }

    // Check if section already exists (by type and order)
    const existing = await dbGet(
      'SELECT id FROM token_custom_sections WHERE token_id = ? AND section_type = ? AND section_order = ?',
      [id, sectionType, sectionOrder || 0]
    ) as any;

    if (existing) {
      // Update existing section
      await dbRun(
        `UPDATE token_custom_sections 
         SET title = ?, content = ?, enabled = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [title || null, content ? JSON.stringify(content) : null, enabled !== undefined ? (enabled ? 1 : 0) : 1, existing.id]
      );
      res.json({
        success: true,
        message: 'Section updated successfully',
        sectionId: existing.id,
      });
    } else {
      // Create new section
      const result = await dbRun(
        `INSERT INTO token_custom_sections (
          token_id, section_type, title, content, section_order, enabled
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          id,
          sectionType,
          title || null,
          content ? JSON.stringify(content) : null,
          sectionOrder || 0,
          enabled !== undefined ? (enabled ? 1 : 0) : 1
        ]
      );
      res.json({
        success: true,
        message: 'Section created successfully',
        sectionId: (result as any).lastID,
      });
    }
  } catch (error: any) {
    console.error('Error managing section:', error);
    if (error.message?.includes('no such table')) {
      // Table doesn't exist yet, return empty response
      res.json({
        success: false,
        message: 'Custom sections not yet available',
      });
    } else {
      res.status(500).json({ error: 'Failed to manage section' });
    }
  }
});

// GET /tokens/:id/sections - Get all custom sections for a token
router.get('/:id/sections', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { enabledOnly } = req.query;

    let query = 'SELECT * FROM token_custom_sections WHERE token_id = ?';
    const params: any[] = [id];

    if (enabledOnly === 'true') {
      query += ' AND enabled = 1';
    }

    query += ' ORDER BY section_order ASC, created_at ASC';

    const sections = await dbAll(query, params) as any[];

    res.json({
      sections: sections.map(section => ({
        id: section.id,
        sectionType: section.section_type,
        title: section.title,
        content: section.content ? JSON.parse(section.content) : null,
        sectionOrder: section.section_order,
        enabled: section.enabled === 1,
        createdAt: section.created_at,
        updatedAt: section.updated_at,
      })),
    });
  } catch (error: any) {
    console.error('Error fetching sections:', error);
    if (error.message?.includes('no such table')) {
      // Table doesn't exist yet, return empty array
      res.json({ sections: [] });
    } else {
      res.status(500).json({ error: 'Failed to fetch sections' });
    }
  }
});

// DELETE /tokens/:id/sections/:sectionId - Delete a custom section
router.delete('/:id/sections/:sectionId', async (req: Request, res: Response) => {
  try {
    const { id, sectionId } = req.params;
    const creatorAddress = req.headers['x-creator-address'] as string;

    const token = await dbGet('SELECT * FROM tokens WHERE id = ?', [id]) as any;
    if (!token) {
      return res.status(404).json({ error: 'Token not found' });
    }

    // Verify creator
    if (token.creator_address && token.creator_address.toLowerCase() !== creatorAddress?.toLowerCase()) {
      return res.status(403).json({ error: 'Only token creator can delete sections' });
    }

    await dbRun(
      'DELETE FROM token_custom_sections WHERE id = ? AND token_id = ?',
      [sectionId, id]
    );

    res.json({
      success: true,
      message: 'Section deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting section:', error);
    res.status(500).json({ error: 'Failed to delete section' });
  }
});

// POST /tokens/fix-visibility - Make all hidden tokens visible (admin/utility endpoint)
router.post('/fix-visibility', async (req: Request, res: Response) => {
  try {
    console.log('🔍 Checking for hidden tokens...');
    
    // Get count of hidden tokens
    const hiddenTokens = await dbAll(
      'SELECT COUNT(*) as count FROM tokens WHERE visible_in_marketplace = 0 OR visible_in_marketplace IS NULL',
      []
    ) as any[];
    
    const count = hiddenTokens[0]?.count || 0;
    console.log(`📊 Found ${count} hidden tokens`);
    
    if (count === 0) {
      return res.json({
        success: true,
        message: 'No hidden tokens found. All tokens are already visible.',
        updated: 0,
      });
    }
    
    // Update all hidden tokens to be visible
    console.log('🔄 Making all tokens visible...');
    const result = await dbRun(
      'UPDATE tokens SET visible_in_marketplace = 1 WHERE visible_in_marketplace = 0 OR visible_in_marketplace IS NULL',
      []
    );
    
    const updated = (result as any)?.changes ?? (result as any)?.rowCount ?? 0;
    console.log(`✅ Updated ${updated} tokens to be visible in marketplace`);
    
    // Verify
    const visibleTokens = await dbAll(
      'SELECT COUNT(*) as count FROM tokens WHERE visible_in_marketplace = 1',
      []
    ) as any[];
    const totalTokens = await dbAll(
      'SELECT COUNT(*) as count FROM tokens',
      []
    ) as any[];
    
    res.json({
      success: true,
      message: `Updated ${updated} tokens to be visible in marketplace`,
      updated,
      totalTokens: totalTokens[0]?.count || 0,
      visibleTokens: visibleTokens[0]?.count || 0,
      hiddenTokens: (totalTokens[0]?.count || 0) - (visibleTokens[0]?.count || 0),
    });
  } catch (error) {
    console.error('❌ Error making tokens visible:', error);
    res.status(500).json({
      error: 'Failed to update token visibility',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// POST /tokens/merge-duplicates - Merge duplicate tokens that have the same token address
router.post('/merge-duplicates', async (_req: Request, res: Response) => {
  try {
    const { dbAll, dbRun, dbGet } = await import('../db/adapter');
    
    console.log('🔍 Finding duplicate tokens by token address...');
    
    // Find all tokens that have the same token_address across different token_ids
    // Use PostgreSQL STRING_AGG or SQLite GROUP_CONCAT
    const { isUsingPostgreSQL } = await import('../db/adapter');
    const usingPostgres = isUsingPostgreSQL();
    
    let duplicatesQuery: string;
    if (usingPostgres) {
      // PostgreSQL: Use array_agg with DISTINCT, then array_to_string
      // This works in all PostgreSQL versions that support DISTINCT in aggregates
      duplicatesQuery = `
        SELECT 
          token_address,
          COUNT(DISTINCT token_id) as token_count,
          array_to_string(ARRAY(SELECT DISTINCT token_id::text FROM token_deployments td2 WHERE td2.token_address = td.token_address ORDER BY token_id::text), ',') as token_ids,
          array_to_string(ARRAY(SELECT DISTINCT chain::text FROM token_deployments td3 WHERE td3.token_address = td.token_address ORDER BY chain::text), ',') as chains
        FROM token_deployments td
        WHERE td.token_address IS NOT NULL
        GROUP BY td.token_address
        HAVING COUNT(DISTINCT td.token_id) > 1
      `;
    } else {
      // SQLite: Use GROUP_CONCAT with DISTINCT
      duplicatesQuery = `
        SELECT 
          td.token_address,
          COUNT(DISTINCT td.token_id) as token_count,
          GROUP_CONCAT(DISTINCT td.token_id) as token_ids,
          GROUP_CONCAT(DISTINCT td.chain) as chains
        FROM token_deployments td
        WHERE td.token_address IS NOT NULL
        GROUP BY td.token_address
        HAVING COUNT(DISTINCT td.token_id) > 1
      `;
    }
    
    const duplicates = await dbAll(duplicatesQuery, []) as any[];
    
    if (duplicates.length === 0) {
      return res.json({
        success: true,
        message: 'No duplicate tokens found',
        merged: 0,
      });
    }
    
    console.log(`📊 Found ${duplicates.length} token addresses with duplicate token IDs`);
    
    let mergedCount = 0;
    const mergeResults: any[] = [];
    
    for (const duplicate of duplicates) {
      const tokenAddress = duplicate.token_address;
      const tokenIds = duplicate.token_ids.split(',').filter((id: string) => id && id.trim() !== '');
      const chains = duplicate.chains.split(',').filter((c: string) => c && c.trim() !== '');
      
      console.log(`\n🔀 Processing token address ${tokenAddress}:`);
      console.log(`   Token IDs: ${tokenIds.join(', ')}`);
      console.log(`   Chains: ${chains.join(', ')}`);
      
      // Choose the first token ID as the master (keep the oldest one by created_at)
      // Get the oldest token
      const tokens = await dbAll(
        `SELECT id, created_at FROM tokens WHERE id IN (${tokenIds.map(() => '?').join(',')}) ORDER BY created_at ASC`,
        tokenIds
      ) as any[];
      
      if (tokens.length === 0) {
        console.warn(`   ⚠️  No tokens found for IDs: ${tokenIds.join(', ')}, skipping...`);
        continue;
      }
      
      const masterTokenId = tokens[0].id;
      const duplicateTokenIds = tokenIds.filter((id: string) => id !== masterTokenId);
      
      console.log(`   Master token ID: ${masterTokenId} (created: ${tokens[0].created_at})`);
      console.log(`   Duplicate token IDs to merge: ${duplicateTokenIds.join(', ')}`);
      
      // Get master token info
      const masterToken = await dbGet('SELECT * FROM tokens WHERE id = ?', [masterTokenId]) as any;
      if (!masterToken) {
        console.warn(`   ⚠️  Master token ${masterTokenId} not found, skipping...`);
        continue;
      }
      
      // For each duplicate token ID, merge its deployments into the master token
      for (const duplicateTokenId of duplicateTokenIds) {
        // Get all deployments for this duplicate token
        const duplicateDeployments = await dbAll(
          'SELECT * FROM token_deployments WHERE token_id = ?',
          [duplicateTokenId]
        ) as any[];
        
        console.log(`   📦 Merging ${duplicateDeployments.length} deployments from token ${duplicateTokenId}...`);
        
        for (const deployment of duplicateDeployments) {
          // Check if deployment already exists for master token on this chain
          const existingDeployment = await dbGet(
            'SELECT * FROM token_deployments WHERE token_id = ? AND chain = ?',
            [masterTokenId, deployment.chain]
          ) as any;
          
          if (existingDeployment) {
            // Update existing deployment with data from duplicate if it's missing info
            if (!existingDeployment.token_address && deployment.token_address) {
              await dbRun(
                'UPDATE token_deployments SET token_address = ?, curve_address = COALESCE(?, curve_address), status = COALESCE(?, status), is_graduated = COALESCE(?, is_graduated), market_cap = COALESCE(?, market_cap) WHERE token_id = ? AND chain = ?',
                [
                  deployment.token_address,
                  deployment.curve_address,
                  deployment.status,
                  deployment.is_graduated,
                  deployment.market_cap,
                  masterTokenId,
                  deployment.chain,
                ]
              );
              console.log(`     ✅ Updated deployment for chain ${deployment.chain}`);
            } else {
              console.log(`     ⏭️  Deployment for chain ${deployment.chain} already exists, skipping...`);
            }
          } else {
            // Insert deployment for master token
            await dbRun(
              'INSERT INTO token_deployments (token_id, chain, token_address, curve_address, status, is_graduated, market_cap, current_supply, reserve_balance) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
              [
                masterTokenId,
                deployment.chain,
                deployment.token_address,
                deployment.curve_address,
                deployment.status,
                deployment.is_graduated,
                deployment.market_cap,
                deployment.current_supply,
                deployment.reserve_balance,
              ]
            );
            console.log(`     ✅ Added deployment for chain ${deployment.chain}`);
          }
        }
        
        // Delete the duplicate token and its deployments (cascade should handle deployments)
        await dbRun('DELETE FROM token_deployments WHERE token_id = ?', [duplicateTokenId]);
        await dbRun('DELETE FROM tokens WHERE id = ?', [duplicateTokenId]);
        console.log(`   🗑️  Deleted duplicate token ${duplicateTokenId}`);
        
        mergedCount++;
      }
      
      mergeResults.push({
        tokenAddress,
        masterTokenId,
        duplicateTokenIds,
        chains,
      });
    }
    
    console.log(`\n✅ Merge complete: ${mergedCount} duplicate tokens merged`);
    
    res.json({
      success: true,
      message: `Merged ${mergedCount} duplicate tokens`,
      merged: mergedCount,
      results: mergeResults,
    });
  } catch (error: any) {
    console.error('❌ Error merging duplicate tokens:', error);
    res.status(500).json({
      error: 'Failed to merge duplicate tokens',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

