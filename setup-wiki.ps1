# PowerShell script to set up GitHub Wiki
# Run this AFTER creating the first page in GitHub's wiki interface

Write-Host "GitHub Wiki Setup Script" -ForegroundColor Green
Write-Host "========================" -ForegroundColor Green
Write-Host ""

# Check if wiki repo already exists
$wikiDir = "crossify-platform.wiki"
if (Test-Path $wikiDir) {
    Write-Host "Wiki directory already exists. Removing..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force $wikiDir
}

Write-Host "Step 1: Cloning wiki repository..." -ForegroundColor Cyan
Write-Host "Note: Make sure you've created at least one page in GitHub's wiki interface first!" -ForegroundColor Yellow
Write-Host ""

try {
    git clone https://github.com/M1k3lee/crossify-platform.wiki.git
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error: Could not clone wiki repository." -ForegroundColor Red
        Write-Host "Make sure you've created at least one page in GitHub's wiki interface first!" -ForegroundColor Yellow
        Write-Host "Go to: https://github.com/M1k3lee/crossify-platform/wiki" -ForegroundColor Yellow
        Write-Host "Click 'Create the first page' and create a page called 'Home'" -ForegroundColor Yellow
        exit 1
    }
    
    Write-Host "Wiki repository cloned successfully" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "Step 2: Copying wiki files..." -ForegroundColor Cyan
    Copy-Item ".wiki\Architecture.md" -Destination "$wikiDir\" -ErrorAction SilentlyContinue
    Copy-Item ".wiki\Contracts.md" -Destination "$wikiDir\" -ErrorAction SilentlyContinue
    Copy-Item ".wiki\Development-Process.md" -Destination "$wikiDir\" -ErrorAction SilentlyContinue
    Copy-Item ".wiki\Integration.md" -Destination "$wikiDir\" -ErrorAction SilentlyContinue
    Copy-Item ".wiki\Roadmap.md" -Destination "$wikiDir\" -ErrorAction SilentlyContinue
    Copy-Item ".wiki\Testing.md" -Destination "$wikiDir\" -ErrorAction SilentlyContinue
    
    Write-Host "Files copied successfully" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "Step 3: Committing and pushing..." -ForegroundColor Cyan
    Set-Location $wikiDir
    git add .
    git commit -m "Add comprehensive wiki documentation"
    git push origin master
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "Wiki setup complete!" -ForegroundColor Green
        Write-Host "Your wiki is now available at: https://github.com/M1k3lee/crossify-platform/wiki" -ForegroundColor Cyan
    } else {
        Write-Host "Error pushing to wiki repository" -ForegroundColor Red
    }
    
    Set-Location ..
    
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Manual setup instructions:" -ForegroundColor Yellow
    Write-Host "1. Go to: https://github.com/M1k3lee/crossify-platform/wiki" -ForegroundColor Yellow
    Write-Host "2. Create each page manually and copy content from .wiki folder" -ForegroundColor Yellow
}
