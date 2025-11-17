import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("\n🔍 Checking global supply in GlobalSupplyTracker contracts...\n");

  const chains = [
    {
      name: "Base Sepolia",
      network: "baseSepolia",
      rpcUrl: process.env.BASE_SEPOLIA_RPC_URL || "https://base-sepolia-rpc.publicnode.com",
      tracker: "0x1eC9ee96EbD41111ad7b99f29D9a61e46b721C65",
      curve: "0xc4d1BfaEacCFFf0F359D6E7cDD4026D32A74949E",
    },
    {
      name: "BSC Testnet",
      network: "bscTestnet",
      rpcUrl: process.env.BSC_TESTNET_RPC_URL || "https://bsc-testnet.publicnode.com",
      tracker: "0xe84Ae64735261F441e0bcB12bCf60630c5239ef4",
      curve: "0x681B22f4A1AD0c2b7Bd4DfBf6B8b60De8d45de71",
    },
    {
      name: "Sepolia",
      network: "sepolia",
      rpcUrl: process.env.SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com",
      tracker: "0x130195A8D09dfd99c36D5903B94088EDBD66533e",
      curve: "0xdB3B190424Ff8e61091Ca1c672edDc56c75F12d2",
    },
  ];

  // We need to know the token address - let's check what token these curves are for
  // For now, let's check if we can get the token address from the bonding curve
  const BondingCurveABI = [
    "function token() external view returns (address)",
    "function totalSupplySold() external view returns (uint256)",
  ];

  const GlobalSupplyTrackerABI = [
    "function globalSupply(address) external view returns (uint256)",
    "function chainSupply(address, string) external view returns (uint256)",
  ];

  for (const chain of chains) {
    console.log("=".repeat(60));
    console.log(`${chain.name}`);
    console.log("=".repeat(60));

    try {
      const provider = new ethers.JsonRpcProvider(chain.rpcUrl);
      const curve = new ethers.Contract(chain.curve, BondingCurveABI, provider);
      const tracker = new ethers.Contract(chain.tracker, GlobalSupplyTrackerABI, provider);

      // Get token address from bonding curve
      const tokenAddress = await curve.token();
      console.log(`Token Address: ${tokenAddress}`);

      // Get local supply from bonding curve
      const localSupply = await curve.totalSupplySold();
      console.log(`Local Supply: ${ethers.formatEther(localSupply)} tokens`);

      // Get global supply from tracker
      const globalSupply = await tracker.globalSupply(tokenAddress);
      console.log(`Global Supply: ${ethers.formatEther(globalSupply)} tokens`);

      // Get chain-specific supply
      const chainName = chain.name === "Base Sepolia" ? "base-sepolia" : 
                       chain.name === "BSC Testnet" ? "bsc-testnet" : "sepolia";
      const chainSupply = await tracker.chainSupply(tokenAddress, chainName);
      console.log(`Chain Supply (${chainName}): ${ethers.formatEther(chainSupply)} tokens`);

      if (globalSupply === 0n) {
        console.log(`\n⚠️  WARNING: Global supply is 0!`);
        console.log(`   The global supply needs to be initialized with the sum of all local supplies.`);
        console.log(`   Expected global supply: ${ethers.formatEther(localSupply)} tokens (from this chain)`);
      } else if (globalSupply !== localSupply) {
        console.log(`\n✅ Global supply is set (${ethers.formatEther(globalSupply)}), but differs from local supply.`);
        console.log(`   This is expected if there are tokens on other chains.`);
      } else {
        console.log(`\n✅ Global supply matches local supply.`);
      }

    } catch (error: any) {
      console.error(`❌ Error: ${error.message}`);
    }

    console.log("");
  }

  console.log("=".repeat(60));
  console.log("📝 Note: Prices will sync once global supply is updated.");
  console.log("   This happens automatically when a buy/sell transaction occurs.");
  console.log("=".repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

