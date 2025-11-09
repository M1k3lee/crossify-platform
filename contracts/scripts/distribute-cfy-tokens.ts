import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * @dev Distribute CFY tokens according to tokenomics
 * 
 * Distribution:
 * - Presale: 30% (300M) → Presale contract
 * - Liquidity: 25% (250M) → Liquidity pool
 * - Team: 15% (150M) → Vesting contract (6 month cliff, 24 month vesting)
 * - Ecosystem: 15% (150M) → Ecosystem wallet
 * - Staking: 10% (100M) → Staking contract
 * - Treasury: 5% (50M) → Treasury wallet
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("🚀 Distributing CFY tokens with account:", deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  // Contract addresses (from deployment)
  const CFY_TOKEN = process.env.CFY_TOKEN_ADDRESS || "";
  const VESTING_CONTRACT = process.env.VESTING_CONTRACT_ADDRESS || "";
  const STAKING_CONTRACT = process.env.STAKING_CONTRACT_ADDRESS || "";
  
  if (!CFY_TOKEN || CFY_TOKEN === "") {
    throw new Error("CFY_TOKEN_ADDRESS environment variable is required");
  }

  // Distribution addresses
  const presaleAddress = process.env.PRESALE_ADDRESS || deployer.address;
  const liquidityAddress = process.env.LIQUIDITY_ADDRESS || deployer.address;
  const teamAddress = process.env.TEAM_ADDRESS || deployer.address;
  const ecosystemAddress = process.env.ECOSYSTEM_ADDRESS || deployer.address;
  const treasuryAddress = process.env.TREASURY_ADDRESS || deployer.address;
  
  // Distribution amounts
  const PRESALE_AMOUNT = ethers.parseEther("300000000"); // 300M (30%)
  const LIQUIDITY_AMOUNT = ethers.parseEther("250000000"); // 250M (25%)
  const TEAM_AMOUNT = ethers.parseEther("150000000"); // 150M (15%)
  const ECOSYSTEM_AMOUNT = ethers.parseEther("150000000"); // 150M (15%)
  const STAKING_AMOUNT = ethers.parseEther("100000000"); // 100M (10%)
  const TREASURY_AMOUNT = ethers.parseEther("50000000"); // 50M (5%)
  
  const TOTAL_DISTRIBUTED = PRESALE_AMOUNT + LIQUIDITY_AMOUNT + TEAM_AMOUNT + 
                           ECOSYSTEM_AMOUNT + STAKING_AMOUNT + TREASURY_AMOUNT;
  
  console.log("📊 Token Distribution Plan:");
  console.log("   Total to distribute:", ethers.formatEther(TOTAL_DISTRIBUTED), "CFY\n");
  
  // Get CFY token contract
  const CFYToken = await ethers.getContractAt("CFYToken", CFY_TOKEN);
  
  // Check deployer balance
  const deployerBalance = await CFYToken.balanceOf(deployer.address);
  console.log("   Deployer balance:", ethers.formatEther(deployerBalance), "CFY");
  require(deployerBalance >= TOTAL_DISTRIBUTED, "Insufficient CFY balance");
  
  // ============================================
  // 1. DISTRIBUTE PRESALE TOKENS
  // ============================================
  console.log("\n📝 Step 1: Distributing Presale tokens (30%)...");
  const tx1 = await CFYToken.transfer(presaleAddress, PRESALE_AMOUNT);
  await tx1.wait();
  console.log("   ✅ Transferred", ethers.formatEther(PRESALE_AMOUNT), "CFY to", presaleAddress);
  
  // ============================================
  // 2. DISTRIBUTE LIQUIDITY TOKENS
  // ============================================
  console.log("\n📝 Step 2: Distributing Liquidity tokens (25%)...");
  const tx2 = await CFYToken.transfer(liquidityAddress, LIQUIDITY_AMOUNT);
  await tx2.wait();
  console.log("   ✅ Transferred", ethers.formatEther(LIQUIDITY_AMOUNT), "CFY to", liquidityAddress);
  
  // ============================================
  // 3. DISTRIBUTE TEAM TOKENS (VESTED)
  // ============================================
  console.log("\n📝 Step 3: Distributing Team tokens (15%) to Vesting contract...");
  if (VESTING_CONTRACT && VESTING_CONTRACT !== "") {
    const CFYVesting = await ethers.getContractAt("CFYVesting", VESTING_CONTRACT);
    
    // 6 month cliff, 24 month vesting
    const SIX_MONTHS = 6 * 30 * 24 * 60 * 60; // 6 months in seconds
    const TWENTY_FOUR_MONTHS = 24 * 30 * 24 * 60 * 60; // 24 months in seconds
    
    // Approve vesting contract
    const approveTx = await CFYToken.approve(VESTING_CONTRACT, TEAM_AMOUNT);
    await approveTx.wait();
    
    // Create vesting schedule
    const vestingTx = await CFYVesting.createVestingSchedule(
      teamAddress,
      TEAM_AMOUNT,
      SIX_MONTHS,
      TWENTY_FOUR_MONTHS,
      0 // Start now
    );
    await vestingTx.wait();
    
    console.log("   ✅ Created vesting schedule for", teamAddress);
    console.log("      Amount:", ethers.formatEther(TEAM_AMOUNT), "CFY");
    console.log("      Cliff: 6 months");
    console.log("      Vesting: 24 months");
  } else {
    // If vesting contract not deployed, transfer directly (not recommended)
    console.log("   ⚠️  Vesting contract not set, transferring directly to team address");
    const tx3 = await CFYToken.transfer(teamAddress, TEAM_AMOUNT);
    await tx3.wait();
    console.log("   ✅ Transferred", ethers.formatEther(TEAM_AMOUNT), "CFY to", teamAddress);
  }
  
  // ============================================
  // 4. DISTRIBUTE ECOSYSTEM TOKENS
  // ============================================
  console.log("\n📝 Step 4: Distributing Ecosystem tokens (15%)...");
  const tx4 = await CFYToken.transfer(ecosystemAddress, ECOSYSTEM_AMOUNT);
  await tx4.wait();
  console.log("   ✅ Transferred", ethers.formatEther(ECOSYSTEM_AMOUNT), "CFY to", ecosystemAddress);
  
  // ============================================
  // 5. DISTRIBUTE STAKING REWARDS
  // ============================================
  console.log("\n📝 Step 5: Distributing Staking Rewards (10%)...");
  if (STAKING_CONTRACT && STAKING_CONTRACT !== "") {
    const tx5 = await CFYToken.transfer(STAKING_CONTRACT, STAKING_AMOUNT);
    await tx5.wait();
    console.log("   ✅ Transferred", ethers.formatEther(STAKING_AMOUNT), "CFY to staking contract");
  } else {
    console.log("   ⚠️  Staking contract not set, skipping");
  }
  
  // ============================================
  // 6. DISTRIBUTE TREASURY TOKENS
  // ============================================
  console.log("\n📝 Step 6: Distributing Treasury tokens (5%)...");
  const tx6 = await CFYToken.transfer(treasuryAddress, TREASURY_AMOUNT);
  await tx6.wait();
  console.log("   ✅ Transferred", ethers.formatEther(TREASURY_AMOUNT), "CFY to", treasuryAddress);
  
  // ============================================
  // DISTRIBUTION SUMMARY
  // ============================================
  console.log("\n🎉 Token Distribution Complete!\n");
  console.log("📊 Distribution Summary:");
  console.log("   Presale (30%):", ethers.formatEther(PRESALE_AMOUNT), "CFY →", presaleAddress);
  console.log("   Liquidity (25%):", ethers.formatEther(LIQUIDITY_AMOUNT), "CFY →", liquidityAddress);
  console.log("   Team (15%):", ethers.formatEther(TEAM_AMOUNT), "CFY →", teamAddress, "(Vested)");
  console.log("   Ecosystem (15%):", ethers.formatEther(ECOSYSTEM_AMOUNT), "CFY →", ecosystemAddress);
  console.log("   Staking (10%):", ethers.formatEther(STAKING_AMOUNT), "CFY →", STAKING_CONTRACT || "Not set");
  console.log("   Treasury (5%):", ethers.formatEther(TREASURY_AMOUNT), "CFY →", treasuryAddress);
  console.log("   Total Distributed:", ethers.formatEther(TOTAL_DISTRIBUTED), "CFY");
  
  // Check remaining balance
  const remainingBalance = await CFYToken.balanceOf(deployer.address);
  console.log("\n   Remaining Balance:", ethers.formatEther(remainingBalance), "CFY");
  
  if (remainingBalance > 0) {
    console.log("   ⚠️  Warning: There are remaining tokens in deployer address");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Distribution failed:", error);
    process.exit(1);
  });

