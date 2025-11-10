/**
 * Script to make all hidden tokens visible in the marketplace
 * Run this to fix tokens that were synced without visible_in_marketplace being set
 */

import { dbRun, dbAll } from '../db/adapter';

async function makeTokensVisible() {
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
      console.log('✅ No hidden tokens found. All tokens are already visible.');
      return;
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
    
    console.log(`📊 Tokens status:`);
    console.log(`   - Total tokens: ${totalTokens[0]?.count || 0}`);
    console.log(`   - Visible tokens: ${visibleTokens[0]?.count || 0}`);
    console.log(`   - Hidden tokens: ${(totalTokens[0]?.count || 0) - (visibleTokens[0]?.count || 0)}`);
    
  } catch (error) {
    console.error('❌ Error making tokens visible:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  makeTokensVisible()
    .then(() => {
      console.log('✅ Script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

export { makeTokensVisible };

