import { ethers } from "hardhat";
import hre from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * Test script to verify TokenFactory is working correctly
 * Tests: Token creation, ownership, and owner functions
 */

async function main() {
  const signers = await ethers.getSigners();
  const deployer = signers[0];
  const network = hre.network.name;
  
  console.log("\n🧪 Testing TokenFactory...");
  console.log(`📋 Network: ${network}`);
  console.log(`👤 Tester: ${deployer.address}`);
  
  // Get factory address based on network
  const factoryAddresses: Record<string, string> = {
    sepolia: process.env.TOKEN_FACTORY_ADDRESS_SEPOLIA || "0xBc56A85F475515dFc9a0d5F2c185c2fB523471B0",
    bscTestnet: process.env.TOKEN_FACTORY_ADDRESS_BSCTESTNET || "0x314DFf75620f1CFB09B5aD88892Dded0A13A6c58",
    baseSepolia: process.env.TOKEN_FACTORY_ADDRESS_BASESEPOLIA || "0xBc56A85F475515dFc9a0d5F2c185c2fB523471B0",
  };
  
  const factoryAddress = factoryAddresses[network];
  if (!factoryAddress) {
    console.error(`❌ No factory address configured for ${network}`);
    process.exit(1);
  }
  
  console.log(`🏭 Factory: ${factoryAddress}`);
  
  // Connect to factory
  const TokenFactory = await ethers.getContractFactory("TokenFactory");
  const factory = TokenFactory.attach(factoryAddress);
  
  // Test 1: Verify factory owner
  console.log("\n✅ Test 1: Checking factory owner...");
  try {
    const owner = await factory.owner();
    console.log(`   Owner: ${owner}`);
    console.log(`   Tester is owner: ${owner.toLowerCase() === deployer.address.toLowerCase()}`);
  } catch (error: any) {
    console.error(`   ❌ Failed: ${error.message}`);
  }
  
  // Test 2: Create a test token
  console.log("\n✅ Test 2: Creating test token...");
  try {
    const tx = await factory.createToken(
      "Test Token",
      "TEST",
      ethers.parseEther("1000000"), // 1M tokens
      "ipfs://test", // Mock IPFS hash
      ethers.parseEther("0.0001"), // Base price
      ethers.parseEther("0.00001"), // Slope
      0, // No graduation threshold
      100, // 1% buy fee
      100  // 1% sell fee
    );
    
    console.log(`   ⏳ Transaction hash: ${tx.hash}`);
    console.log(`   ⏳ Waiting for confirmation...`);
    
    const receipt = await tx.wait();
    console.log(`   ✅ Transaction confirmed in block ${receipt?.blockNumber}`);
    
    // Get token address from events
    const tokenCreatedEvent = receipt?.logs.find((log: any) => {
      try {
        const parsed = factory.interface.parseLog(log);
        return parsed?.name === "TokenCreated";
      } catch {
        return false;
      }
    });
    
    if (tokenCreatedEvent) {
      const parsed = factory.interface.parseLog(tokenCreatedEvent);
      const tokenAddress = parsed?.args[0];
      const creator = parsed?.args[1];
      const curveAddress = parsed?.args[2];
      
      console.log(`   📍 Token Address: ${tokenAddress}`);
      console.log(`   👤 Creator: ${creator}`);
      console.log(`   📊 Curve Address: ${curveAddress}`);
      
      // Test 3: Verify token ownership
      console.log("\n✅ Test 3: Verifying token ownership...");
      try {
        const CrossChainToken = await ethers.getContractFactory("CrossChainToken");
        const token = CrossChainToken.attach(tokenAddress);
        const tokenOwner = await token.owner();
        
        console.log(`   Token Owner: ${tokenOwner}`);
        console.log(`   Expected Owner (Creator): ${creator}`);
        console.log(`   Owner matches creator: ${tokenOwner.toLowerCase() === creator.toLowerCase()}`);
        console.log(`   Owner matches tester: ${tokenOwner.toLowerCase() === deployer.address.toLowerCase()}`);
        
        if (tokenOwner.toLowerCase() === creator.toLowerCase() && creator.toLowerCase() === deployer.address.toLowerCase()) {
          console.log(`   ✅ PASS: Token is owned by creator!`);
        } else {
          console.log(`   ❌ FAIL: Token ownership is incorrect!`);
        }
      } catch (error: any) {
        console.error(`   ❌ Failed to verify ownership: ${error.message}`);
      }
      
      // Test 4: Verify creator tracking
      console.log("\n✅ Test 4: Verifying creator tracking...");
      try {
        const trackedCreator = await factory.tokenCreator(tokenAddress);
        console.log(`   Tracked Creator: ${trackedCreator}`);
        console.log(`   Matches: ${trackedCreator.toLowerCase() === creator.toLowerCase()}`);
        
        if (trackedCreator.toLowerCase() === creator.toLowerCase()) {
          console.log(`   ✅ PASS: Creator is tracked correctly!`);
        } else {
          console.log(`   ❌ FAIL: Creator tracking is incorrect!`);
        }
      } catch (error: any) {
        console.error(`   ❌ Failed to verify creator tracking: ${error.message}`);
      }
      
      // Test 5: Test mint function (if owner)
      console.log("\n✅ Test 5: Testing mint function...");
      try {
        const CrossChainToken = await ethers.getContractFactory("CrossChainToken");
        const token = CrossChainToken.attach(tokenAddress);
        const tokenOwner = await token.owner();
        
        if (tokenOwner.toLowerCase() === deployer.address.toLowerCase()) {
          console.log(`   Attempting to mint 1000 tokens...`);
          const mintTx = await token.mint(deployer.address, ethers.parseEther("1000"));
          await mintTx.wait();
          console.log(`   ✅ PASS: Mint function works!`);
        } else {
          console.log(`   ⏭️  Skipped: Tester is not the owner`);
        }
      } catch (error: any) {
        console.error(`   ❌ Failed to test mint: ${error.message}`);
      }
      
      console.log("\n✅ Test Summary:");
      console.log(`   Token Address: ${tokenAddress}`);
      const CrossChainToken = await ethers.getContractFactory("CrossChainToken");
      const tokenForSummary = CrossChainToken.attach(tokenAddress);
      const finalOwner = await tokenForSummary.owner();
      console.log(`   Token Owner: ${finalOwner}`);
      console.log(`   Creator: ${creator}`);
      console.log(`   Owner Matches Creator: ${finalOwner.toLowerCase() === creator.toLowerCase()}`);
      
    } else {
      console.error(`   ❌ Could not find TokenCreated event`);
    }
    
  } catch (error: any) {
    console.error(`   ❌ Failed to create token: ${error.message}`);
    if (error.data) {
      console.error(`   Error data: ${error.data}`);
    }
  }
  
  console.log("\n✅ Testing complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Test failed:");
    console.error(error);
    process.exit(1);
  });

