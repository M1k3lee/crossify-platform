const { ethers } = require('ethers');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const TOKEN_ID = process.argv[2] || 'd09b0eed-57d9-456e-8b24-f81cc1656821';
const API_BASE = process.env.API_BASE_URL || 'https://crossify-platform-production.up.railway.app/api';

const TRACKER_ADDRESSES = {
  'base-sepolia': '0x1eC9ee96EbD41111ad7b99f29D9a61e46b721C65',
  'bsc-testnet': '0xe84Ae64735261F441e0bcB12bCf60630c5239ef4',
  'sepolia': '0x130195A8D09dfd99c36D5903B94088EDBD66533e',
};

const RPC_URLS = {
  'base-sepolia': 'https://base-sepolia-rpc.publicnode.com',
  'bsc-testnet': 'https://bsc-testnet-rpc.publicnode.com',
  'sepolia': 'https://ethereum-sepolia-rpc.publicnode.com',
};

const TRACKER_ABI = [
  'function owner() external view returns (address)',
  'function authorizedUpdaters(address) external view returns (bool)',
  'function authorizeUpdater(address) external',
];

async function authorizeCurves() {
  console.log('\n🔧 Authorizing Bonding Curves for Token\n');
  console.log(`Token ID: ${TOKEN_ID}\n`);
  
  try {
    // Get deployments from API
    const axios = require('axios');
    const deploymentsRes = await axios.get(`${API_BASE}/tokens/${TOKEN_ID}`);
    
    let deployments = deploymentsRes.data.deployments || deploymentsRes.data.token?.deployments || [];
    
    // If deployments is empty, try status endpoint
    if (deployments.length === 0) {
      try {
        const statusRes = await axios.get(`${API_BASE}/tokens/${TOKEN_ID}/status`);
        deployments = statusRes.data.deployments || [];
        console.log('Got deployments from status endpoint');
      } catch (e) {
        console.warn('Status endpoint failed:', e.message);
      }
    }
    
    console.log(`Found ${deployments.length} deployments\n`);
    if (deployments.length > 0) {
      console.log('Deployments:');
      deployments.forEach((d, i) => {
        console.log(`  ${i + 1}. ${d.chain}: ${d.curve_address || d.curveAddress || 'N/A'}`);
      });
      console.log('');
    }
    
    const results = [];
    
    for (const dep of deployments) {
      const curveAddress = dep.curve_address || dep.curveAddress;
      if (!curveAddress || dep.chain.toLowerCase().includes('hedera') || dep.chain.toLowerCase().includes('solana')) {
        if (!curveAddress) {
          console.log(`⚠️  Skipping ${dep.chain}: No curve address`);
        } else {
          console.log(`⚠️  Skipping ${dep.chain}: Non-EVM chain`);
        }
        continue;
      }
      
      const chain = dep.chain.toLowerCase();
      const trackerAddress = TRACKER_ADDRESSES[chain];
      const rpcUrl = RPC_URLS[chain];
      
      if (!trackerAddress || !rpcUrl) {
        console.log(`⚠️  Skipping ${chain}: No tracker address or RPC URL configured`);
        continue;
      }
      
      console.log(`\n🔍 Processing ${chain}...`);
      console.log(`   Curve: ${curveAddress}`);
      console.log(`   Tracker: ${trackerAddress}`);
      
      try {
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const trackerContract = new ethers.Contract(trackerAddress, TRACKER_ABI, provider);
        
        // Check if already authorized
        const isAuthorized = await trackerContract.authorizedUpdaters(curveAddress);
        if (isAuthorized) {
          console.log(`   ✅ Already authorized`);
          results.push({ chain, success: true, message: 'Already authorized' });
          continue;
        }
        
        // Get owner
        const owner = await trackerContract.owner();
        console.log(`   Owner: ${owner}`);
        
        // Try to find owner's private key
        const possibleKeys = [
          process.env.ETHEREUM_PRIVATE_KEY,
          process.env.PRIVATE_KEY,
          process.env.BASE_PRIVATE_KEY,
          process.env.BSC_PRIVATE_KEY,
          process.env.SEPOLIA_PRIVATE_KEY,
        ].filter(Boolean);
        
        let ownerWallet = null;
        for (const key of possibleKeys) {
          try {
            const wallet = new ethers.Wallet(key.replace(/^0x/, ''), provider);
            if (wallet.address.toLowerCase() === owner.toLowerCase()) {
              ownerWallet = wallet;
              console.log(`   ✅ Found owner key: ${wallet.address}`);
              break;
            }
          } catch (e) {
            // Invalid key, skip
          }
        }
        
        if (!ownerWallet) {
          console.log(`   ❌ No private key found for owner ${owner}`);
          console.log(`   Available keys: ${possibleKeys.length} keys checked`);
          results.push({ chain, success: false, message: `Need private key for owner ${owner}` });
          continue;
        }
        
        // Authorize the bonding curve
        console.log(`   📝 Authorizing ${curveAddress}...`);
        const trackerWithSigner = new ethers.Contract(trackerAddress, TRACKER_ABI, ownerWallet);
        const tx = await trackerWithSigner.authorizeUpdater(curveAddress, { gasLimit: 200000 });
        console.log(`   ⏳ Waiting for confirmation...`);
        await tx.wait();
        
        console.log(`   ✅ Authorized! Transaction: ${tx.hash}`);
        results.push({ chain, success: true, txHash: tx.hash });
        
      } catch (error) {
        console.error(`   ❌ Error: ${error.message}`);
        if (error.reason) {
          console.error(`   Reason: ${error.reason}`);
        }
        results.push({ chain, success: false, message: error.message });
      }
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 Summary:');
    results.forEach(r => {
      console.log(`   ${r.success ? '✅' : '❌'} ${r.chain}: ${r.message || (r.success ? 'Success' : 'Failed')}`);
      if (r.txHash) {
        console.log(`      TX: ${r.txHash}`);
      }
    });
    console.log('='.repeat(80));
    console.log('');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    process.exit(1);
  }
}

authorizeCurves();

