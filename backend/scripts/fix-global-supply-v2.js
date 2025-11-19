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
  console.log('\n🔧 Fixing Global Supply on All Chains (V2 - Smart Update)\n');
  
  // Step 1: Query current state from all trackers
  console.log('📊 Step 1: Querying current state from all trackers...\n');
  const currentStates = {};
  
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
      
      currentStates[dep.chain] = {
        globalSupply,
        chainSupply,
        actualSupply,
      };
      
      console.log(`   ${dep.chain}:`);
      console.log(`      Global Supply: ${ethers.formatEther(globalSupply)}`);
      console.log(`      Chain Supply: ${ethers.formatEther(chainSupply)}`);
      console.log(`      Actual Supply: ${ethers.formatEther(actualSupply)}`);
    } catch (error) {
      console.error(`   ❌ Error querying ${dep.chain}:`, error.message);
      return;
    }
  }
  
  // Step 2: Calculate correct global supply (sum of all actual supplies)
  const totalGlobalSupply = Object.values(currentStates).reduce(
    (sum, state) => sum + state.actualSupply,
    ethers.parseEther('0')
  );
  console.log(`\n📈 Step 2: Correct global supply = ${ethers.formatEther(totalGlobalSupply)} tokens\n`);
  
  // Step 3: For each chain, calculate what the chain supply should be to make global supply correct
  // Formula: targetGlobal = currentGlobal - currentChain + newChain
  // So: newChain = targetGlobal - currentGlobal + currentChain
  // But we want to use the actual supply, so we need to adjust the approach
  
  console.log('🔄 Step 3: Updating each chain to fix global supply...\n');
  
  // Strategy: Update chains in order, using actual supply but calculating the expected global supply
  // After all updates, the global supply should equal the sum of all actual supplies
  
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
      
      const state = currentStates[dep.chain];
      
      // Calculate what the new global supply should be after this update
      // We want: newGlobalSupply = sum of all actual supplies
      // Formula: newGlobalSupply = currentGlobalSupply - currentChainSupply + actualSupply
      // But we want newGlobalSupply = totalGlobalSupply
      // So we need: totalGlobalSupply = currentGlobalSupply - currentChainSupply + newChainSupply
      // Therefore: newChainSupply = totalGlobalSupply - currentGlobalSupply + currentChainSupply
      
      // However, we MUST use the actual supply from the bonding curve
      // So we'll update with actual supply, and the global supply will be:
      // newGlobalSupply = currentGlobalSupply - currentChainSupply + actualSupply
      
      // The issue is that each chain's tracker is independent, so we can't directly set
      // the global supply to the total. Instead, we need to ensure each chain's tracker
      // has the correct global supply.
      
      // Actually, the real solution is simpler: Update each chain with its actual supply.
      // The global supply on each chain will be recalculated, but since each chain's tracker
      // is independent, they won't match. This is a contract design issue.
      
      // For now, let's update with actual supply and see what happens
      const trackerWithSigner = new ethers.Contract(dep.tracker, TRACKER_ABI, wallet);
      
      console.log(`   ${dep.chain}:`);
      console.log(`      Updating chain supply: ${ethers.formatEther(state.chainSupply)} → ${ethers.formatEther(state.actualSupply)}`);
      
      // Send transaction
      const tx = await trackerWithSigner.updateSupply(
        dep.token,
        dep.chainName,
        state.actualSupply,
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
      
      results.push({
        chain: dep.chain,
        success: true,
        txHash: tx.hash,
        newGlobalSupply: ethers.formatEther(newGlobalSupply),
        expectedGlobalSupply: ethers.formatEther(totalGlobalSupply),
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
      
      console.log(`${dep.chain}:`);
      console.log(`   Global Supply: ${ethers.formatEther(globalSupply)} (expected: ${ethers.formatEther(totalGlobalSupply)})`);
      console.log(`   Chain Supply: ${ethers.formatEther(chainSupply)}`);
    } catch (error) {
      console.error(`❌ Error verifying ${dep.chain}:`, error.message);
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('\n⚠️  IMPORTANT NOTE:');
  console.log('   Each chain\'s GlobalSupplyTracker maintains its own global supply value.');
  console.log('   These values are independent and won\'t match unless cross-chain sync is working.');
  console.log('   The contract design assumes cross-chain messages will keep them in sync.');
  console.log('   Since cross-chain sync may not be active, each tracker only knows about its own chain.');
  console.log('\n   To truly fix this, we need to either:');
  console.log('   1. Enable and fix cross-chain sync, OR');
  console.log('   2. Modify the contract to allow setting global supply directly');
  console.log('\n');
}

fixGlobalSupply().catch(console.error);

