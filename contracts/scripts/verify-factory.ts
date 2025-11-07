import { ethers } from "hardhat";
import hre from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const network = hre.network.name;
  console.log(`\n🔍 Verifying TokenFactory on ${network}...\n`);

  // Factory addresses
  const factories: Record<string, string> = {
    sepolia: "0x8142ea4C9891d2d0e314740c50cd6969b405ae32",
    bscTestnet: "0xA4c5bFA9099347Bc405B72dd1955b75dCa263573",
    baseSepolia: "0x8142ea4C9891d2d0e314740c50cd6969b405ae32",
  };

  const factoryAddress = factories[network];
  if (!factoryAddress) {
    console.error(`❌ No factory address configured for ${network}`);
    return;
  }

  console.log(`📍 Factory Address: ${factoryAddress}`);
  
  // Check if contract exists
  const code = await ethers.provider.getCode(factoryAddress);
  if (code === "0x" || code === null || code.length < 10) {
    console.error(`❌ No contract found at ${factoryAddress}`);
    console.error(`   Contract code: ${code}`);
    return;
  }

  console.log(`✅ Contract exists (${code.length / 2 - 1} bytes)`);

  // Try to create a contract instance and call a view function
  const TokenFactory = await ethers.getContractFactory("TokenFactory");
  const factory = TokenFactory.attach(factoryAddress);

  try {
    // Try to get total tokens (should work if contract is correct)
    const totalTokens = await factory.getTotalTokens();
    console.log(`✅ Contract is valid - Total tokens created: ${totalTokens.toString()}`);
    
    // Try to read owner
    const owner = await factory.owner();
    console.log(`✅ Factory owner: ${owner}`);
    
    // Try to verify the createToken function exists
    const createTokenFragment = factory.interface.getFunction("createToken");
    console.log(`✅ createToken function exists: ${createTokenFragment.format("full")}`);
    
    console.log(`\n✅ Factory contract is valid and ready to use!\n`);
  } catch (error: any) {
    console.error(`❌ Error interacting with contract:`, error.message);
    console.error(`   This suggests the contract at this address is not the TokenFactory we expect.`);
    console.error(`   The contract might be an old version or a different contract entirely.`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Verification failed:");
    console.error(error);
    process.exit(1);
  });





