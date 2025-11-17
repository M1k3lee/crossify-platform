import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * Verify bonding curve configuration for all chains
 * 
 * Usage:
 *   npx hardhat run scripts/verify-all-chains.ts
 */
async function main() {
  console.log("\n🔍 Verifying bonding curve configuration for all chains...\n");

  const chains = [
    {
      name: "Base Sepolia",
      network: "baseSepolia",
      curveAddress: "0xc4d1BfaEacCFFf0F359D6E7cDD4026D32A74949E",
      globalSupplyTracker: "0x1eC9ee96EbD41111ad7b99f29D9a61e46b721C65",
    },
    {
      name: "BSC Testnet",
      network: "bscTestnet",
      curveAddress: "0x681B22f4A1AD0c2b7Bd4DfBf6B8b60De8d45de71",
      globalSupplyTracker: "0xe84Ae64735261F441e0bcB12bCf60630c5239ef4",
    },
    {
      name: "Sepolia",
      network: "sepolia",
      curveAddress: "0xdB3B190424Ff8e61091Ca1c672edDc56c75F12d2",
      globalSupplyTracker: "0x130195A8D09dfd99c36D5903B94088EDBD66533e",
    },
  ];

  const BondingCurveABI = [
    "function globalSupplyTracker() external view returns (address)",
    "function useGlobalSupply() external view returns (bool)",
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
    issues: string[];
  }> = [];

  for (const chain of chains) {
    console.log("=".repeat(60));
    console.log(`${chain.name}`);
    console.log("=".repeat(60));
    console.log(`Curve Address: ${chain.curveAddress}\n`);

    try {
      // Switch network provider
      const networkConfig = hre.config.networks[chain.network];
      if (!networkConfig || !networkConfig.url) {
        console.log(`⚠️  Network ${chain.network} not configured in hardhat.config.ts\n`);
        continue;
      }

      const provider = new ethers.JsonRpcProvider(networkConfig.url);
      const curve = new ethers.Contract(chain.curveAddress, BondingCurveABI, provider);

      const tracker = await curve.globalSupplyTracker();
      const useGlobal = await curve.useGlobalSupply();
      const currentPrice = await curve.getCurrentPrice();
      const localSupply = await curve.totalSupplySold();

      let authorized = false;
      const issues: string[] = [];

      if (tracker === ethers.ZeroAddress) {
        issues.push("GlobalSupplyTracker not set");
      } else {
        try {
          const trackerContract = new ethers.Contract(tracker, GlobalSupplyTrackerABI, provider);
          authorized = await trackerContract.authorizedUpdaters(chain.curveAddress);
          if (!authorized) {
            issues.push("Not authorized in GlobalSupplyTracker");
          }
        } catch {
          issues.push("Could not check authorization");
        }
      }

      if (!useGlobal) {
        issues.push("useGlobalSupply is disabled");
      }

      const priceUSD = (parseFloat(ethers.formatEther(currentPrice)) * 3000).toFixed(6);

      console.log(`Global Supply Tracker: ${tracker}`);
      console.log(`Use Global Supply: ${useGlobal ? "✅ YES" : "❌ NO"}`);
      console.log(`Authorized: ${authorized ? "✅ YES" : "❌ NO"}`);
      console.log(`Current Price: ${ethers.formatEther(currentPrice)} ETH ($${priceUSD})`);
      console.log(`Local Supply: ${ethers.formatEther(localSupply)} tokens`);

      if (issues.length > 0) {
        console.log(`\n⚠️  Issues:`);
        issues.forEach(issue => console.log(`   - ${issue}`));
      }

      results.push({
        chain: chain.name,
        curve: chain.curveAddress,
        tracker: tracker,
        useGlobal,
        authorized,
        price: priceUSD,
        localSupply: ethers.formatEther(localSupply),
        issues,
      });

    } catch (error: any) {
      console.error(`❌ Error checking ${chain.name}: ${error.message}`);
      if (error.message.includes("could not decode result data")) {
        console.error("   Contract might not exist or address is incorrect");
      }
    }

    console.log("");
  }

  // Summary
  console.log("=".repeat(60));
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
    const status = r.issues.length === 0 ? "✅ OK" : `❌ ${r.issues.join(", ")}`;
    console.log(`   ${r.chain}: ${status}`);
  });

  const allConfigured = results.every(r => r.issues.length === 0);
  const allPricesMatch = !priceVariance;

  if (allConfigured && allPricesMatch) {
    console.log("\n✅ All chains are properly configured and prices are synced!");
  } else {
    console.log("\n❌ Issues found. Run fix scripts to resolve.");
    console.log("\nTo fix:");
    console.log("1. Run fix-bonding-curve-config.ts for each chain with issues");
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

