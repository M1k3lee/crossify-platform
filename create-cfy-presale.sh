#!/bin/bash

# Script to create CFY Token Presale
# Make sure your backend is running and API_BASE is set correctly

API_BASE="${API_BASE:-http://localhost:3001/api}"

echo "🚀 Creating CFY Token Presale..."
echo ""

# Presale configuration
PRESALE_DATA='{
  "token_symbol": "CFY",
  "token_name": "Crossify",
  "solana_address": "CEYNCD4ayxq9eQnMzg9TsTBBFLjAEBwquq7TKLDvhcG6",
  "presale_price": 0.0001,
  "total_tokens_for_presale": "300000000",
  "min_purchase_sol": 0.1,
  "max_purchase_sol": 100,
  "liquidity_percentage": 60,
  "dev_percentage": 20,
  "marketing_percentage": 20,
  "affiliate_reward_percentage": 5
}'

echo "📋 Presale Configuration:"
echo "$PRESALE_DATA" | jq '.'
echo ""

# Create presale
echo "Creating presale..."
RESPONSE=$(curl -s -X POST "$API_BASE/presale" \
  -H "Content-Type: application/json" \
  -d "$PRESALE_DATA")

# Check if jq is available
if command -v jq &> /dev/null; then
  PRESALE_ID=$(echo "$RESPONSE" | jq -r '.id')
  echo "$RESPONSE" | jq '.'
else
  echo "$RESPONSE"
  PRESALE_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
fi

if [ -z "$PRESALE_ID" ] || [ "$PRESALE_ID" = "null" ]; then
  echo "❌ Failed to create presale"
  exit 1
fi

echo ""
echo "✅ Presale created successfully!"
echo "📝 Presale ID: $PRESALE_ID"
echo ""
echo "🔗 Presale URL: http://localhost:3000/presale?id=$PRESALE_ID"
echo ""
echo "⚠️  IMPORTANT: Activate the presale to start monitoring:"
echo "   curl -X PATCH $API_BASE/presale/$PRESALE_ID/status \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"status\": \"active\"}'"
echo ""

