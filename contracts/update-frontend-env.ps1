# Update frontend/.env with factory addresses
param(
    [Parameter(Mandatory=$true)]
    [string]$SepoliaFactory,
    
    [Parameter(Mandatory=$false)]
    [string]$BSCFactory,
    
    [Parameter(Mandatory=$false)]
    [string]$BaseFactory
)

$frontendEnv = "..\frontend\.env"

if (-not (Test-Path $frontendEnv)) {
    Write-Host "Creating frontend/.env file..." -ForegroundColor Yellow
    $content = @()
} else {
    $content = Get-Content $frontendEnv
}

# Update or add factory addresses
$updated = @{}
foreach ($line in $content) {
    if ($line -match "^VITE_ETH_FACTORY=") {
        $updated['ETH'] = $true
        $content = $content -replace "^VITE_ETH_FACTORY=.*", "VITE_ETH_FACTORY=$SepoliaFactory"
    } elseif ($line -match "^VITE_BSC_FACTORY=") {
        $updated['BSC'] = $true
        if ($BSCFactory) {
            $content = $content -replace "^VITE_BSC_FACTORY=.*", "VITE_BSC_FACTORY=$BSCFactory"
        }
    } elseif ($line -match "^VITE_BASE_FACTORY=") {
        $updated['BASE'] = $true
        if ($BaseFactory) {
            $content = $content -replace "^VITE_BASE_FACTORY=.*", "VITE_BASE_FACTORY=$BaseFactory"
        }
    }
}

# Add missing factory addresses
if (-not $updated['ETH']) {
    $content += "VITE_ETH_FACTORY=$SepoliaFactory"
}
if ($BSCFactory -and -not $updated['BSC']) {
    $content += "VITE_BSC_FACTORY=$BSCFactory"
}
if ($BaseFactory -and -not $updated['BASE']) {
    $content += "VITE_BASE_FACTORY=$BaseFactory"
}

Set-Content -Path $frontendEnv -Value ($content -join "`n")
Write-Host "✅ Updated frontend/.env with factory addresses" -ForegroundColor Green





