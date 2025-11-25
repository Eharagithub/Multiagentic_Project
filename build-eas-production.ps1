# EAS Production Build Script for Frontend
# This script builds the Frontend app for production using EAS

param(
    [string]$Platform = "all",  # "ios", "android", or "all"
    [switch]$Wait = $false,      # Wait for build completion
    [switch]$DryRun = $false     # Show what would be built without actually building
)

function Write-Header {
    param([string]$Message)
    Write-Host "`n$($('=' * 60))" -ForegroundColor Cyan
    Write-Host $Message -ForegroundColor Cyan
    Write-Host $('=' * 60) -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ $Message" -ForegroundColor Yellow
}

Write-Header "🚀 EAS PRODUCTION BUILD - FRONTEND"

# Verify we're in the right directory
$currentDir = Get-Location
$frontendDir = Join-Path $PSScriptRoot "Frontend"
$mobileDir = Join-Path $PSScriptRoot "mobile"

Write-Info "Current directory: $currentDir"
Write-Info "Frontend directory: $frontendDir"
Write-Info "Mobile directory: $mobileDir"

# Check if Frontend directory exists
if (-not (Test-Path $frontendDir)) {
    Write-Error-Custom "Frontend directory not found at $frontendDir"
    exit 1
}

Write-Success "Frontend directory found"

# Check if mobile/eas.json exists
if (-not (Test-Path (Join-Path $mobileDir "eas.json"))) {
    Write-Error-Custom "eas.json not found in mobile directory"
    exit 1
}

Write-Success "eas.json configuration found"

# Navigate to Frontend directory
Set-Location $frontendDir
Write-Success "Changed to Frontend directory"

# Validate dependencies
Write-Host "`nValidating dependencies..." -ForegroundColor Cyan
if (-not (Test-Path "node_modules")) {
    Write-Info "Installing dependencies..."
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Error-Custom "Failed to install dependencies"
        exit 1
    }
    Write-Success "Dependencies installed"
} else {
    Write-Success "Dependencies already installed"
}

# Build command
Write-Header "📦 BUILDING WITH EAS"

$buildArgs = @("build", "--platform", $Platform, "--profile", "production")

if ($DryRun) {
    Write-Info "DRY RUN - Showing build command only"
    Write-Host "`nCommand: eas $($buildArgs -join ' ')`n" -ForegroundColor Yellow
    exit 0
}

if ($Wait) {
    $buildArgs += "--wait"
    Write-Info "Build will wait for completion"
}

# Run EAS build
Write-Info "Starting EAS production build..."
Write-Host "Platform: $Platform" -ForegroundColor Yellow
Write-Host "Profile: production" -ForegroundColor Yellow

eas @buildArgs

if ($LASTEXITCODE -eq 0) {
    Write-Header "✅ BUILD SUCCESSFUL"
    Write-Success "EAS production build completed successfully"
    Write-Info "Check EAS dashboard for build artifacts: https://expo.dev/accounts/tnhgeneric"
} else {
    Write-Error-Custom "Build failed with exit code $LASTEXITCODE"
    exit 1
}
