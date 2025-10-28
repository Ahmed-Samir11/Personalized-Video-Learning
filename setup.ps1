# Quick Start Script for Personalized Video Learning Extension
# Run this in PowerShell from the project root

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Personalized Video Learning Assistant" -ForegroundColor Cyan
Write-Host "Quick Start Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
Write-Host "Checking for Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js not found!" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Check if npm is installed
Write-Host "Checking for npm..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version
    Write-Host "✓ npm found: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ npm not found!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Step 1: Installing Dependencies" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Step 2: Building Extension" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Build failed" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✓ Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Create icon files (see assets/icons/README.md)" -ForegroundColor White
Write-Host "2. Load extension in Chrome:" -ForegroundColor White
Write-Host "   - Navigate to chrome://extensions/" -ForegroundColor Gray
Write-Host "   - Enable 'Developer mode'" -ForegroundColor Gray
Write-Host "   - Click 'Load unpacked'" -ForegroundColor Gray
Write-Host "   - Select the 'dist' folder" -ForegroundColor Gray
Write-Host "3. Configure your AI API key in the extension popup" -ForegroundColor White
Write-Host "4. Visit a YouTube video to test!" -ForegroundColor White
Write-Host ""
Write-Host "For development with auto-rebuild, run: npm run dev" -ForegroundColor Cyan
Write-Host "For help, see README.md and DEVELOPMENT.md" -ForegroundColor Cyan
Write-Host ""
