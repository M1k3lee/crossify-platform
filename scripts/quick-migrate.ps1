# Quick Migration Script - Just provide Railway URL and run!

param(
    [Parameter(Mandatory=$true)]
    [string]$RailwayDatabaseUrl
)

Write-Host "🚀 Starting Migration..." -ForegroundColor Cyan
Write-Host ""

# Cloud SQL connection (you may need to update the IP)
# Get IP from: https://console.cloud.google.com/sql/instances/crossify-db/connections
$CloudSqlIp = "34.142.XXX.XXX"  # TODO: Replace with actual IP from Cloud SQL Connections tab
$CloudSqlUrl = "postgresql://postgres:@@Mixmaster@20@${CloudSqlIp}:5432/crossify-db"

Write-Host "📋 Railway URL: $($RailwayDatabaseUrl.Substring(0, [Math]::Min(50, $RailwayDatabaseUrl.Length)))..." -ForegroundColor Gray
Write-Host "📋 Cloud SQL URL: $($CloudSqlUrl.Substring(0, [Math]::Min(50, $CloudSqlUrl.Length)))..." -ForegroundColor Gray
Write-Host ""

# Set environment variables
$env:RAILWAY_DATABASE_URL = $RailwayDatabaseUrl
$env:CLOUD_SQL_DATABASE_URL = $CloudSqlUrl

# Run migration
Write-Host "🔄 Running migration script..." -ForegroundColor Yellow
Write-Host ""

cd backend
npx ts-node ../scripts/migrate-railway-to-cloudsql.ts

cd ..

Write-Host ""
Write-Host "✅ Migration complete!" -ForegroundColor Green



