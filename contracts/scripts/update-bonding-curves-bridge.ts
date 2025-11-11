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

// BondingCurve ABI
const BONDING_CURVE_ABI = [
  'function setLiquidityBridge(address _bridge) external',
  'function setChainEID(uint32 _eid) external',
  'function setUseLiquidityBridge(bool _use) external',
  'function liquidityBridge() external view returns (address)',
  'function chainEID() external view returns (uint32)',
  'function useLiquidityBridge() external view returns (bool)',
];

async function main() {
  const network = hre.network.name;
  console.log(`\n🔧 Updating Bonding Curves on ${network}...\n`);

  // Get curve addresses from environment (comma-separated)
  const curveAddresses = process.env.BONDING_CURVE_ADDRESSES?.split(',').map(a => a.trim()) || [];

  if (curveAddresses.length === 0) {
    console.error("❌ ERROR: No bonding curve addresses provided!");
    console.error("   Set BONDING_CURVE_ADDRESSES (comma-separated) in .env");
    console.error("   Example: BONDING_CURVE_ADDRESSES=0x...,0x...,0x...");
    process.exit(1);
  }

  const bridgeAddress = BRIDGE_ADDRESSES[network];
  const chainEID = CHAIN_EIDS[network];

  if (!bridgeAddress || !chainEID) {
    console.error(`❌ ERROR: Bridge not deployed on ${network}`);
    process.exit(1);
  }

  console.log(`📍 Bridge: ${bridgeAddress}`);
  console.log(`📍 Chain EID: ${chainEID}`);
  console.log(`📍 Curves to update: ${curveAddresses.length}\n`);

  const [deployer] = await ethers.getSigners();
  console.log(`👤 Deployer: ${deployer.address}\n`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < curveAddresses.length; i++) {
    const curveAddress = curveAddresses[i];
    console.log(`${i + 1}️⃣ Updating curve: ${curveAddress}...`);

    try {
      // Verify curve exists
      const curveCode = await ethers.provider.getCode(curveAddress);
      if (!curveCode || curveCode === '0x' || curveCode === '0x0') {
        console.warn(`   ⚠️  Curve not found, skipping...\n`);
        failCount++;
        continue;
      }

      const curve = new ethers.Contract(curveAddress, BONDING_CURVE_ABI, deployer);

      // Check current settings
      try {
        const currentBridge = await curve.liquidityBridge();
        const currentEID = await curve.chainEID();
        const currentUse = await curve.useLiquidityBridge();

        if (currentBridge.toLowerCase() === bridgeAddress.toLowerCase() && 
            currentEID === chainEID && 
            currentUse) {
          console.log(`   ✅ Already configured correctly\n`);
          successCount++;
          continue;
        }
      } catch (error) {
        // Continue with update
      }

      // Update bridge address
      const tx1 = await curve.setLiquidityBridge(bridgeAddress);
      await tx1.wait();
      console.log(`   ✅ Bridge address set`);

      // Update chain EID
      const tx2 = await curve.setChainEID(chainEID);
      await tx2.wait();
      console.log(`   ✅ Chain EID set`);

      // Enable bridge
      const tx3 = await curve.setUseLiquidityBridge(true);
      await tx3.wait();
      console.log(`   ✅ Bridge enabled`);
      console.log(`   TXs: ${tx1.hash}, ${tx2.hash}, ${tx3.hash}\n`);

      successCount++;
    } catch (error: any) {
      console.error(`   ❌ Error: ${error.message}\n`);
      failCount++;
    }
  }

  console.log("=".repeat(60));
  console.log("✅ Update Summary:");
  console.log(`   Successful: ${successCount}`);
  console.log(`   Failed: ${failCount}`);
  console.log(`   Total: ${curveAddresses.length}`);
  console.log("=".repeat(60) + "\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Update failed:");
    console.error(error);
    process.exit(1);
  });

