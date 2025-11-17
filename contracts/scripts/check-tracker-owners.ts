import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const chains = [
    { name: "Base Sepolia", network: "baseSepolia", tracker: "0x1eC9ee96EbD41111ad7b99f29D9a61e46b721C65" },
    { name: "BSC Testnet", network: "bscTestnet", tracker: "0xe84Ae64735261F441e0bcB12bCf60630c5239ef4" },
    { name: "Sepolia", network: "sepolia", tracker: "0x130195A8D09dfd99c36D5903B94088EDBD66533e" },
  ];

  const [deployer] = await ethers.getSigners();
  console.log(`\n👤 Current Deployer: ${deployer.address}\n`);

  for (const chain of chains) {
    console.log(`\n${chain.name}:`);
    console.log(`  Tracker: ${chain.tracker}`);
    
    try {
      const networkConfig = hre.config.networks[chain.network];
      if (!networkConfig || !networkConfig.url) {
        console.log(`  ⚠️  Network not configured`);
        continue;
      }

      const provider = new ethers.JsonRpcProvider(networkConfig.url);
      const tracker = new ethers.Contract(
        chain.tracker,
        ["function owner() external view returns (address)"],
        provider
      );
      
      const owner = await tracker.owner();
      console.log(`  Owner: ${owner}`);
      console.log(`  Match: ${owner.toLowerCase() === deployer.address.toLowerCase() ? "✅ YES" : "❌ NO"}`);
    } catch (error: any) {
      console.log(`  ❌ Error: ${error.message}`);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

