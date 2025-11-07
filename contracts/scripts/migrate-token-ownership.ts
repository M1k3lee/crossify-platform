import { ethers } from "hardhat";
import hre from "hardhat";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

/**
 * Migration script to transfer token ownership from factory to creators
 * 
 * This script:
 * 1. Connects to the TokenFactory contract
 * 2. For each token created, transfers ownership from factory to creator
 * 3. Can be run multiple times safely (only transfers if factory is owner)
 * 
 * Usage:
 * npx hardhat run scripts/migrate-token-ownership.ts --network <network>
 */

async function main() {
  const signers = await ethers.getSigners();
  const deployer = signers[0];
  const network = hre.network.name;
  
  console.log("\n🔄 Token Ownership Migration Script");
  console.log(`📋 Network: ${network}`);
  console.log(`👤 Deployer: ${deployer.address}`);
  
  // Get TokenFactory address from environment or use default
  const TOKEN_FACTORY_ADDRESS = process.env.TOKEN_FACTORY_ADDRESS;
  if (!TOKEN_FACTORY_ADDRESS) {
    console.error("❌ ERROR: TOKEN_FACTORY_ADDRESS not found in environment!");
    console.error("Please set TOKEN_FACTORY_ADDRESS in your .env file");
    process.exit(1);
  }
  
  console.log(`🏭 TokenFactory: ${TOKEN_FACTORY_ADDRESS}`);
  
  // Connect to TokenFactory
  const TokenFactory = await ethers.getContractFactory("TokenFactory");
  const factory = TokenFactory.attach(TOKEN_FACTORY_ADDRESS);
  
  // Get all tokens created by this factory
  let tokenAddresses: string[] = [];
  
  try {
    // Try to use getAllTokens() function if available (newer factory versions)
    tokenAddresses = await factory.getAllTokens();
    console.log(`\n📊 Found ${tokenAddresses.length} tokens via getAllTokens()`);
  } catch (error: any) {
    // Fallback: Try to get count and iterate
    console.log("⚠️  getAllTokens() not available, trying alternative method...");
    try {
      const count = await factory.getTotalTokens();
      console.log(`\n📊 Found ${count} tokens via getAllTokensCount()`);
      
      for (let i = 0; i < Number(count); i++) {
        try {
          const tokenAddress = await factory.allTokens(i);
          tokenAddresses.push(tokenAddress);
        } catch (err: any) {
          console.warn(`⚠️  Could not fetch token at index ${i}: ${err.message}`);
        }
      }
    } catch (countError: any) {
      console.warn("⚠️  Could not get token count. You may need to provide token addresses manually.");
    }
  }
  
  // Option: Also allow manual token addresses if needed (for old factories or edge cases)
  const MANUAL_TOKEN_ADDRESSES: string[] = [];
  for (const addr of MANUAL_TOKEN_ADDRESSES) {
    if (addr && !tokenAddresses.includes(addr)) {
      tokenAddresses.push(addr);
    }
  }
  
  if (tokenAddresses.length === 0) {
    console.log("ℹ️  No tokens found to migrate.");
    console.log("💡 This is normal if:");
    console.log("   - No tokens have been created yet");
    console.log("   - All tokens were created with the new factory (already have correct ownership)");
    console.log("\n✅ New tokens created with this factory will automatically have correct ownership.");
    return;
  }
  
  console.log(`\n🔍 Checking ownership for ${tokenAddresses.length} tokens...\n`);
  
  let migratedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  
  // Check each token and migrate if needed
  for (const tokenAddress of tokenAddresses) {
    try {
      // Get creator
      const creator = await factory.tokenCreator(tokenAddress);
      if (creator === ethers.ZeroAddress) {
        console.log(`⏭️  Skipping ${tokenAddress} - not found in factory`);
        skippedCount++;
        continue;
      }
      
      // Connect to token contract to check owner
      const Ownable = await ethers.getContractFactory("Ownable");
      const token = Ownable.attach(tokenAddress);
      
      const currentOwner = await token.owner();
      
      if (currentOwner.toLowerCase() === factory.target.toString().toLowerCase()) {
        // Factory is owner - migrate
        console.log(`🔄 Migrating ${tokenAddress} to creator ${creator}...`);
        
        try {
          const tx = await factory.migrateTokenOwnership(tokenAddress);
          await tx.wait();
          console.log(`   ✅ Successfully migrated ${tokenAddress}`);
          migratedCount++;
        } catch (error: any) {
          console.error(`   ❌ Failed to migrate ${tokenAddress}:`, error.message);
          errorCount++;
        }
      } else if (currentOwner.toLowerCase() === creator.toLowerCase()) {
        // Already owned by creator
        console.log(`✅ ${tokenAddress} already owned by creator ${creator}`);
        skippedCount++;
      } else {
        // Owned by someone else
        console.log(`⚠️  ${tokenAddress} owned by ${currentOwner}, expected creator ${creator}`);
        skippedCount++;
      }
    } catch (error: any) {
      console.error(`❌ Error processing ${tokenAddress}:`, error.message);
      errorCount++;
    }
  }
  
  console.log("\n📊 Migration Summary:");
  console.log(`   ✅ Migrated: ${migratedCount}`);
  console.log(`   ⏭️  Skipped: ${skippedCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log(`   📦 Total: ${tokenAddresses.length}`);
  
  if (migratedCount > 0) {
    console.log("\n✅ Migration completed successfully!");
  } else {
    console.log("\n✅ No tokens needed migration (all already owned by creators)");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });



