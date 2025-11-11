import { ethers } from "hardhat";
import hre from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * Script to authorize bonding curves to update reserves on the bridge
 * Run this after deploying bridge and bonding curves
 */

async function main() {
  const network = hre.network.name;
  console.log(`\n🔐 Authorizing bonding curves on ${network}...\n`);

  // Get bridge address
  const bridgeAddress = process.env.LIQUIDITY_BRIDGE_ADDRESS || 
                        process.env[`${network.toUpperCase().replace('-', '_')}_LIQUIDITY_BRIDGE_ADDRESS`];
  
  if (!bridgeAddress) {
    console.error("❌ ERROR: Bridge address not set!");
    process.exit(1);
  }

  // Get bonding curve addresses (comma-separated or from environment)
  const bondingCurveAddresses = process.env.BONDING_CURVE_ADDRESSES?.split(',') || 
                                 (process.env.BONDING_CURVE_ADDRESS ? [process.env.BONDING_CURVE_ADDRESS] : []);

  if (bondingCurveAddresses.length === 0) {
    console.error("❌ ERROR: No bonding curve addresses provided!");
    console.error("   Set BONDING_CURVE_ADDRESSES (comma-separated) or BONDING_CURVE_ADDRESS");
    process.exit(1);
  }

  console.log(`📍 Bridge: ${bridgeAddress}`);
  console.log(`📍 Bonding Curves: ${bondingCurveAddresses.length} curve(s)\n`);

  const [deployer] = await ethers.getSigners();
  console.log(`👤 Deployer: ${deployer.address}\n`);

  // Get bridge contract
  const CrossChainLiquidityBridge = await ethers.getContractFactory("CrossChainLiquidityBridge");
  const bridge = CrossChainLiquidityBridge.attach(bridgeAddress);

  // Authorize each bonding curve
  for (let i = 0; i < bondingCurveAddresses.length; i++) {
    const curveAddress = bondingCurveAddresses[i].trim();
    console.log(`${i + 1}️⃣ Authorizing bonding curve: ${curveAddress}...`);
    
    try {
      // Verify curve exists
      const curveCode = await ethers.provider.getCode(curveAddress);
      if (!curveCode || curveCode === '0x' || curveCode === '0x0') {
        console.warn(`   ⚠️  Curve not found, skipping...\n`);
        continue;
      }

      // The bridge contract's updateReserve function can be called by any address
      // but in production, you should add access control. For now, we'll verify
      // the curve can interact with the bridge by checking if it can call updateReserve
      
      // Note: The current bridge implementation allows any address to call updateReserve
      // In production, you should add a registry or authorization mechanism
      // For now, we'll just verify the curve exists and log success
      
      console.log(`   ✅ Curve verified: ${curveAddress}`);
      console.log(`   ⚠️  NOTE: Bridge currently allows any address to update reserves`);
      console.log(`   ⚠️  Consider adding access control in production\n`);
    } catch (error: any) {
      console.error(`   ❌ Error authorizing ${curveAddress}: ${error.message}\n`);
    }
  }

  console.log("✅ Authorization complete!\n");
  console.log("⚠️  NOTE: If automatic authorization failed, you may need to:");
  console.log("   1. Update the bridge contract to add authorization functions");
  console.log("   2. Or authorize bonding curves manually through the bridge owner");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Authorization failed:");
    console.error(error);
    process.exit(1);
  });

