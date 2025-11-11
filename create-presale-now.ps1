# Quick script to create CFY presale
# Make sure your backend is running on http://localhost:3001

$API_BASE = "http://localhost:3001/api"

Write-Host "🚀 Creating CFY Token Presale..." -ForegroundColor Cyan
Write-Host ""

# Presale configuration
$presaleConfig = @{
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
}

$jsonBody = $presaleConfig | ConvertTo-Json

Write-Host "📋 Configuration:" -ForegroundColor Yellow
Write-Host $jsonBody
Write-Host ""

# Create presale
Write-Host "Creating presale..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$API_BASE/presale" `
        -Method POST `
        -ContentType "application/json" `
        -Body $jsonBody
    
    $presaleId = $response.id
    
    Write-Host ""
    Write-Host "✅ Presale created successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 Presale ID: $presaleId" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "🔗 Presale URL: http://localhost:3000/presale?id=$presaleId" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "⚠️  NEXT STEP: Activate the presale to start monitoring" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Run this command to activate:" -ForegroundColor White
    Write-Host "Invoke-RestMethod -Uri `"$API_BASE/presale/$presaleId/status`" -Method PATCH -ContentType `"application/json`" -Body '{\"status\": \"active\"}'" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Or use this URL in your browser/Postman:" -ForegroundColor White
    Write-Host "PATCH $API_BASE/presale/$presaleId/status" -ForegroundColor Gray
    Write-Host "Body: {`"status`": `"active`"}" -ForegroundColor Gray
    Write-Host ""
    
    # Save presale ID to file
    $presaleId | Out-File -FilePath "presale-id.txt" -Encoding utf8
    Write-Host "💾 Presale ID saved to presale-id.txt" -ForegroundColor Green
    Write-Host ""
    
} catch {
    Write-Host "❌ Failed to create presale" -ForegroundColor Red
    Write-Host ""
    Write-Host "Error details:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response:" -ForegroundColor Red
        Write-Host $responseBody -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Make sure your backend is running on http://localhost:3001" -ForegroundColor White
    Write-Host "2. Check that the database is initialized" -ForegroundColor White
    Write-Host "3. Verify the API endpoint is accessible" -ForegroundColor White
    exit 1
}

