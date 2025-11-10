import { ethers } from "hardhat";

/**
 * Script to authorize TokenFactory addresses in CrossChainSync contracts
 * This allows TokenFactory to authorize newly created tokens in CrossChainSync
 */

const CONTRACT_ADDRESSES: Record<string, { crossChainSync: string; tokenFactory: string }> = {
  sepolia: {
    crossChainSync: "0x1eC9ee96EbD41111ad7b99f29D9a61e46b721C65",
    tokenFactory: "0x39fB28323572610eC0Df1EF075f4acDD51f77e2E", // From console error
  },
  bscTestnet: {
    crossChainSync: "0xf5446E2690B2eb161231fB647476A98e1b6b7736",
    tokenFactory: "0x39fB28323572610eC0Df1EF075f4acDD51f77e2E", // From console error
  },
  baseSepolia: {
    crossChainSync: "0x39fB28323572610eC0Df1EF075f4acDD51f77e2E",
    tokenFactory: "0x314DFf75620f1CFB09B5aD88892Dded0A13A6c58", // From console error
  },
};

async function main() {
  const network = await ethers.provider.getNetwork();
  const networkName = network.name;
  
  console.log(`\n🔗 Authorizing TokenFactory in CrossChainSync on ${networkName}...`);
  console.log(`   Chain ID: ${network.chainId}\n`);

  // Determine which network we're on
  let addresses;
  if (network.chainId === 11155111n) {
    addresses = CONTRACT_ADDRESSES.sepolia;
  } else if (network.chainId === 97n) {
    addresses = CONTRACT_ADDRESSES.bscTestnet;
  } else if (network.chainId === 84532n) {
    addresses = CONTRACT_ADDRESSES.baseSepolia;
  } else {
    throw new Error(`Unknown network: ${networkName} (${network.chainId})`);
  }

  console.log(`📋 CrossChainSync: ${addresses.crossChainSync}`);
  console.log(`📋 TokenFactory: ${addresses.tokenFactory}\n`);

  // Get signer
  const [signer] = await ethers.getSigners();
  console.log(`👤 Signer: ${signer.address}`);
  
  const balance = await ethers.provider.getBalance(signer.address);
  console.log(`💰 Balance: ${ethers.formatEther(balance)} ${networkName === 'bsc-testnet' ? 'BNB' : 'ETH'}\n`);

  // Get CrossChainSync contract
  const CrossChainSyncABI = [
    "function authorizeAddress(address addr) external",
    "function authorizedTokens(address) external view returns (bool)",
    "function owner() external view returns (address)",
  ];

  const crossChainSync = new ethers.Contract(
    addresses.crossChainSync,
    CrossChainSyncABI,
    signer
  );

  // Check if TokenFactory is already authorized
  const isAuthorized = await crossChainSync.authorizedTokens(addresses.tokenFactory);
  if (isAuthorized) {
    console.log(`✅ TokenFactory is already authorized in CrossChainSync`);
    return;
  }

  // Check if signer is owner
  const owner = await crossChainSync.owner();
  if (owner.toLowerCase() !== signer.address.toLowerCase()) {
    throw new Error(`❌ Signer ${signer.address} is not the owner of CrossChainSync. Owner is: ${owner}`);
  }

  // Authorize TokenFactory
  console.log(`🔐 Authorizing TokenFactory...`);
  const tx = await crossChainSync.authorizeAddress(addresses.tokenFactory);
  console.log(`📤 Transaction hash: ${tx.hash}`);
  console.log(`⏳ Waiting for confirmation...`);
  
  const receipt = await tx.wait();
  console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);
  console.log(`   Gas used: ${receipt.gasUsed.toString()}`);

  // Verify authorization
  const authorized = await crossChainSync.authorizedTokens(addresses.tokenFactory);
  if (authorized) {
    console.log(`\n✅ Successfully authorized TokenFactory in CrossChainSync!`);
    console.log(`   TokenFactory can now authorize tokens in CrossChainSync`);
  } else {
    console.log(`\n⚠️  Authorization may have failed. Please verify manually.`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

