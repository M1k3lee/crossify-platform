import { ethers } from "hardhat";
import hre from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * Complete cross-chain setup script
 * 1. Funds contracts
 * 2. Updates TokenFactory with new addresses
 * 3. Finds and authorizes all existing BondingCurve contracts
 */

// Contract addresses from deployment
const DEPLOYED_ADDRESSES: Record<string, {
  tokenFactory: string;
  crossChainSync: string;
  globalSupplyTracker: string;
}> = {
  baseSepolia: {
    tokenFactory: "0x314DFf75620f1CFB09B5aD88892Dded0A13A6c58",
    crossChainSync: "0x39fB28323572610eC0Df1EF075f4acDD51f77e2E",
    globalSupplyTracker: "0x1eC9ee96EbD41111ad7b99f29D9a61e46b721C65",
  },
  bscTestnet: {
    tokenFactory: "0x39fB28323572610eC0Df1EF075f4acDD51f77e2E",
    crossChainSync: "0xf5446E2690B2eb161231fB647476A98e1b6b7736",
    globalSupplyTracker: "0xe84Ae64735261F441e0bcB12bCf60630c5239ef4",
  },
  sepolia: {
    tokenFactory: "0x39fB28323572610eC0Df1EF075f4acDD51f77e2E",
    crossChainSync: "0x1eC9ee96EbD41111ad7b99f29D9a61e46b721C65",
    globalSupplyTracker: "0x130195A8D09dfd99c36D5903B94088EDBD66533e",
  },
};

// Chain EIDs
const CHAIN_EIDS: Record<string, number> = {
  sepolia: 40161,
  bscTestnet: 40102,
  baseSepolia: 40245,
};

// LayerZero Endpoint
const LZ_ENDPOINT = "0x6EDCE65403992e310A62460808c4b910D972f10f";

// Funding amounts
const TRACKER_FUND_AMOUNT = process.env.TRACKER_FUND_AMOUNT || "0.05";
const SYNC_FUND_AMOUNT = process.env.SYNC_FUND_AMOUNT || "0.1";

