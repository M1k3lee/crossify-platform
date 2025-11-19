/**
 * Simple script to test price sync
 * Run: node test-sync.js
 */

const axios = require('axios');

const API_BASE = 'https://crossify-platform-production.up.railway.app/api';
const TOKEN_ID = 'ea23015c-d3c7-40e1-8cb3-94d2cbd813b9';

async function testSync() {
  console.log('\n🔄 Testing Price Sync...\n');
  
  try {
    console.log('📡 Calling sync endpoint...');
    const response = await axios.post(`${API_BASE}/tokens/${TOKEN_ID}/sync-prices`);
    const data = response.data;
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 SYNC RESULTS');
    console.log('='.repeat(60));
    console.log(`Overall: ${data.success ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`Message: ${data.message}\n`);
    
    if (data.sync && data.sync.results) {
      console.log('Chain-by-Chain Results:');
      data.sync.results.forEach((r, i) => {
        const icon = r.success ? '✅' : '❌';
        console.log(`  ${icon} ${r.chain}: ${r.message}`);
        if (r.actualSupply && r.trackerSupply) {
          console.log(`     Supply: ${r.trackerSupply} → ${r.actualSupply}`);
        }
        if (r.txHash) {
          console.log(`     TX: ${r.txHash}`);
        }
      });
    }
    
    const syncCount = data.sync?.results?.filter(r => r.success).length || 0;
    const totalCount = data.sync?.results?.length || 0;
    
    console.log(`\n✅ Synced: ${syncCount}/${totalCount} chains`);
    
    if (data.success && syncCount === totalCount) {
      console.log('\n🎉 All chains synced successfully!');
    } else if (syncCount > 0) {
      console.log('\n⚠️  Partial success. Some chains still need syncing.');
    } else {
      console.log('\n❌ Sync failed for all chains. Check errors above.');
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error(JSON.stringify(error.response.data, null, 2));
    }
  }
  
  console.log('\n');
}

testSync();

