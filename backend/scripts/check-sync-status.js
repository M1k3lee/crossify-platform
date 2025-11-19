const axios = require('axios');

const API_BASE = 'https://crossify-platform-production.up.railway.app/api';
const TOKEN_ID = 'ea23015c-d3c7-40e1-8cb3-94d2cbd813b9';

async function checkStatus() {
  try {
    console.log('📊 Checking sync diagnostics...\n');
    const response = await axios.get(`${API_BASE}/tokens/${TOKEN_ID}/sync-diagnostics`);
    const data = response.data;
    
    console.log('🔍 Current Status:\n');
    data.diagnostics.forEach(d => {
      if (d.skipped) {
        console.log(`⏭️  ${d.chain}: ${d.reason}`);
      } else {
        console.log(`\n${'─'.repeat(60)}`);
        console.log(`🔗 ${d.chain}`);
        console.log(`   Actual Supply: ${d.actualSupply}`);
        console.log(`   Tracker Supply: ${d.trackerSupply}`);
        console.log(`   Global Supply: ${d.globalSupply || 'N/A'}`);
        console.log(`   Needs Update: ${d.needsUpdate ? '❌ YES' : '✅ NO'}`);
        console.log(`   Can Update: ${d.canUpdate ? '✅ YES' : '❌ NO'}`);
        if (d.updateError) {
          console.log(`   Update Error: ${d.updateError}`);
        }
        console.log(`   Authorized: ${d.authorization?.curveAuthorized ? '✅' : '❌'}`);
        console.log(`   Wallet is Owner: ${d.authorization?.walletIsOwner ? '✅' : '❌'}`);
      }
    });
    
    console.log(`\n${'='.repeat(60)}`);
    console.log('📈 Summary:');
    console.log(`   Total: ${data.summary.total}`);
    console.log(`   Can Update: ${data.summary.canUpdate}`);
    console.log(`   Needs Update: ${data.summary.needsUpdate}`);
    console.log(`   Errors: ${data.summary.errors}`);
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

checkStatus();