async function main() {
  const network = hre.network.name;
  console.log(`\n🚀 Complete Cross-Chain Setup on ${network}\n`);
  console.log("=" .repeat(60) + "\n");

  // Validate network
  if (!DEPLOYED_ADDRESSES[network]) {
    console.error(`❌ ERROR: Unknown network ${network}`);
    console.error(`   Supported: ${Object.keys(DEPLOYED_ADDRESSES).join(", ")}`);
    process.exit(1);
  }

  const addresses = DEPLOYED_ADDRESSES[network];
  const chainEID = CHAIN_EIDS[network];
  const [deployer] = await ethers.getSigners();

  console.log(`📋 Network: ${network}`);
  console.log(`👤 Deployer: ${deployer.address}`);
  console.log(`📍 TokenFactory: ${addresses.tokenFactory}`);
  console.log(`📍 CrossChainSync: ${addresses.crossChainSync}`);
  console.log(`📍 GlobalSupplyTracker: ${addresses.globalSupplyTracker}\n`);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH/BNB\n`);

  // Step 1: Fund Contracts
  console.log("=" .repeat(60));
  console.log("STEP 1: Funding Contracts");
  console.log("=" .repeat(60) + "\n");

  const trackerFund = ethers.parseEther(TRACKER_FUND_AMOUNT);
  const syncFund = ethers.parseEther(SYNC_FUND_AMOUNT);

  try {
    console.log(`💰 Funding GlobalSupplyTracker: ${TRACKER_FUND_AMOUNT} ETH/BNB`);
    const tx1 = await deployer.sendTransaction({
      to: addresses.globalSupplyTracker,
      value: trackerFund,
    });
    await tx1.wait();
    console.log("   ✅ Funded\n");
  } catch (error: any) {
    console.error("   ❌ Failed to fund tracker:", error.message);
    console.log("   ⚠️  Continuing...\n");
  }

  try {
    console.log(`💰 Funding CrossChainSync: ${SYNC_FUND_AMOUNT} ETH/BNB`);
    const tx2 = await deployer.sendTransaction({
      to: addresses.crossChainSync,
      value: syncFund,
    });
    await tx2.wait();
    console.log("   ✅ Funded\n");
  } catch (error: any) {
    console.error("   ❌ Failed to fund sync:", error.message);
    console.log("   ⚠️  Continuing...\n");
  }

  // Step 2: Update TokenFactory
  console.log("=" .repeat(60));
  console.log("STEP 2: Updating TokenFactory");
  console.log("=" .repeat(60) + "\n");

  const TokenFactory = await ethers.getContractFactory("TokenFactory");
  const factory = TokenFactory.attach(addresses.tokenFactory);

  try {
    console.log("🔧 Updating GlobalSupplyTracker address...");
    const tx3 = await factory.setGlobalSupplyTracker(addresses.globalSupplyTracker);
    await tx3.wait();
    console.log("   ✅ GlobalSupplyTracker updated\n");
  } catch (error: any) {
    console.error("   ❌ Failed:", error.message);
    console.log("   ⚠️  Continuing...\n");
  }

  try {
    console.log("🔧 Updating CrossChainSync infrastructure...");
    const tx4 = await factory.setCrossChainInfrastructure(
      LZ_ENDPOINT,
      addresses.crossChainSync,
      "0x0000000000000000000000000000000000000000", // Price oracle (optional)
      chainEID
    );
    await tx4.wait();
    console.log("   ✅ CrossChainSync infrastructure updated\n");
  } catch (error: any) {
    console.error("   ❌ Failed:", error.message);
    console.log("   ⚠️  Continuing...\n");
  }

  try {
    console.log("🔧 Enabling global supply usage...");
    const tx5 = await factory.setUseGlobalSupply(true);
    await tx5.wait();
    console.log("   ✅ Global supply enabled\n");
  } catch (error: any) {
    console.error("   ❌ Failed:", error.message);
    console.log("   ⚠️  Continuing...\n");
  }

  // Step 3: Find and Authorize Existing BondingCurves
  console.log("=" .repeat(60));
  console.log("STEP 3: Authorizing Existing BondingCurves");
  console.log("=" .repeat(60) + "\n");

  const GlobalSupplyTracker = await ethers.getContractFactory("GlobalSupplyTracker");
  const tracker = GlobalSupplyTracker.attach(addresses.globalSupplyTracker);

  // Get TokenCreated events from TokenFactory
  console.log("🔍 Finding all tokens created by TokenFactory...");
  
  // Query events in chunks to avoid block range limits
  const currentBlock = await ethers.provider.getBlockNumber();
  let chunkSize = 10000; // Query 10k blocks at a time
  const startBlock = Math.max(0, currentBlock - 50000); // Last 50k blocks max
  
  const tokenCreatedFilter = factory.filters.TokenCreated();
  const events: any[] = [];
  
  // Query in chunks
  for (let fromBlock = startBlock; fromBlock <= currentBlock; fromBlock += chunkSize) {
    const toBlock = Math.min(fromBlock + chunkSize - 1, currentBlock);
    try {
      const chunkEvents = await factory.queryFilter(tokenCreatedFilter, fromBlock, toBlock);
      events.push(...chunkEvents);
      console.log(`   Queried blocks ${fromBlock}-${toBlock}: found ${chunkEvents.length} tokens`);
    } catch (error: any) {
      console.log(`   ⚠️  Failed to query blocks ${fromBlock}-${toBlock}: ${error.message}`);
      // Continue with next chunk if this fails
    }
  }
  
  console.log(`   Total found: ${events.length} tokens\n`);

  if (events.length === 0) {
    console.log("   ⚠️  No tokens found. New tokens will be automatically configured.\n");
  } else {
    let authorizedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      const curveAddress = event.args.curveAddress;
      
      try {
        // Check if already authorized
        const isAuthorized = await tracker.authorizedUpdaters(curveAddress);
        
        if (isAuthorized) {
          console.log(`   ${i + 1}. Curve ${curveAddress.substring(0, 10)}... already authorized ✅`);
          skippedCount++;
          continue;
        }

        // Check if curve exists
        const code = await ethers.provider.getCode(curveAddress);
        if (!code || code === '0x' || code === '0x0') {
          console.log(`   ${i + 1}. Curve ${curveAddress.substring(0, 10)}... not found ⚠️`);
          skippedCount++;
          continue;
        }

        // Authorize
        console.log(`   ${i + 1}. Authorizing curve ${curveAddress.substring(0, 10)}...`);
        const tx = await tracker.authorizeUpdater(curveAddress);
        await tx.wait();
        console.log(`      ✅ Authorized\n`);
        authorizedCount++;
      } catch (error: any) {
        console.log(`      ❌ Failed: ${error.message}\n`);
        errorCount++;
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Authorized: ${authorizedCount}`);
    console.log(`   ⏭️  Skipped: ${skippedCount}`);
    console.log(`   ❌ Errors: ${errorCount}\n`);
  }

  // Step 4: Verify Setup
  console.log("=" .repeat(60));
  console.log("STEP 4: Verification");
  console.log("=" .repeat(60) + "\n");

  try {
    const factoryTracker = await factory.globalSupplyTracker();
    const useGlobalSupply = await factory.useGlobalSupply();
    const crossChainEnabled = await factory.crossChainEnabled();
    const trackerBalance = await ethers.provider.getBalance(addresses.globalSupplyTracker);
    const syncBalance = await ethers.provider.getBalance(addresses.crossChainSync);

    console.log(`✅ Factory GlobalSupplyTracker: ${factoryTracker}`);
    console.log(`✅ Use Global Supply: ${useGlobalSupply}`);
    console.log(`✅ Cross-Chain Enabled: ${crossChainEnabled}`);
    console.log(`✅ Tracker Balance: ${ethers.formatEther(trackerBalance)} ETH/BNB`);
    console.log(`✅ Sync Balance: ${ethers.formatEther(syncBalance)} ETH/BNB\n`);
  } catch (error: any) {
    console.error("   ⚠️  Verification failed:", error.message);
  }

  // Summary
  console.log("=" .repeat(60));
  console.log("✅ SETUP COMPLETE!");
  console.log("=" .repeat(60) + "\n");

  console.log("📝 Next steps:");
  console.log("   1. New tokens created will automatically use cross-chain sync");
  console.log("   2. Existing tokens are now authorized and can send cross-chain messages");
  console.log("   3. Test by making a token purchase and verifying cross-chain sync\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Setup failed:");
    console.error(error);
    process.exit(1);
  });

