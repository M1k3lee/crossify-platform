#!/bin/bash

# Quick verification script for Base Sepolia bonding curve
# Token: XDOGE (9ed6d4f6-02bc-4c3e-8b48-dab785d4d9af)

echo "🔍 Verifying Base Sepolia bonding curve configuration..."
echo ""

cd contracts

# Curve address from console logs
CURVE_ADDRESS="0xc4d1BfaEacCFFf0F359D6E7cDD4026D32A74949E"

# GlobalSupplyTracker address from Railway
GLOBAL_SUPPLY_TRACKER="0x1eC9ee96EbD41111ad7b99f29D9a61e46b721C65"

echo "📍 Bonding Curve: $CURVE_ADDRESS"
echo "📍 Global Supply Tracker: $GLOBAL_SUPPLY_TRACKER"
echo ""

# Step 1: Verify
echo "Step 1: Verifying current configuration..."
CURVE_ADDRESS=$CURVE_ADDRESS npx hardhat run scripts/verify-bonding-curve-config.ts --network baseSepolia

echo ""
echo "Press Enter to continue with fix (or Ctrl+C to cancel)..."
read

# Step 2: Fix
echo "Step 2: Fixing configuration..."
CURVE_ADDRESS=$CURVE_ADDRESS \
GLOBAL_SUPPLY_TRACKER=$GLOBAL_SUPPLY_TRACKER \
npx hardhat run scripts/fix-bonding-curve-config.ts --network baseSepolia

echo ""
echo "✅ Done! Check the output above for results."

