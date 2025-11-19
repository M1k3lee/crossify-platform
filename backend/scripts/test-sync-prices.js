const axios = require('axios');

const API_BASE = 'https://crossify-platform-production.up.railway.app/api';
const TOKEN_ID = 'ea23015c-d3c7-40e1-8cb3-94d2cbd813b9';

async function testSync() {
  try {
    console.log('🔄 Testing Price Sync...\n');
    console.log(`Token ID: ${TOKEN_ID}\n`);
    
    const response = await axios.post(`${API_BASE}/tokens/${TOKEN_ID}/sync-prices`);
    const data = response.data;
    
    console.log('📊 Full Sync Response:\n');
    console.log(JSON.stringify(data, null, 2));
    
    console.log(`\n${'='.repeat(60)}`);
    console.log('📈 Summary');
    console.log(`${'='.repeat(60)}`);
    console.log(`Overall Success: ${data.success ? '✅' : '❌'}`);
    console.log(`Message: ${data.message}\n`);
    
    if (data.configuration) {
      console.log('🔧 Configuration Results:');
      console.log(`   Success: ${data.configuration.success ? '✅' : '❌'}`);
      console.log(`   Message: ${data.configuration.message}`);
      if (data.configuration.results) {
        data.configuration.results.forEach((r, i) => {
          console.log(`   ${i + 1}. ${r.chain}: ${r.success ? '✅' : '❌'} ${r.message}`);
        });
      }
      console.log('');
    }
    
    if (data.sync) {
      console.log('🔄 Sync Results:');
      console.log(`   Success: ${data.sync.success ? '✅' : '❌'}`);
      console.log(`   Message: ${data.sync.message}`);
      if (data.sync.results) {
        data.sync.results.forEach((r, i) => {
          console.log(`   ${i + 1}. ${r.chain}:`);
          console.log(`      Success: ${r.success ? '✅' : '❌'}`);
          console.log(`      Message: ${r.message}`);
          if (r.actualSupply) {
            console.log(`      Actual Supply: ${r.actualSupply}`);
          }
          if (r.trackerSupply) {
            console.log(`      Tracker Supply: ${r.trackerSupply}`);
          }
          if (r.txHash) {
            console.log(`      Transaction: ${r.txHash}`);
          }
        });
      }
    }
    
    const syncSuccessCount = data.sync?.results?.filter(r => r.success).length || 0;
    const syncTotalCount = data.sync?.results?.length || 0;
    
    console.log(`\n✅ Sync Succeeded: ${syncSuccessCount}/${syncTotalCount} chains`);
    
    if (data.success && syncSuccessCount === syncTotalCount) {
      console.log('\n🎉 All chains synced successfully!');
    } else {
      console.log('\n⚠️  Some chains failed to sync. Check details above.');
    }
    
  } catch (error) {
    console.error('\n❌ Error calling sync endpoint:');
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Message: ${error.response.data?.message || error.response.data?.error || 'Unknown error'}`);
      console.error(`   Data:`, JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('   No response received. Is the API running?');
      console.error(`   URL: ${error.config?.url}`);
    } else {
      console.error(`   Error: ${error.message}`);
    }
    process.exit(1);
  }
}

testSync();

