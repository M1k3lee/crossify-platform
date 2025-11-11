import { ethers } from "hardhat";
import hre from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

// Bridge addresses from deployment
const BRIDGE_ADDRESSES: Record<string, string> = {
  sepolia: "0x7005c0A2c9Cd108af213c717cA6d7232AcBD1b29",
  bscTestnet: "0x08BA4231c0843375714Ef89999C9F908735E0Ec2",
  baseSepolia: "0xDeFC8B749e68b5e21b3873928e68Aaf56031C6EA",
};

// Chain EIDs
const CHAIN_EIDS: Record<string, number> = {
  sepolia: 40161,
  bscTestnet: 40102,
  baseSepolia: 40245,
};

// TokenFactory ABI (simplified)
const TOKEN_FACTORY_ABI = [
  'function setLiquidityBridge(address _bridge) external',
  'function setUseLiquidityBridge(bool _use) external',
  'function liquidityBridge() external view returns (address)',
  'function useLiquidityBridge() external view returns (bool)',
];

async function main() {
  const network = hre.network.name;
  console.log(`\n🔧 Updating TokenFactory on ${network}...\n`);

  // Get TokenFactory address
  const factoryAddress = process.env.TOKEN_FACTORY_ADDRESS || 
                      process.env[`${network.toUpperCase().replace('-', '_')}_FACTORY_ADDRESS`] ||
                      process.env.FACTORY_ADDRESS;

  if (!factoryAddress) {
    console.error("❌ ERROR: TokenFactory address not found!");
    console.error(`   Set TOKEN_FACTORY_ADDRESS or ${network.toUpperCase().replace('-', '_')}_FACTORY_ADDRESS`);
    process.exit(1);
  }

  const bridgeAddress = BRIDGE_ADDRESSES[network];
  if (!bridgeAddress) {
    console.error(`❌ ERROR: Bridge address not found for ${network}`);
    console.error(`   Available networks: ${Object.keys(BRIDGE_ADDRESSES).join(", ")}`);
    process.exit(1);
  }

  console.log(`📍 TokenFactory: ${factoryAddress}`);
  console.log(`📍 Bridge: ${bridgeAddress}`);
  console.log(`📍 Chain EID: ${CHAIN_EIDS[network]}\n`);

  const [deployer] = await ethers.getSigners();
  console.log(`👤 Deployer: ${deployer.address}\n`);

  // Get TokenFactory contract
  const factory = new ethers.Contract(factoryAddress, TOKEN_FACTORY_ABI, deployer);

  // Check current settings
  try {
    const currentBridge = await factory.liquidityBridge();
    const currentUse = await factory.useLiquidityBridge();
    
    console.log("📊 Current Settings:");
    console.log(`   Bridge: ${currentBridge}`);
    console.log(`   Use Bridge: ${currentUse}\n`);

    if (currentBridge.toLowerCase() === bridgeAddress.toLowerCase() && currentUse) {
      console.log("✅ TokenFactory already configured correctly!");
      return;
    }
  } catch (error: any) {
    console.warn(`⚠️  Could not read current settings: ${error.message}\n`);
  }

  // Update bridge address
  console.log("1️⃣ Setting liquidity bridge address...");
  try {
    const tx1 = await factory.setLiquidityBridge(bridgeAddress);
    await tx1.wait();
    console.log(`   ✅ Bridge address set: ${bridgeAddress}`);
    console.log(`   TX: ${tx1.hash}\n`);
  } catch (error: any) {
    console.error(`   ❌ Failed to set bridge address: ${error.message}\n`);
    process.exit(1);
  }

  // Enable bridge usage
  console.log("2️⃣ Enabling liquidity bridge usage...");
  try {
    const tx2 = await factory.setUseLiquidityBridge(true);
    await tx2.wait();
    console.log(`   ✅ Bridge usage enabled`);
    console.log(`   TX: ${tx2.hash}\n`);
  } catch (error: any) {
    console.error(`   ❌ Failed to enable bridge: ${error.message}\n`);
    process.exit(1);
  }

  // Verify
  console.log("3️⃣ Verifying configuration...");
  try {
    const finalBridge = await factory.liquidityBridge();
    const finalUse = await factory.useLiquidityBridge();
    
    if (finalBridge.toLowerCase() === bridgeAddress.toLowerCase() && finalUse) {
      console.log("   ✅ TokenFactory configured successfully!\n");
    } else {
      console.warn("   ⚠️  Configuration may not be correct");
      console.warn(`   Bridge: ${finalBridge}`);
      console.warn(`   Use: ${finalUse}\n`);
    }
  } catch (error: any) {
    console.warn(`   ⚠️  Could not verify: ${error.message}\n`);
  }

  console.log("✅ TokenFactory update complete!");
  console.log("\n📝 New tokens created through this factory will automatically use the bridge.\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Update failed:");
    console.error(error);
    process.exit(1);
  });

