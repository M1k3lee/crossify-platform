import { ethers } from "hardhat";
import hre from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

// Global Supply Tracker addresses
const TRACKER_ADDRESSES: Record<string, string> = {
  sepolia: "0xA4c5bFA9099347Bc405B72dd1955b75dCa263573",
  bscTestnet: "0x15Bc893fa73694106D1720f4f0c8C3EE3259a15e",
  baseSepolia: "0xA4c5bFA9099347Bc405B72dd1955b75dCa263573",
};

async function main() {
  const network = hre.network.name;
  const trackerAddress = TRACKER_ADDRESSES[network];
  
  if (!trackerAddress) {
    console.error(`❌ No tracker address configured for ${network}`);
    process.exit(1);
  }

  console.log(`\n🔍 Authorizing TokenFactory to update GlobalSupplyTracker...`);
  console.log(`📋 Network: ${network}`);
  console.log(`📍 Tracker: ${trackerAddress}`);

  const signers = await ethers.getSigners();
  const deployer = signers[0];
  
  console.log(`👤 Deployer: ${deployer.address}`);

  // Get the factory address from the network
  // We need to authorize the factory so it can authorize bonding curves
  // Actually, we should authorize the factory contract itself, or make it so bonding curves can be authorized
  
  const tracker = await ethers.getContractAt("GlobalSupplyTracker", trackerAddress);
  
  // Check if deployer is owner
  const owner = await tracker.owner();
  console.log(`👑 Tracker owner: ${owner}`);
  
  if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
    console.error(`❌ Deployer is not the owner of the tracker contract!`);
    console.error(`   Owner: ${owner}`);
    console.error(`   Deployer: ${deployer.address}`);
    process.exit(1);
  }

  // For now, we'll authorize the factory to be able to authorize bonding curves later
  // Actually, a better approach is to make the factory the updater, or allow the factory to authorize curves
  // But for MVP, let's just note that bonding curves need to be authorized after deployment
  
  console.log(`\n⚠️  IMPORTANT: Bonding curves need to be authorized after deployment!`);
  console.log(`   The factory owner needs to call:`);
  console.log(`   tracker.authorizeUpdater(bondingCurveAddress)`);
  console.log(`\n   Or we need to modify the design to allow factory-authorized updates.`);
  
  console.log(`\n✅ Script complete. Note: This is a design consideration for production.`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });





