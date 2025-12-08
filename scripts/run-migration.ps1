# PowerShell script to run Railway to Cloud SQL migration
# This script helps set up environment variables and run the migration

Write-Host "🚀 Railway to Cloud SQL Migration Setup" -ForegroundColor Cyan
Write-Host ""

# Check if Railway DATABASE_URL is provided
if (-not $env:RAILWAY_DATABASE_URL) {
    Write-Host "⚠️  RAILWAY_DATABASE_URL not set!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To get your Railway DATABASE_URL:" -ForegroundColor White
    Write-Host "1. Go to https://railway.app" -ForegroundColor Gray
    Write-Host "2. Open your project" -ForegroundColor Gray
    Write-Host "3. Click on PostgreSQL service" -ForegroundColor Gray
    Write-Host "4. Go to Variables tab" -ForegroundColor Gray
    Write-Host "5. Copy the DATABASE_URL value" -ForegroundColor Gray
    Write-Host ""
    $railwayUrl = Read-Host "Enter Railway DATABASE_URL (or press Enter to skip)"
    if ($railwayUrl) {
        $env:RAILWAY_DATABASE_URL = $railwayUrl
    } else {
        Write-Host "❌ Cannot proceed without Railway DATABASE_URL" -ForegroundColor Red
        exit 1
    }
}

# Check if Cloud SQL DATABASE_URL is provided
if (-not $env:CLOUD_SQL_DATABASE_URL) {
    Write-Host "⚠️  CLOUD_SQL_DATABASE_URL not set!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Cloud SQL connection format:" -ForegroundColor White
    Write-Host "postgresql://postgres:PASSWORD@PUBLIC_IP:5432/crossify-db" -ForegroundColor Gray
    Write-Host ""
    Write-Host "To get Cloud SQL public IP:" -ForegroundColor White
    Write-Host "1. Go to https://console.cloud.google.com/sql/instances/crossify-db" -ForegroundColor Gray
    Write-Host "2. Click on Connections tab" -ForegroundColor Gray
    Write-Host "3. Find the Public IP address" -ForegroundColor Gray
    Write-Host ""
    $cloudSqlUrl = Read-Host "Enter Cloud SQL DATABASE_URL (or press Enter to use default format)"
    if ($cloudSqlUrl) {
        $env:CLOUD_SQL_DATABASE_URL = $cloudSqlUrl
    } else {
        # Try to construct from known values
        $publicIp = Read-Host "Enter Cloud SQL Public IP address"
        if ($publicIp) {
            $env:CLOUD_SQL_DATABASE_URL = "postgresql://postgres:@@Mixmaster@20@${publicIp}:5432/crossify-db"
            Write-Host "✅ Using: $($env:CLOUD_SQL_DATABASE_URL)" -ForegroundColor Green
        } else {
            Write-Host "❌ Cannot proceed without Cloud SQL connection info" -ForegroundColor Red
            exit 1
        }
    }
}

Write-Host ""
Write-Host "✅ Environment variables set!" -ForegroundColor Green
Write-Host ""

# Change to backend directory
Set-Location backend

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Check if ts-node is available
Write-Host "🔍 Checking for ts-node..." -ForegroundColor Cyan
$tsNodePath = Get-Command npx -ErrorAction SilentlyContinue
if (-not $tsNodePath) {
    Write-Host "❌ npx not found. Please install Node.js" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🚀 Starting migration..." -ForegroundColor Cyan
Write-Host ""

# Run the migration script
npx ts-node ../scripts/migrate-railway-to-cloudsql.ts

# Return to original directory
Set-Location ..



