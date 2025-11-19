import { ethers } from 'hardhat';

/**
 * Authorize the backend wallet as an updater in GlobalSupplyTracker contracts
 * This allows the backend to call updateSupply() directly
 */

const BACKEND_WALLET = '0x30314630fEb44E1b1DF77397906240Ff5c40F6D2';

const CHAINS = [
  {
    name: 'Sepolia',
    network: 'sepolia',
    trackerAddress: process.env.GLOBAL_SUPPLY_TRACKER_V2_SEPOLIA || process.env.GLOBAL_SUPPLY_TRACKER_SEPOLIA || '',
    privateKey: process.env.ETHEREUM_PRIVATE_KEY || process.env.PRIVATE_KEY || '',
  },
  {
    name: 'Base Sepolia',
    network: 'baseSepolia',
    trackerAddress: process.env.GLOBAL_SUPPLY_TRACKER_V2_BASE_SEPOLIA || process.env.GLOBAL_SUPPLY_TRACKER_BASE_SEPOLIA || '',
    privateKey: process.env.BASE_PRIVATE_KEY || process.env.PRIVATE_KEY || '',
  },
  {
    name: 'BSC Testnet',
    network: 'bscTestnet',
    trackerAddress: process.env.GLOBAL_SUPPLY_TRACKER_V2_BSC_TESTNET || process.env.GLOBAL_SUPPLY_TRACKER_BSC_TESTNET || '',
    privateKey: process.env.BSC_PRIVATE_KEY || process.env.PRIVATE_KEY || '',
  },
];

const TRACKER_ABI = [
  'function owner() external view returns (address)',
  'function authorizedUpdaters(address) external view returns (bool)',
  'function authorizeUpdater(address) external',
];

async function authorizeWallet(chain: typeof CHAINS[0]) {
  if (!chain.trackerAddress) {
    console.log(`⚠️  ${chain.name}: No tracker address configured`);
    return { success: false, message: 'No tracker address' };
  }

  if (!chain.privateKey) {
    console.log(`⚠️  ${chain.name}: No private key configured`);
    return { success: false, message: 'No private key' };
  }

  try {
    const provider = new ethers.JsonRpcProvider(
      chain.network === 'sepolia' ? process.env.ETHEREUM_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com' :
      chain.network === 'baseSepolia' ? process.env.BASE_RPC_URL || 'https://base-sepolia-rpc.publicnode.com' :
      process.env.BSC_RPC_URL || 'https://bsc-testnet.publicnode.com'
    );

    const wallet = new ethers.Wallet(chain.privateKey.replace(/^0x/, ''), provider);
    const tracker = new ethers.Contract(chain.trackerAddress, TRACKER_ABI, wallet);

    console.log(`\n${'='.repeat(60)}`);
    console.log(`${chain.name}`);
    console.log(`${'='.repeat(60)}`);
    console.log(`Tracker: ${chain.trackerAddress}`);
    console.log(`Backend Wallet: ${BACKEND_WALLET}`);
    console.log(`Owner Wallet: ${wallet.address}`);

    // Check if wallet is owner
    const owner = await tracker.owner();
    console.log(`Tracker Owner: ${owner}`);

    if (owner.toLowerCase() !== wallet.address.toLowerCase()) {
      console.error(`❌ Wallet ${wallet.address} is not the owner!`);
      console.error(`   Owner: ${owner}`);
      return { success: false, message: 'Wallet is not owner' };
    }

    // Check if already authorized
    const isAuthorized = await tracker.authorizedUpdaters(BACKEND_WALLET);
    if (isAuthorized) {
      console.log(`✅ Backend wallet already authorized`);
      return { success: true, message: 'Already authorized' };
    }

    // Authorize
    console.log(`📝 Authorizing backend wallet...`);
    const tx = await tracker.authorizeUpdater(BACKEND_WALLET, {
      gasLimit: 200000,
    });
    console.log(`   Transaction: ${tx.hash}`);
    console.log(`   Waiting for confirmation...`);
    const receipt = await tx.wait();
    console.log(`✅ Backend wallet authorized successfully!`);
    console.log(`   Block: ${receipt.blockNumber}`);

    // Verify
    const verified = await tracker.authorizedUpdaters(BACKEND_WALLET);
    if (verified) {
      console.log(`✅ Verification: Backend wallet is now authorized`);
    } else {
      console.error(`❌ Verification failed: Backend wallet is NOT authorized`);
    }

    return { success: true, message: 'Authorized', txHash: tx.hash };
  } catch (error: any) {
    console.error(`❌ Error authorizing ${chain.name}:`, error.message);
    return { success: false, message: error.message };
  }
}

async function main() {
  console.log('\n🔧 Authorizing Backend Wallet in GlobalSupplyTracker Contracts\n');
  console.log(`Backend Wallet: ${BACKEND_WALLET}\n`);

  const results = [];
  for (const chain of CHAINS) {
    const result = await authorizeWallet(chain);
    results.push({ chain: chain.name, ...result });
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 Summary');
  console.log(`${'='.repeat(60)}`);
  results.forEach(r => {
    console.log(`${r.success ? '✅' : '❌'} ${r.chain}: ${r.message}`);
  });

  const successCount = results.filter(r => r.success).length;
  console.log(`\n✅ Authorized: ${successCount}/${results.length} chains`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

