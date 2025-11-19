const axios = require('axios');

/**
 * Test script to authorize backend wallet via API endpoint
 */

const API_BASE = process.env.API_BASE_URL || 'https://crossify-platform-production.up.railway.app/api';
const TOKEN_ID = process.env.TOKEN_ID || 'ea23015c-d3c7-40e1-8cb3-94d2cbd813b9';

async function main() {
  console.log('\n🔧 Testing Backend Wallet Authorization\n');
  console.log(`API Base: ${API_BASE}`);
  console.log(`Token ID: ${TOKEN_ID}\n`);

  try {
    console.log('📡 Calling authorization endpoint...');
    const response = await axios.post(`${API_BASE}/tokens/${TOKEN_ID}/authorize-backend-wallet`);
    
    console.log('\n✅ Authorization Response:');
    console.log(JSON.stringify(response.data, null, 2));
    
    const { success, message, results } = response.data;
    
    console.log(`\n${'='.repeat(60)}`);
    console.log('📊 Summary');
    console.log(`${'='.repeat(60)}`);
    console.log(`Overall Success: ${success ? '✅' : '❌'}`);
    console.log(`Message: ${message}\n`);
    
    if (results && Array.isArray(results)) {
      results.forEach((result, index) => {
        console.log(`${result.success ? '✅' : '❌'} ${result.chain}: ${result.message}`);
        if (result.txHash) {
          console.log(`   Transaction: ${result.txHash}`);
        }
      });
    }
    
    const successCount = results?.filter(r => r.success).length || 0;
    const totalCount = results?.length || 0;
    
    console.log(`\n✅ Authorized: ${successCount}/${totalCount} chains`);
    
    if (success) {
      console.log('\n🎉 Backend wallet authorized successfully!');
      console.log('   You can now try the sync endpoint again.');
    } else {
      console.log('\n⚠️  Some chains failed to authorize.');
      console.log('   Check the error messages above.');
    }
    
  } catch (error) {
    console.error('\n❌ Error calling authorization endpoint:');
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

main()
  .then(() => {
    console.log('\n✅ Test complete!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });

