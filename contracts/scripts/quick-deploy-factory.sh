#!/bin/bash

# Quick deployment script for TokenFactory contracts
# This script deploys TokenFactory to all testnet networks

echo "🚀 Starting TokenFactory deployment to all networks..."
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ ERROR: .env file not found!"
    echo "Please create a .env file with:"
    echo "  PRIVATE_KEY=your_private_key_here"
    echo "  SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com"
    echo "  BSC_TESTNET_RPC_URL=https://bsc-testnet.publicnode.com"
    echo "  BASE_SEPOLIA_RPC_URL=https://base-sepolia-rpc.publicnode.com"
    exit 1
fi

# Compile contracts
echo "📦 Compiling contracts..."
npx hardhat compile
if [ $? -ne 0 ]; then
    echo "❌ Compilation failed!"
    exit 1
fi

echo ""
echo "✅ Compilation successful!"
echo ""

# Deploy to Sepolia
echo "🌐 Deploying to Sepolia..."
npx hardhat run scripts/deploy.ts --network sepolia
SEPOLIA_FACTORY=$(grep "TokenFactory deployed to:" <<< "$(npx hardhat run scripts/deploy.ts --network sepolia 2>&1)" | tail -1 | awk '{print $NF}')
echo "✅ Sepolia Factory: $SEPOLIA_FACTORY"
echo ""

# Deploy to BSC Testnet
echo "🌐 Deploying to BSC Testnet..."
npx hardhat run scripts/deploy.ts --network bscTestnet
BSC_FACTORY=$(grep "TokenFactory deployed to:" <<< "$(npx hardhat run scripts/deploy.ts --network bscTestnet 2>&1)" | tail -1 | awk '{print $NF}')
echo "✅ BSC Testnet Factory: $BSC_FACTORY"
echo ""

# Deploy to Base Sepolia
echo "🌐 Deploying to Base Sepolia..."
npx hardhat run scripts/deploy.ts --network baseSepolia
BASE_FACTORY=$(grep "TokenFactory deployed to:" <<< "$(npx hardhat run scripts/deploy.ts --network baseSepolia 2>&1)" | tail -1 | awk '{print $NF}')
echo "✅ Base Sepolia Factory: $BASE_FACTORY"
echo ""

echo "✅ All deployments complete!"
echo ""
echo "📝 Update your frontend .env file with:"
echo "VITE_ETH_FACTORY=$SEPOLIA_FACTORY"
echo "VITE_BSC_FACTORY=$BSC_FACTORY"
echo "VITE_BASE_FACTORY=$BASE_FACTORY"

