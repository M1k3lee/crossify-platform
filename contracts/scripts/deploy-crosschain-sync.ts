import { ethers } from "hardhat";
import hre from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

// LayerZero Endpoint addresses for testnets
const LZ_ENDPOINTS: Record<string, string> = {
  sepolia: "0x6EDCE65403992e310A62460808c4b910D972f10f", // Sepolia LayerZero Endpoint
  bscTestnet: "0x6EDCE65403992e310A62460808c4b910D972f10f", // BSC Testnet LayerZero Endpoint
  baseSepolia: "0x6EDCE65403992e310A62460808c4b910D972f10f", // Base Sepolia LayerZero Endpoint
};

async function main() {
  if (!process.env.PRIVATE_KEY || process.env.PRIVATE_KEY.trim() === '') {
    console.error("❌ ERROR: PRIVATE_KEY not found in environment!");
    process.exit(1);
  }

  try {
    await ethers.provider.getBlockNumber();
    console.log(`✅ Connected to network. Current block: ${await ethers.provider.getBlockNumber()}`);
  } catch (error) {
    console.error("❌ ERROR: Cannot connect to RPC endpoint!");
    process.exit(1);
  }

  const signers = await ethers.getSigners();
  const deployer = signers[0];
  const network = hre.network.name;

  console.log("\n🚀 Deploying CrossChainSync contract...");
  console.log(`📋 Network: ${network}`);
  console.log(`👤 Deployer: ${deployer.address}`);
  console.log(`💰 Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH/BNB`);

  // Get LayerZero endpoint address
  const lzEndpoint = LZ_ENDPOINTS[network];
  if (!lzEndpoint) {
    console.error(`❌ ERROR: No LayerZero endpoint configured for ${network}`);
    console.error(`   Available networks: ${Object.keys(LZ_ENDPOINTS).join(", ")}`);
    process.exit(1);
  }

  console.log(`\n📍 LayerZero Endpoint: ${lzEndpoint}`);

  // Verify endpoint exists (but don't fail if it doesn't - LayerZero might not be on testnet yet)
  try {
    const endpointCode = await ethers.provider.getCode(lzEndpoint);
    if (!endpointCode || endpointCode === '0x' || endpointCode === '0x0') {
      console.warn(`⚠️  WARNING: LayerZero endpoint not found at ${lzEndpoint}`);
      console.warn(`   This might be expected if LayerZero v2 is not yet deployed on ${network}`);
      console.warn(`   Deployment will continue, but cross-chain sync won't work until endpoint is configured`);
    } else {
      console.log(`✅ LayerZero endpoint verified`);
    }
  } catch (error) {
    console.warn(`⚠️  Could not verify endpoint: ${error}`);
  }

  console.log("\n📦 Deploying CrossChainSync contract...");
  const CrossChainSync = await ethers.getContractFactory("CrossChainSync");
  const crossChainSync = await CrossChainSync.deploy(lzEndpoint);

  console.log(`⏳ Transaction hash: ${crossChainSync.deploymentTransaction()?.hash}`);
  console.log("⏳ Waiting for deployment confirmation...");

  await crossChainSync.waitForDeployment();
  const syncAddress = await crossChainSync.getAddress();

  console.log(`\n✅ CrossChainSync deployed to: ${syncAddress}`);
  console.log(`\n📝 Please update your .env file with:`);
  console.log(`   VITE_CROSS_CHAIN_SYNC_${network.toUpperCase()}=${syncAddress}`);
  console.log(`\n🔍 Verify on block explorer:`);
  const explorerUrl = (hre.config.etherscan.customChains as any[])?.find(c => c.network === network)?.urls?.browserURL || 'https://etherscan.io';
  console.log(`   ${explorerUrl}/address/${syncAddress}`);
  
  console.log(`\n⚠️  IMPORTANT: Authorize this contract in LayerZero endpoint if needed`);
  console.log(`   And update TokenFactory with this address for cross-chain token creation`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });

