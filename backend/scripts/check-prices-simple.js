const { ethers } = require('ethers');

const DEPLOYMENTS = [
  {
    chain: 'base-sepolia',
    curve: '0x1ec1419feFaf3D4eDF4f991570EEfB69CFd4BBD4',
    token: '0xa6E90B03A2aaF99543dbf1c64d22395d9b4359eb',
    tracker: '0x1eC9ee96EbD41111ad7b99f29D9a61e46b721C65',
    rpc: 'https://base-sepolia-rpc.publicnode.com',
  },
  {
    chain: 'bsc-testnet',
    curve: '0x325f08033Ff255669f442A0c97322094FaA1203b',
    token: '0x1f2D4CA70F1274c8CcfB9d600191258C4f2Aec1c',
    tracker: '0xe84Ae64735261F441e0bcB12bCf60630c5239ef4',
    rpc: 'https://bsc-testnet.publicnode.com',
  },
  {
    chain: 'sepolia',
    curve: '0x9a6d626ccf74f8aBb31D02C94e4a349a607f11c1',
    token: '0x84c7959EEbCC0307Ca0A3Cf3d338C215A1bB24Cb',
    tracker: '0x130195A8D09dfd99c36D5903B94088EDBD66533e',
    rpc: 'https://ethereum-sepolia-rpc.publicnode.com',
  },
];

const BONDING_CURVE_ABI = [
  'function getCurrentPrice() external view returns (uint256)',
  'function useGlobalSupply() external view returns (bool)',
  'function totalSupplySold() external view returns (uint256)',
];

const TRACKER_ABI = [
  'function getGlobalSupply(address tokenId) external view returns (uint256)',
  'function chainSupply(address tokenId, string memory chain) external view returns (uint256)',
];

async function checkPrices() {
  console.log('\n🔍 Checking Actual Prices from Contracts...\n');
  
  const results = [];
  
  for (const dep of DEPLOYMENTS) {
    try {
      const provider = new ethers.JsonRpcProvider(dep.rpc);
      const curveContract = new ethers.Contract(dep.curve, BONDING_CURVE_ABI, provider);
      const trackerContract = new ethers.Contract(dep.tracker, TRACKER_ABI, provider);
      
      const [currentPrice, useGlobalSupply, localSupply, globalSupply, chainSupply] = await Promise.all([
        curveContract.getCurrentPrice(),
        curveContract.useGlobalSupply(),
        curveContract.totalSupplySold(),
        trackerContract.getGlobalSupply(dep.token).catch(() => null),
        trackerContract.chainSupply(dep.token, dep.chain).catch(() => null),
      ]);
      
      const priceUSD = parseFloat(ethers.formatEther(currentPrice)) * 3000;
      const localSupplyTokens = parseFloat(ethers.formatEther(localSupply));
      const globalSupplyTokens = globalSupply ? parseFloat(ethers.formatEther(globalSupply)) : null;
      const chainSupplyTokens = chainSupply ? parseFloat(ethers.formatEther(chainSupply)) : null;
      
      results.push({
        chain: dep.chain,
        priceUSD,
        localSupply: localSupplyTokens,
        globalSupply: globalSupplyTokens,
        chainSupply: chainSupplyTokens,
        useGlobalSupply,
      });
    } catch (error) {
      console.error(`❌ Error checking ${dep.chain}:`, error.message);
    }
  }
  
  console.log('📊 Price Comparison:\n');
  console.log('Chain'.padEnd(20) + 'Price (USD)'.padEnd(15) + 'Local Supply'.padEnd(15) + 'Chain Supply'.padEnd(15) + 'Global Supply'.padEnd(15) + 'Uses Global');
  console.log('-'.repeat(95));
  
  results.forEach(r => {
    console.log(
      r.chain.padEnd(20) + 
      `$${r.priceUSD.toFixed(6)}`.padEnd(15) + 
      r.localSupply.toFixed(2).padEnd(15) + 
      (r.chainSupply?.toFixed(2) || 'N/A').padEnd(15) + 
      (r.globalSupply?.toFixed(2) || 'N/A').padEnd(15) + 
      (r.useGlobalSupply ? '✅' : '❌')
    );
  });
  
  const prices = results.map(r => r.priceUSD);
  const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
  const variance = prices.length > 1
    ? Math.sqrt(prices.reduce((sum, p) => sum + Math.pow(p - avgPrice, 2), 0) / prices.length) / avgPrice * 100
    : 0;
  
  console.log(`\n📈 Average Price: $${avgPrice.toFixed(6)}`);
  console.log(`📊 Variance: ${variance.toFixed(2)}%`);
  
  if (variance > 0.5) {
    console.log('\n⚠️  Prices are still out of sync!');
    console.log('   The bonding curves may not be reading the updated global supply correctly.');
  } else {
    console.log('\n✅ Prices are in sync!');
  }
}

checkPrices();

