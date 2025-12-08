# Quick Hedera Deployment Script
# This script deploys contracts to Hedera Testnet with your configured account

Write-Host "🚀 Deploying to Hedera Testnet..." -ForegroundColor Cyan
Write-Host ""

# Check if .env exists
if (-not (Test-Path .env)) {
    Write-Host "❌ ERROR: .env file not found!" -ForegroundColor Red
    Write-Host "Please create contracts/.env with:" -ForegroundColor Yellow
    Write-Host "  PRIVATE_KEY=YOUR_PRIVATE_KEY" -ForegroundColor Yellow
    Write-Host "  HEDERA_TESTNET_RPC_URL=https://testnet.hashio.io/api" -ForegroundColor Yellow
    exit 1
}

# Check if PRIVATE_KEY is set
$envContent = Get-Content .env -Raw
if ($envContent -notmatch "PRIVATE_KEY") {
    Write-Host "⚠️  WARNING: PRIVATE_KEY not found in .env" -ForegroundColor Yellow
    Write-Host "Adding Hedera configuration..." -ForegroundColor Yellow
    Add-Content .env "`n# Hedera Configuration"
    Add-Content .env "HEDERA_TESTNET_RPC_URL=https://testnet.hashio.io/api"
    Add-Content .env "PRIVATE_KEY=YOUR_PRIVATE_KEY"
    Write-Host "✅ Configuration added!" -ForegroundColor Green
}

Write-Host "📋 Your Hedera Account:" -ForegroundColor Cyan
Write-Host "   Account ID: 0.0.7268944" -ForegroundColor White
Write-Host "   EVM Address: 0x30314630feb44e1b1df77397906240ff5c40f6d2" -ForegroundColor White
Write-Host ""

Write-Host "🔍 Checking account balance..." -ForegroundColor Cyan
Write-Host "   View on HashScan: https://hashscan.io/testnet/account/0.0.7268944" -ForegroundColor Gray
Write-Host ""

Write-Host "🚀 Starting deployment..." -ForegroundColor Cyan
Write-Host ""

# Deploy contracts
npx hardhat run scripts/deploy-hedera.ts --network hederaTestnet

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Deployment complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 Next Steps:" -ForegroundColor Cyan
    Write-Host "   1. Copy the TokenFactory address from above" -ForegroundColor White
    Write-Host "   2. Add to backend/.env: HEDERA_FACTORY_ADDRESS=0x..." -ForegroundColor White
    Write-Host "   3. Add to frontend env vars: VITE_HEDERA_FACTORY=0x..." -ForegroundColor White
    Write-Host "   4. Redeploy frontend" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    Write-Host "Check the error messages above." -ForegroundColor Yellow
}

