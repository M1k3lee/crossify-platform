import { Router, Request, Response } from 'express';
import { dbAll } from '../db';

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

