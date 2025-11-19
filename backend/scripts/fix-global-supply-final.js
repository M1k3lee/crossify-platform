const { ethers } = require('ethers');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

/**
 * This script fixes the global supply issue by:
 * 1. Querying actual supplies from all bonding curves
 * 2. Calculating the correct global supply (sum of all)
 * 3. For each chain, updating the supply in a way that sets the global supply correctly
 * 
 * The trick: We first set each chain's supply to 0, then update with actual values.
 * This ensures: globalSupply = sum of all chain supplies
 */

const DEPLOYMENTS = [
  {
    chain: 'base-sepolia',
    curve: '0x1ec1419feFaf3D4eDF4f991570EEfB69CFd4BBD4',
    token: '0xa6E90B03A2aaF99543dbf1c64d22395d9b4359eb',
    tracker: '0x1eC9ee96EbD41111ad7b99f29D9a61e46b721C65',
    rpc: 'https://base-sepolia-rpc.publicnode.com',
    chainName: 'base-sepolia',
    privateKey: process.env.BASE_PRIVATE_KEY || process.env.ETHEREUM_PRIVATE_KEY || process.env.PRIVATE_KEY,
  },
  {
    chain: 'bsc-testnet',
    curve: '0x325f08033Ff255669f442A0c97322094FaA1203b',
    token: '0x1f2D4CA70F1274c8CcfB9d600191258C4f2Aec1c',
    tracker: '0xe84Ae64735261F441e0bcB12bCf60630c5239ef4',
    rpc: 'https://bsc-testnet.publicnode.com',
    chainName: 'bsc-testnet',
    privateKey: process.env.BSC_PRIVATE_KEY || process.env.ETHEREUM_PRIVATE_KEY || process.env.PRIVATE_KEY,
  },
  {
    chain: 'sepolia',
    curve: '0x9a6d626ccf74f8aBb31D02C94e4a349a607f11c1',
    token: '0x84c7959EEbCC0307Ca0A3Cf3d338C215A1bB24Cb',
    tracker: '0x130195A8D09dfd99c36D5903B94088EDBD66533e',
    rpc: 'https://ethereum-sepolia-rpc.publicnode.com',
    chainName: 'sepolia',
    privateKey: process.env.ETHEREUM_PRIVATE_KEY || process.env.PRIVATE_KEY,
  },
];

const BONDING_CURVE_ABI = [
  'function totalSupplySold() external view returns (uint256)',
];

const TRACKER_ABI = [
  'function getGlobalSupply(address tokenId) external view returns (uint256)',
  'function chainSupply(address tokenId, string memory chain) external view returns (uint256)',
  'function updateSupply(address tokenId, string memory chain, uint256 newSupply) external payable',
  'function owner() external view returns (address)',
  'function authorizedUpdaters(address) external view returns (bool)',
];

