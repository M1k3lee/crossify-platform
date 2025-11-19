const { ethers } = require('ethers');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

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
  console.log('\n🔧 Fixing Global Supply on All Chains...\n');
  
  // Step 1: Query actual supplies from all bonding curves
  console.log('📊 Step 1: Querying actual supplies from bonding curves...\n');
  const actualSupplies = {};
  
  for (const dep of DEPLOYMENTS) {
    try {
      const provider = new ethers.JsonRpcProvider(dep.rpc);
      const curveContract = new ethers.Contract(dep.curve, BONDING_CURVE_ABI, provider);
      const actualSupply = await curveContract.totalSupplySold();
      actualSupplies[dep.chain] = actualSupply;
      console.log(`   ${dep.chain}: ${ethers.formatEther(actualSupply)} tokens`);
    } catch (error) {
      console.error(`   ❌ Error querying ${dep.chain}:`, error.message);
      return;
    }
  }
  
  // Step 2: Calculate correct global supply (sum of all chains)
  const totalGlobalSupply = Object.values(actualSupplies).reduce((sum, supply) => sum + supply, ethers.parseEther('0'));
  console.log(`\n📈 Step 2: Correct global supply = ${ethers.formatEther(totalGlobalSupply)} tokens\n`);
  
  // Step 3: For each chain, update the supply to trigger global supply recalculation
  console.log('🔄 Step 3: Updating each chain to fix global supply...\n');
  
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
      
      // Get current chain supply from tracker
      const currentChainSupply = await trackerContract.chainSupply(dep.token, dep.chainName);
      const currentGlobalSupply = await trackerContract.getGlobalSupply(dep.token);
      
      console.log(`   ${dep.chain}:`);
      console.log(`      Current chain supply: ${ethers.formatEther(currentChainSupply)}`);
      console.log(`      Current global supply: ${ethers.formatEther(currentGlobalSupply)}`);
      console.log(`      Actual supply: ${ethers.formatEther(actualSupplies[dep.chain])}`);
      
      // Update supply (this will trigger global supply recalculation)
      // We update with the actual supply, which should match what's in the bonding curve
      const trackerWithSigner = new ethers.Contract(dep.tracker, TRACKER_ABI, wallet);
      
      // Estimate gas first
      try {
        const gasEstimate = await trackerWithSigner.updateSupply.estimateGas(
          dep.token,
          dep.chainName,
          actualSupplies[dep.chain],
          { from: wallet.address }
        );
        console.log(`      Estimated gas: ${gasEstimate.toString()}`);
      } catch (estError) {
        console.log(`      ⚠️  Gas estimation failed: ${estError.message}`);
        // Continue anyway
      }
      
      // Send transaction
      console.log(`      📤 Sending update transaction...`);
      const tx = await trackerWithSigner.updateSupply(
        dep.token,
        dep.chainName,
        actualSupplies[dep.chain],
        {
          gasLimit: 500000,
        }
      );
      
      console.log(`      ⏳ Waiting for confirmation...`);
      await tx.wait();
      
      // Verify the update
      const newGlobalSupply = await trackerContract.getGlobalSupply(dep.token);
      const newChainSupply = await trackerContract.chainSupply(dep.token, dep.chainName);
      
      console.log(`      ✅ Transaction confirmed: ${tx.hash}`);
      console.log(`      New chain supply: ${ethers.formatEther(newChainSupply)}`);
      console.log(`      New global supply: ${ethers.formatEther(newGlobalSupply)}`);
      console.log(`      Expected global supply: ${ethers.formatEther(totalGlobalSupply)}`);
      
      const isCorrect = newGlobalSupply.toString() === totalGlobalSupply.toString();
      if (isCorrect) {
        console.log(`      🎉 Global supply is now correct!\n`);
      } else {
        console.log(`      ⚠️  Global supply mismatch (may need to update other chains first)\n`);
      }
      
      results.push({
        chain: dep.chain,
        success: true,
        txHash: tx.hash,
        newGlobalSupply: ethers.formatEther(newGlobalSupply),
        expectedGlobalSupply: ethers.formatEther(totalGlobalSupply),
        isCorrect,
      });
      
    } catch (error) {
      console.error(`   ❌ Error updating ${dep.chain}:`, error.message);
      results.push({ chain: dep.chain, success: false, message: error.message });
    }
  }
  
  // Step 4: Final verification
  console.log('\n📊 Step 4: Final Verification\n');
  console.log('='.repeat(80));
  
  for (const dep of DEPLOYMENTS) {
    try {
      const provider = new ethers.JsonRpcProvider(dep.rpc);
      const trackerContract = new ethers.Contract(dep.tracker, TRACKER_ABI, provider);
      
      const globalSupply = await trackerContract.getGlobalSupply(dep.token);
      const chainSupply = await trackerContract.chainSupply(dep.token, dep.chainName);
      
      const isCorrect = globalSupply.toString() === totalGlobalSupply.toString();
      console.log(`${isCorrect ? '✅' : '❌'} ${dep.chain}:`);
      console.log(`   Global Supply: ${ethers.formatEther(globalSupply)} (expected: ${ethers.formatEther(totalGlobalSupply)})`);
      console.log(`   Chain Supply: ${ethers.formatEther(chainSupply)}`);
    } catch (error) {
      console.error(`❌ Error verifying ${dep.chain}:`, error.message);
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('\n📈 Summary:');
  const successCount = results.filter(r => r.success).length;
  console.log(`   Updated: ${successCount}/${DEPLOYMENTS.length} chains`);
  
  const allCorrect = results.filter(r => r.success && r.isCorrect).length;
  if (allCorrect === DEPLOYMENTS.length) {
    console.log('   🎉 All global supplies are now correct!');
  } else {
    console.log('   ⚠️  Some global supplies may still need adjustment.');
    console.log('   Note: Global supply is calculated incrementally, so you may need to');
    console.log('   run this script multiple times or update chains in a specific order.');
  }
  
  console.log('\n');
}

fixGlobalSupply().catch(console.error);

