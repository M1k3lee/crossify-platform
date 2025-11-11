# PowerShell script to create CFY Token Presale
# Make sure your backend is running and API_BASE is set correctly

$API_BASE = if ($env:API_BASE) { $env:API_BASE } else { "http://localhost:3001/api" }

Write-Host "🚀 Creating CFY Token Presale..." -ForegroundColor Cyan
Write-Host ""

# Presale configuration
$presaleData = @{
    token_symbol = "CFY"
    token_name = "Crossify"
    solana_address = "CEYNCD4ayxq9eQnMzg9TsTBBFLjAEBwquq7TKLDvhcG6"
    presale_price = 0.0001
    total_tokens_for_presale = "300000000"
    min_purchase_sol = 0.1
    max_purchase_sol = 100
    liquidity_percentage = 60
    dev_percentage = 20
    marketing_percentage = 20
    affiliate_reward_percentage = 5
} | ConvertTo-Json

Write-Host "📋 Presale Configuration:" -ForegroundColor Yellow
Write-Host $presaleData
Write-Host ""

# Create presale
Write-Host "Creating presale..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$API_BASE/presale" `
        -Method POST `
        -ContentType "application/json" `
        -Body $presaleData
    
    $presaleId = $response.id
    
    Write-Host ""
    Write-Host "✅ Presale created successfully!" -ForegroundColor Green
    Write-Host "📝 Presale ID: $presaleId" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "🔗 Presale URL: http://localhost:3000/presale?id=$presaleId" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "⚠️  IMPORTANT: Activate the presale to start monitoring:" -ForegroundColor Yellow
    Write-Host "   Invoke-RestMethod -Uri `"$API_BASE/presale/$presaleId/status`" -Method PATCH -ContentType `"application/json`" -Body '{\"status\": \"active\"}'" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "❌ Failed to create presale" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

