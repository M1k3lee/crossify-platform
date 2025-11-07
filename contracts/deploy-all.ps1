# Deploy TokenFactory to all testnets
Write-Host "🚀 Deploying TokenFactory to all testnets..." -ForegroundColor Cyan
Write-Host ""

# Check if .env exists
if (-not (Test-Path .env)) {
    Write-Host "❌ ERROR: .env file not found!" -ForegroundColor Red
    Write-Host "Please create .env file with your PRIVATE_KEY and RPC URLs" -ForegroundColor Yellow
    Write-Host "See .env.example for template" -ForegroundColor Yellow
    exit 1
}

# Check if PRIVATE_KEY is set
$envContent = Get-Content .env -Raw
if (-not $envContent -match "PRIVATE_KEY\s*=") {
    Write-Host "❌ ERROR: PRIVATE_KEY not found in .env file!" -ForegroundColor Red
    Write-Host "Please add your PRIVATE_KEY to contracts/.env" -ForegroundColor Yellow
    exit 1
}

$factories = @{}

# Deploy to Sepolia
Write-Host "📦 Deploying to Sepolia (Ethereum)..." -ForegroundColor Green
try {
    $output = npx hardhat run scripts/deploy.ts --network sepolia 2>&1 | Out-String
    Write-Host $output
    if ($output -match "Address:\s*(0x[a-fA-F0-9]{40})") {
        $factories['ETH'] = $matches[1]
        Write-Host "✅ Sepolia deployment successful: $($factories['ETH'])" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Sepolia deployment failed: $_" -ForegroundColor Red
}

Write-Host ""

# Deploy to BSC Testnet
Write-Host "📦 Deploying to BSC Testnet..." -ForegroundColor Green
try {
    $output = npx hardhat run scripts/deploy.ts --network bscTestnet 2>&1 | Out-String
    Write-Host $output
    if ($output -match "Address:\s*(0x[a-fA-F0-9]{40})") {
        $factories['BSC'] = $matches[1]
        Write-Host "✅ BSC deployment successful: $($factories['BSC'])" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ BSC deployment failed: $_" -ForegroundColor Red
}

Write-Host ""

# Deploy to Base Sepolia
Write-Host "📦 Deploying to Base Sepolia..." -ForegroundColor Green
try {
    $output = npx hardhat run scripts/deploy.ts --network baseSepolia 2>&1 | Out-String
    Write-Host $output
    if ($output -match "Address:\s*(0x[a-fA-F0-9]{40})") {
        $factories['BASE'] = $matches[1]
        Write-Host "✅ Base Sepolia deployment successful: $($factories['BASE'])" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Base Sepolia deployment failed: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "✅ All deployments complete!" -ForegroundColor Cyan
Write-Host ""

# Update frontend .env
if ($factories.Count -gt 0) {
    Write-Host "📝 Updating frontend/.env with factory addresses..." -ForegroundColor Yellow
    $frontendEnv = "..\frontend\.env"
    
    if (Test-Path $frontendEnv) {
        $envContent = Get-Content $frontendEnv -Raw
        
        # Update or add factory addresses
        if ($factories['ETH']) {
            $envContent = $envContent -replace "VITE_ETH_FACTORY=.*", "VITE_ETH_FACTORY=$($factories['ETH'])"
            if ($envContent -notmatch "VITE_ETH_FACTORY=") {
                $envContent += "`nVITE_ETH_FACTORY=$($factories['ETH'])"
            }
        }
        if ($factories['BSC']) {
            $envContent = $envContent -replace "VITE_BSC_FACTORY=.*", "VITE_BSC_FACTORY=$($factories['BSC'])"
            if ($envContent -notmatch "VITE_BSC_FACTORY=") {
                $envContent += "`nVITE_BSC_FACTORY=$($factories['BSC'])"
            }
        }
        if ($factories['BASE']) {
            $envContent = $envContent -replace "VITE_BASE_FACTORY=.*", "VITE_BASE_FACTORY=$($factories['BASE'])"
            if ($envContent -notmatch "VITE_BASE_FACTORY=") {
                $envContent += "`nVITE_BASE_FACTORY=$($factories['BASE'])"
            }
        }
        
        Set-Content -Path $frontendEnv -Value $envContent
        Write-Host "✅ Updated frontend/.env" -ForegroundColor Green
    } else {
        Write-Host "⚠️  frontend/.env not found, creating it..." -ForegroundColor Yellow
        $newEnv = @()
        if ($factories['ETH']) { $newEnv += "VITE_ETH_FACTORY=$($factories['ETH'])" }
        if ($factories['BSC']) { $newEnv += "VITE_BSC_FACTORY=$($factories['BSC'])" }
        if ($factories['BASE']) { $newEnv += "VITE_BASE_FACTORY=$($factories['BASE'])" }
        Set-Content -Path $frontendEnv -Value ($newEnv -join "`n")
        Write-Host "✅ Created frontend/.env" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "📋 Factory Addresses:" -ForegroundColor Cyan
    if ($factories['ETH']) { Write-Host "  Ethereum (Sepolia): $($factories['ETH'])" }
    if ($factories['BSC']) { Write-Host "  BSC Testnet: $($factories['BSC'])" }
    if ($factories['BASE']) { Write-Host "  Base Sepolia: $($factories['BASE'])" }
} else {
    Write-Host "⚠️  No deployments were successful. Please check the errors above." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 Done! Restart your frontend dev server to use the new factory addresses." -ForegroundColor Green





