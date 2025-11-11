import { ethers } from "hardhat";
import hre from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

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
  const network = hre.network.name;
  console.log(`\n🔧 Setting up CrossChainLiquidityBridge on ${network}...\n`);

  // Get bridge address from environment
  const bridgeAddress = process.env.LIQUIDITY_BRIDGE_ADDRESS || 
                        process.env[`${network.toUpperCase().replace('-', '_')}_LIQUIDITY_BRIDGE_ADDRESS`];
  
  if (!bridgeAddress) {
    console.error("❌ ERROR: Bridge address not set!");
    console.error(`   Set LIQUIDITY_BRIDGE_ADDRESS or ${network.toUpperCase().replace('-', '_')}_LIQUIDITY_BRIDGE_ADDRESS`);
    process.exit(1);
  }

  console.log(`📍 Bridge Address: ${bridgeAddress}`);

  // Get remote bridge addresses
  const remoteBridges: Record<string, string> = {};
  
  if (network !== 'sepolia' && network !== 'ethereum') {
    const sepoliaBridge = process.env.SEPOLIA_LIQUIDITY_BRIDGE_ADDRESS || process.env.ETHEREUM_LIQUIDITY_BRIDGE_ADDRESS;
    if (sepoliaBridge) remoteBridges['40161'] = sepoliaBridge;
  }
  
  if (network !== 'bscTestnet' && network !== 'bsc') {
    const bscBridge = process.env.BSC_TESTNET_LIQUIDITY_BRIDGE_ADDRESS || process.env.BSC_LIQUIDITY_BRIDGE_ADDRESS;
    if (bscBridge) remoteBridges['40102'] = bscBridge;
  }
  
  if (network !== 'baseSepolia' && network !== 'base') {
    const baseBridge = process.env.BASE_SEPOLIA_LIQUIDITY_BRIDGE_ADDRESS || process.env.BASE_LIQUIDITY_BRIDGE_ADDRESS;
    if (baseBridge) remoteBridges['40245'] = baseBridge;
  }

  // For mainnets, also add mainnet addresses
  if (network === 'ethereum' || network === 'bsc' || network === 'base') {
    const ethBridge = process.env.ETHEREUM_LIQUIDITY_BRIDGE_ADDRESS;
    const bscBridge = process.env.BSC_LIQUIDITY_BRIDGE_ADDRESS;
    const baseBridge = process.env.BASE_LIQUIDITY_BRIDGE_ADDRESS;
    
    if (network !== 'ethereum' && ethBridge) remoteBridges['30110'] = ethBridge;
    if (network !== 'bsc' && bscBridge) remoteBridges['30102'] = bscBridge;
    if (network !== 'base' && baseBridge) remoteBridges['30145'] = baseBridge;
  }

  if (Object.keys(remoteBridges).length === 0) {
    console.warn("⚠️  WARNING: No remote bridge addresses configured!");
    console.warn("   Set remote bridge addresses in environment variables");
    console.warn("   Continuing with basic setup...\n");
  }

  const [deployer] = await ethers.getSigners();
  console.log(`👤 Deployer: ${deployer.address}\n`);

  // Get bridge contract
  const CrossChainLiquidityBridge = await ethers.getContractFactory("CrossChainLiquidityBridge");
  const bridge = CrossChainLiquidityBridge.attach(bridgeAddress);

  // Verify bridge exists
  const bridgeCode = await ethers.provider.getCode(bridgeAddress);
  if (!bridgeCode || bridgeCode === '0x' || bridgeCode === '0x0') {
    console.error(`❌ ERROR: Bridge not found at ${bridgeAddress}`);
    process.exit(1);
  }

  console.log("✅ Bridge contract verified\n");

  // Set trusted remotes (if CrossChainSync supports it, we'll configure through it)
  // For now, the bridge uses CrossChainSync for messaging, so remotes are set there

  // Set default minimum reserve percentage (30% = 3000 basis points)
  console.log("1️⃣ Setting default minimum reserve percentage (30%)...");
  try {
    const tx1 = await bridge.setMinReservePercent(ethers.ZeroAddress, 3000); // 0 address = default for all tokens
    await tx1.wait();
    console.log("   ✅ Default minimum reserve set to 30%\n");
  } catch (error: any) {
    console.warn(`   ⚠️  Could not set default: ${error.message}\n`);
  }

  // Set bridge fee (0.1% = 10 basis points)
  console.log("2️⃣ Setting bridge fee (0.1%)...");
  try {
    const tx2 = await bridge.setBridgeFeePercent(10);
    await tx2.wait();
    console.log("   ✅ Bridge fee set to 0.1%\n");
  } catch (error: any) {
    console.warn(`   ⚠️  Could not set fee: ${error.message}\n`);
  }

  // Display configuration
  console.log("3️⃣ Current Configuration:");
  try {
    const bridgeFee = await bridge.bridgeFeePercent();
    const feeCollector = await bridge.feeCollector();
    console.log(`   Bridge Fee: ${bridgeFee} basis points (${Number(bridgeFee) / 100}%)`);
    console.log(`   Fee Collector: ${feeCollector}`);
    console.log(`   Chain EID: ${CHAIN_EIDS[network] || 'Not set'}\n`);
  } catch (error: any) {
    console.warn(`   ⚠️  Could not read configuration: ${error.message}\n`);
  }

  console.log("✅ Bridge setup complete!\n");
  console.log("⚠️  NEXT STEPS:");
  console.log("   1. Authorize bonding curves to update reserves:");
  console.log("      bridge.authorizeToken(bondingCurveAddress)");
  console.log("   2. Update bonding curves to use this bridge:");
  console.log("      bondingCurve.setLiquidityBridge(bridgeAddress)");
  console.log("      bondingCurve.setChainEID(chainEID)");
  console.log("      bondingCurve.setUseLiquidityBridge(true)");
  console.log("   3. Set trusted remotes in CrossChainSync contract");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Setup failed:");
    console.error(error);
    process.exit(1);
  });

