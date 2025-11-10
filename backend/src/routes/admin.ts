import { Router, Request, Response } from 'express';
import { dbGet, dbAll, dbRun } from '../db';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export const router = Router();

// Admin password hash (should be set via env in production)
const DEFAULT_PASSWORD = 'admin123';

// Get admin password hash from env or generate one for development
// Note: bcrypt hashes include a salt, so each hash is unique, but bcrypt.compare() will verify correctly
const getAdminPasswordHash = (): string => {
  if (process.env.ADMIN_PASSWORD_HASH) {
    return process.env.ADMIN_PASSWORD_HASH;
  }
  // Generate hash for development (will be different each restart, but bcrypt.compare works correctly)
  const hash = bcrypt.hashSync(DEFAULT_PASSWORD, 10);
  console.log('🔐 Admin password hash generated for development');
  console.log('   Default password:', DEFAULT_PASSWORD);
  console.log('   Hash:', hash.substring(0, 30) + '...');
  return hash;
};

const ADMIN_PASSWORD_HASH = getAdminPasswordHash();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware to verify admin authentication
function verifyAdmin(req: Request, res: Response, next: Function): void {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Get token from "Bearer TOKEN"
  
  if (!token) {
    res.status(401).json({ error: 'Unauthorized: No token provided' });
    return;
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded.role !== 'admin') {
      res.status(403).json({ error: 'Forbidden: Invalid role' });
      return;
    }
    (req as any).user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }
}

// POST /admin/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ error: 'Password required' });
    }
    
    // Verify password
    let isValid = false;
    try {
      // Compare password with stored hash
      isValid = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
      console.log(`🔐 Login attempt: password="${password}", valid=${isValid}`);
      
      // Debug: Log hash info if login fails
      if (!isValid) {
        console.log(`   Stored hash length: ${ADMIN_PASSWORD_HASH.length}`);
        console.log(`   Stored hash start: ${ADMIN_PASSWORD_HASH.substring(0, 20)}...`);
      }
    } catch (compareError) {
      console.error('❌ Password comparison error:', compareError);
      return res.status(500).json({ 
        error: 'Authentication error', 
        details: compareError instanceof Error ? compareError.message : 'Unknown error' 
      });
    }
    
    if (!isValid) {
      console.log(`❌ Login failed: Invalid password`);
      return res.status(401).json({ 
        error: 'Invalid password',
        hint: process.env.ADMIN_PASSWORD_HASH ? 'Check your ADMIN_PASSWORD_HASH in .env' : `Default password is: ${DEFAULT_PASSWORD}`
      });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { role: 'admin', timestamp: Date.now() },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    console.log('✅ Admin login successful');
    res.json({ success: true, token });
    return;
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Login failed', details: error instanceof Error ? error.message : 'Unknown error' });
    return;
  }
});

