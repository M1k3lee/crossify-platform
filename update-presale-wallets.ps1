# Update Presale Wallet Addresses
# This script updates the presale configuration with fund splitting wallet addresses

param(
    [string]$PresaleId = "default",
    [string]$ApiUrl = "http://localhost:3001"
)

$wallets = @{
    liquidity_wallet = "9F9vF1j2f4Feykyw2idgTcb4PMZso7EpA7BmL4cjFmdt"
    dev_wallet = "Bvm4pKoXXr86uPquGNvDj6FGceiitkT52kb85a13AEjC"
    marketing_wallet = "3VK7LvBToxDiLjGJSpQYDf3QQs3dVprzdktXyEZfcVLn"
    auto_split_enabled = $true
    split_threshold_sol = 1.0
}

Write-Host "🔧 Updating presale wallets for presale: $PresaleId" -ForegroundColor Cyan
Write-Host ""

Write-Host "Liquidity Wallet: $($wallets.liquidity_wallet)" -ForegroundColor Green
Write-Host "Dev Wallet: $($wallets.dev_wallet)" -ForegroundColor Green
Write-Host "Marketing Wallet: $($wallets.marketing_wallet)" -ForegroundColor Green
Write-Host "Auto-split Enabled: $($wallets.auto_split_enabled)" -ForegroundColor Yellow
Write-Host "Split Threshold: $($wallets.split_threshold_sol) SOL" -ForegroundColor Yellow
Write-Host ""

try {
    $body = $wallets | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$ApiUrl/api/presale/$PresaleId/wallets" `
        -Method PATCH `
        -ContentType "application/json" `
        -Body $body

    Write-Host "✅ Successfully updated presale wallets!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Response:" -ForegroundColor Cyan
    $response | ConvertTo-Json -Depth 3
    
} catch {
    Write-Host "❌ Error updating wallets:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    if ($_.ErrorDetails.Message) {
        Write-Host "Details:" -ForegroundColor Yellow
        Write-Host $_.ErrorDetails.Message -ForegroundColor Yellow
    }
    
    exit 1
}

Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Verify wallets are correct in the database" -ForegroundColor White
Write-Host "2. Ensure SOLANA_OPERATOR_PRIVATE_KEY is set (must be presale wallet's private key)" -ForegroundColor White
Write-Host "3. Test fund splitting with a small amount first" -ForegroundColor White
Write-Host "4. Monitor split history via: GET $ApiUrl/api/presale/$PresaleId/splits" -ForegroundColor White

