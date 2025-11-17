import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * Verify cross-chain configuration for a token across all chains
 * 
 * This script checks:
 * - Bonding curve addresses on each chain
 * - GlobalSupplyTracker configuration
 * - useGlobalSupply status
 * - Authorization status
 * 
 * Usage:
 *   TOKEN_ID=9ed6d4f6-02bc-4c3e-8b48-dab785d4d9af npx hardhat run scripts/verify-token-crosschain-config.ts
 * 
 * Or provide curve addresses directly:
 *   BASE_CURVE=0x... BSC_CURVE=0x... SEPOLIA_CURVE=0x... npx hardhat run scripts/verify-token-crosschain-config.ts
 */
async function main() {
  console.log("\n🔍 Verifying cross-chain configuration for token...\n");

  // Get curve addresses from environment or API
  const baseCurve = process.env.BASE_CURVE;
  const bscCurve = process.env.BSC_CURVE;
  const sepoliaCurve = process.env.SEPOLIA_CURVE;

  if (!baseCurve && !bscCurve && !sepoliaCurve) {
    const tokenId = process.env.TOKEN_ID;
    if (!tokenId) {
      console.error("❌ ERROR: No curve addresses or TOKEN_ID provided");
      console.error("   Provide either:");
      console.error("   - TOKEN_ID=<uuid> (will fetch from API)");
      console.error("   - BASE_CURVE=0x... BSC_CURVE=0x... SEPOLIA_CURVE=0x...");
      process.exit(1);
    }

    // TODO: Fetch from API
    console.error("❌ API fetching not implemented yet. Please provide curve addresses directly.");
    console.error("   BASE_CURVE=0x... BSC_CURVE=0x... SEPOLIA_CURVE=0x...");
    process.exit(1);
  }

  const chains = [
    { name: "Base Sepolia", curve: baseCurve, network: "baseSepolia" },
    { name: "BSC Testnet", curve: bscCurve, network: "bscTestnet" },
    { name: "Sepolia", curve: sepoliaCurve, network: "sepolia" },
  ].filter(c => c.curve);

  if (chains.length === 0) {
    console.error("❌ ERROR: No curve addresses provided");
    process.exit(1);
  }

  console.log(`Found ${chains.length} chain deployment(s)\n`);

  const BondingCurveABI = [
    "function globalSupplyTracker() external view returns (address)",
    "function useGlobalSupply() external view returns (bool)",
    "function chainName() external view returns (string)",
    "function getCurrentPrice() external view returns (uint256)",
    "function totalSupplySold() external view returns (uint256)",
  ];

  const GlobalSupplyTrackerABI = [
    "function authorizedUpdaters(address) external view returns (bool)",
  ];

  const results: Array<{
    chain: string;
    curve: string;
    tracker: string;
    useGlobal: boolean;
    authorized: boolean;
    price: string;
    localSupply: string;
  }> = [];

  for (const chain of chains) {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`${chain.name}`);
    console.log("=".repeat(60));
    console.log(`Curve Address: ${chain.curve}\n`);

    try {
      // Switch to the appropriate network provider
      // For now, we'll use the default provider (you may need to configure this)
      const provider = ethers.provider;
      const curve = new ethers.Contract(chain.curve!, BondingCurveABI, provider);

      const tracker = await curve.globalSupplyTracker();
      const useGlobal = await curve.useGlobalSupply();
      const currentPrice = await curve.getCurrentPrice();
      const localSupply = await curve.totalSupplySold();

      let authorized = false;
      if (tracker !== ethers.ZeroAddress) {
        try {
          const trackerContract = new ethers.Contract(tracker, GlobalSupplyTrackerABI, provider);
          authorized = await trackerContract.authorizedUpdaters(chain.curve!);
        } catch {
          authorized = false;
        }
      }

      const priceUSD = (parseFloat(ethers.formatEther(currentPrice)) * 3000).toFixed(6);

      console.log(`Global Supply Tracker: ${tracker}`);
      console.log(`Use Global Supply: ${useGlobal ? "✅ YES" : "❌ NO"}`);
      console.log(`Authorized: ${authorized ? "✅ YES" : "❌ NO"}`);
      console.log(`Current Price: ${ethers.formatEther(currentPrice)} ETH ($${priceUSD})`);
      console.log(`Local Supply: ${ethers.formatEther(localSupply)} tokens`);

      results.push({
        chain: chain.name,
        curve: chain.curve!,
        tracker: tracker,
        useGlobal,
        authorized,
        price: priceUSD,
        localSupply: ethers.formatEther(localSupply),
      });
    } catch (error: any) {
      console.error(`❌ Error checking ${chain.name}: ${error.message}`);
      if (error.message.includes("could not decode result data")) {
        console.error("   Contract might not exist or address is incorrect");
      }
    }
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("SUMMARY");
  console.log("=".repeat(60) + "\n");

  if (results.length === 0) {
    console.log("❌ No valid configurations found");
    process.exit(1);
  }

  // Check if all prices are the same
  const prices = results.map(r => r.price);
  const uniquePrices = [...new Set(prices)];
  const priceVariance = uniquePrices.length > 1;

  console.log(`Chains checked: ${results.length}`);
  console.log(`Prices: ${prices.join(", ")}`);
  if (priceVariance) {
    console.log(`⚠️  Price variance detected! Prices should be the same across all chains.`);
  } else {
    console.log(`✅ All chains show the same price`);
  }

  console.log("\nConfiguration Status:");
  results.forEach(r => {
    const issues: string[] = [];
    if (r.tracker === ethers.ZeroAddress) issues.push("No tracker");
    if (!r.useGlobal) issues.push("useGlobalSupply disabled");
    if (!r.authorized) issues.push("Not authorized");

    const status = issues.length === 0 ? "✅ OK" : `❌ ${issues.join(", ")}`;
    console.log(`   ${r.chain}: ${status}`);
  });

  const allConfigured = results.every(r => 
    r.tracker !== ethers.ZeroAddress && r.useGlobal && r.authorized
  );

  if (allConfigured && !priceVariance) {
    console.log("\n✅ All chains are properly configured and prices are synced!");
  } else {
    console.log("\n❌ Issues found. Run fix scripts to resolve.");
    console.log("\nTo fix:");
    console.log("1. Run fix-bonding-curve-config.ts for each chain");
    console.log("2. Ensure GlobalSupplyTracker contracts are deployed");
    console.log("3. Configure cross-chain messaging");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