// GET /admin/dashboard - Dashboard overview
router.get('/dashboard', verifyAdmin, async (req: Request, res: Response) => {
  try {
    // Get total tokens
    const totalTokens = await dbGet('SELECT COUNT(*) as count FROM tokens') as any;
    
    // Get total fees (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const fees = await dbAll(`
      SELECT 
        SUM(amount_usd) as total_fees,
        COUNT(*) as fee_count,
        fee_type,
        SUM(CASE WHEN fee_type = 'token_creation' THEN amount_usd ELSE 0 END) as creation_fees,
        SUM(CASE WHEN fee_type = 'mint' THEN amount_usd ELSE 0 END) as mint_fees,
        SUM(CASE WHEN fee_type = 'cross_chain' THEN amount_usd ELSE 0 END) as cross_chain_fees,
        SUM(CASE WHEN fee_type = 'bridge' THEN amount_usd ELSE 0 END) as bridge_fees
      FROM platform_fees
      WHERE collected_at >= datetime('now', '-30 days')
      AND status = 'confirmed'
    `) as any[];
    
    // Get active tokens (deployed in last 7 days)
    const activeTokens = await dbAll(`
      SELECT COUNT(DISTINCT token_id) as count
      FROM token_deployments
      WHERE created_at >= datetime('now', '-7 days')
      AND status = 'deployed'
    `) as any[];
    
    // Get recent fees (last 24 hours)
    const recentFees = await dbAll(`
      SELECT 
        fee_type,
        SUM(amount_usd) as amount,
        COUNT(*) as count
      FROM platform_fees
      WHERE collected_at >= datetime('now', '-1 day')
      AND status = 'confirmed'
      GROUP BY fee_type
    `) as any[];
    
    // Get top tokens by fees
    const topTokens = await dbAll(`
      SELECT 
        t.id,
        t.name,
        t.symbol,
        SUM(pf.amount_usd) as total_fees,
        COUNT(pf.id) as fee_count
      FROM tokens t
      LEFT JOIN platform_fees pf ON t.id = pf.token_id
      WHERE pf.status = 'confirmed'
      GROUP BY t.id
      ORDER BY total_fees DESC
      LIMIT 10
    `) as any[];
    
    res.json({
      overview: {
        totalTokens: totalTokens?.count || 0,
        activeTokens: activeTokens[0]?.count || 0,
        totalFees30d: fees[0]?.total_fees || 0,
        feeCount30d: fees[0]?.fee_count || 0,
      },
      fees: {
        total: fees[0]?.total_fees || 0,
        byType: {
          creation: fees[0]?.creation_fees || 0,
          mint: fees[0]?.mint_fees || 0,
          crossChain: fees[0]?.cross_chain_fees || 0,
          bridge: fees[0]?.bridge_fees || 0,
        },
        recent24h: recentFees,
      },
      topTokens,
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// GET /admin/tokens - All tokens with details
router.get('/tokens', verifyAdmin, async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 50, search } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    
    let query = `
      SELECT 
        t.*,
        COUNT(DISTINCT td.id) as deployment_count,
        SUM(CASE WHEN pf.status = 'confirmed' THEN pf.amount_usd ELSE 0 END) as total_fees
      FROM tokens t
      LEFT JOIN token_deployments td ON t.id = td.token_id
      LEFT JOIN platform_fees pf ON t.id = pf.token_id
    `;
    
    const params: any[] = [];
    if (search) {
      query += ` WHERE t.name LIKE ? OR t.symbol LIKE ? OR t.id LIKE ?`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }
    
    query += ` GROUP BY t.id ORDER BY t.created_at DESC LIMIT ? OFFSET ?`;
    params.push(Number(limit), offset);
    
    const tokens = await dbAll(query, params) as any[];
    
    // Get total count
    let countQuery = 'SELECT COUNT(*) as count FROM tokens';
    if (search) {
      countQuery += ` WHERE name LIKE ? OR symbol LIKE ? OR id LIKE ?`;
    }
    const total = await dbGet(countQuery, search ? [`%${search}%`, `%${search}%`, `%${search}%`] : []) as any;
    
    res.json({
      tokens: tokens.map(t => ({
        ...t,
        advancedSettings: t.advanced_settings ? JSON.parse(t.advanced_settings) : {},
      })),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: total?.count || 0,
        totalPages: Math.ceil((total?.count || 0) / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching tokens:', error);
    res.status(500).json({ error: 'Failed to fetch tokens' });
  }
});

// GET /admin/fees - Fee analytics
router.get('/fees', verifyAdmin, async (req: Request, res: Response) => {
  try {
    const { period = '30d', type } = req.query;
    
    let dateFilter = "datetime('now', '-30 days')";
    if (period === '7d') dateFilter = "datetime('now', '-7 days')";
    if (period === '90d') dateFilter = "datetime('now', '-90 days')";
    if (period === '1y') dateFilter = "datetime('now', '-1 year')";
    
    let query = `
      SELECT 
        DATE(collected_at) as date,
        fee_type,
        SUM(amount_usd) as total,
        COUNT(*) as count,
        AVG(amount_usd) as average
      FROM platform_fees
      WHERE collected_at >= ${dateFilter}
      AND status = 'confirmed'
    `;
    
    const params: any[] = [];
    if (type) {
      query += ` AND fee_type = ?`;
      params.push(type);
    }
    
    query += ` GROUP BY DATE(collected_at), fee_type ORDER BY date DESC`;
    
    const fees = await dbAll(query, params) as any[];
    
    // Get summary
    const summary = await dbAll(`
      SELECT 
        fee_type,
        SUM(amount_usd) as total,
        COUNT(*) as count,
        MIN(amount_usd) as min,
        MAX(amount_usd) as max,
        AVG(amount_usd) as avg
      FROM platform_fees
      WHERE collected_at >= ${dateFilter}
      AND status = 'confirmed'
      ${type ? 'AND fee_type = ?' : ''}
      GROUP BY fee_type
    `, type ? [type] : []) as any[];
    
    res.json({
      fees,
      summary,
      period,
    });
  } catch (error) {
    console.error('Error fetching fees:', error);
    res.status(500).json({ error: 'Failed to fetch fees' });
  }
});

// GET /admin/fees/realtime - Real-time fee stream
router.get('/fees/realtime', verifyAdmin, async (req: Request, res: Response) => {
  try {
    const fees = await dbAll(`
      SELECT 
        pf.*,
        t.name as token_name,
        t.symbol as token_symbol
      FROM platform_fees pf
      LEFT JOIN tokens t ON pf.token_id = t.id
      WHERE pf.collected_at >= datetime('now', '-1 hour')
      ORDER BY pf.collected_at DESC
      LIMIT 100
    `) as any[];
    
    res.json({ fees });
  } catch (error) {
    console.error('Error fetching real-time fees:', error);
    res.status(500).json({ error: 'Failed to fetch real-time fees' });
  }
});

// POST /admin/fees/record - Record a fee (called by platform contracts)
router.post('/fees/record', async (req: Request, res: Response) => {
  try {
    const { tokenId, chain, feeType, amount, amountUsd, nativeAmount, fromAddress, toAddress, txHash } = req.body;
    
    // Verify request is from authorized source (in production, use API key)
    const apiKey = req.headers['x-api-key'];
    if (apiKey !== process.env.PLATFORM_API_KEY) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    await dbRun(
      `INSERT INTO platform_fees (
        token_id, chain, fee_type, amount, amount_usd, native_amount,
        from_address, to_address, tx_hash, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [tokenId || null, chain, feeType, amount, amountUsd || null, nativeAmount || null, fromAddress || null, toAddress || null, txHash || null]
    );
    
    // Update daily statistics
    const today = new Date().toISOString().split('T')[0];
    await dbRun(
      `INSERT OR REPLACE INTO fee_statistics (date, ${feeType}_fees, total_fees_usd)
       VALUES (?, COALESCE((SELECT ${feeType}_fees FROM fee_statistics WHERE date = ?), 0) + ?, 
               COALESCE((SELECT total_fees_usd FROM fee_statistics WHERE date = ?), 0) + ?)`,
      [today, today, amountUsd || 0, today, amountUsd || 0]
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error recording fee:', error);
    res.status(500).json({ error: 'Failed to record fee' });
  }
});

// GET /admin/statistics - Platform statistics
router.get('/statistics', verifyAdmin, async (req: Request, res: Response) => {
  try {
    const stats = {
      tokens: await dbGet('SELECT COUNT(*) as count FROM tokens') as any,
      deployments: await dbGet('SELECT COUNT(*) as count FROM token_deployments WHERE status = "deployed"') as any,
      totalFees: await dbGet('SELECT SUM(amount_usd) as total FROM platform_fees WHERE status = "confirmed"') as any,
      activeUsers: await dbGet('SELECT COUNT(DISTINCT creator_address) as count FROM tokens WHERE creator_address IS NOT NULL') as any,
      verifiedTokens: await dbGet('SELECT COUNT(*) as count FROM tokens WHERE verified = 1') as any,
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// POST /admin/tokens/:id/verify - Verify a token
router.post('/tokens/:id/verify', verifyAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { verified = true } = req.body;
    const adminUser = (req as any).user;
    
    // Check if token exists
    const token = await dbGet('SELECT id, name, symbol FROM tokens WHERE id = ?', [id]) as any;
    if (!token) {
      return res.status(404).json({ error: 'Token not found' });
    }
    
    // Update verification status
    if (verified) {
      await dbRun(
        `UPDATE tokens 
         SET verified = 1, verified_at = CURRENT_TIMESTAMP, verified_by = ?
         WHERE id = ?`,
        [adminUser.username || adminUser.role || 'admin', id]
      );
      console.log(`✅ Token ${id} (${token.name}) verified by admin`);
    } else {
      await dbRun(
        `UPDATE tokens 
         SET verified = 0, verified_at = NULL, verified_by = NULL
         WHERE id = ?`,
        [id]
      );
      console.log(`✅ Token ${id} (${token.name}) verification removed by admin`);
    }
    
    res.json({ 
      success: true, 
      verified,
      message: verified ? 'Token verified successfully' : 'Token verification removed'
    });
  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(500).json({ error: 'Failed to verify token' });
  }
});

