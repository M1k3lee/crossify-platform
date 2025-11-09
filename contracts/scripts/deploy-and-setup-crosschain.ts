import { ethers } from "hardhat";
import hre from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * Complete deployment and setup script for cross-chain synchronization
 * This script deploys CrossChainSync, (optionally) redeploys GlobalSupplyTracker,
 * and configures everything for cross-chain messaging
 */

// LayerZero Endpoint addresses for testnets
const LZ_ENDPOINTS: Record<string, string> = {
  sepolia: "0x6EDCE65403992e310A62460808c4b910D972f10f",
  bscTestnet: "0x6EDCE65403992e310A62460808c4b910D972f10f",
  baseSepolia: "0x6EDCE65403992e310A62460808c4b910D972f10f",
};

// Chain EIDs (LayerZero Endpoint IDs)
const CHAIN_EIDS: Record<string, number> = {
  sepolia: 40161,
  bscTestnet: 40102,
  baseSepolia: 40245,
};

// Chain names for trusted remotes
const CHAIN_NAMES: Record<string, string> = {
  sepolia: "sepolia",
  bscTestnet: "bsc-testnet",
  baseSepolia: "base-sepolia",
};

async function main() {
  const network = hre.network.name;
  console.log(`\n🚀 Deploying and setting up cross-chain sync on ${network}...\n`);

  // Validate network
  if (!CHAIN_EIDS[network]) {
    console.error(`❌ ERROR: Unknown network ${network}`);
    console.error(`   Supported networks: ${Object.keys(CHAIN_EIDS).join(", ")}`);
    process.exit(1);
  }

  const [deployer] = await ethers.getSigners();
  console.log(`👤 Deployer: ${deployer.address}`);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH/BNB\n`);

  if (balance < ethers.parseEther("0.1")) {
    console.warn("⚠️  Warning: Low balance! You may need more funds for deployment and fees.");
  }

  const chainEID = CHAIN_EIDS[network];
  const lzEndpoint = LZ_ENDPOINTS[network];

  console.log(`📍 Chain EID: ${chainEID}`);
  console.log(`📍 LayerZero Endpoint: ${lzEndpoint}\n`);

  // Step 1: Deploy CrossChainSync
  console.log("1️⃣ Deploying CrossChainSync...");
  const CrossChainSync = await ethers.getContractFactory("CrossChainSync");
  const crossChainSync = await CrossChainSync.deploy(lzEndpoint);
  await crossChainSync.waitForDeployment();
  const crossChainSyncAddress = await crossChainSync.getAddress();
  console.log(`   ✅ CrossChainSync deployed: ${crossChainSyncAddress}\n`);

  // Step 2: Deploy GlobalSupplyTracker (with chain EID)
  console.log("2️⃣ Deploying GlobalSupplyTracker...");
  const GlobalSupplyTracker = await ethers.getContractFactory("GlobalSupplyTracker");
  const globalSupplyTracker = await GlobalSupplyTracker.deploy(chainEID);
  await globalSupplyTracker.waitForDeployment();
  const globalSupplyTrackerAddress = await globalSupplyTracker.getAddress();
  console.log(`   ✅ GlobalSupplyTracker deployed: ${globalSupplyTrackerAddress}\n`);

  // Step 3: Configure GlobalSupplyTracker
  console.log("3️⃣ Configuring GlobalSupplyTracker...");
  const tx1 = await globalSupplyTracker.setCrossChainSync(crossChainSyncAddress);
  await tx1.wait();
  console.log("   ✅ CrossChainSync address set\n");

  // Step 4: Authorize GlobalSupplyTracker in CrossChainSync
  console.log("4️⃣ Authorizing GlobalSupplyTracker in CrossChainSync...");
  const tx2 = await crossChainSync.authorizeAddress(globalSupplyTrackerAddress);
  await tx2.wait();
  console.log("   ✅ GlobalSupplyTracker authorized\n");

  // Step 5: Fund contracts (optional, if FUND_AMOUNT is set)
  const fundAmount = process.env.FUND_AMOUNT;
  if (fundAmount) {
    console.log("5️⃣ Funding contracts...");
    const amount = ethers.parseEther(fundAmount);
    
    // Fund GlobalSupplyTracker
    const tx3 = await deployer.sendTransaction({
      to: globalSupplyTrackerAddress,
      value: amount,
    });
    await tx3.wait();
    console.log(`   ✅ Funded GlobalSupplyTracker: ${fundAmount} ETH/BNB`);

    // Fund CrossChainSync
    const tx4 = await deployer.sendTransaction({
      to: crossChainSyncAddress,
      value: amount,
    });
    await tx4.wait();
    console.log(`   ✅ Funded CrossChainSync: ${fundAmount} ETH/BNB\n`);
  } else {
    console.log("5️⃣ Skipping funding (FUND_AMOUNT not set)\n");
  }

  // Step 6: Set trusted remotes (if provided)
  const trustedRemotesEnv = process.env.TRUSTED_REMOTES;
  if (trustedRemotesEnv) {
    console.log("6️⃣ Setting trusted remotes...");
    try {
      const trustedRemotes = JSON.parse(trustedRemotesEnv);
      for (const remote of trustedRemotes) {
        const { eid, address: remoteAddress } = remote;
        const encoded = ethers.AbiCoder.defaultAbiCoder().encode(["address"], [remoteAddress]);
        const tx = await crossChainSync.setTrustedRemote(eid, encoded);
        await tx.wait();
        console.log(`   ✅ Trusted remote set: EID ${eid} -> ${remoteAddress}`);
      }
      console.log("");
    } catch (error: any) {
      console.error("   ❌ Failed to set trusted remotes:", error.message);
    }
  } else {
    console.log("6️⃣ Skipping trusted remotes (TRUSTED_REMOTES not set)");
    console.log("   ⚠️  You'll need to set trusted remotes manually for cross-chain sync to work\n");
  }

  // Step 7: Verify setup
  console.log("7️⃣ Verifying setup...");
  const isEnabled = await globalSupplyTracker.crossChainEnabled();
  const syncAddress = await globalSupplyTracker.crossChainSync();
  const isAuthorized = await crossChainSync.authorizedTokens(globalSupplyTrackerAddress);
  const trackerBalance = await ethers.provider.getBalance(globalSupplyTrackerAddress);
  const syncBalance = await ethers.provider.getBalance(crossChainSyncAddress);

  console.log(`   ✅ Cross-chain enabled: ${isEnabled}`);
  console.log(`   ✅ Sync address: ${syncAddress}`);
  console.log(`   ✅ Authorized: ${isAuthorized}`);
  console.log(`   ✅ Tracker balance: ${ethers.formatEther(trackerBalance)} ETH/BNB`);
  console.log(`   ✅ Sync balance: ${ethers.formatEther(syncBalance)} ETH/BNB\n`);

  // Output summary
  console.log("📋 Deployment Summary:");
  console.log(`   Network: ${network}`);
  console.log(`   Chain EID: ${chainEID}`);
  console.log(`   CrossChainSync: ${crossChainSyncAddress}`);
  console.log(`   GlobalSupplyTracker: ${globalSupplyTrackerAddress}\n`);

  console.log("📝 Environment variables to add:");
  console.log(`   CROSS_CHAIN_SYNC_${network.toUpperCase()}=${crossChainSyncAddress}`);
  console.log(`   GLOBAL_SUPPLY_TRACKER_${network.toUpperCase()}=${globalSupplyTrackerAddress}\n`);

  console.log("🔍 Verify on block explorer:");
  const explorerUrls: Record<string, string> = {
    sepolia: `https://sepolia.etherscan.io/address/${crossChainSyncAddress}`,
    bscTestnet: `https://testnet.bscscan.com/address/${crossChainSyncAddress}`,
    baseSepolia: `https://sepolia-explorer.base.org/address/${crossChainSyncAddress}`,
  };
  if (explorerUrls[network]) {
    console.log(`   ${explorerUrls[network]}\n`);
  }

  console.log("✅ Deployment complete!");
  console.log("\n⚠️  Next steps:");
  console.log("   1. Deploy CrossChainSync and GlobalSupplyTracker on other chains");
  console.log("   2. Set trusted remotes for all chains");
  console.log("   3. Update TokenFactory with new addresses (if needed)");
  console.log("   4. Test cross-chain sync with a token purchase\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });

