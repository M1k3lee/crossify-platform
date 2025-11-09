import { ethers } from "hardhat";
import hre from "hardhat";

/**
 * Quick script to check contract balances
 */

const CONTRACT_ADDRESSES: Record<string, {
  globalSupplyTracker: string;
  crossChainSync: string;
}> = {
  baseSepolia: {
    globalSupplyTracker: "0x1eC9ee96EbD41111ad7b99f29D9a61e46b721C65",
    crossChainSync: "0x39fB28323572610eC0Df1EF075f4acDD51f77e2E",
  },
  bscTestnet: {
    globalSupplyTracker: "0xe84Ae64735261F441e0bcB12bCf60630c5239ef4",
    crossChainSync: "0xf5446E2690B2eb161231fB647476A98e1b6b7736",
  },
  sepolia: {
    globalSupplyTracker: "0x130195A8D09dfd99c36D5903B94088EDBD66533e",
    crossChainSync: "0x1eC9ee96EbD41111ad7b99f29D9a61e46b721C65",
  },
};

async function main() {
  const network = hre.network.name;
  console.log(`\n💰 Checking contract balances on ${network}...\n`);

  const addresses = CONTRACT_ADDRESSES[network];
  if (!addresses) {
    console.error(`❌ Unknown network: ${network}`);
    process.exit(1);
  }

  const provider = ethers.provider;

  // Check GlobalSupplyTracker balance
  const trackerBalance = await provider.getBalance(addresses.globalSupplyTracker);
  console.log(`📍 GlobalSupplyTracker: ${addresses.globalSupplyTracker}`);
  console.log(`   Balance: ${ethers.formatEther(trackerBalance)} ${network === 'bscTestnet' ? 'BNB' : 'ETH'}\n`);

  // Check CrossChainSync balance
  const syncBalance = await provider.getBalance(addresses.crossChainSync);
  console.log(`📍 CrossChainSync: ${addresses.crossChainSync}`);
  console.log(`   Balance: ${ethers.formatEther(syncBalance)} ${network === 'bscTestnet' ? 'BNB' : 'ETH'}\n`);

  // Status
  const minTrackerBalance = ethers.parseEther("0.01");
  const minSyncBalance = ethers.parseEther("0.01");

  console.log("📊 Status:");
  if (trackerBalance >= minTrackerBalance) {
    console.log(`   ✅ GlobalSupplyTracker: Sufficiently funded`);
  } else {
    console.log(`   ⚠️  GlobalSupplyTracker: Low balance (recommended: ~0.05)`);
  }

  if (syncBalance >= minSyncBalance) {
    console.log(`   ✅ CrossChainSync: Sufficiently funded`);
  } else {
    console.log(`   ⚠️  CrossChainSync: Low balance (recommended: ~0.1)`);
  }

  console.log("");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Error:", error);
    process.exit(1);
  });


