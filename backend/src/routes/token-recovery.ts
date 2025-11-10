import { Router, Request, Response } from 'express';
import { dbRun, dbGet, dbAll } from '../db';
import { v4 as uuidv4 } from 'uuid';

export const router = Router();

// POST /tokens/recover - Recover a token from deployment data
// This endpoint can be used to recreate a token record if it was lost
router.post('/recover', async (req: Request, res: Response) => {
  try {
    const { tokenId, tokenData } = req.body;
    
    if (!tokenId || !tokenData) {
      return res.status(400).json({ error: 'Token ID and token data are required' });
    }
    
    // Check if token already exists
    const existing = await dbGet('SELECT id FROM tokens WHERE id = ?', [tokenId]) as any;
    if (existing) {
      return res.status(409).json({ error: 'Token already exists' });
    }
    
    // Check if deployments exist for this token
    const deployments = await dbAll(
      'SELECT * FROM token_deployments WHERE token_id = ?',
      [tokenId]
    ) as any[];
    
    if (deployments.length === 0) {
      return res.status(404).json({ error: 'No deployments found for this token ID' });
    }
    
    // Recreate token record from deployment data
    const tokenDataWithDefaults = {
      name: tokenData.name || 'Unknown Token',
      symbol: tokenData.symbol || 'UNKNOWN',
      decimals: tokenData.decimals || 18,
      initialSupply: tokenData.initialSupply || '0',
      logoIpfs: tokenData.logoIpfs || null,
      description: tokenData.description || null,
      twitterUrl: tokenData.twitterUrl || null,
      discordUrl: tokenData.discordUrl || null,
      telegramUrl: tokenData.telegramUrl || null,
      websiteUrl: tokenData.websiteUrl || null,
      githubUrl: tokenData.githubUrl || null,
      mediumUrl: tokenData.mediumUrl || null,
      redditUrl: tokenData.redditUrl || null,
      youtubeUrl: tokenData.youtubeUrl || null,
      linkedinUrl: tokenData.linkedinUrl || null,
      basePrice: tokenData.basePrice || '0',
      slope: tokenData.slope || '0',
      graduationThreshold: tokenData.graduationThreshold || '0',
      buyFeePercent: tokenData.buyFeePercent || '0',
      sellFeePercent: tokenData.sellFeePercent || '0',
      crossChainEnabled: tokenData.crossChainEnabled || false,
      creatorAddress: tokenData.creatorAddress || null,
      advancedSettings: tokenData.advancedSettings ? JSON.stringify(tokenData.advancedSettings) : '{}',
      bannerImageIpfs: tokenData.bannerImageIpfs || null,
      primaryColor: tokenData.primaryColor || '#3B82F6',
      accentColor: tokenData.accentColor || '#8B5CF6',
      backgroundColor: tokenData.backgroundColor || null,
      layoutTemplate: tokenData.layoutTemplate || 'default',
      customSettings: tokenData.customSettings ? JSON.stringify(tokenData.customSettings) : null,
    };
    
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
        tokenDataWithDefaults.name,
        tokenDataWithDefaults.symbol,
        tokenDataWithDefaults.decimals,
        tokenDataWithDefaults.initialSupply,
        tokenDataWithDefaults.logoIpfs,
        tokenDataWithDefaults.description,
        tokenDataWithDefaults.twitterUrl,
        tokenDataWithDefaults.discordUrl,
        tokenDataWithDefaults.telegramUrl,
        tokenDataWithDefaults.websiteUrl,
        tokenDataWithDefaults.githubUrl,
        tokenDataWithDefaults.mediumUrl,
        tokenDataWithDefaults.redditUrl,
        tokenDataWithDefaults.youtubeUrl,
        tokenDataWithDefaults.linkedinUrl,
        tokenDataWithDefaults.basePrice,
        tokenDataWithDefaults.slope,
        tokenDataWithDefaults.graduationThreshold,
        tokenDataWithDefaults.buyFeePercent,
        tokenDataWithDefaults.sellFeePercent,
        tokenDataWithDefaults.crossChainEnabled ? 1 : 0,
        tokenDataWithDefaults.creatorAddress,
        tokenDataWithDefaults.advancedSettings,
        tokenDataWithDefaults.bannerImageIpfs,
        tokenDataWithDefaults.primaryColor,
        tokenDataWithDefaults.accentColor,
        tokenDataWithDefaults.backgroundColor,
        tokenDataWithDefaults.layoutTemplate,
        tokenDataWithDefaults.customSettings,
      ]
    );
    
    console.log(`✅ Recovered token ${tokenId} from deployment data`);
    
    res.json({
      success: true,
      tokenId,
      message: 'Token recovered successfully',
      deploymentsCount: deployments.length,
    });
  } catch (error) {
    console.error('Error recovering token:', error);
    res.status(500).json({ 
      error: 'Failed to recover token',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});


