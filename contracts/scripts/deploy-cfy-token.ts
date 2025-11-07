import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying CFY token with account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  // Get contract factories
  const CrossifyTokenFactory = await ethers.getContractFactory("CrossifyToken");
  
  // Deploy parameters
  const name = "Crossify Token";
  const symbol = "CFY";
  const initialSupply = ethers.parseEther("1000000000"); // 1 billion CFY
  const owner = deployer.address;
  
  // LayerZero and cross-chain parameters (should be set from config)
  // For testnet, use placeholder addresses
  const lzEndpoint = process.env.LAYERZERO_ENDPOINT || "0x0000000000000000000000000000000000000000";
  const crossChainSync = process.env.CROSS_CHAIN_SYNC || "0x0000000000000000000000000000000000000000";
  const priceOracle = process.env.PRICE_ORACLE || "0x0000000000000000000000000000000000000000";
  const chainEID = process.env.CHAIN_EID || "30110"; // Ethereum Sepolia EID
  
  console.log("\n📝 Deploying Crossify Token (CFY)...");
  console.log("Name:", name);
  console.log("Symbol:", symbol);
  console.log("Initial Supply:", ethers.formatEther(initialSupply), "CFY");
  console.log("Owner:", owner);
  console.log("LayerZero Endpoint:", lzEndpoint);
  console.log("Cross-Chain Sync:", crossChainSync);
  
  // Deploy CFY token
  const cfyToken = await CrossifyTokenFactory.deploy(
    name,
    symbol,
    initialSupply,
    owner,
    lzEndpoint,
    crossChainSync,
    priceOracle,
    chainEID
  );
  
  await cfyToken.waitForDeployment();
  const cfyTokenAddress = await cfyToken.getAddress();
  
  console.log("\n✅ CFY Token deployed successfully!");
  console.log("Address:", cfyTokenAddress);
  console.log("\n📋 Deployment Details:");
  console.log("  Token Name:", name);
  console.log("  Token Symbol:", symbol);
  console.log("  Total Supply:", ethers.formatEther(initialSupply), "CFY");
  console.log("  Owner:", owner);
  
  // Deploy buyback contract
  console.log("\n📝 Deploying Buyback Contract...");
  const BuybackContractFactory = await ethers.getContractFactory("BuybackContract");
  
  // Get Uniswap router and factory addresses (testnet)
  const uniswapRouter = process.env.UNISWAP_ROUTER || "0x0000000000000000000000000000000000000000";
  const uniswapFactory = process.env.UNISWAP_FACTORY || "0x0000000000000000000000000000000000000000";
  const liquidityPool = process.env.LIQUIDITY_POOL || deployer.address; // Placeholder
  const feeCollector = process.env.FEE_COLLECTOR || deployer.address;
  
  const buybackContract = await BuybackContractFactory.deploy(
    cfyTokenAddress,
    uniswapRouter,
    uniswapFactory,
    liquidityPool,
    owner,
    feeCollector
  );
  
  await buybackContract.waitForDeployment();
  const buybackAddress = await buybackContract.getAddress();
  
  console.log("✅ Buyback Contract deployed successfully!");
  console.log("Address:", buybackAddress);
  
  // Deploy liquidity provision contract
  console.log("\n📝 Deploying Liquidity Provision Contract...");
  const LiquidityProvisionFactory = await ethers.getContractFactory("LiquidityProvisionContract");
  
  const stakingContract = process.env.STAKING_CONTRACT || "0x0000000000000000000000000000000000000000";
  
  const liquidityContract = await LiquidityProvisionFactory.deploy(
    cfyTokenAddress,
    uniswapRouter,
    stakingContract,
    owner,
    feeCollector
  );
  
  await liquidityContract.waitForDeployment();
  const liquidityAddress = await liquidityContract.getAddress();
  
  console.log("✅ Liquidity Provision Contract deployed successfully!");
  console.log("Address:", liquidityAddress);
  
  // Configure CFY token
  console.log("\n📝 Configuring CFY Token...");
  await cfyToken.setBuybackContract(buybackAddress);
  await cfyToken.setLiquidityPool(liquidityAddress);
  console.log("✅ CFY Token configured!");
  
  console.log("\n🎉 All contracts deployed successfully!");
  console.log("\n📋 Summary:");
  console.log("  CFY Token:", cfyTokenAddress);
  console.log("  Buyback Contract:", buybackAddress);
  console.log("  Liquidity Provision Contract:", liquidityAddress);
  console.log("\n💡 Next Steps:");
  console.log("  1. Set buyback contract address in CFY token");
  console.log("  2. Set liquidity pool address in CFY token");
  console.log("  3. Deploy to other chains (BSC, Base, Solana)");
  console.log("  4. Create initial liquidity pools");
  console.log("  5. Launch presale");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });




