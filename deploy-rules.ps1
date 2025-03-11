# Firebase Rules Deployment Script
# This script helps deploy the Firebase security rules

# Text colors
$cyan = [ConsoleColor]::Cyan
$yellow = [ConsoleColor]::Yellow
$green = [ConsoleColor]::Green
$red = [ConsoleColor]::Red

# Check if Firebase CLI is installed
Write-Host "Checking if Firebase CLI is installed..." -ForegroundColor $cyan
$firebaseCli = Get-Command firebase -ErrorAction SilentlyContinue
if (-not $firebaseCli) {
    Write-Host "Firebase CLI is not installed. Installing now..." -ForegroundColor $red
    npm install -g firebase-tools
    if (-not $?) {
        Write-Host "Failed to install Firebase CLI. Please install it manually with: npm install -g firebase-tools" -ForegroundColor $red
        exit 1
    }
}

Write-Host "Firebase CLI is available." -ForegroundColor $green

# Login to Firebase
Write-Host "Logging in to Firebase..." -ForegroundColor $cyan
firebase login
if (-not $?) {
    Write-Host "Failed to login to Firebase. Please try again." -ForegroundColor $red
    exit 1
}

# Deploy Firestore rules
Write-Host "Deploying Firestore rules..." -ForegroundColor $cyan
firebase deploy --only firestore:rules
if (-not $?) {
    Write-Host "Failed to deploy Firestore rules. Please check for errors." -ForegroundColor $red
    exit 1
}

# Deploy Storage rules
Write-Host "Deploying Storage rules..." -ForegroundColor $cyan
firebase deploy --only storage:rules
if (-not $?) {
    Write-Host "Failed to deploy Storage rules. Please check for errors." -ForegroundColor $red
    exit 1
}

Write-Host "Rules deployment completed successfully!" -ForegroundColor $green
Write-Host "Visit the Firebase console to verify your rules:" -ForegroundColor $yellow
Write-Host "https://console.firebase.google.com" -ForegroundColor $yellow 