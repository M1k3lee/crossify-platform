#!/bin/bash
# Mac/Linux script to set up environment files
# Run this from the project root: chmod +x setup-env.sh && ./setup-env.sh

echo "🚀 Setting up Crossify.io environment files..."

# Backend .env
if [ -f "backend/.env.example" ]; then
    if [ ! -f "backend/.env" ]; then
        cp backend/.env.example backend/.env
        echo "✅ Created backend/.env"
    else
        echo "⚠️  backend/.env already exists, skipping..."
    fi
else
    echo "❌ backend/.env.example not found!"
fi

# Contracts .env
if [ -f "contracts/.env.example" ]; then
    if [ ! -f "contracts/.env" ]; then
        cp contracts/.env.example contracts/.env
        echo "✅ Created contracts/.env"
    else
        echo "⚠️  contracts/.env already exists, skipping..."
    fi
else
    echo "❌ contracts/.env.example not found!"
fi

echo ""
echo "📝 Next steps:"
echo "1. Open backend/.env and fill in your RPC URLs and private keys"
echo "2. Open contracts/.env and fill in your RPC URLs and private keys"
echo "3. See SETUP_ENV.md for detailed instructions!"
echo ""








