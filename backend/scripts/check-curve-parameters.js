const { ethers } = require('ethers');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const TOKEN_ID = process.argv[2];
const API_BASE = process.env.API_BASE_URL || 'https://crossify-platform-production.up.railway.app/api';

const RPC_URLS = {
  'base-sepolia': 'https://base-sepolia-rpc.publicnode.com',
  'bsc-testnet': 'https://bsc-testnet-rpc.publicnode.com',
  'sepolia': 'https://ethereum-sepolia-rpc.publicnode.com',
  'hedera-testnet': 'https://testnet.hashio.io/api',
};

const BONDING_CURVE_ABI = [
  'function basePrice() external view returns (uint256)',
  'function slope() external view returns (uint256)',
  'function getCurrentPrice() external view returns (uint256)',
  'function totalSupplySold() external view returns (uint256)',
  'function useGlobalSupply() external view returns (bool)',
  'function globalSupplyTracker() external view returns (address)',
];

async function checkParameters() {
  console.log('\n🔍 Checking Bonding Curve Parameters\n');
  console.log(`Token ID: ${TOKEN_ID}\n`);
  
  try {
    const axios = require('axios');
    const deploymentsRes = await axios.get(`${API_BASE}/tokens/${TOKEN_ID}`);
    
    let deployments = deploymentsRes.data.deployments || deploymentsRes.data.token?.deployments || [];
    
    if (deployments.length === 0) {
      try {
        const statusRes = await axios.get(`${API_BASE}/tokens/${TOKEN_ID}/status`);
        deployments = statusRes.data.deployments || [];
      } catch (e) {
        console.warn('Status endpoint failed:', e.message);
      }
    }
    
    console.log(`Found ${deployments.length} deployments\n`);
    
    const results = [];
    
    for (const dep of deployments) {
      const curveAddress = dep.curve_address || dep.curveAddress;
      if (!curveAddress || dep.chain.toLowerCase().includes('solana')) {
        continue;
      }
      
      const chain = dep.chain.toLowerCase();
      const rpcUrl = RPC_URLS[chain];
      
      if (!rpcUrl) {
        console.log(`⚠️  Skipping ${chain}: No RPC URL`);
        continue;
      }
      
      console.log(`\n📊 ${chain.toUpperCase()}`);
      console.log(`   Curve: ${curveAddress}`);
      
      try {
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const curveContract = new ethers.Contract(curveAddress, BONDING_CURVE_ABI, provider);
        
        const [basePriceWei, slopeWei, currentPriceWei, supplyWei, useGlobalSupply, trackerAddress] = await Promise.all([
          curveContract.basePrice().catch(() => null),
          curveContract.slope().catch(() => null),
          curveContract.getCurrentPrice().catch(() => null),
          curveContract.totalSupplySold().catch(() => null),
          curveContract.useGlobalSupply().catch(() => false),
          curveContract.globalSupplyTracker().catch(() => ethers.ZeroAddress),
        ]);
        
        const basePrice = basePriceWei ? parseFloat(ethers.formatEther(basePriceWei)) : null;
        const slope = slopeWei ? parseFloat(ethers.formatEther(slopeWei)) : null;
        const currentPrice = currentPriceWei ? parseFloat(ethers.formatEther(currentPriceWei)) : null;
        const supply = supplyWei ? parseFloat(ethers.formatEther(supplyWei)) : null;
        const currentPriceUSD = currentPrice ? currentPrice * 3000 : null;
        
        console.log(`   Base Price: ${basePrice ? `${basePrice.toFixed(8)} ETH ($${(basePrice * 3000).toFixed(6)})` : 'N/A'}`);
        console.log(`   Slope: ${slope ? `${slope.toFixed(12)} ETH per token` : 'N/A'}`);
        console.log(`   Current Price: ${currentPrice ? `${currentPrice.toFixed(8)} ETH ($${currentPriceUSD.toFixed(6)})` : 'N/A'}`);
        console.log(`   Supply: ${supply ? `${supply.toFixed(2)} tokens` : 'N/A'}`);
        console.log(`   Use Global Supply: ${useGlobalSupply ? '✅ YES' : '❌ NO'}`);
        console.log(`   Tracker: ${trackerAddress === ethers.ZeroAddress ? '❌ Not set' : trackerAddress}`);
        
        results.push({
          chain,
          basePrice,
          slope,
          currentPrice,
          currentPriceUSD,
          supply,
          useGlobalSupply,
          trackerAddress: trackerAddress === ethers.ZeroAddress ? null : trackerAddress,
        });
        
      } catch (error) {
        console.error(`   ❌ Error: ${error.message}`);
        results.push({ chain, error: error.message });
      }
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 SUMMARY');
    console.log('='.repeat(80));
    
    // Check if basePrice and slope are the same across chains
    const validResults = results.filter(r => r.basePrice !== null && r.slope !== null);
    if (validResults.length > 1) {
      const basePrices = validResults.map(r => r.basePrice);
      const slopes = validResults.map(r => r.slope);
      
      const basePriceSame = basePrices.every(p => Math.abs(p - basePrices[0]) < 0.00000001);
      const slopeSame = slopes.every(s => Math.abs(s - slopes[0]) < 0.00000001);
      
      console.log(`\n🔍 Parameter Consistency:`);
      console.log(`   Base Price: ${basePriceSame ? '✅ SAME' : '❌ DIFFERENT'}`);
      if (!basePriceSame) {
        console.log(`   Values: ${basePrices.map(p => p.toFixed(8)).join(', ')}`);
      }
      console.log(`   Slope: ${slopeSame ? '✅ SAME' : '❌ DIFFERENT'}`);
      if (!slopeSame) {
        console.log(`   Values: ${slopes.map(s => s.toFixed(12)).join(', ')}`);
      }
      
      if (!basePriceSame || !slopeSame) {
        console.log(`\n⚠️  WARNING: Bonding curves have different parameters!`);
        console.log(`   Prices cannot sync properly if basePrice and slope are different.`);
        console.log(`   Solution: Redeploy tokens with consistent parameters.`);
      }
    }
    
    // Check price variance
    const prices = validResults.map(r => r.currentPriceUSD).filter(p => p !== null);
    if (prices.length > 1) {
      const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
      const variance = Math.sqrt(prices.reduce((sum, p) => sum + Math.pow(p - avgPrice, 2), 0) / prices.length) / avgPrice * 100;
      
      console.log(`\n💰 Price Variance: ${variance.toFixed(2)}%`);
      console.log(`   Average Price: $${avgPrice.toFixed(6)}`);
      validResults.forEach(r => {
        if (r.currentPriceUSD) {
          const deviation = ((r.currentPriceUSD - avgPrice) / avgPrice) * 100;
          console.log(`   ${r.chain}: $${r.currentPriceUSD.toFixed(6)} (${deviation > 0 ? '+' : ''}${deviation.toFixed(2)}%)`);
        }
      });
    }
    
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

if (!TOKEN_ID) {
  console.error('Usage: node check-curve-parameters.js <token-id>');
  process.exit(1);
}

checkParameters();




