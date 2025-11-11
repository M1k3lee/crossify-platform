# Script to activate the presale
# Reads presale ID from presale-id.txt or you can provide it

param(
    [string]$PresaleId = ""
)

$API_BASE = "http://localhost:3001/api"

# Get presale ID
if ([string]::IsNullOrEmpty($PresaleId)) {
    if (Test-Path "presale-id.txt") {
        $PresaleId = Get-Content "presale-id.txt" -Raw
        $PresaleId = $PresaleId.Trim()
    } else {
        Write-Host "❌ No presale ID found. Please provide it:" -ForegroundColor Red
        Write-Host ".\activate-presale.ps1 -PresaleId YOUR_PRESALE_ID" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host "🟢 Activating presale: $PresaleId" -ForegroundColor Cyan
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri "$API_BASE/presale/$PresaleId/status" `
        -Method PATCH `
        -ContentType "application/json" `
        -Body '{"status": "active"}'
    
    Write-Host "✅ Presale activated successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🔍 The system is now monitoring your wallet address for incoming SOL transactions" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📊 View your presale at:" -ForegroundColor Yellow
    Write-Host "   http://localhost:3000/presale?id=$PresaleId" -ForegroundColor White
    Write-Host ""
    Write-Host "💡 Test it by sending 0.1 SOL to:" -ForegroundColor Yellow
    Write-Host "   CEYNCD4ayxq9eQnMzg9TsTBBFLjAEBwquq7TKLDvhcG6" -ForegroundColor White
    Write-Host ""
    
} catch {
    Write-Host "❌ Failed to activate presale" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

