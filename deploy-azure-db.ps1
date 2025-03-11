# Deploy Database Schema to Azure SQL Database
# This script deploys the database schema to Azure SQL Database

# Configuration - Replace these with your actual values
$resourceGroup = "calendar-app-rg"
$sqlServer = "calendar-app-sql"
$sqlDatabase = "CalendarApp"
$sqlUser = "sqladmin"
$sqlPassword = "YourStrongPassword123"
$schemaFile = "database/schema.sql"

# Text colors
$cyan = [ConsoleColor]::Cyan
$yellow = [ConsoleColor]::Yellow
$green = [ConsoleColor]::Green
$red = [ConsoleColor]::Red

# Check if Azure CLI is installed
Write-Host "Checking if Azure CLI is installed..." -ForegroundColor $cyan
try {
    $azCliVersion = az --version 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Azure CLI is not installed. Please install it from https://docs.microsoft.com/en-us/cli/azure/install-azure-cli" -ForegroundColor $red
        exit 1
    }
    
    Write-Host "Azure CLI is available." -ForegroundColor $green
} catch {
    Write-Host "Error checking Azure CLI: $_" -ForegroundColor $red
    exit 1
}

# Check if sqlcmd is available
Write-Host "Checking if sqlcmd is available..." -ForegroundColor $cyan
try {
    $sqlcmdVersion = sqlcmd -? 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "sqlcmd is not available. Please install SQL Server Command Line Tools." -ForegroundColor $red
        Write-Host "You can download it from: https://docs.microsoft.com/en-us/sql/tools/sqlcmd-utility" -ForegroundColor $yellow
        exit 1
    }
    
    Write-Host "sqlcmd is available." -ForegroundColor $green
} catch {
    Write-Host "Error checking sqlcmd: $_" -ForegroundColor $red
    exit 1
}

# Check if schema file exists
Write-Host "Checking if schema file exists..." -ForegroundColor $cyan
if (-not (Test-Path $schemaFile)) {
    Write-Host "Schema file not found: $schemaFile" -ForegroundColor $red
    exit 1
}

# Login to Azure
Write-Host "Logging in to Azure..." -ForegroundColor $cyan
az login
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to login to Azure. Please try again." -ForegroundColor $red
    exit 1
}

# Get the SQL Server FQDN
Write-Host "Getting SQL Server FQDN..." -ForegroundColor $cyan
$sqlServerFqdn = az sql server show --resource-group $resourceGroup --name $sqlServer --query "fullyQualifiedDomainName" -o tsv
if ($LASTEXITCODE -ne 0 -or -not $sqlServerFqdn) {
    Write-Host "Failed to get SQL Server FQDN. Please check the resource group and server name." -ForegroundColor $red
    exit 1
}

Write-Host "SQL Server FQDN: $sqlServerFqdn" -ForegroundColor $green

# Add client IP to firewall rules
Write-Host "Adding client IP to firewall rules..." -ForegroundColor $cyan
$clientIp = (Invoke-WebRequest -Uri "https://api.ipify.org").Content
az sql server firewall-rule create --resource-group $resourceGroup --server $sqlServer --name "DeploymentClient" --start-ip-address $clientIp --end-ip-address $clientIp
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to add client IP to firewall rules. Continuing anyway..." -ForegroundColor $yellow
}

# Deploy schema
Write-Host "Deploying schema to Azure SQL Database..." -ForegroundColor $cyan
try {
    $schemaContent = Get-Content -Path $schemaFile -Raw
    $schemaResult = $schemaContent | sqlcmd -S $sqlServerFqdn -U $sqlUser -P $sqlPassword -d $sqlDatabase
    Write-Host "Schema deployed successfully." -ForegroundColor $green
} catch {
    Write-Host "Error deploying schema: $_" -ForegroundColor $red
    exit 1
}

# Verify database objects
Write-Host "Verifying database objects..." -ForegroundColor $cyan
$verifyQuery = @"
SELECT 'Tables: ' + CAST(COUNT(*) AS VARCHAR) FROM sys.tables;
SELECT 'Providers: ' + CAST(COUNT(*) AS VARCHAR) FROM Providers;
SELECT 'ClinicTypes: ' + CAST(COUNT(*) AS VARCHAR) FROM ClinicTypes;
"@

try {
    $verifyResult = $verifyQuery | sqlcmd -S $sqlServerFqdn -U $sqlUser -P $sqlPassword -d $sqlDatabase
    Write-Host $verifyResult -ForegroundColor $green
} catch {
    Write-Host "Error verifying database objects: $_" -ForegroundColor $red
    exit 1
}

# Remove client IP from firewall rules
Write-Host "Removing client IP from firewall rules..." -ForegroundColor $cyan
az sql server firewall-rule delete --resource-group $resourceGroup --server $sqlServer --name "DeploymentClient" --yes
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to remove client IP from firewall rules. Please remove it manually." -ForegroundColor $yellow
}

Write-Host "Azure SQL Database deployment complete!" -ForegroundColor $green
Write-Host "Make sure to update your production environment variables with the following settings:" -ForegroundColor $yellow
Write-Host "REACT_APP_USE_SQL_DATABASE=true" -ForegroundColor $yellow
Write-Host "REACT_APP_SQL_SERVER=$sqlServerFqdn" -ForegroundColor $yellow
Write-Host "REACT_APP_SQL_DATABASE=$sqlDatabase" -ForegroundColor $yellow
Write-Host "REACT_APP_SQL_USER=$sqlUser" -ForegroundColor $yellow
Write-Host "REACT_APP_SQL_PASSWORD=********" -ForegroundColor $yellow 