const axios = require('axios');
const { ethers } = require('ethers');

const API_BASE = 'https://crossify-platform-production.up.railway.app/api';
const TOKEN_ID = 'ea23015c-d3c7-40e1-8cb3-94d2cbd813b9';

const RPC_URLS = {
  'base-sepolia': 'https://base-sepolia-rpc.publicnode.com',
  'bsc-testnet': 'https://bsc-testnet.publicnode.com',
  'sepolia': 'https://ethereum-sepolia-rpc.publicnode.com',
};

const BONDING_CURVE_ABI = [
  'function getCurrentPrice() external view returns (uint256)',
  'function useGlobalSupply() external view returns (bool)',
  'function globalSupplyTracker() external view returns (address)',
  'function totalSupplySold() external view returns (uint256)',
];

const TRACKER_ABI = [
  'function getGlobalSupply(address tokenId) external view returns (uint256)',
  'function chainSupply(address tokenId, string memory chain) external view returns (uint256)',
];

async function checkPrices() {
  console.log('\n🔍 Checking Actual Prices from Contracts...\n');
  
  try {
    // Get deployments from API
    const deploymentsRes = await axios.get(`${API_BASE}/tokens/${TOKEN_ID}`);
    console.log('API Response keys:', Object.keys(deploymentsRes.data));
    const deployments = deploymentsRes.data.deployments || deploymentsRes.data.token?.deployments || [];
    console.log(`Found ${deployments.length} deployments`);
    
    const results = [];
    
    for (const dep of deployments) {
      if (!dep.curve_address || dep.chain.toLowerCase().includes('hedera') || dep.chain.toLowerCase().includes('solana')) {
        continue;
      }
      
      const chain = dep.chain.toLowerCase();
      const rpcUrl = RPC_URLS[chain];
      
      if (!rpcUrl) {
        console.log(`⚠️  No RPC URL for ${chain}`);
        continue;
      }
      
      try {
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const curveContract = new ethers.Contract(dep.curve_address, BONDING_CURVE_ABI, provider);
        
        // Get bonding curve info
        const [currentPrice, useGlobalSupply, trackerAddress, localSupply] = await Promise.all([
          curveContract.getCurrentPrice(),
          curveContract.useGlobalSupply(),
          curveContract.globalSupplyTracker(),
          curveContract.totalSupplySold(),
        ]);
        
        const priceUSD = parseFloat(ethers.formatEther(currentPrice)) * 3000;
        const localSupplyTokens = parseFloat(ethers.formatEther(localSupply));
        
        // Get tracker info if available
        let globalSupply = null;
        let chainSupply = null;
        if (trackerAddress && trackerAddress !== ethers.ZeroAddress) {
          try {
            const trackerContract = new ethers.Contract(trackerAddress, TRACKER_ABI, provider);
            [globalSupply, chainSupply] = await Promise.all([
              trackerContract.getGlobalSupply(dep.token_address).catch(() => null),
              trackerContract.chainSupply(dep.token_address, chain).catch(() => null),
            ]);
          } catch (e) {
            console.warn(`⚠️  Error querying tracker for ${chain}:`, e.message);
          }
        }
        
        results.push({
          chain: dep.chain,
          priceUSD: priceUSD.toFixed(6),
          localSupply: localSupplyTokens.toFixed(2),
          globalSupply: globalSupply ? parseFloat(ethers.formatEther(globalSupply)).toFixed(2) : 'N/A',
          chainSupply: chainSupply ? parseFloat(ethers.formatEther(chainSupply)).toFixed(2) : 'N/A',
          useGlobalSupply,
          trackerAddress: trackerAddress === ethers.ZeroAddress ? 'Not set' : trackerAddress,
        });
      } catch (error) {
        console.error(`❌ Error checking ${chain}:`, error.message);
      }
    }
    
    console.log('📊 Price Comparison:\n');
    console.log('Chain'.padEnd(20) + 'Price (USD)'.padEnd(15) + 'Local Supply'.padEnd(15) + 'Chain Supply'.padEnd(15) + 'Global Supply');
    console.log('-'.repeat(80));
    
    results.forEach(r => {
      console.log(
        r.chain.padEnd(20) + 
        r.priceUSD.padEnd(15) + 
        r.localSupply.padEnd(15) + 
        r.chainSupply.padEnd(15) + 
        r.globalSupply
      );
    });
    
    const prices = results.map(r => parseFloat(r.priceUSD));
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    const variance = prices.length > 1
      ? Math.sqrt(prices.reduce((sum, p) => sum + Math.pow(p - avgPrice, 2), 0) / prices.length) / avgPrice * 100
      : 0;
    
    console.log(`\n📈 Average Price: $${avgPrice.toFixed(6)}`);
    console.log(`📊 Variance: ${variance.toFixed(2)}%`);
    
    if (variance > 0.5) {
      console.log('\n⚠️  Prices are still out of sync!');
      console.log('   This suggests the bonding curves are not reading the updated global supply.');
    } else {
      console.log('\n✅ Prices are in sync!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkPrices();

