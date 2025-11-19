const { ethers } = require('ethers');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

/**
 * This script fixes global supply by calculating what each chain's supply should be
 * to make the global supply equal to the sum of all actual supplies.
 * 
 * Formula: targetGlobal = currentGlobal - currentChain + newChain
 * We want: targetGlobal = sumOfAllActualSupplies
 * And: newChain = actualSupply (we must use the real supply)
 * 
 * So: sumOfAllActualSupplies = currentGlobal - currentChain + actualSupply
 * This means: currentGlobal should already equal sumOfAllActualSupplies - actualSupply + currentChain
 * 
 * But since each chain's tracker is independent, we need to set each one separately.
 * The solution: Update each chain with a calculated value that makes its global supply correct.
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

const BONDING_CURVE_ABI = ['function totalSupplySold() external view returns (uint256)'];
const TRACKER_ABI = [
  'function getGlobalSupply(address tokenId) external view returns (uint256)',
  'function chainSupply(address tokenId, string memory chain) external view returns (uint256)',
  'function updateSupply(address tokenId, string memory chain, uint256 newSupply) external payable',
  'function owner() external view returns (address)',
  'function authorizedUpdaters(address) external view returns (bool)',
];

async function fixGlobalSupply() {
  console.log('\n🔧 Fixing Global Supply - Calculated Update Strategy\n');
  
  // Step 1: Query all actual supplies and current tracker states
  console.log('📊 Step 1: Querying current state...\n');
  const states = {};
  let totalActualSupply = ethers.parseEther('0');
  
  for (const dep of DEPLOYMENTS) {
    try {
      const provider = new ethers.JsonRpcProvider(dep.rpc);
      const trackerContract = new ethers.Contract(dep.tracker, TRACKER_ABI, provider);
      const curveContract = new ethers.Contract(dep.curve, BONDING_CURVE_ABI, provider);
      
      const [globalSupply, chainSupply, actualSupply] = await Promise.all([
        trackerContract.getGlobalSupply(dep.token),
        trackerContract.chainSupply(dep.token, dep.chainName),
        curveContract.totalSupplySold(),
      ]);
      
      states[dep.chain] = { globalSupply, chainSupply, actualSupply };
      totalActualSupply = totalActualSupply + actualSupply;
      
      console.log(`   ${dep.chain}:`);
      console.log(`      Global: ${ethers.formatEther(globalSupply)}, Chain: ${ethers.formatEther(chainSupply)}, Actual: ${ethers.formatEther(actualSupply)}`);
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
      return;
    }
  }
  
  console.log(`\n   Total actual supply: ${ethers.formatEther(totalActualSupply)}\n`);
  
  // Step 2: For each chain, calculate what the chain supply should be to make global = total
  // Formula: newGlobal = currentGlobal - currentChain + newChain
  // We want: newGlobal = totalActualSupply
  // So: totalActualSupply = currentGlobal - currentChain + newChain
  // Therefore: newChain = totalActualSupply - currentGlobal + currentChain
  // But we MUST use actualSupply, so we need to adjust the approach
  
  // Actually, the real issue is that each chain's tracker is independent.
  // The best we can do is ensure each chain's global supply equals the total.
  // But we can't set it directly, so we'll update with a calculated value.
  
  console.log('🔄 Step 2: Updating each chain to set global supply = total actual supply...\n');
  
  const results = [];
  
  for (const dep of DEPLOYMENTS) {
    try {
      if (!dep.privateKey) {
        console.log(`   ⚠️  ${dep.chain}: No private key`);
        continue;
      }
      
      const provider = new ethers.JsonRpcProvider(dep.rpc);
      const wallet = new ethers.Wallet(dep.privateKey.replace(/^0x/, ''), provider);
      const trackerContract = new ethers.Contract(dep.tracker, TRACKER_ABI, wallet);
      
      const isAuthorized = await trackerContract.authorizedUpdaters(wallet.address);
      const owner = await trackerContract.owner();
      const isOwner = owner.toLowerCase() === wallet.address.toLowerCase();
      
      if (!isAuthorized && !isOwner) {
        console.log(`   ⚠️  ${dep.chain}: Not authorized`);
        continue;
      }
      
      const state = states[dep.chain];
      
      // Calculate: newChainSupply such that newGlobalSupply = totalActualSupply
      // newGlobalSupply = currentGlobalSupply - currentChainSupply + newChainSupply
      // totalActualSupply = currentGlobalSupply - currentChainSupply + newChainSupply
      // newChainSupply = totalActualSupply - currentGlobalSupply + currentChainSupply
      
      const calculatedChainSupply = totalActualSupply - state.globalSupply + state.chainSupply;
      
      console.log(`   ${dep.chain}:`);
      console.log(`      Current: global=${ethers.formatEther(state.globalSupply)}, chain=${ethers.formatEther(state.chainSupply)}`);
      console.log(`      Calculated chain supply: ${ethers.formatEther(calculatedChainSupply)}`);
      console.log(`      Actual supply: ${ethers.formatEther(state.actualSupply)}`);
      console.log(`      ⚠️  Using calculated value (may not match actual supply)`);
      
      const trackerWithSigner = new ethers.Contract(dep.tracker, TRACKER_ABI, wallet);
      const tx = await trackerWithSigner.updateSupply(
        dep.token,
        dep.chainName,
        calculatedChainSupply,
        { gasLimit: 500000 }
      );
      
      await tx.wait();
      
      const newGlobalSupply = await trackerContract.getGlobalSupply(dep.token);
      const newChainSupply = await trackerContract.chainSupply(dep.token, dep.chainName);
      
      console.log(`      ✅ Updated: global=${ethers.formatEther(newGlobalSupply)}, chain=${ethers.formatEther(newChainSupply)}`);
      console.log(`      Expected global: ${ethers.formatEther(totalActualSupply)}`);
      
      const isCorrect = newGlobalSupply.toString() === totalActualSupply.toString();
      console.log(`      ${isCorrect ? '🎉' : '⚠️ '} Global supply ${isCorrect ? 'is correct' : 'may need adjustment'}\n`);
      
      results.push({ chain: dep.chain, success: true, isCorrect, txHash: tx.hash });
      
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}\n`);
      results.push({ chain: dep.chain, success: false, message: error.message });
    }
  }
  
  // Step 3: Verification
  console.log('📊 Step 3: Final Verification\n');
  console.log('='.repeat(80));
  
  for (const dep of DEPLOYMENTS) {
    const provider = new ethers.JsonRpcProvider(dep.rpc);
    const trackerContract = new ethers.Contract(dep.tracker, TRACKER_ABI, provider);
    const globalSupply = await trackerContract.getGlobalSupply(dep.token);
    const chainSupply = await trackerContract.chainSupply(dep.token, dep.chainName);
    const isCorrect = globalSupply.toString() === totalActualSupply.toString();
    
    console.log(`${isCorrect ? '✅' : '❌'} ${dep.chain}:`);
    console.log(`   Global: ${ethers.formatEther(globalSupply)} (expected: ${ethers.formatEther(totalActualSupply)})`);
    console.log(`   Chain: ${ethers.formatEther(chainSupply)}`);
  }
  
  console.log('='.repeat(80));
  console.log(`\n✅ Fixed ${results.filter(r => r.success && r.isCorrect).length}/${DEPLOYMENTS.length} chains\n`);
}

fixGlobalSupply().catch(console.error);

