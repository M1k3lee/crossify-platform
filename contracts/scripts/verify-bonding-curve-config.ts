import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * Verify bonding curve configuration for cross-chain price sync
 * 
 * Usage:
 *   npx hardhat run scripts/verify-bonding-curve-config.ts --network baseSepolia
 * 
 * Or provide curve address:
 *   CURVE_ADDRESS=0x... npx hardhat run scripts/verify-bonding-curve-config.ts --network baseSepolia
 */
async function main() {
  const network = hre.network.name;
  console.log(`\n🔍 Verifying bonding curve configuration on ${network}...\n`);

  const curveAddress = process.env.CURVE_ADDRESS;
  if (!curveAddress) {
    console.error("❌ ERROR: CURVE_ADDRESS environment variable not set");
    console.error("   Usage: CURVE_ADDRESS=0x... npx hardhat run scripts/verify-bonding-curve-config.ts --network <network>");
    process.exit(1);
  }

  console.log(`📍 Bonding Curve Address: ${curveAddress}`);

  // Get bonding curve contract
  const BondingCurveABI = [
    "function globalSupplyTracker() external view returns (address)",
    "function useGlobalSupply() external view returns (bool)",
    "function chainName() external view returns (string)",
    "function basePrice() external view returns (uint256)",
    "function slope() external view returns (uint256)",
    "function totalSupplySold() external view returns (uint256)",
    "function getCurrentPrice() external view returns (uint256)",
    "function getSupplyForPricing() external view returns (uint256)",
  ];

  const curve = new ethers.Contract(curveAddress, BondingCurveABI, ethers.provider);

  try {
    // Check configuration
    const globalSupplyTracker = await curve.globalSupplyTracker();
    const useGlobalSupply = await curve.useGlobalSupply();
    const chainName = await curve.chainName();
    const basePrice = await curve.basePrice();
    const slope = await curve.slope();
    const totalSupplySold = await curve.totalSupplySold();
    const currentPrice = await curve.getCurrentPrice();
    const supplyForPricing = await curve.getSupplyForPricing().catch(() => null);

    console.log("\n📊 Configuration:");
    console.log(`   Chain Name: ${chainName}`);
    console.log(`   Global Supply Tracker: ${globalSupplyTracker}`);
    console.log(`   Use Global Supply: ${useGlobalSupply ? "✅ YES" : "❌ NO"}`);
    console.log(`   Base Price: ${ethers.formatEther(basePrice)} ETH`);
    console.log(`   Slope: ${ethers.formatEther(slope)} ETH per token`);
    console.log(`   Local Supply: ${ethers.formatEther(totalSupplySold)} tokens`);
    if (supplyForPricing) {
      console.log(`   Supply for Pricing: ${ethers.formatEther(supplyForPricing)} tokens`);
      if (supplyForPricing.toString() !== totalSupplySold.toString()) {
        console.log(`   ⚠️  Using GLOBAL supply (different from local)`);
      } else {
        console.log(`   ⚠️  Using LOCAL supply (same as local)`);
      }
    }
    console.log(`   Current Price: ${ethers.formatEther(currentPrice)} ETH ($${(parseFloat(ethers.formatEther(currentPrice)) * 3000).toFixed(6)})`);

    // Check if GlobalSupplyTracker is configured
    if (globalSupplyTracker === ethers.ZeroAddress) {
      console.log("\n❌ ISSUE: GlobalSupplyTracker is not set (address is zero)");
      console.log("   Fix: Call setGlobalSupplyTracker() on the bonding curve");
    } else {
      console.log("\n✅ GlobalSupplyTracker is set");

      // Check if GlobalSupplyTracker contract exists
      const code = await ethers.provider.getCode(globalSupplyTracker);
      if (code === "0x") {
        console.log("❌ ISSUE: GlobalSupplyTracker contract does not exist at that address");
      } else {
        console.log("✅ GlobalSupplyTracker contract exists");

        // Check if bonding curve is authorized
        const GlobalSupplyTrackerABI = [
          "function authorizedUpdaters(address) external view returns (bool)",
        ];
        const tracker = new ethers.Contract(globalSupplyTracker, GlobalSupplyTrackerABI, ethers.provider);
        try {
          const isAuthorized = await tracker.authorizedUpdaters(curveAddress);
          if (isAuthorized) {
            console.log("✅ Bonding curve is authorized in GlobalSupplyTracker");
          } else {
            console.log("❌ ISSUE: Bonding curve is NOT authorized in GlobalSupplyTracker");
            console.log("   Fix: Call authorizeUpdater() on GlobalSupplyTracker with bonding curve address");
          }
        } catch (error: any) {
          console.log("⚠️  Could not check authorization (contract might have different ABI)");
        }
      }
    }

    // Check if useGlobalSupply is enabled
    if (!useGlobalSupply) {
      console.log("\n❌ ISSUE: useGlobalSupply is disabled");
      console.log("   Fix: Call setUseGlobalSupply(true) on the bonding curve");
    } else {
      console.log("\n✅ useGlobalSupply is enabled");
    }

    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("SUMMARY");
    console.log("=".repeat(60));

    const issues: string[] = [];
    if (globalSupplyTracker === ethers.ZeroAddress) {
      issues.push("GlobalSupplyTracker not set");
    }
    if (!useGlobalSupply) {
      issues.push("useGlobalSupply is disabled");
    }

    if (issues.length === 0) {
      console.log("✅ Bonding curve is properly configured for cross-chain price sync!");
    } else {
      console.log("❌ Issues found:");
      issues.forEach((issue, i) => console.log(`   ${i + 1}. ${issue}`));
      console.log("\n💡 Run the fix script to resolve these issues.");
    }

  } catch (error: any) {
    console.error("\n❌ Error verifying bonding curve:", error.message);
    if (error.message.includes("could not decode result data")) {
      console.error("   This might mean the contract address is incorrect or the contract doesn't exist.");
    }
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

