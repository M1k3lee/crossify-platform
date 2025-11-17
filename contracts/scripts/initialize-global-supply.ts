import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * Initialize global supply by having each bonding curve update it
 * Since only authorized bonding curves can call updateSupply, we need to
 * trigger an update from each curve. The easiest way is to make a tiny
 * buy transaction (0.000001 ETH) on each chain to trigger the update.
 */
async function main() {
  console.log("\n🔧 Initializing global supply across all chains...\n");
  console.log("📝 Note: This will make a tiny buy transaction on each chain");
  console.log("   to trigger the bonding curve to update global supply.\n");

  const ownerPrivateKey = process.env.ETHEREUM_PRIVATE_KEY || process.env.PRIVATE_KEY;
  
  if (!ownerPrivateKey) {
    console.error("❌ ERROR: ETHEREUM_PRIVATE_KEY or PRIVATE_KEY not found!");
    process.exit(1);
  }

  const chains = [
    {
      name: "Base Sepolia",
      rpcUrl: process.env.BASE_SEPOLIA_RPC_URL || "https://base-sepolia-rpc.publicnode.com",
      curve: "0xc4d1BfaEacCFFf0F359D6E7cDD4026D32A74949E",
    },
    {
      name: "BSC Testnet",
      rpcUrl: process.env.BSC_TESTNET_RPC_URL || "https://bsc-testnet.publicnode.com",
      curve: "0x681B22f4A1AD0c2b7Bd4DfBf6B8b60De8d45de71",
    },
    {
      name: "Sepolia",
      rpcUrl: process.env.SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com",
      curve: "0xdB3B190424Ff8e61091Ca1c672edDc56c75F12d2",
    },
  ];

  const BondingCurveABI = [
    "function buy(uint256 tokenAmount) external payable",
    "function getCurrentPrice() external view returns (uint256)",
    "function totalSupplySold() external view returns (uint256)",
  ];

  for (const chain of chains) {
    console.log("=".repeat(60));
    console.log(`${chain.name}`);
    console.log("=".repeat(60));

    try {
      const provider = new ethers.JsonRpcProvider(chain.rpcUrl);
      const wallet = new ethers.Wallet(ownerPrivateKey.replace(/^0x/, ''), provider);
      const curve = new ethers.Contract(chain.curve, BondingCurveABI, wallet);

      // Check current state
      const currentPrice = await curve.getCurrentPrice();
      const currentSupply = await curve.totalSupplySold();
      
      console.log(`Current Price: ${ethers.formatEther(currentPrice)} ETH`);
      console.log(`Current Supply: ${ethers.formatEther(currentSupply)} tokens`);

      // Buy the smallest possible amount (1 wei of tokens)
      // This will trigger updateSupply in GlobalSupplyTracker
      const tokenAmount = 1n; // 1 wei
      const price = await curve.getCurrentPrice();
      const totalCost = price + (price * 500n / 10000n); // Add 5% fee buffer

      console.log(`\n📝 Making tiny buy to trigger global supply update...`);
      console.log(`   Token Amount: ${tokenAmount} wei`);
      console.log(`   Estimated Cost: ${ethers.formatEther(totalCost)} ETH`);

      // Check balance
      const balance = await provider.getBalance(wallet.address);
      if (balance < totalCost) {
        console.error(`❌ Insufficient balance: ${ethers.formatEther(balance)} ETH`);
        console.log(`   Need at least: ${ethers.formatEther(totalCost)} ETH`);
        console.log(`\n⏭️  Skipping ${chain.name}...\n`);
        continue;
      }

      // Make the buy transaction
      const tx = await curve.buy(tokenAmount, { value: totalCost });
      console.log(`   Transaction: ${tx.hash}`);
      console.log(`   Waiting for confirmation...`);
      const receipt = await tx.wait();
      console.log(`✅ Buy successful! Block: ${receipt.blockNumber}`);
      console.log(`   This should have triggered global supply update.\n`);

    } catch (error: any) {
      console.error(`❌ Error: ${error.message}`);
      if (error.reason) {
        console.error(`   Reason: ${error.reason}`);
      }
      console.log(`\n⏭️  Continuing to next chain...\n`);
    }
  }

  console.log("=".repeat(60));
  console.log("✅ Initialization complete!");
  console.log("=".repeat(60));
  console.log("\n📝 Next steps:");
  console.log("1. Wait a few seconds for transactions to confirm");
  console.log("2. Run check-global-supply.ts to verify global supply is set");
  console.log("3. Run verify-all-chains.ts to check prices are synced");
  console.log("\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

