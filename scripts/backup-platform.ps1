# Crossify Platform Backup Script
# Creates a complete backup of the platform before Uniswap v4 integration

param(
    [string]$BackupDir = "backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
)

Write-Host "🔄 Creating Crossify Platform Backup..." -ForegroundColor Cyan
Write-Host "📁 Backup Directory: $BackupDir" -ForegroundColor Yellow

# Create backup directory
New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
New-Item -ItemType Directory -Path "$BackupDir/backend" -Force | Out-Null
New-Item -ItemType Directory -Path "$BackupDir/contracts" -Force | Out-Null
New-Item -ItemType Directory -Path "$BackupDir/frontend" -Force | Out-Null
New-Item -ItemType Directory -Path "$BackupDir/scripts" -Force | Out-Null
New-Item -ItemType Directory -Path "$BackupDir/docs" -Force | Out-Null

Write-Host "✅ Backup directories created" -ForegroundColor Green

# Backup critical directories
Write-Host "📦 Backing up backend..." -ForegroundColor Cyan
Copy-Item -Path "backend" -Destination "$BackupDir/backend" -Recurse -Exclude "node_modules","dist",".env" -ErrorAction SilentlyContinue

Write-Host "📦 Backing up contracts..." -ForegroundColor Cyan
Copy-Item -Path "contracts" -Destination "$BackupDir/contracts" -Recurse -Exclude "node_modules","artifacts","cache",".env" -ErrorAction SilentlyContinue

Write-Host "📦 Backing up frontend..." -ForegroundColor Cyan
Copy-Item -Path "frontend" -Destination "$BackupDir/frontend" -Recurse -Exclude "node_modules","dist",".env" -ErrorAction SilentlyContinue

Write-Host "📦 Backing up scripts..." -ForegroundColor Cyan
Copy-Item -Path "scripts" -Destination "$BackupDir/scripts" -Recurse -ErrorAction SilentlyContinue

Write-Host "📦 Backing up documentation..." -ForegroundColor Cyan
Copy-Item -Path "*.md" -Destination "$BackupDir/" -Exclude "UNISWAP_V4*.md" -ErrorAction SilentlyContinue

# Backup configuration files
Write-Host "📄 Backing up configuration files..." -ForegroundColor Cyan
Copy-Item -Path "package.json" -Destination "$BackupDir/" -ErrorAction SilentlyContinue
Copy-Item -Path "package-lock.json" -Destination "$BackupDir/" -ErrorAction SilentlyContinue

# Backup environment variable templates
if (Test-Path "backend/.env.example") {
    Copy-Item -Path "backend/.env.example" -Destination "$BackupDir/backend/" -ErrorAction SilentlyContinue
    Write-Host "  ✅ Backend .env.example backed up" -ForegroundColor Green
}

if (Test-Path "contracts/.env.example") {
    Copy-Item -Path "contracts/.env.example" -Destination "$BackupDir/contracts/" -ErrorAction SilentlyContinue
    Write-Host "  ✅ Contracts .env.example backed up" -ForegroundColor Green
}

# Create backup manifest
$manifest = @{
    timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    platform = "Crossify.io"
    purpose = "Pre-Uniswap-v4-Integration Backup"
    gitCommit = if (Get-Command git -ErrorAction SilentlyContinue) { 
        (git rev-parse HEAD 2>$null) 
    } else { 
        "N/A" 
    }
    gitBranch = if (Get-Command git -ErrorAction SilentlyContinue) { 
        (git rev-parse --abbrev-ref HEAD 2>$null) 
    } else { 
        "N/A" 
    }
    directories = @(
        "backend",
        "contracts",
        "frontend",
        "scripts"
    )
    excluded = @(
        "node_modules",
        "dist",
        "artifacts",
        "cache",
        ".env files (sensitive)"
    )
}

$manifest | ConvertTo-Json -Depth 10 | Out-File "$BackupDir/BACKUP_MANIFEST.json"

Write-Host "✅ Backup manifest created" -ForegroundColor Green

# Create restore instructions
$restoreInstructions = @"
# Crossify Platform Backup - Restore Instructions

## Backup Information
- **Date**: $($manifest.timestamp)
- **Purpose**: Pre-Uniswap-v4-Integration Backup
- **Git Commit**: $($manifest.gitCommit)
- **Git Branch**: $($manifest.gitBranch)

## How to Restore

### Option 1: Restore Entire Platform
```powershell
# Stop any running services first
# Then restore directories:
Copy-Item -Path "$BackupDir/backend" -Destination "backend" -Recurse -Force
Copy-Item -Path "$BackupDir/contracts" -Destination "contracts" -Recurse -Force
Copy-Item -Path "$BackupDir/frontend" -Destination "frontend" -Recurse -Force
Copy-Item -Path "$BackupDir/scripts" -Destination "scripts" -Recurse -Force
Copy-Item -Path "$BackupDir/package.json" -Destination "package.json" -Force
```

### Option 2: Restore Specific Component
```powershell
# Example: Restore only backend
Copy-Item -Path "$BackupDir/backend" -Destination "backend" -Recurse -Force
```

### Option 3: Git Restore (if using git)
```bash
git checkout backup-pre-v4-YYYYMMDD
# or
git reset --hard $($manifest.gitCommit)
```

## Important Notes

1. **Environment Variables**: You'll need to restore `.env` files manually from your secure storage
2. **Dependencies**: Run `npm install` in each directory after restore
3. **Database**: If using PostgreSQL, restore from database backup separately
4. **Contracts**: Deployed contracts cannot be "restored" - only code

## What Was Backed Up

- ✅ All source code (backend, contracts, frontend, scripts)
- ✅ Configuration files (package.json, etc.)
- ✅ Documentation (markdown files)
- ✅ Environment variable templates (.env.example)

## What Was NOT Backed Up

- ❌ node_modules (can be reinstalled)
- ❌ dist/build artifacts (can be rebuilt)
- ❌ .env files (sensitive - keep separately)
- ❌ Database (backup separately if needed)

## Verification

After restore, verify:
1. Code compiles: `npm run build` in each directory
2. Tests pass: `npm test` (if available)
3. Environment variables are set correctly
4. Services start successfully
"@

$restoreInstructions | Out-File "$BackupDir/RESTORE_INSTRUCTIONS.md"

Write-Host "✅ Restore instructions created" -ForegroundColor Green

# Create git tag (if git is available)
if (Get-Command git -ErrorAction SilentlyContinue) {
    $tagName = "backup-pre-v4-$(Get-Date -Format 'yyyyMMdd')"
    Write-Host "🏷️  Creating git tag: $tagName" -ForegroundColor Cyan
    git tag $tagName 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ Git tag created (local only)" -ForegroundColor Green
        Write-Host "  💡 Push tag with: git push origin $tagName" -ForegroundColor Yellow
    }
}

# Summary
Write-Host "`n" -ForegroundColor White
Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ BACKUP COMPLETE!" -ForegroundColor Green
Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "📁 Location: $BackupDir" -ForegroundColor Yellow
Write-Host "📄 Manifest: $BackupDir/BACKUP_MANIFEST.json" -ForegroundColor Yellow
Write-Host "📖 Instructions: $BackupDir/RESTORE_INSTRUCTIONS.md" -ForegroundColor Yellow
Write-Host "`n💡 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Review backup contents" -ForegroundColor White
Write-Host "   2. Verify backup is complete" -ForegroundColor White
Write-Host "   3. Store backup in safe location" -ForegroundColor White
Write-Host "   4. Proceed with Uniswap v4 integration" -ForegroundColor White
Write-Host "`n" -ForegroundColor White

