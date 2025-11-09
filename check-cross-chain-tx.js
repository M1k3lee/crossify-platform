// Script to check if cross-chain messages were sent for a transaction
const { ethers } = require('ethers');

const BSC_TESTNET_RPC = 'https://bsc-testnet.publicnode.com';
const TX_HASH = '0x89941d60dd2d0a64a75077762308a5a132c0f42c6adc61623beb8917edbfdba7';

async function checkTransaction() {
  console.log('🔍 Checking transaction for cross-chain messages...\n');
  
  const provider = new ethers.JsonRpcProvider(BSC_TESTNET_RPC);
  
  try {
    // Get transaction receipt
    const receipt = await provider.getTransactionReceipt(TX_HASH);
    
    if (!receipt) {
      console.log('❌ Transaction not found');
      return;
    }
    
    console.log(`✅ Transaction found:`);
    console.log(`   Block: ${receipt.blockNumber}`);
    console.log(`   Status: ${receipt.status === 1 ? 'Success' : 'Failed'}`);
    console.log(`   Gas Used: ${receipt.gasUsed.toString()}`);
    console.log(`   To: ${receipt.to}`);
    console.log(`\n📋 Logs (${receipt.logs.length}):`);
    
    // Check for LayerZero events or GlobalSupplyTracker events
    let foundGlobalSupplyUpdate = false;
    let foundLayerZeroMessage = false;
    let foundTokenBought = false;
    
    for (let i = 0; i < receipt.logs.length; i++) {
      const log = receipt.logs[i];
      console.log(`\n   Log ${i + 1}:`);
      console.log(`     Address: ${log.address}`);
      console.log(`     Topics: ${log.topics.length}`);
      
      // Check for TokenBought event (from BondingCurve)
      if (log.topics.length > 0) {
        // TokenBought event signature: TokenBought(address,uint256,uint256)
        const tokenBoughtSig = ethers.id('TokenBought(address,uint256,uint256)');
        if (log.topics[0] === tokenBoughtSig) {
          foundTokenBought = true;
          console.log(`     ✅ TokenBought event detected`);
          const decoded = ethers.AbiCoder.defaultAbiCoder().decode(
            ['address', 'uint256', 'uint256'],
            log.data
          );
          console.log(`        Buyer: ${decoded[0]}`);
          console.log(`        Amount Paid: ${ethers.formatEther(decoded[1])} BNB`);
          console.log(`        Tokens Received: ${ethers.formatEther(decoded[2])} tokens`);
        }
        
        // SupplyUpdated event signature: SupplyUpdated(address,string,uint256,uint256)
        // Note: string in event means we need to check the event signature hash
        const supplyUpdatedSig = ethers.id('SupplyUpdated(address,string,uint256,uint256)');
        if (log.topics[0] === supplyUpdatedSig) {
          foundGlobalSupplyUpdate = true;
          console.log(`     ✅ SupplyUpdated event detected (GlobalSupplyTracker)`);
          // Decode the indexed parameters (address is indexed, string is not)
          const tokenId = ethers.getAddress('0x' + log.topics[1].slice(-40));
          console.log(`        Token: ${tokenId}`);
        }
        
        // Check for LayerZero events
        // LayerZero v2 events might include: PacketSent, PacketReceived, etc.
        if (log.address.toLowerCase().includes('layerzero') || 
            log.topics.some(t => t.toLowerCase().includes('layerzero'))) {
          foundLayerZeroMessage = true;
          console.log(`     ✅ LayerZero event detected`);
        }
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`   TokenBought event: ${foundTokenBought ? '✅ Found' : '❌ Not found'}`);
    console.log(`   GlobalSupplyTracker update: ${foundGlobalSupplyUpdate ? '✅ Found' : '❌ Not found'}`);
    console.log(`   LayerZero message: ${foundLayerZeroMessage ? '✅ Sent' : '❌ Not found'}`);
    
    if (foundGlobalSupplyUpdate && !foundLayerZeroMessage) {
      console.log(`\n⚠️  WARNING: GlobalSupplyTracker was updated, but NO LayerZero message was sent!`);
      console.log(`   This means the supply was updated locally but NOT synced across chains.`);
      console.log(`   The GlobalSupplyTracker contract does NOT have LayerZero integration.`);
      console.log(`   To enable cross-chain sync, the GlobalSupplyTracker needs to call CrossChainSync.`);
    }
    
    if (!foundGlobalSupplyUpdate) {
      console.log(`\n⚠️  WARNING: GlobalSupplyTracker was NOT called!`);
      console.log(`   This could mean:`);
      console.log(`   1. useGlobalSupply is disabled for this token`);
      console.log(`   2. globalSupplyTracker address is not set`);
      console.log(`   3. The bonding curve is not authorized to update the tracker`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkTransaction();

