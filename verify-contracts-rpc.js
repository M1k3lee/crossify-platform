// Simple RPC-based verification script (no Hardhat needed)
// Usage: node verify-contracts-rpc.js

const { ethers } = require('ethers');

// Known contract addresses from deployment
const CONTRACTS = {
  'base-sepolia': {
    rpc: 'https://base-sepolia-rpc.publicnode.com',
    globalSupplyTracker: '0xA4c5bFA9099347Bc405B72dd1955b75dCa263573',
    tokenFactory: '0x314DFf75620f1CFB09B5aD88892Dded0A13A6c58',
  },
  'bsc-testnet': {
    rpc: 'https://bsc-testnet.publicnode.com',
    globalSupplyTracker: '0x15Bc893fa73694106D1720f4f0c8C3EE3259a15e',
    tokenFactory: '0x39fB28323572610eC0Df1EF075f4acDD51f77e2E',
  },
  'sepolia': {
    rpc: 'https://ethereum-sepolia-rpc.publicnode.com',
    globalSupplyTracker: '0xA4c5bFA9099347Bc405B72dd1955b75dCa263573',
    tokenFactory: '0x39fB28323572610eC0Df1EF075f4acDD51f77e2E',
  },
};

// Minimal ABI to check for cross-chain functions
const GLOBAL_SUPPLY_TRACKER_ABI = [
  'function crossChainSync() external view returns (address)',
  'function crossChainEnabled() external view returns (bool)',
  'function currentChainEID() external view returns (uint32)',
  'function owner() external view returns (address)',
];

async function checkContract(chainName, contractAddress, rpcUrl) {
  console.log(`\n🔍 Checking ${chainName}...`);
  console.log(`   RPC: ${rpcUrl}`);
  console.log(`   Address: ${contractAddress}\n`);

  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    
    // Check if contract exists
    const code = await provider.getCode(contractAddress);
    if (!code || code === '0x' || code === '0x0') {
      console.log('   ❌ Contract not found at this address');
      return false;
    }
    console.log('   ✅ Contract exists');

    // Try to call cross-chain functions
    const contract = new ethers.Contract(contractAddress, GLOBAL_SUPPLY_TRACKER_ABI, provider);

    try {
      const crossChainSync = await contract.crossChainSync();
      console.log(`   ✅ crossChainSync() exists: ${crossChainSync}`);
    } catch {
      console.log('   ❌ crossChainSync() function NOT found');
      console.log('   ⚠️  Contract needs to be redeployed with new version');
      return false;
    }

    try {
      const enabled = await contract.crossChainEnabled();
      console.log(`   ✅ crossChainEnabled() exists: ${enabled}`);
    } catch {
      console.log('   ❌ crossChainEnabled() function NOT found');
      return false;
    }

    try {
      const eid = await contract.currentChainEID();
      console.log(`   ✅ currentChainEID() exists: ${eid}`);
    } catch {
      console.log('   ⚠️  currentChainEID() not found (may use chain name mapping)');
    }

    return true;
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🔍 Verifying Existing GlobalSupplyTracker Contracts\n');
  console.log('=' .repeat(60));

  const results = {};

  for (const [chainName, config] of Object.entries(CONTRACTS)) {
    const hasNewFunctions = await checkContract(
      chainName,
      config.globalSupplyTracker,
      config.rpc
    );
    results[chainName] = hasNewFunctions;
  }

  console.log('\n' + '=' .repeat(60));
  console.log('📊 SUMMARY');
  console.log('=' .repeat(60) + '\n');

  for (const [chainName, hasNewFunctions] of Object.entries(results)) {
    if (hasNewFunctions) {
      console.log(`✅ ${chainName}: Contract is compatible (has cross-chain functions)`);
    } else {
      console.log(`⚠️  ${chainName}: Contract needs redeployment (missing cross-chain functions)`);
    }
  }

  console.log('\n📝 Next Steps:');
  const needsRedeploy = Object.values(results).some(r => !r);
  if (needsRedeploy) {
    console.log('   1. Redeploy GlobalSupplyTracker on chains that need it');
    console.log('   2. Deploy CrossChainSync on all chains');
    console.log('   3. Configure contracts');
  } else {
    console.log('   1. Deploy CrossChainSync on all chains');
    console.log('   2. Configure existing GlobalSupplyTracker contracts');
    console.log('   3. Set trusted remotes');
  }
  console.log('');
}

main().catch(console.error);

