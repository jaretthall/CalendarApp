# Firebase Deployment Script
# This script helps deploy the Calendar application to Firebase

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

# Build the application
Write-Host "Building the application..." -ForegroundColor $cyan
npm run build
if (-not $?) {
    Write-Host "Failed to build the application. Please check for errors." -ForegroundColor $red
    exit 1
}

# Deploy to Firebase
Write-Host "Deploying to Firebase..." -ForegroundColor $cyan
firebase deploy
if (-not $?) {
    Write-Host "Failed to deploy to Firebase. Please check for errors." -ForegroundColor $red
    exit 1
}

Write-Host "Deployment completed successfully!" -ForegroundColor $green
Write-Host "Your application is now live on Firebase." -ForegroundColor $green
Write-Host "Visit the Firebase console to see your deployed app:" -ForegroundColor $yellow
Write-Host "https://console.firebase.google.com" -ForegroundColor $yellow 