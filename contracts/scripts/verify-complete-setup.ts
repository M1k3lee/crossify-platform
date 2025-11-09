import { ethers } from "hardhat";
import hre from "hardhat";

/**
 * Comprehensive verification script to check if everything is set up correctly
 */

const CONTRACT_ADDRESSES: Record<string, {
  globalSupplyTracker: string;
  crossChainSync: string;
  tokenFactory?: string;
  chainEID: number;
}> = {
  baseSepolia: {
    globalSupplyTracker: "0x1eC9ee96EbD41111ad7b99f29D9a61e46b721C65",
    crossChainSync: "0x39fB28323572610eC0Df1EF075f4acDD51f77e2E",
    chainEID: 40245,
  },
  bscTestnet: {
    globalSupplyTracker: "0xe84Ae64735261F441e0bcB12bCf60630c5239ef4",
    crossChainSync: "0xf5446E2690B2eb161231fB647476A98e1b6b7736",
    chainEID: 40102,
  },
  sepolia: {
    globalSupplyTracker: "0x130195A8D09dfd99c36D5903B94088EDBD66533e",
    crossChainSync: "0x1eC9ee96EbD41111ad7b99f29D9a61e46b721C65",
    chainEID: 40161,
  },
};

async function main() {
  const network = hre.network.name;
  console.log(`\n🔍 Verifying complete cross-chain setup on ${network}...\n`);

  const addresses = CONTRACT_ADDRESSES[network];
  if (!addresses) {
    console.error(`❌ Unknown network: ${network}`);
    process.exit(1);
  }

  const provider = ethers.provider;

  // 1. Check contract balances
  console.log("1️⃣ Checking contract balances...");
  const trackerBalance = await provider.getBalance(addresses.globalSupplyTracker);
  const syncBalance = await provider.getBalance(addresses.crossChainSync);
  console.log(`   GlobalSupplyTracker: ${ethers.formatEther(trackerBalance)} ${network === 'bscTestnet' ? 'BNB' : 'ETH'}`);
  console.log(`   CrossChainSync: ${ethers.formatEther(syncBalance)} ${network === 'bscTestnet' ? 'BNB' : 'ETH'}`);
  
  if (trackerBalance < ethers.parseEther("0.01")) {
    console.log(`   ⚠️  GlobalSupplyTracker balance is low (recommended: ~0.05)`);
  } else {
    console.log(`   ✅ GlobalSupplyTracker has sufficient funds`);
  }
  
  if (syncBalance < ethers.parseEther("0.01")) {
    console.log(`   ⚠️  CrossChainSync balance is low (recommended: ~0.1)`);
  } else {
    console.log(`   ✅ CrossChainSync has sufficient funds`);
  }

  // 2. Check GlobalSupplyTracker configuration
  console.log("\n2️⃣ Checking GlobalSupplyTracker configuration...");
  const trackerABI = [
    "function crossChainSync() view returns (address)",
    "function crossChainEnabled() view returns (bool)",
    "function currentChainEID() view returns (uint32)",
    "function getChainEID(string) view returns (uint32)",
  ];
  const tracker = new ethers.Contract(addresses.globalSupplyTracker, trackerABI, provider);
  
  try {
    const crossChainSyncAddress = await tracker.crossChainSync();
    const crossChainEnabled = await tracker.crossChainEnabled();
    const currentChainEID = await tracker.currentChainEID();
    
    console.log(`   CrossChainSync address: ${crossChainSyncAddress}`);
    console.log(`   Cross-chain enabled: ${crossChainEnabled}`);
    console.log(`   Current chain EID: ${currentChainEID}`);
    
    if (crossChainSyncAddress.toLowerCase() === addresses.crossChainSync.toLowerCase()) {
      console.log(`   ✅ CrossChainSync address is correct`);
    } else {
      console.log(`   ❌ CrossChainSync address mismatch!`);
    }
    
    if (crossChainEnabled) {
      console.log(`   ✅ Cross-chain messaging is enabled`);
    } else {
      console.log(`   ⚠️  Cross-chain messaging is disabled`);
    }
    
    if (currentChainEID === addresses.chainEID) {
      console.log(`   ✅ Chain EID is correct (${currentChainEID})`);
    } else if (currentChainEID > 0) {
      console.log(`   ⚠️  Chain EID mismatch (expected ${addresses.chainEID}, got ${currentChainEID})`);
    } else {
      console.log(`   ⚠️  Chain EID not set (expected ${addresses.chainEID})`);
    }
    
    // Check chain EID mappings
    const baseSepoliaEID = await tracker.getChainEID("base-sepolia");
    const bscTestnetEID = await tracker.getChainEID("bsc-testnet");
    const sepoliaEID = await tracker.getChainEID("sepolia");
    
    console.log(`   Chain EID mappings:`);
    console.log(`     base-sepolia: ${baseSepoliaEID}`);
    console.log(`     bsc-testnet: ${bscTestnetEID}`);
    console.log(`     sepolia: ${sepoliaEID}`);
  } catch (error: any) {
    console.log(`   ❌ Error checking GlobalSupplyTracker: ${error.message}`);
  }

  // 3. Check CrossChainSync trusted remotes
  console.log("\n3️⃣ Checking CrossChainSync trusted remotes...");
  const syncABI = [
    "function trustedRemotes(uint32) view returns (bytes)",
  ];
  const sync = new ethers.Contract(addresses.crossChainSync, syncABI, provider);
  
  const remoteChains: Array<{name: string, eid: number, key: keyof typeof CONTRACT_ADDRESSES}> = [
    {name: "Base Sepolia", eid: 40245, key: "baseSepolia"},
    {name: "BSC Testnet", eid: 40102, key: "bscTestnet"},
    {name: "Sepolia", eid: 40161, key: "sepolia"},
  ];
  
  for (const {name: chainName, eid, key} of remoteChains) {
    if (eid === addresses.chainEID) continue; // Skip current chain
    
    try {
      const remoteBytes = await sync.trustedRemotes(eid);
      if (remoteBytes.length > 0) {
        // Decode the address from bytes (skip first 12 bytes for padding, last 20 bytes are address)
        const peerAddress = ethers.getAddress(ethers.dataSlice(remoteBytes, 12));
        const expectedAddress = CONTRACT_ADDRESSES[key]?.crossChainSync;
        
        if (expectedAddress && peerAddress.toLowerCase() === expectedAddress.toLowerCase()) {
          console.log(`   ✅ Trusted remote for ${chainName} (EID ${eid}): ${peerAddress}`);
        } else {
          console.log(`   ⚠️  Trusted remote for ${chainName} (EID ${eid}) exists but address may be incorrect: ${peerAddress} (expected: ${expectedAddress})`);
        }
      } else {
        console.log(`   ❌ No trusted remote for ${chainName} (EID ${eid})`);
      }
    } catch (error: any) {
      console.log(`   ❌ Error checking trusted remote for ${chainName}: ${error.message}`);
    }
  }

  // 4. Check if GlobalSupplyTracker is authorized in CrossChainSync
  console.log("\n4️⃣ Checking CrossChainSync authorization...");
  const syncAuthABI = [
    "function authorizedTokens(address) view returns (bool)",
  ];
  const syncAuth = new ethers.Contract(addresses.crossChainSync, syncAuthABI, provider);
  
  try {
    const isAuthorized = await syncAuth.authorizedTokens(addresses.globalSupplyTracker);
    if (isAuthorized) {
      console.log(`   ✅ GlobalSupplyTracker is authorized in CrossChainSync`);
    } else {
      console.log(`   ❌ GlobalSupplyTracker is NOT authorized in CrossChainSync`);
    }
  } catch (error: any) {
    console.log(`   ⚠️  Could not check authorization: ${error.message}`);
  }

  console.log("\n✅ Verification complete!\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Error:", error);
    process.exit(1);
  });

