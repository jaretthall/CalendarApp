# Setup CORS for Firebase Storage
# This script sets up CORS configuration for Firebase Storage

# Check if the Google Cloud SDK is installed
$gcloudInstalled = $false

# Check standard installation paths
$possiblePaths = @(
    "C:\Users\$env:USERNAME\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd",
    "C:\Program Files\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd",
    "C:\Program Files (x86)\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd"
)

foreach ($path in $possiblePaths) {
    if (Test-Path $path) {
        $gcloudInstalled = $true
        Write-Host "Found Google Cloud SDK at: $path"
        # Add to PATH temporarily for this session if not already in PATH
        if (-not ($env:PATH -like "*Google\Cloud SDK*")) {
            $gcloudDir = Split-Path -Parent $path
            $env:PATH = "$gcloudDir;$env:PATH"
            Write-Host "Added Google Cloud SDK to PATH for this session"
        }
        break
    }
}

# Also try to find it in PATH
if (-not $gcloudInstalled) {
    try {
        $gcloudCmd = Get-Command gcloud -ErrorAction SilentlyContinue
        if ($gcloudCmd) {
            $gcloudInstalled = $true
            Write-Host "Found Google Cloud SDK in PATH"
        }
    } catch {
        # Continue with the script
    }
}

if (-not $gcloudInstalled) {
    Write-Host "Google Cloud SDK is not installed or not in PATH."
    Write-Host "Please install the Google Cloud SDK from: https://cloud.google.com/sdk/docs/install"
    Write-Host "After installation, run 'gcloud init' to initialize the SDK."
    Write-Host "Then run 'gcloud auth login' to authenticate."
    
    # Check if the installer is available in the current directory
    if (Test-Path -Path ".\GoogleCloudSDKInstaller.exe") {
        Write-Host "Found GoogleCloudSDKInstaller.exe in the current directory."
        Write-Host "Would you like to run it now? (y/n)"
        $response = Read-Host
        if ($response -eq "y") {
            Start-Process -FilePath ".\GoogleCloudSDKInstaller.exe" -Wait
            Write-Host "Please restart this script after installation is complete."
        }
    }
    
    exit 1
}

# Check if the user is logged in to Firebase
Write-Host "Checking Firebase login status..."
$firebaseLoginStatus = firebase login:list

if ($firebaseLoginStatus -match "No users signed in") {
    Write-Host "You are not logged in to Firebase. Please log in first."
    firebase login
}

# Get the Firebase project ID
Write-Host "Getting Firebase project ID..."

# Try to get project ID from .firebaserc file first
$projectId = $null
if (Test-Path ".firebaserc") {
    try {
        $firebaserc = Get-Content ".firebaserc" | ConvertFrom-Json
        $projectId = $firebaserc.projects.default
        Write-Host "Found project ID in .firebaserc: $projectId"
    } catch {
        Write-Host "Could not parse .firebaserc file."
    }
}

# If not found in .firebaserc, try to get from firebase CLI
if ([string]::IsNullOrEmpty($projectId)) {
    try {
        $projectsJson = firebase projects:list --json
        $projects = $projectsJson | ConvertFrom-Json
        
        if ($projects -and $projects.results -and $projects.results.Count -gt 0) {
            $projectId = $projects.results[0].projectId
            Write-Host "Found project ID from Firebase CLI: $projectId"
        }
    } catch {
        Write-Host "Error getting project list from Firebase CLI: $_"
    }
}

# If still not found, ask the user
if ([string]::IsNullOrEmpty($projectId)) {
    Write-Host "Could not determine Firebase project ID automatically."
    $projectId = Read-Host "Please enter your Firebase project ID"
}

if ([string]::IsNullOrEmpty($projectId)) {
    Write-Host "No project ID provided. Exiting."
    exit 1
}

Write-Host "Using Firebase project: $projectId"

# Set up CORS for Firebase Storage
Write-Host "Setting up CORS for Firebase Storage..."
Write-Host "Using CORS configuration from cors.json:"
Get-Content -Path "cors.json"

# List all available buckets
Write-Host "Listing available buckets..."
$buckets = gcloud storage buckets list --format="value(name)"
Write-Host "Available buckets:"
$buckets | ForEach-Object { Write-Host "  $_" }

# Try to find the Firebase Storage bucket
$firebaseBucket = $buckets | Where-Object { $_ -like "*$projectId*" }

if ($firebaseBucket) {
    Write-Host "Found Firebase Storage bucket: $firebaseBucket"
    # Use gcloud to set CORS
    Write-Host "Applying CORS configuration to $firebaseBucket..."
    gcloud storage buckets update gs://$firebaseBucket --cors-file=cors.json
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "CORS configuration applied successfully to $firebaseBucket."
    } else {
        Write-Host "Failed to apply CORS configuration to $firebaseBucket."
    }
} else {
    Write-Host "Could not find a Firebase Storage bucket for project $projectId."
    Write-Host "Available buckets:"
    $buckets | ForEach-Object { Write-Host "  $_" }
    
    $manualBucket = Read-Host "Please enter the full bucket name (without gs:// prefix)"
    
    if (-not [string]::IsNullOrEmpty($manualBucket)) {
        Write-Host "Applying CORS configuration to gs://$manualBucket..."
        gcloud storage buckets update gs://$manualBucket --cors-file=cors.json
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "CORS configuration applied successfully to gs://$manualBucket."
        } else {
            Write-Host "Failed to apply CORS configuration to gs://$manualBucket."
        }
    } else {
        Write-Host "No bucket name provided. Exiting."
        exit 1
    }
} 