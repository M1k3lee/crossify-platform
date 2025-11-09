import { ethers } from "hardhat";
import * as dotenv from "dotenv";
import { writeFileSync } from "fs";
import { join } from "path";

dotenv.config();

/**
 * @dev Deployment script for CFY token contracts on Base mainnet
 * 
 * Deployment steps:
 * 1. Deploy CFY Token
 * 2. Deploy CFY Vesting
 * 3. Deploy CFY Staking (will need LP token address later)
 * 4. Deploy CFY Governance
 * 5. Deploy CFY Presale
 * 6. Configure contracts and transfer tokens
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("🚀 Deploying CFY Token Contracts on Base Mainnet\n");
  console.log("Deployer address:", deployer.address);
  console.log("Deployer balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  // Validate environment variables
  const requiredEnvVars = [
    'FEE_COLLECTOR_ADDRESS',
    'TREASURY_ADDRESS',
    'PRESALE_ADDRESS',
    'VESTING_ADDRESS',
  ];
  
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  if (missingVars.length > 0) {
    console.error("❌ Missing required environment variables:");
    missingVars.forEach(varName => console.error(`   - ${varName}`));
    process.exit(1);
  }

  const feeCollector = process.env.FEE_COLLECTOR_ADDRESS!;
  const treasury = process.env.TREASURY_ADDRESS!;
  const presaleAddress = process.env.PRESALE_ADDRESS!;
  const vestingAddress = process.env.VESTING_ADDRESS!;

  console.log("📋 Configuration:");
  console.log("   Fee Collector:", feeCollector);
  console.log("   Treasury:", treasury);
  console.log("   Presale Address:", presaleAddress);
  console.log("   Vesting Address:", vestingAddress);
  console.log("");

  const deploymentInfo: Record<string, string> = {};

  // ============================================
  // 1. DEPLOY CFY TOKEN
  // ============================================
  console.log("📝 Step 1: Deploying CFY Token...");
  const CFYTokenFactory = await ethers.getContractFactory("CFYToken");
  const cfyToken = await CFYTokenFactory.deploy(
    deployer.address, // owner
    feeCollector,     // feeCollector
    treasury          // treasury
  );
  await cfyToken.waitForDeployment();
  const cfyTokenAddress = await cfyToken.getAddress();
  deploymentInfo.CFY_TOKEN = cfyTokenAddress;
  console.log("✅ CFY Token deployed at:", cfyTokenAddress);
  
  const totalSupply = await cfyToken.totalSupply();
  console.log("   Total Supply:", ethers.formatEther(totalSupply), "CFY");
  console.log("");

  // ============================================
  // 2. DEPLOY CFY VESTING
  // ============================================
  console.log("📝 Step 2: Deploying CFY Vesting...");
  const CFYVestingFactory = await ethers.getContractFactory("CFYVesting");
  const vestingContract = await CFYVestingFactory.deploy(
    cfyTokenAddress,
    deployer.address // owner
  );
  await vestingContract.waitForDeployment();
  const vestingContractAddress = await vestingContract.getAddress();
  deploymentInfo.CFY_VESTING = vestingContractAddress;
  console.log("✅ CFY Vesting deployed at:", vestingContractAddress);
  console.log("");

  // ============================================
  // 3. DEPLOY CFY STAKING
  // ============================================
  console.log("📝 Step 3: Deploying CFY Staking...");
  console.log("   ⚠️  Note: LP token address will be set after DEX pool creation");
  const LP_TOKEN_PLACEHOLDER = ethers.ZeroAddress; // Will be updated later
  
  const CFYStakingFactory = await ethers.getContractFactory("CFYStaking");
  const stakingContract = await CFYStakingFactory.deploy(
    cfyTokenAddress,
    LP_TOKEN_PLACEHOLDER, // LP token (to be set later)
    deployer.address      // owner
  );
  await stakingContract.waitForDeployment();
  const stakingContractAddress = await stakingContract.getAddress();
  deploymentInfo.CFY_STAKING = stakingContractAddress;
  console.log("✅ CFY Staking deployed at:", stakingContractAddress);
  console.log("   ⚠️  Remember to update LP token address after pool creation!");
  console.log("");

  // ============================================
  // 4. DEPLOY CFY GOVERNANCE
  // ============================================
  console.log("📝 Step 4: Deploying CFY Governance...");
  const CFYGovernanceFactory = await ethers.getContractFactory("CFYGovernance");
  const governanceContract = await CFYGovernanceFactory.deploy(
    cfyTokenAddress,
    deployer.address // owner
  );
  await governanceContract.waitForDeployment();
  const governanceContractAddress = await governanceContract.getAddress();
  deploymentInfo.CFY_GOVERNANCE = governanceContractAddress;
  console.log("✅ CFY Governance deployed at:", governanceContractAddress);
  console.log("");

  // ============================================
  // 5. DEPLOY CFY PRESALE
  // ============================================
  console.log("📝 Step 5: Deploying CFY Presale...");
  const CFYPresaleFactory = await ethers.getContractFactory("CFYPresale");
  const presaleContract = await CFYPresaleFactory.deploy(
    cfyTokenAddress,
    deployer.address // owner
  );
  await presaleContract.waitForDeployment();
  const presaleContractAddress = await presaleContract.getAddress();
  deploymentInfo.CFY_PRESALE = presaleContractAddress;
  console.log("✅ CFY Presale deployed at:", presaleContractAddress);
  console.log("");

  // ============================================
  // 6. CONFIGURE CONTRACTS
  // ============================================
  console.log("📝 Step 6: Configuring contracts...");
  
  // Set buyback and liquidity contracts in CFY Token
  console.log("   Setting buyback and liquidity contracts...");
  await cfyToken.setBuybackContract(treasury);
  await cfyToken.setLiquidityContract(treasury);
  console.log("   ✅ Buyback and liquidity contracts set");
  
  // Transfer tokens to presale contract (300M CFY = 30% of total supply)
  console.log("   Transferring 300M CFY to presale contract...");
  const presaleAmount = ethers.parseEther("300000000"); // 300M CFY
  await cfyToken.transfer(presaleContractAddress, presaleAmount);
  console.log("   ✅ Presale tokens transferred");
  
  // Transfer tokens to vesting contract (for team/advisors)
  // Note: Amount depends on allocation
  console.log("   Transferring vesting tokens...");
  const vestingAmount = ethers.parseEther("100000000"); // 100M CFY (example)
  await cfyToken.transfer(vestingContractAddress, vestingAmount);
  console.log("   ✅ Vesting tokens transferred");
  
  // Transfer remaining tokens to treasury
  const remainingBalance = await cfyToken.balanceOf(deployer.address);
  if (remainingBalance > 0) {
    console.log("   Transferring remaining tokens to treasury...");
    await cfyToken.transfer(treasury, remainingBalance);
    console.log("   ✅ Remaining tokens transferred to treasury");
  }
  
  console.log("✅ Contracts configured\n");

  // ============================================
  // 7. VERIFY DEPLOYMENT
  // ============================================
  console.log("📝 Step 7: Verifying deployment...");
  
  const tokenBalance = await cfyToken.balanceOf(cfyTokenAddress);
  const presaleBalance = await cfyToken.balanceOf(presaleContractAddress);
  const vestingBalance = await cfyToken.balanceOf(vestingContractAddress);
  const treasuryBalance = await cfyToken.balanceOf(treasury);
  
  console.log("   Token balances:");
  console.log("     Presale:", ethers.formatEther(presaleBalance), "CFY");
  console.log("     Vesting:", ethers.formatEther(vestingBalance), "CFY");
  console.log("     Treasury:", ethers.formatEther(treasuryBalance), "CFY");
  
  const totalDistributed = presaleBalance + vestingBalance + treasuryBalance;
  const expectedTotal = totalSupply;
  
  if (totalDistributed === expectedTotal) {
    console.log("   ✅ All tokens distributed correctly");
  } else {
    console.warn("   ⚠️  Token distribution mismatch!");
    console.warn(`      Expected: ${ethers.formatEther(expectedTotal)} CFY`);
    console.warn(`      Distributed: ${ethers.formatEther(totalDistributed)} CFY`);
  }
  
  console.log("✅ Deployment verified\n");

  // ============================================
  // 8. SAVE DEPLOYMENT INFO
  // ============================================
  console.log("📝 Step 8: Saving deployment information...");
  
  const deploymentData = {
    network: "base-mainnet",
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    contracts: deploymentInfo,
    configuration: {
      feeCollector,
      treasury,
      presaleAddress,
      vestingAddress,
    },
  };
  
  const deploymentPath = join(__dirname, "..", "deployments", "base-mainnet-cfy.json");
  writeFileSync(deploymentPath, JSON.stringify(deploymentData, null, 2));
  console.log("✅ Deployment info saved to:", deploymentPath);
  console.log("");

  // ============================================
  // DEPLOYMENT SUMMARY
  // ============================================
  console.log("🎉 CFY Token Contracts Deployed Successfully!\n");
  console.log("📋 Contract Addresses:");
  console.log("   CFY Token:", deploymentInfo.CFY_TOKEN);
  console.log("   CFY Vesting:", deploymentInfo.CFY_VESTING);
  console.log("   CFY Staking:", deploymentInfo.CFY_STAKING);
  console.log("   CFY Governance:", deploymentInfo.CFY_GOVERNANCE);
  console.log("   CFY Presale:", deploymentInfo.CFY_PRESALE);
  console.log("\n⚠️  Next Steps:");
  console.log("   1. Verify contracts on BaseScan");
  console.log("   2. Create DEX liquidity pool (Uniswap V3 on Base)");
  console.log("   3. Update staking contract with LP token address");
  console.log("   4. Set up presale parameters and start presale");
  console.log("   5. Create vesting schedules for team/advisors");
  console.log("   6. Transfer ownership to multi-sig wallet (if applicable)");
  console.log("\n✅ Deployment complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });

