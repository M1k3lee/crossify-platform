import { ethers } from "hardhat";
import hre from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

// LayerZero Endpoint addresses
const LZ_ENDPOINTS: Record<string, string> = {
  sepolia: "0x6EDCE65403992e310A62460808c4b910D972f10f",
  bscTestnet: "0x6EDCE65403992e310A62460808c4b910D972f10f",
  baseSepolia: "0x6EDCE65403992e310A62460808c4b910D972f10f",
  ethereum: "0x1a44076050125825900e736c501f859c50fE728c", // Mainnet
  bsc: "0x1a44076050125825900e736c501f859c50fE728c", // Mainnet
  base: "0x1a44076050125825900e736c501f859c50fE728c", // Mainnet
};

// Chain EIDs (LayerZero Endpoint IDs)
const CHAIN_EIDS: Record<string, number> = {
  sepolia: 40161,
  bscTestnet: 40102,
  baseSepolia: 40245,
  ethereum: 30110,
  bsc: 30102,
  base: 30145,
};

async function main() {
  if (!process.env.PRIVATE_KEY || process.env.PRIVATE_KEY.trim() === '') {
    console.error("❌ ERROR: PRIVATE_KEY not found in environment!");
    process.exit(1);
  }

  try {
    await ethers.provider.getBlockNumber();
    console.log(`✅ Connected to network. Current block: ${await ethers.provider.getBlockNumber()}`);
  } catch (error) {
    console.error("❌ ERROR: Cannot connect to RPC endpoint!");
    process.exit(1);
  }

  const signers = await ethers.getSigners();
  const deployer = signers[0];
  const network = hre.network.name;

  console.log("\n🚀 Deploying CrossChainLiquidityBridge contract...");
  console.log(`📋 Network: ${network}`);
  console.log(`👤 Deployer: ${deployer.address}`);
  console.log(`💰 Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH/BNB\n`);

  // Get LayerZero endpoint address
  const lzEndpoint = LZ_ENDPOINTS[network];
  if (!lzEndpoint) {
    console.error(`❌ ERROR: No LayerZero endpoint configured for ${network}`);
    console.error(`   Available networks: ${Object.keys(LZ_ENDPOINTS).join(", ")}`);
    process.exit(1);
  }

  // Get CrossChainSync address (required for bridge)
  const crossChainSyncAddress = process.env.CROSS_CHAIN_SYNC_ADDRESS || 
                                 process.env[`CROSS_CHAIN_SYNC_${network.toUpperCase().replace('-', '_')}`];
  
  if (!crossChainSyncAddress) {
    console.error(`❌ ERROR: CrossChainSync address not found!`);
    console.error(`   Set CROSS_CHAIN_SYNC_ADDRESS or CROSS_CHAIN_SYNC_${network.toUpperCase().replace('-', '_')}`);
    console.error(`   Deploy CrossChainSync first using: npx hardhat run scripts/deploy-crosschain-sync.ts --network ${network}`);
    process.exit(1);
  }

  // Get fee collector address (defaults to deployer)
  const feeCollector = process.env.FEE_COLLECTOR_ADDRESS || deployer.address;

  console.log(`📍 LayerZero Endpoint: ${lzEndpoint}`);
  console.log(`📍 CrossChainSync: ${crossChainSyncAddress}`);
  console.log(`📍 Fee Collector: ${feeCollector}\n`);

  // Verify contracts exist
  try {
    const endpointCode = await ethers.provider.getCode(lzEndpoint);
    if (!endpointCode || endpointCode === '0x' || endpointCode === '0x0') {
      console.warn(`⚠️  WARNING: LayerZero endpoint not found at ${lzEndpoint}`);
    } else {
      console.log(`✅ LayerZero endpoint verified`);
    }

    const syncCode = await ethers.provider.getCode(crossChainSyncAddress);
    if (!syncCode || syncCode === '0x' || syncCode === '0x0') {
      console.error(`❌ ERROR: CrossChainSync not found at ${crossChainSyncAddress}`);
      process.exit(1);
    } else {
      console.log(`✅ CrossChainSync verified`);
    }
  } catch (error) {
    console.warn(`⚠️  Could not verify contracts: ${error}`);
  }

  console.log("\n📦 Deploying CrossChainLiquidityBridge contract...");
  const CrossChainLiquidityBridge = await ethers.getContractFactory("CrossChainLiquidityBridge");
  const bridge = await CrossChainLiquidityBridge.deploy(
    lzEndpoint,
    crossChainSyncAddress,
    deployer.address, // owner
    feeCollector
  );

  console.log(`⏳ Transaction hash: ${bridge.deploymentTransaction()?.hash}`);
  console.log("⏳ Waiting for deployment confirmation...");

  await bridge.waitForDeployment();
  const bridgeAddress = await bridge.getAddress();

  console.log(`\n✅ CrossChainLiquidityBridge deployed to: ${bridgeAddress}`);
  
  // Get chain EID
  const chainEID = CHAIN_EIDS[network];
  if (chainEID) {
    console.log(`\n📝 Chain EID for ${network}: ${chainEID}`);
  }

  console.log(`\n📝 Please update your .env file with:`);
  console.log(`   ${network.toUpperCase().replace('-', '_')}_LIQUIDITY_BRIDGE_ADDRESS=${bridgeAddress}`);
  console.log(`\n   And update backend .env with:`);
  console.log(`   ${network.toUpperCase().replace('-', '_')}_LIQUIDITY_BRIDGE_ADDRESS=${bridgeAddress}`);
  
  console.log(`\n🔍 Verify on block explorer:`);
  const explorerUrl = (hre.config.etherscan.customChains as any[])?.find(c => c.network === network)?.urls?.browserURL || 
                      (network.includes('sepolia') ? 'https://sepolia.etherscan.io' :
                       network.includes('base') ? 'https://basescan.org' :
                       network.includes('bsc') ? 'https://testnet.bscscan.com' :
                       'https://etherscan.io');
  console.log(`   ${explorerUrl}/address/${bridgeAddress}`);
  
  console.log(`\n⚠️  NEXT STEPS:`);
  console.log(`   1. Set trusted remotes using: npx hardhat run scripts/setup-liquidity-bridge.ts --network ${network}`);
  console.log(`   2. Authorize bonding curves to update reserves`);
  console.log(`   3. Configure minimum reserve percentages per token`);
  console.log(`   4. Update bonding curves to use this bridge address`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });

