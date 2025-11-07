#!/bin/bash
# Deploy TokenFactory to all testnets

echo "🚀 Deploying TokenFactory to all testnets..."
echo ""

# Deploy to Sepolia
echo "📦 Deploying to Sepolia (Ethereum)..."
npx hardhat run scripts/deploy.ts --network sepolia
SEPOLIA_FACTORY=$(grep -o "Address: 0x[a-fA-F0-9]\{40\}" <<< "$OUTPUT" | grep -o "0x[a-fA-F0-9]\{40\}")

# Deploy to BSC Testnet
echo ""
echo "📦 Deploying to BSC Testnet..."
npx hardhat run scripts/deploy.ts --network bscTestnet

# Deploy to Base Sepolia
echo ""
echo "📦 Deploying to Base Sepolia..."
npx hardhat run scripts/deploy.ts --network baseSepolia

echo ""
echo "✅ All deployments complete!"
echo "📝 Please update your frontend/.env file with the factory addresses above."





