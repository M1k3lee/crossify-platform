import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * @dev Deploy CFY Platform Token and all supporting contracts
 * 
 * Deployment Steps:
 * 1. Deploy CFYToken (main token contract)
 * 2. Deploy CFYVesting (for team/advisor tokens)
 * 3. Deploy CFYStaking (for staking rewards)
 * 4. Deploy CFYGovernance (for voting)
 * 5. Deploy BuybackContract (for automatic buybacks)
 * 6. Deploy LiquidityProvisionContract (for liquidity provision)
 * 7. Configure all contracts
 * 8. Distribute tokens according to tokenomics
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("🚀 Deploying CFY Platform Token with account:", deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  // Get network info
  const network = await ethers.provider.getNetwork();
  console.log("📡 Network:", network.name, "(Chain ID:", network.chainId.toString(), ")\n");

  // ============================================
  // 1. DEPLOY CFY TOKEN
  // ============================================
  console.log("📝 Step 1: Deploying CFY Token...");
  const CFYTokenFactory = await ethers.getContractFactory("CFYToken");
  
  const feeCollector = process.env.FEE_COLLECTOR || deployer.address;
  const treasury = process.env.TREASURY || deployer.address;
  
  const cfyToken = await CFYTokenFactory.deploy(
    deployer.address,  // owner
    feeCollector,      // feeCollector
    treasury           // treasury
  );
  
  await cfyToken.waitForDeployment();
  const cfyTokenAddress = await cfyToken.getAddress();
  console.log("✅ CFY Token deployed at:", cfyTokenAddress);
  console.log("   Total Supply: 1,000,000,000 CFY\n");

  // ============================================
  // 2. DEPLOY VESTING CONTRACT
  // ============================================
  console.log("📝 Step 2: Deploying CFY Vesting Contract...");
  const CFYVestingFactory = await ethers.getContractFactory("CFYVesting");
  
  const vestingContract = await CFYVestingFactory.deploy(
    cfyTokenAddress,
    deployer.address
  );
  
  await vestingContract.waitForDeployment();
  const vestingAddress = await vestingContract.getAddress();
  console.log("✅ CFY Vesting deployed at:", vestingAddress, "\n");

  // ============================================
  // 3. DEPLOY STAKING CONTRACT
  // ============================================
  console.log("📝 Step 3: Deploying CFY Staking Contract...");
  const CFYStakingFactory = await ethers.getContractFactory("CFYStaking");
  
  // LP token address (will be set after liquidity pool creation)
  const lpTokenAddress = process.env.LP_TOKEN || ethers.ZeroAddress;
  
  const stakingContract = await CFYStakingFactory.deploy(
    cfyTokenAddress,
    lpTokenAddress,
    deployer.address
  );
  
  await stakingContract.waitForDeployment();
  const stakingAddress = await stakingContract.getAddress();
  console.log("✅ CFY Staking deployed at:", stakingAddress, "\n");

  // ============================================
  // 4. DEPLOY GOVERNANCE CONTRACT
  // ============================================
  console.log("📝 Step 4: Deploying CFY Governance Contract...");
  const CFYGovernanceFactory = await ethers.getContractFactory("CFYGovernance");
  
  const governanceContract = await CFYGovernanceFactory.deploy(
    cfyTokenAddress,
    deployer.address
  );
  
  await governanceContract.waitForDeployment();
  const governanceAddress = await governanceContract.getAddress();
  console.log("✅ CFY Governance deployed at:", governanceAddress, "\n");

  // ============================================
  // 5. DEPLOY BUYBACK CONTRACT
  // ============================================
  console.log("📝 Step 5: Deploying Buyback Contract...");
  const BuybackContractFactory = await ethers.getContractFactory("BuybackContract");
  
  // DEX addresses (Base mainnet)
  const uniswapRouter = process.env.UNISWAP_ROUTER || "0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24"; // Base Uniswap V2 Router
  const uniswapFactory = process.env.UNISWAP_FACTORY || "0xFDa619b6d20975be80A10332cD39b9a4b0FAa8BB"; // Base Uniswap V2 Factory
  const liquidityPool = process.env.LIQUIDITY_POOL || deployer.address; // Will be set after LP creation
  
  const buybackContract = await BuybackContractFactory.deploy(
    cfyTokenAddress,
    uniswapRouter,
    uniswapFactory,
    liquidityPool,
    deployer.address,
    feeCollector
  );
  
  await buybackContract.waitForDeployment();
  const buybackAddress = await buybackContract.getAddress();
  console.log("✅ Buyback Contract deployed at:", buybackAddress, "\n");

  // ============================================
  // 6. DEPLOY LIQUIDITY PROVISION CONTRACT
  // ============================================
  console.log("📝 Step 6: Deploying Liquidity Provision Contract...");
  const LiquidityProvisionFactory = await ethers.getContractFactory("LiquidityProvisionContract");
  
  const liquidityContract = await LiquidityProvisionFactory.deploy(
    cfyTokenAddress,
    uniswapRouter,
    stakingAddress,
    deployer.address,
    feeCollector
  );
  
  await liquidityContract.waitForDeployment();
  const liquidityAddress = await liquidityContract.getAddress();
  console.log("✅ Liquidity Provision Contract deployed at:", liquidityAddress, "\n");

  // ============================================
  // 7. CONFIGURE CFY TOKEN
  // ============================================
  console.log("📝 Step 7: Configuring CFY Token...");
  
  // Set contract addresses
  const tx1 = await cfyToken.setBuybackContract(buybackAddress);
  await tx1.wait();
  console.log("   ✅ Buyback contract set");
  
  const tx2 = await cfyToken.setLiquidityContract(liquidityAddress);
  await tx2.wait();
  console.log("   ✅ Liquidity contract set");
  
  const tx3 = await cfyToken.setStakingContract(stakingAddress);
  await tx3.wait();
  console.log("   ✅ Staking contract set");
  
  const tx4 = await cfyToken.setGovernanceContract(governanceAddress);
  await tx4.wait();
  console.log("   ✅ Governance contract set");
  
  console.log("✅ CFY Token configured!\n");

  // ============================================
  // 8. TOKEN DISTRIBUTION
  // ============================================
  console.log("📝 Step 8: Distributing tokens according to tokenomics...");
  console.log("   This step should be done manually after deployment verification.\n");
  
  // Distribution addresses (should be set in environment variables)
  const presaleAddress = process.env.PRESALE_ADDRESS || deployer.address;
  const liquidityAddress_dist = process.env.LIQUIDITY_ADDRESS || deployer.address;
  const teamAddress = process.env.TEAM_ADDRESS || deployer.address;
  const ecosystemAddress = process.env.ECOSYSTEM_ADDRESS || deployer.address;
  const treasuryAddress_dist = process.env.TREASURY_ADDRESS || treasury;
  
  // Distribution amounts
  const PRESALE_AMOUNT = ethers.parseEther("300000000"); // 300M (30%)
  const LIQUIDITY_AMOUNT = ethers.parseEther("250000000"); // 250M (25%)
  const TEAM_AMOUNT = ethers.parseEther("150000000"); // 150M (15%)
  const ECOSYSTEM_AMOUNT = ethers.parseEther("150000000"); // 150M (15%)
  const STAKING_AMOUNT = ethers.parseEther("100000000"); // 100M (10%)
  const TREASURY_AMOUNT = ethers.parseEther("50000000"); // 50M (5%)
  
  console.log("📊 Token Distribution Plan:");
  console.log("   Presale (30%):", ethers.formatEther(PRESALE_AMOUNT), "CFY →", presaleAddress);
  console.log("   Liquidity (25%):", ethers.formatEther(LIQUIDITY_AMOUNT), "CFY →", liquidityAddress_dist);
  console.log("   Team (15%):", ethers.formatEther(TEAM_AMOUNT), "CFY →", teamAddress, "(Vested)");
  console.log("   Ecosystem (15%):", ethers.formatEther(ECOSYSTEM_AMOUNT), "CFY →", ecosystemAddress);
  console.log("   Staking Rewards (10%):", ethers.formatEther(STAKING_AMOUNT), "CFY →", stakingAddress);
  console.log("   Treasury (5%):", ethers.formatEther(TREASURY_AMOUNT), "CFY →", treasuryAddress_dist);
  console.log("\n   ⚠️  To distribute tokens, run the distribution script separately.\n");

  // ============================================
  // DEPLOYMENT SUMMARY
  // ============================================
  console.log("🎉 Deployment Complete!\n");
  console.log("📋 Contract Addresses:");
  console.log("   CFY Token:", cfyTokenAddress);
  console.log("   Vesting Contract:", vestingAddress);
  console.log("   Staking Contract:", stakingAddress);
  console.log("   Governance Contract:", governanceAddress);
  console.log("   Buyback Contract:", buybackAddress);
  console.log("   Liquidity Provision Contract:", liquidityAddress);
  console.log("\n💡 Next Steps:");
  console.log("   1. Verify contracts on block explorer");
  console.log("   2. Run distribution script to allocate tokens");
  console.log("   3. Create initial liquidity pools");
  console.log("   4. Fund staking contract with 100M CFY");
  console.log("   5. Set up vesting schedules for team/advisor tokens");
  console.log("   6. Launch presale");
  console.log("   7. Deploy to other chains (Ethereum, BSC, Solana)");
  console.log("\n📝 Save these addresses for future reference!");
  
  // Save addresses to file (optional)
  const deploymentInfo = {
    network: network.name,
    chainId: network.chainId.toString(),
    deployer: deployer.address,
    contracts: {
      cfyToken: cfyTokenAddress,
      vesting: vestingAddress,
      staking: stakingAddress,
      governance: governanceAddress,
      buyback: buybackAddress,
      liquidityProvision: liquidityAddress,
    },
    timestamp: new Date().toISOString(),
  };
  
  console.log("\n📄 Deployment Info:");
  console.log(JSON.stringify(deploymentInfo, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });

