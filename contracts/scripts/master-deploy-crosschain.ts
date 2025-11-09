import { ethers } from "hardhat";
import hre from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * Master script to deploy and configure cross-chain sync on a single chain
 * This script does everything in one go:
 * 1. Deploys CrossChainSync
 * 2. Deploys/checks GlobalSupplyTracker
 * 3. Configures everything
 * 4. Sets up trusted remotes (if provided)
 * 5. Funds contracts
 * 6. Verifies setup
 */

// LayerZero Endpoint addresses
const LZ_ENDPOINTS: Record<string, string> = {
  sepolia: "0x6EDCE65403992e310A62460808c4b910D972f10f",
  bscTestnet: "0x6EDCE65403992e310A62460808c4b910D972f10f",
  baseSepolia: "0x6EDCE65403992e310A62460808c4b910D972f10f",
};

// Chain EIDs
const CHAIN_EIDS: Record<string, number> = {
  sepolia: 40161,
  bscTestnet: 40102,
  baseSepolia: 40245,
};

async function main() {
  const network = hre.network.name;
  console.log(`\n🚀 Master Cross-Chain Deployment on ${network}\n`);
  console.log("=" .repeat(60) + "\n");

  // Validate network
  if (!CHAIN_EIDS[network]) {
    console.error(`❌ ERROR: Unknown network ${network}`);
    console.error(`   Supported: ${Object.keys(CHAIN_EIDS).join(", ")}`);
    process.exit(1);
  }

  const [deployer] = await ethers.getSigners();
  const chainEID = CHAIN_EIDS[network];
  const lzEndpoint = LZ_ENDPOINTS[network];

  console.log(`📋 Network: ${network}`);
  console.log(`👤 Deployer: ${deployer.address}`);
  console.log(`📍 Chain EID: ${chainEID}`);
  console.log(`📍 LayerZero Endpoint: ${lzEndpoint}\n`);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH/BNB\n`);

  if (balance < ethers.parseEther("0.2")) {
    console.warn("⚠️  Warning: Low balance! You may need more funds for deployment and fees.\n");
  }

  // Step 1: Deploy CrossChainSync
  console.log("=" .repeat(60));
  console.log("STEP 1: Deploying CrossChainSync");
  console.log("=" .repeat(60) + "\n");

  const CrossChainSync = await ethers.getContractFactory("CrossChainSync");
  const crossChainSync = await CrossChainSync.deploy(lzEndpoint);
  await crossChainSync.waitForDeployment();
  const crossChainSyncAddress = await crossChainSync.getAddress();
  console.log(`✅ CrossChainSync deployed: ${crossChainSyncAddress}\n`);

  // Step 2: Check or Deploy GlobalSupplyTracker
  console.log("=" .repeat(60));
  console.log("STEP 2: GlobalSupplyTracker");
  console.log("=" .repeat(60) + "\n");

  let globalSupplyTrackerAddress = process.env.GLOBAL_SUPPLY_TRACKER_ADDRESS;
  let needToDeployTracker = false;

  if (globalSupplyTrackerAddress) {
    console.log(`📍 Using existing GlobalSupplyTracker: ${globalSupplyTrackerAddress}`);
    console.log("🔍 Checking if it has cross-chain functions...\n");

    try {
      const GlobalSupplyTracker = await ethers.getContractFactory("GlobalSupplyTracker");
      const tracker = GlobalSupplyTracker.attach(globalSupplyTrackerAddress);

      try {
        await tracker.crossChainSync();
        console.log("✅ Existing GlobalSupplyTracker has cross-chain functions\n");
      } catch {
        console.log("⚠️  Existing GlobalSupplyTracker does NOT have cross-chain functions");
        console.log("   Will deploy new GlobalSupplyTracker\n");
        needToDeployTracker = true;
      }
    } catch (error: any) {
      console.log(`⚠️  Error checking existing contract: ${error.message}`);
      console.log("   Will deploy new GlobalSupplyTracker\n");
      needToDeployTracker = true;
    }
  } else {
    console.log("📍 No existing GlobalSupplyTracker address provided");
    console.log("   Will deploy new GlobalSupplyTracker\n");
    needToDeployTracker = true;
  }

  if (needToDeployTracker) {
    console.log("📦 Deploying new GlobalSupplyTracker...");
    const GlobalSupplyTracker = await ethers.getContractFactory("GlobalSupplyTracker");
    const tracker = await GlobalSupplyTracker.deploy(chainEID);
    await tracker.waitForDeployment();
    globalSupplyTrackerAddress = await tracker.getAddress();
    console.log(`✅ GlobalSupplyTracker deployed: ${globalSupplyTrackerAddress}\n`);
  }

  // Step 3: Configure GlobalSupplyTracker
  console.log("=" .repeat(60));
  console.log("STEP 3: Configuring GlobalSupplyTracker");
  console.log("=" .repeat(60) + "\n");

  const GlobalSupplyTracker = await ethers.getContractFactory("GlobalSupplyTracker");
  const tracker = GlobalSupplyTracker.attach(globalSupplyTrackerAddress!);

  console.log("🔧 Setting CrossChainSync address...");
  const tx1 = await tracker.setCrossChainSync(crossChainSyncAddress);
  await tx1.wait();
  console.log("✅ CrossChainSync address set\n");

  // Step 4: Authorize GlobalSupplyTracker in CrossChainSync
  console.log("=" .repeat(60));
  console.log("STEP 4: Authorizing GlobalSupplyTracker");
  console.log("=" .repeat(60) + "\n");

  console.log("🔐 Authorizing GlobalSupplyTracker in CrossChainSync...");
  const tx2 = await crossChainSync.authorizeAddress(globalSupplyTrackerAddress!);
  await tx2.wait();
  console.log("✅ GlobalSupplyTracker authorized\n");

  // Step 5: Set Trusted Remotes (if provided)
  console.log("=" .repeat(60));
  console.log("STEP 5: Setting Trusted Remotes");
  console.log("=" .repeat(60) + "\n");

  const trustedRemotesEnv = process.env.TRUSTED_REMOTES;
  if (trustedRemotesEnv) {
    try {
      const trustedRemotes = JSON.parse(trustedRemotesEnv);
      for (const remote of trustedRemotes) {
        const { eid, address: remoteAddress } = remote;
        console.log(`🔗 Setting trusted remote: EID ${eid} -> ${remoteAddress}`);
        const encoded = ethers.AbiCoder.defaultAbiCoder().encode(["address"], [remoteAddress]);
        const tx = await crossChainSync.setTrustedRemote(eid, encoded);
        await tx.wait();
        console.log(`   ✅ Trusted remote set\n`);
      }
    } catch (error: any) {
      console.error("   ❌ Failed to set trusted remotes:", error.message);
      console.log("   ⚠️  You'll need to set trusted remotes manually\n");
    }
  } else {
    console.log("⚠️  TRUSTED_REMOTES not set in environment");
    console.log("   Skipping trusted remote setup");
    console.log("   You'll need to set trusted remotes manually after deploying on all chains\n");
  }

  // Step 6: Fund Contracts
  console.log("=" .repeat(60));
  console.log("STEP 6: Funding Contracts");
  console.log("=" .repeat(60) + "\n");

  const trackerFundAmount = process.env.TRACKER_FUND_AMOUNT || "0.05";
  const syncFundAmount = process.env.SYNC_FUND_AMOUNT || "0.1";

  const trackerFund = ethers.parseEther(trackerFundAmount);
  const syncFund = ethers.parseEther(syncFundAmount);

  console.log(`💰 Funding GlobalSupplyTracker: ${trackerFundAmount} ETH/BNB`);
  const tx3 = await deployer.sendTransaction({
    to: globalSupplyTrackerAddress!,
    value: trackerFund,
  });
  await tx3.wait();
  console.log("   ✅ Funded\n");

  console.log(`💰 Funding CrossChainSync: ${syncFundAmount} ETH/BNB`);
  const tx4 = await deployer.sendTransaction({
    to: crossChainSyncAddress,
    value: syncFund,
  });
  await tx4.wait();
  console.log("   ✅ Funded\n");

  // Step 7: Verify Setup
  console.log("=" .repeat(60));
  console.log("STEP 7: Verification");
  console.log("=" .repeat(60) + "\n");

  const isEnabled = await tracker.crossChainEnabled();
  const syncAddress = await tracker.crossChainSync();
  const isAuthorized = await crossChainSync.authorizedTokens(globalSupplyTrackerAddress!);
  const trackerBalance = await ethers.provider.getBalance(globalSupplyTrackerAddress!);
  const syncBalance = await ethers.provider.getBalance(crossChainSyncAddress);

  console.log(`✅ Cross-chain enabled: ${isEnabled}`);
  console.log(`✅ Sync address: ${syncAddress}`);
  console.log(`✅ Authorized: ${isAuthorized}`);
  console.log(`✅ Tracker balance: ${ethers.formatEther(trackerBalance)} ETH/BNB`);
  console.log(`✅ Sync balance: ${ethers.formatEther(syncBalance)} ETH/BNB\n`);

  // Summary
  console.log("=" .repeat(60));
  console.log("📋 DEPLOYMENT SUMMARY");
  console.log("=" .repeat(60) + "\n");

  console.log(`Network: ${network}`);
  console.log(`Chain EID: ${chainEID}`);
  console.log(`\n✅ CrossChainSync: ${crossChainSyncAddress}`);
  console.log(`✅ GlobalSupplyTracker: ${globalSupplyTrackerAddress}\n`);

  console.log("📝 Environment variables to save:");
  console.log(`   CROSS_CHAIN_SYNC_${network.toUpperCase()}=${crossChainSyncAddress}`);
  if (needToDeployTracker) {
    console.log(`   GLOBAL_SUPPLY_TRACKER_${network.toUpperCase()}=${globalSupplyTrackerAddress}`);
  }
  console.log("");

  console.log("🔍 Verify on block explorer:");
  const explorerUrls: Record<string, string> = {
    sepolia: `https://sepolia.etherscan.io/address/${crossChainSyncAddress}`,
    bscTestnet: `https://testnet.bscscan.com/address/${crossChainSyncAddress}`,
    baseSepolia: `https://sepolia-explorer.base.org/address/${crossChainSyncAddress}`,
  };
  if (explorerUrls[network]) {
    console.log(`   ${explorerUrls[network]}\n`);
  }

  console.log("=" .repeat(60));
  console.log("✅ DEPLOYMENT COMPLETE!");
  console.log("=" .repeat(60) + "\n");

  console.log("⚠️  Next steps:");
  console.log("   1. Deploy on other chains (BSC Testnet, Sepolia)");
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

