import { Router, Request, Response } from 'express';
import { dbAll, dbRun, dbGet } from '../db/adapter';

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
    
    // Update supply and trigger price sync for buy/sell transactions
    if (status === 'confirmed' && (type === 'buy' || type === 'sell') && amount && price) {
      try {
        // Get current deployment state
        const deployment = await dbGet(
          `SELECT current_supply, reserve_balance FROM token_deployments WHERE token_id = ? AND chain = ?`,
          [tokenId, chain]
        ) as any;
        
        if (deployment) {
          const currentSupply = parseFloat(deployment.current_supply || '0');
          const currentReserve = parseFloat(deployment.reserve_balance || '0');
          const transactionAmount = parseFloat(amount);
          const transactionPrice = parseFloat(price);
          
          // Calculate new supply and reserve
          let newSupply: number;
          let newReserve: number;
          
          if (type === 'buy') {
            // Buy: supply increases, reserve increases
            newSupply = currentSupply + transactionAmount;
            newReserve = currentReserve + (transactionPrice * transactionAmount);
          } else {
            // Sell: supply decreases, reserve decreases
            newSupply = Math.max(0, currentSupply - transactionAmount);
            newReserve = Math.max(0, currentReserve - (transactionPrice * transactionAmount));
          }
          
          // Update deployment
          await dbRun(
            `UPDATE token_deployments 
             SET current_supply = ?, reserve_balance = ?, updated_at = CURRENT_TIMESTAMP
             WHERE token_id = ? AND chain = ?`,
            [newSupply.toString(), newReserve.toString(), tokenId, chain]
          );
          
          console.log(`✅ Updated supply for ${tokenId} on ${chain}: ${currentSupply} → ${newSupply}`);
          console.log(`✅ Updated reserve for ${tokenId} on ${chain}: ${currentReserve} → ${newReserve}`);
          
          // Trigger global supply update and price sync
          try {
            const { updateGlobalSupply, syncPriceAcrossChains } = await import('../services/globalSupply');
            await updateGlobalSupply(tokenId, chain, newSupply.toString());
            await syncPriceAcrossChains(tokenId);
            console.log(`✅ Triggered price sync for ${tokenId} across all chains`);
            
            // Attempt to send cross-chain messages via smart contracts
            try {
              const { sendCrossChainSupplyUpdate } = await import('../services/crossChainMessaging');
              const crossChainResult = await sendCrossChainSupplyUpdate(
                tokenId,
                chain,
                newSupply.toString(),
                deployment.token_address || ''
              );
              
              if (crossChainResult.success) {
                console.log(`✅ Cross-chain messages sent: ${crossChainResult.message}`);
                if (crossChainResult.txHashes) {
                  console.log(`   Transaction hashes: ${crossChainResult.txHashes.join(', ')}`);
                }
              } else {
                console.warn(`⚠️  Cross-chain messaging failed (non-critical): ${crossChainResult.message}`);
              }
            } catch (crossChainError) {
              // Non-critical - cross-chain messaging might not be configured
              console.warn('⚠️  Cross-chain messaging error (non-critical):', crossChainError instanceof Error ? crossChainError.message : crossChainError);
            }
            
            // Log bonding curve transaction to Hedera HCS for immutable audit trail
            try {
              const { getHederaAuditService } = await import('../services/hederaAudit');
              const auditService = getHederaAuditService();
              
              const tokenAddress = deployment.token_address || '';
              if (!tokenAddress) {
                console.warn('⚠️  Cannot log to HCS: tokenAddress is missing for token', tokenId, 'on chain', chain);
              } else {
                console.log(`📝 Logging ${type} transaction to Hedera HCS:`, {
                  tokenId,
                  tokenAddress,
                  chain,
                  amount,
                  price,
                  txHash
                });
                
                await auditService.logBondingCurveTransaction({
                  tokenAddress: tokenAddress.toLowerCase(), // Normalize to lowercase for consistency
                  chain: chain,
                  transactionType: type.toUpperCase() as "BUY" | "SELL",
                  amount: amount || '0',
                  price: price || '0',
                  newSupply: newSupply.toString(),
                  txHash: txHash || '',
                  userAddress: fromAddress || '',
                  timestamp: Date.now(),
                });
                
                console.log(`✅ Successfully logged ${type} transaction to Hedera HCS`);
              }
            } catch (auditError) {
              // Non-critical - don't fail if audit logging fails
              console.error('❌ Error logging to Hedera HCS:', auditError instanceof Error ? auditError.message : auditError);
              if (auditError instanceof Error && auditError.stack) {
                console.error('Stack trace:', auditError.stack);
              }
            }
          } catch (syncError) {
            console.error('⚠️ Error syncing prices (non-critical):', syncError);
            // Don't fail transaction recording if sync fails
          }
        } else {
          console.warn(`⚠️ Deployment not found for token ${tokenId} on ${chain}, skipping supply update`);
        }
      } catch (updateError) {
        console.error('⚠️ Error updating supply (non-critical):', updateError);
        // Don't fail transaction recording if supply update fails
      }
    }
    
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

