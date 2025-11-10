#!/usr/bin/env node

/**
 * Setup verification script
 * Checks if environment is ready for TokenFactory deployment
 */

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

console.log('🔍 Checking deployment setup...\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.error('❌ ERROR: .env file not found!');
  console.error('   Create a .env file in the contracts/ directory with:');
  console.error('   PRIVATE_KEY=your_private_key_here');
  console.error('   SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com');
  console.error('   BSC_TESTNET_RPC_URL=https://bsc-testnet.publicnode.com');
  console.error('   BASE_SEPOLIA_RPC_URL=https://base-sepolia-rpc.publicnode.com');
  process.exit(1);
}

console.log('✅ .env file found');

// Load environment variables
dotenv.config({ path: envPath });

// Check PRIVATE_KEY
const privateKey = process.env.PRIVATE_KEY;
if (!privateKey || privateKey.trim() === '') {
  console.error('❌ ERROR: PRIVATE_KEY not set in .env file!');
  console.error('   Add: PRIVATE_KEY=your_private_key_here');
  process.exit(1);
}

// Check private key length (should be 64 characters without 0x, or 66 with 0x)
const cleanedKey = privateKey.trim().replace(/^0x/, '');
if (cleanedKey.length !== 64) {
  console.error('❌ ERROR: PRIVATE_KEY has invalid length!');
  console.error(`   Expected 64 characters (32 bytes), got ${cleanedKey.length}`);
  console.error('   Private key should be 64 hex characters (without 0x prefix)');
  process.exit(1);
}

console.log('✅ PRIVATE_KEY is set and valid length');

// Check RPC URLs
const rpcUrls = {
  SEPOLIA_RPC_URL: process.env.SEPOLIA_RPC_URL || process.env.ETHEREUM_RPC_URL,
  BSC_TESTNET_RPC_URL: process.env.BSC_TESTNET_RPC_URL || process.env.BSC_RPC_URL,
  BASE_SEPOLIA_RPC_URL: process.env.BASE_SEPOLIA_RPC_URL || process.env.BASE_RPC_URL,
};

let allRpcsSet = true;
for (const [key, value] of Object.entries(rpcUrls)) {
  if (!value || value.trim() === '') {
    console.warn(`⚠️  WARNING: ${key} not set (will use default)`);
    allRpcsSet = false;
  } else {
    console.log(`✅ ${key} is set`);
  }
}

if (!allRpcsSet) {
  console.log('\n💡 Tip: RPC URLs are optional - defaults will be used if not set');
}

// Check if contracts are compiled
const artifactsPath = path.join(__dirname, 'artifacts');
if (!fs.existsSync(artifactsPath)) {
  console.warn('\n⚠️  WARNING: Contracts not compiled yet');
  console.warn('   Run: npx hardhat compile');
} else {
  console.log('✅ Contracts appear to be compiled');
}

// Summary
console.log('\n✅ Setup check complete!');
console.log('\n📝 Next steps:');
console.log('   1. Ensure you have testnet tokens for gas fees');
console.log('   2. Run: npx hardhat compile');
console.log('   3. Deploy: npx hardhat run scripts/deploy.ts --network sepolia');
console.log('   4. Repeat for bscTestnet and baseSepolia');

console.log('\n💡 Get testnet tokens from:');
console.log('   - Sepolia: https://sepoliafaucet.com/');
console.log('   - BSC Testnet: https://testnet.bnbchain.org/faucet-smart');
console.log('   - Base Sepolia: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet');

