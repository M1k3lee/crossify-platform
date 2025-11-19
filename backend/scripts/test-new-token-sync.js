const axios = require('axios');

// Get token ID from command line or use default
const TOKEN_ID = process.argv[2] || 'd09b0eed-57d9-456e-8b24-f81cc1656821';
const API_BASE = process.env.API_BASE_URL || 'https://crossify-platform-production.up.railway.app/api';

async function testSync() {
  console.log('\n🔍 Testing Sync for New Token\n');
  console.log(`Token ID: ${TOKEN_ID}`);
  console.log(`API Base: ${API_BASE}\n`);
  
  try {
    console.log('📡 Step 1: Calling sync endpoint...');
    const startTime = Date.now();
    const response = await axios.post(
      `${API_BASE}/tokens/${TOKEN_ID}/sync-prices`,
      {},
      {
        timeout: 120000, // 2 minutes
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    const duration = Date.now() - startTime;
    
    console.log(`✅ Response received in ${duration}ms\n`);
    console.log('📦 Full Response:');
    console.log(JSON.stringify(response.data, null, 2));
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 SUMMARY');
    console.log('='.repeat(80));
    console.log(`Overall Success: ${response.data.success ? '✅' : '❌'}`);
    console.log(`Message: ${response.data.message}\n`);
    
    if (response.data.configuration) {
      console.log('🔧 Configuration:');
      console.log(`   Success: ${response.data.configuration.success ? '✅' : '❌'}`);
      console.log(`   Message: ${response.data.configuration.message}`);
      if (response.data.configuration.results) {
        response.data.configuration.results.forEach((r, i) => {
          console.log(`   ${i + 1}. ${r.chain}: ${r.success ? '✅' : '❌'} ${r.message}`);
        });
      }
      console.log('');
    }
    
    if (response.data.sync) {
      console.log('🔄 Sync:');
      console.log(`   Success: ${response.data.sync.success ? '✅' : '❌'}`);
      console.log(`   Message: ${response.data.sync.message}`);
      if (response.data.sync.results) {
        response.data.sync.results.forEach((r, i) => {
          console.log(`   ${i + 1}. ${r.chain}: ${r.success ? '✅' : '❌'} ${r.message}`);
          if (r.actualSupply) console.log(`      Actual: ${r.actualSupply}`);
          if (r.trackerSupply) console.log(`      Tracker: ${r.trackerSupply}`);
        });
      }
      console.log('');
    }
    
    if (response.data.diagnostics) {
      console.log('🔍 Diagnostics:');
      response.data.diagnostics.forEach((d, i) => {
        console.log(`   ${i + 1}. ${d.chain}:`);
        console.log(`      Use Global: ${d.useGlobalSupply ? '✅' : '❌'}`);
        console.log(`      Tracker: ${d.trackerAddress || 'Not set'}`);
        console.log(`      Local Supply: ${d.localSupply || 'N/A'}`);
        console.log(`      Configured: ${d.configured ? '✅' : '❌'}`);
      });
    }
    
  } catch (error) {
    console.error('\n❌ Error:');
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data:`, JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('   No response received (timeout or network error)');
      console.error(`   Message: ${error.message}`);
    } else {
      console.error(`   ${error.message}`);
    }
    process.exit(1);
  }
}

testSync();