async function fixGlobalSupply() {
  console.log('\n🔧 Fixing Global Supply - Reset and Rebuild Strategy\n');
  
  // Step 1: Query actual supplies
  console.log('📊 Step 1: Querying actual supplies from bonding curves...\n');
  const actualSupplies = {};
  let totalActualSupply = ethers.parseEther('0');
  
  for (const dep of DEPLOYMENTS) {
    try {
      const provider = new ethers.JsonRpcProvider(dep.rpc);
      const curveContract = new ethers.Contract(dep.curve, BONDING_CURVE_ABI, provider);
      const actualSupply = await curveContract.totalSupplySold();
      actualSupplies[dep.chain] = actualSupply;
      totalActualSupply = totalActualSupply + actualSupply;
      console.log(`   ${dep.chain}: ${ethers.formatEther(actualSupply)} tokens`);
    } catch (error) {
      console.error(`   ❌ Error querying ${dep.chain}:`, error.message);
      return;
    }
  }
  
  console.log(`\n   Total actual supply: ${ethers.formatEther(totalActualSupply)} tokens\n`);
  
  // Step 2: For each chain, reset chain supply to 0, then set to actual
  // This ensures: globalSupply = sum of all chain supplies
  console.log('🔄 Step 2: Resetting and rebuilding global supply on each chain...\n');
  
  const results = [];
  
  for (const dep of DEPLOYMENTS) {
    try {
      if (!dep.privateKey) {
        console.log(`   ⚠️  ${dep.chain}: No private key, skipping`);
        results.push({ chain: dep.chain, success: false, message: 'No private key' });
        continue;
      }
      
      const provider = new ethers.JsonRpcProvider(dep.rpc);
      const wallet = new ethers.Wallet(dep.privateKey.replace(/^0x/, ''), provider);
      const trackerContract = new ethers.Contract(dep.tracker, TRACKER_ABI, wallet);
      
      // Check authorization
      const isAuthorized = await trackerContract.authorizedUpdaters(wallet.address);
      const owner = await trackerContract.owner();
      const isOwner = owner.toLowerCase() === wallet.address.toLowerCase();
      
      if (!isAuthorized && !isOwner) {
        console.log(`   ⚠️  ${dep.chain}: Wallet not authorized (owner: ${owner})`);
        results.push({ chain: dep.chain, success: false, message: 'Not authorized' });
        continue;
      }
      
      const trackerWithSigner = new ethers.Contract(dep.tracker, TRACKER_ABI, wallet);
      
      // Get current state
      const currentGlobalSupply = await trackerContract.getGlobalSupply(dep.token);
      const currentChainSupply = await trackerContract.chainSupply(dep.token, dep.chainName);
      
      console.log(`   ${dep.chain}:`);
      console.log(`      Current: global=${ethers.formatEther(currentGlobalSupply)}, chain=${ethers.formatEther(currentChainSupply)}`);
      
      // Step 2a: Reset chain supply to 0 (this will subtract currentChainSupply from globalSupply)
      console.log(`      Step 2a: Resetting chain supply to 0...`);
      const resetTx = await trackerWithSigner.updateSupply(
        dep.token,
        dep.chainName,
        ethers.parseEther('0'),
        { gasLimit: 500000 }
      );
      await resetTx.wait();
      
      const afterResetGlobal = await trackerContract.getGlobalSupply(dep.token);
      const afterResetChain = await trackerContract.chainSupply(dep.token, dep.chainName);
      console.log(`      After reset: global=${ethers.formatEther(afterResetGlobal)}, chain=${ethers.formatEther(afterResetChain)}`);
      
      // Step 2b: Set chain supply to actual supply (this will add actualSupply to globalSupply)
      console.log(`      Step 2b: Setting chain supply to actual (${ethers.formatEther(actualSupplies[dep.chain])})...`);
      const updateTx = await trackerWithSigner.updateSupply(
        dep.token,
        dep.chainName,
        actualSupplies[dep.chain],
        { gasLimit: 500000 }
      );
      await updateTx.wait();
      
      const finalGlobalSupply = await trackerContract.getGlobalSupply(dep.token);
      const finalChainSupply = await trackerContract.chainSupply(dep.token, dep.chainName);
      
      console.log(`      ✅ Final: global=${ethers.formatEther(finalGlobalSupply)}, chain=${ethers.formatEther(finalChainSupply)}`);
      console.log(`      Expected global: ${ethers.formatEther(totalActualSupply)}`);
      
      const isCorrect = finalGlobalSupply.toString() === totalActualSupply.toString();
      if (isCorrect) {
        console.log(`      🎉 Global supply is correct!\n`);
      } else {
        console.log(`      ⚠️  Global supply mismatch (this is expected - each chain's tracker is independent)\n`);
      }
      
      results.push({
        chain: dep.chain,
        success: true,
        resetTx: resetTx.hash,
        updateTx: updateTx.hash,
        finalGlobalSupply: ethers.formatEther(finalGlobalSupply),
        expectedGlobalSupply: ethers.formatEther(totalActualSupply),
        isCorrect,
      });
      
    } catch (error) {
      console.error(`   ❌ Error updating ${dep.chain}:`, error.message);
      results.push({ chain: dep.chain, success: false, message: error.message });
    }
  }
  
  // Step 3: Final verification
  console.log('\n📊 Step 3: Final Verification\n');
  console.log('='.repeat(80));
  
  for (const dep of DEPLOYMENTS) {
    try {
      const provider = new ethers.JsonRpcProvider(dep.rpc);
      const trackerContract = new ethers.Contract(dep.tracker, TRACKER_ABI, provider);
      
      const globalSupply = await trackerContract.getGlobalSupply(dep.token);
      const chainSupply = await trackerContract.chainSupply(dep.token, dep.chainName);
      
      const isCorrect = globalSupply.toString() === totalActualSupply.toString();
      console.log(`${isCorrect ? '✅' : '❌'} ${dep.chain}:`);
      console.log(`   Global Supply: ${ethers.formatEther(globalSupply)} (expected: ${ethers.formatEther(totalActualSupply)})`);
      console.log(`   Chain Supply: ${ethers.formatEther(chainSupply)}`);
    } catch (error) {
      console.error(`❌ Error verifying ${dep.chain}:`, error.message);
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('\n📈 Summary:');
  const successCount = results.filter(r => r.success).length;
  const correctCount = results.filter(r => r.success && r.isCorrect).length;
  console.log(`   Updated: ${successCount}/${DEPLOYMENTS.length} chains`);
  console.log(`   Correct global supply: ${correctCount}/${DEPLOYMENTS.length} chains`);
  
  if (correctCount === DEPLOYMENTS.length) {
    console.log('\n   🎉 All global supplies are now correct!');
    console.log('   Prices should now be synchronized across all chains.');
  } else {
    console.log('\n   ⚠️  Note: Each chain\'s GlobalSupplyTracker is independent.');
    console.log('   They maintain separate global supply values.');
    console.log('   For true cross-chain sync, cross-chain messaging must be enabled.');
  }
  
  console.log('\n');
}

fixGlobalSupply().catch(console.error);

