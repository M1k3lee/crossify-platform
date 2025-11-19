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
  'function basePrice() external view returns (uint256)',
  'function slope() external view returns (uint256)',
  'function useGlobalSupply() external view returns (bool)',
  'function globalSupplyTracker() external view returns (address)',
  'function totalSupplySold() external view returns (uint256)',
  'function getSupplyForPricing() external view returns (uint256)',
];

const TRACKER_ABI = [
  'function getGlobalSupply(address tokenId) external view returns (uint256)',
];

async function debugPrices() {
  console.log('\n🔍 Debugging Price Calculation...\n');
  
  for (const dep of DEPLOYMENTS) {
    try {
      const provider = new ethers.JsonRpcProvider(dep.rpc);
      const curveContract = new ethers.Contract(dep.curve, BONDING_CURVE_ABI, provider);
      const trackerContract = new ethers.Contract(dep.tracker, TRACKER_ABI, provider);
      
      const [
        currentPrice,
        basePrice,
        slope,
        useGlobalSupply,
        trackerAddress,
        localSupply,
        supplyForPricing,
        globalSupply,
      ] = await Promise.all([
        curveContract.getCurrentPrice(),
        curveContract.basePrice(),
        curveContract.slope(),
        curveContract.useGlobalSupply(),
        curveContract.globalSupplyTracker(),
        curveContract.totalSupplySold(),
        curveContract.getSupplyForPricing().catch(() => null),
        trackerContract.getGlobalSupply(dep.token).catch(() => null),
      ]);
      
      const priceUSD = parseFloat(ethers.formatEther(currentPrice)) * 3000;
      const basePriceEth = parseFloat(ethers.formatEther(basePrice));
      const slopeEth = parseFloat(ethers.formatEther(slope));
      const localSupplyTokens = parseFloat(ethers.formatEther(localSupply));
      const supplyForPricingTokens = supplyForPricing ? parseFloat(ethers.formatEther(supplyForPricing)) : null;
      const globalSupplyTokens = globalSupply ? parseFloat(ethers.formatEther(globalSupply)) : null;
      
      // Calculate expected price
      const supplyUsed = supplyForPricingTokens || globalSupplyTokens || localSupplyTokens;
      const supplyInTokens = supplyUsed / 1e18; // Convert from wei
      const expectedPriceWei = basePriceEth + (slopeEth * supplyInTokens);
      const expectedPriceUSD = expectedPriceWei * 3000;
      
      console.log(`${dep.chain}:`);
      console.log(`   Current Price: $${priceUSD.toFixed(6)}`);
      console.log(`   Base Price: ${basePriceEth.toFixed(18)} ETH`);
      console.log(`   Slope: ${slopeEth.toFixed(18)} ETH/token`);
      console.log(`   Uses Global: ${useGlobalSupply ? '✅' : '❌'}`);
      console.log(`   Tracker Address: ${trackerAddress}`);
      console.log(`   Local Supply: ${localSupplyTokens.toFixed(2)} tokens`);
      console.log(`   Supply for Pricing: ${supplyForPricingTokens?.toFixed(2) || 'N/A'} tokens`);
      console.log(`   Global Supply (from tracker): ${globalSupplyTokens?.toFixed(2) || 'N/A'} tokens`);
      console.log(`   Expected Price (using supply ${supplyUsed.toFixed(2)}): $${expectedPriceUSD.toFixed(6)}`);
      console.log(`   Price Match: ${Math.abs(priceUSD - expectedPriceUSD) < 0.0001 ? '✅' : '❌'}`);
      console.log('');
      
    } catch (error) {
      console.error(`❌ Error checking ${dep.chain}:`, error.message);
    }
  }
}

debugPrices().catch(console.error);

