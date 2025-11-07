# Windows PowerShell script to set up environment files
# Run this from the project root: .\setup-env.ps1

Write-Host "Setting up Crossify.io environment files..." -ForegroundColor Cyan

# Create backend .env.example if it doesn't exist
if (-not (Test-Path "backend\.env.example")) {
    @"
# Crossify Backend Environment Variables
# Copy this file to .env and fill in your values

PORT=3001
NODE_ENV=development
DATABASE_PATH=./data/crossify.db

REDIS_HOST=localhost
REDIS_PORT=6379

IPFS_API_URL=http://localhost:5001
IPFS_GATEWAY=https://ipfs.io/ipfs/

ETHEREUM_RPC_URL=https://eth-sepolia.publicnode.com
ETHEREUM_PRIVATE_KEY=your_ethereum_private_key_here

BSC_RPC_URL=https://bsc-testnet.publicnode.com
BSC_PRIVATE_KEY=your_bsc_private_key_here

BASE_RPC_URL=https://base-sepolia.publicnode.com
BASE_PRIVATE_KEY=your_base_private_key_here

SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_PRIVATE_KEY=your_solana_private_key_here

CORS_ORIGIN=http://localhost:3000
JWT_SECRET=your_random_jwt_secret_here
"@ | Set-Content -Path "backend\.env.example"
    Write-Host "Created backend/.env.example" -ForegroundColor Green
}

# Create contracts .env.example if it doesn't exist
if (-not (Test-Path "contracts\.env.example")) {
    @"
# Crossify Contracts Environment Variables
# Copy this file to .env and fill in your values

ETHEREUM_RPC_URL=https://eth-sepolia.publicnode.com
ETHEREUM_PRIVATE_KEY=your_ethereum_private_key_here
ETHERSCAN_API_KEY=your_etherscan_api_key_here

BSC_RPC_URL=https://bsc-testnet.publicnode.com
BSC_PRIVATE_KEY=your_bsc_private_key_here
# Note: BSC now uses Etherscan API V2 - you can use the same ETHERSCAN_API_KEY
# BSC_ETHERSCAN_API_KEY=your_etherscan_api_key_here

BASE_RPC_URL=https://base-sepolia.publicnode.com
BASE_PRIVATE_KEY=your_base_private_key_here
BASESCAN_API_KEY=your_basescan_api_key_here
"@ | Set-Content -Path "contracts\.env.example"
    Write-Host "Created contracts/.env.example" -ForegroundColor Green
}

# Backend .env
if (Test-Path "backend\.env.example") {
    if (-not (Test-Path "backend\.env")) {
        Copy-Item "backend\.env.example" "backend\.env"
        Write-Host "Created backend/.env" -ForegroundColor Green
    } else {
        Write-Host "backend/.env already exists, skipping..." -ForegroundColor Yellow
    }
} else {
    Write-Host "backend/.env.example not found!" -ForegroundColor Red
}

# Contracts .env
if (Test-Path "contracts\.env.example") {
    if (-not (Test-Path "contracts\.env")) {
        Copy-Item "contracts\.env.example" "contracts\.env"
        Write-Host "Created contracts/.env" -ForegroundColor Green
    } else {
        Write-Host "contracts/.env already exists, skipping..." -ForegroundColor Yellow
    }
} else {
    Write-Host "contracts/.env.example not found!" -ForegroundColor Red
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Open backend/.env and fill in your RPC URLs and private keys" -ForegroundColor White
Write-Host "2. Open contracts/.env and fill in your RPC URLs and private keys" -ForegroundColor White
Write-Host "3. See SETUP_ENV.md for detailed instructions!" -ForegroundColor White
Write-Host ""
