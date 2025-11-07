import { ethers } from "hardhat";

async function main() {
  const tokenAddress = process.env.TOKEN_ADDRESS || "0xd3C8dc1d0161Ea5060796b1F84966D56da8E2508";
  const factoryAddress = process.env.TOKEN_FACTORY_ADDRESS || "0xBc56A85F475515dFc9a0d5F2c185c2fB523471B0";
  
  console.log("\n🔍 Verifying Token Ownership...");
  console.log(`Token: ${tokenAddress}`);
  console.log(`Factory: ${factoryAddress}`);
  
  const factory = await ethers.getContractAt("TokenFactory", factoryAddress);
  const token = await ethers.getContractAt("CrossChainToken", tokenAddress);
  
  const owner = await token.owner();
  const creator = await factory.tokenCreator(tokenAddress);
  
  console.log(`\n✅ Owner: ${owner}`);
  console.log(`✅ Creator: ${creator}`);
  console.log(`✅ Match: ${owner.toLowerCase() === creator.toLowerCase()}`);
  
  if (owner.toLowerCase() === creator.toLowerCase()) {
    console.log(`\n🎉 SUCCESS: Token is owned by creator!`);
  } else {
    console.log(`\n❌ FAIL: Token ownership mismatch!`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


