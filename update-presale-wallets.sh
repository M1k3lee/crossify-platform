#!/bin/bash

# Update Presale Wallet Addresses
# This script updates the presale configuration with fund splitting wallet addresses

PRESALE_ID="${1:-default}"
API_URL="${2:-http://localhost:3001}"

echo "🔧 Updating presale wallets for presale: $PRESALE_ID"
echo ""

LIQUIDITY_WALLET="9F9vF1j2f4Feykyw2idgTcb4PMZso7EpA7BmL4cjFmdt"
DEV_WALLET="Bvm4pKoXXr86uPquGNvDj6FGceiitkT52kb85a13AEjC"
MARKETING_WALLET="3VK7LvBToxDiLjGJSpQYDf3QQs3dVprzdktXyEZfcVLn"
AUTO_SPLIT_ENABLED=true
SPLIT_THRESHOLD_SOL=1.0

echo "Liquidity Wallet: $LIQUIDITY_WALLET"
echo "Dev Wallet: $DEV_WALLET"
echo "Marketing Wallet: $MARKETING_WALLET"
echo "Auto-split Enabled: $AUTO_SPLIT_ENABLED"
echo "Split Threshold: $SPLIT_THRESHOLD_SOL SOL"
echo ""

JSON_BODY=$(cat <<EOF
{
  "liquidity_wallet": "$LIQUIDITY_WALLET",
  "dev_wallet": "$DEV_WALLET",
  "marketing_wallet": "$MARKETING_WALLET",
  "auto_split_enabled": $AUTO_SPLIT_ENABLED,
  "split_threshold_sol": $SPLIT_THRESHOLD_SOL
}
EOF
)

RESPONSE=$(curl -s -w "\n%{http_code}" -X PATCH \
  "$API_URL/api/presale/$PRESALE_ID/wallets" \
  -H "Content-Type: application/json" \
  -d "$JSON_BODY")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
  echo "✅ Successfully updated presale wallets!"
  echo ""
  echo "Response:"
  echo "$BODY" | jq .
else
  echo "❌ Error updating wallets (HTTP $HTTP_CODE)"
  echo "Response:"
  echo "$BODY"
  exit 1
fi

echo ""
echo "📝 Next Steps:"
echo "1. Verify wallets are correct in the database"
echo "2. Ensure SOLANA_OPERATOR_PRIVATE_KEY is set (must be presale wallet's private key)"
echo "3. Test fund splitting with a small amount first"
echo "4. Monitor split history via: GET $API_URL/api/presale/$PRESALE_ID/splits"

