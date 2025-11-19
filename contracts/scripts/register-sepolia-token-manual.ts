/**
 * Manually register the correct Sepolia token address
 */

import { ethers } from "ethers";
import * as dotenv from "dotenv";

dotenv.config();

const TOKEN_ID = "ea23015c-d3c7-40e1-8cb3-94d2cbd813b9";
const SEPOLIA_TOKEN_ADDRESS = "0x84c7959EEbCC0307Ca0A3Cf3d338C215A1bB24Cb";
const TOKEN_ID_REGISTRY_SEPOLIA = "0x4f3854445c33E9cf42b40B0AB36f4Dd58c23331f";
const RPC_URL_SEPOLIA = process.env.RPC_URL_SEPOLIA || "https://ethereum-sepolia-rpc.publicnode.com";

function uuidToBytes32(uuidString: string): string {
  const uuidWithoutDashes = uuidString.replace(/-/g, '');
  const bytes = ethers.toUtf8Bytes(uuidWithoutDashes);
  return ethers.keccak256(bytes);
}

async function main() {
  const ownerPrivateKey = process.env.PRIVATE_KEY || process.env.ETHEREUM_PRIVATE_KEY;
  
  if (!ownerPrivateKey) {
    console.error("❌ ERROR: PRIVATE_KEY not found!");
    process.exit(1);
  }
  
  const provider = new ethers.JsonRpcProvider(RPC_URL_SEPOLIA);
  const wallet = new ethers.Wallet(ownerPrivateKey.replace(/^0x/, ''), provider);
  
  const registryABI = [
    "function owner() external view returns (address)",
    "function registerToken(address tokenAddress, bytes32 tokenId, string memory chain) external",
    "function isRegistered(address tokenAddress) external view returns (bool)",
  ];
  
  const registry = new ethers.Contract(TOKEN_ID_REGISTRY_SEPOLIA, registryABI, wallet);
  
  // Check if already registered
  const isRegistered = await registry.isRegistered(SEPOLIA_TOKEN_ADDRESS);
  if (isRegistered) {
    console.log("✅ Token already registered");
    return;
  }
  
  // Convert UUID to bytes32
  const tokenIdBytes32 = uuidToBytes32(TOKEN_ID);
  
  console.log(`\n🔧 Registering Sepolia token:`);
  console.log(`   Token ID: ${TOKEN_ID}`);
  console.log(`   Token Address: ${SEPOLIA_TOKEN_ADDRESS}`);
  console.log(`   Token ID (bytes32): ${tokenIdBytes32}\n`);
  
  // Register
  const tx = await registry.registerToken(SEPOLIA_TOKEN_ADDRESS, tokenIdBytes32, "sepolia");
  console.log(`⏳ Transaction sent: ${tx.hash}`);
  await tx.wait();
  console.log(`✅ Transaction confirmed: ${tx.hash}\n`);
  
  // Verify
  const registered = await registry.isRegistered(SEPOLIA_TOKEN_ADDRESS);
  if (registered) {
    console.log("✅ Token successfully registered in TokenIDRegistry!");
  } else {
    console.log("❌ Registration verification failed");
  }
}

main().catch(console.error);

