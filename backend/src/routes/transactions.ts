import { Router, Request, Response } from 'express';
import { dbAll, dbRun } from '../db';

export const router = Router();

// GET /transactions
router.get('/', async (req: Request, res: Response) => {
  try {
    const { tokenId, chain, type, limit = 100, offset = 0 } = req.query;
    
    let query = 'SELECT * FROM transactions WHERE 1=1';
    const params: any[] = [];
    
    if (tokenId) {
      query += ' AND token_id = ?';
      params.push(tokenId);
    }
    
    if (chain) {
      query += ' AND chain = ?';
      params.push(chain);
    }
    
    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit as string), parseInt(offset as string));
    
    const transactions = await dbAll(query, params) as any[];
    
    res.json({
      transactions: transactions.map(tx => ({
        id: tx.id,
        tokenId: tx.token_id,
        chain: tx.chain,
        txHash: tx.tx_hash,
        type: tx.type,
        fromAddress: tx.from_address,
        toAddress: tx.to_address,
        amount: tx.amount,
        price: tx.price,
        status: tx.status,
        createdAt: tx.created_at,
      })),
      count: transactions.length,
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// POST /transactions - Record a transaction
router.post('/', async (req: Request, res: Response) => {
  try {
    const { tokenId, chain, txHash, type, fromAddress, toAddress, amount, price, status = 'confirmed' } = req.body;
    
    if (!tokenId || !chain || !txHash || !type) {
      return res.status(400).json({ error: 'Missing required fields: tokenId, chain, txHash, type' });
    }
    
    // Record transaction
    await dbRun(
      `INSERT INTO transactions (
        token_id, chain, tx_hash, type, from_address, to_address, amount, price, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        tokenId,
        chain,
        txHash,
        type,
        fromAddress || null,
        toAddress || null,
        amount || null,
        price || null,
        status,
      ]
    );
    
    console.log(`✅ Recorded ${type} transaction for token ${tokenId} on ${chain}: ${txHash}`);
    
    res.json({
      success: true,
      message: 'Transaction recorded',
    });
  } catch (error: any) {
    console.error('Error recording transaction:', error);
    
    // If it's a duplicate, that's okay - just return success
    if (error.message?.includes('UNIQUE constraint') || error.message?.includes('duplicate')) {
      console.log('Transaction already recorded (duplicate)');
      return res.json({
        success: true,
        message: 'Transaction already recorded',
      });
    }
    
    res.status(500).json({ error: 'Failed to record transaction' });
  }
});

