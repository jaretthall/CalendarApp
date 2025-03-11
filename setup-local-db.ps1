# Setup Local SQL Database for Calendar App
# This script creates a local SQL Server database for development

# Configuration
$sqlServer = "localhost"
$sqlDatabase = "CalendarApp"
$sqlUser = "sa"
$sqlPassword = "YourStrongPassword123"
$schemaFile = "database/schema.sql"

# Text colors
$cyan = [ConsoleColor]::Cyan
$yellow = [ConsoleColor]::Yellow
$green = [ConsoleColor]::Green
$red = [ConsoleColor]::Red

# Check if SQL Server is installed and running
Write-Host "Checking if SQL Server is installed and running..." -ForegroundColor $cyan
try {
    $sqlService = Get-Service -Name "MSSQLSERVER" -ErrorAction SilentlyContinue
    if ($null -eq $sqlService) {
        Write-Host "SQL Server service (MSSQLSERVER) not found. Please install SQL Server." -ForegroundColor $red
        Write-Host "You can download SQL Server Express from: https://www.microsoft.com/en-us/sql-server/sql-server-downloads" -ForegroundColor $yellow
        exit 1
    }
    
    if ($sqlService.Status -ne "Running") {
        Write-Host "SQL Server service is not running. Starting service..." -ForegroundColor $yellow
        Start-Service -Name "MSSQLSERVER"
        Start-Sleep -Seconds 5
    }
    
    Write-Host "SQL Server is running." -ForegroundColor $green
} catch {
    Write-Host "Error checking SQL Server service: $_" -ForegroundColor $red
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

# Create database if it doesn't exist
Write-Host "Creating database if it doesn't exist..." -ForegroundColor $cyan
$createDbQuery = @"
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = '$sqlDatabase')
BEGIN
    CREATE DATABASE [$sqlDatabase]
    PRINT 'Database created.'
END
ELSE
BEGIN
    PRINT 'Database already exists.'
END
"@

try {
    $createDbResult = $createDbQuery | sqlcmd -S $sqlServer -U $sqlUser -P $sqlPassword
    Write-Host $createDbResult -ForegroundColor $green
} catch {
    Write-Host "Error creating database: $_" -ForegroundColor $red
    exit 1
}

# Apply schema
Write-Host "Applying database schema..." -ForegroundColor $cyan
try {
    $schemaContent = Get-Content -Path $schemaFile -Raw
    $schemaResult = $schemaContent | sqlcmd -S $sqlServer -U $sqlUser -P $sqlPassword -d $sqlDatabase
    Write-Host "Schema applied successfully." -ForegroundColor $green
} catch {
    Write-Host "Error applying schema: $_" -ForegroundColor $red
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
    $verifyResult = $verifyQuery | sqlcmd -S $sqlServer -U $sqlUser -P $sqlPassword -d $sqlDatabase
    Write-Host $verifyResult -ForegroundColor $green
} catch {
    Write-Host "Error verifying database objects: $_" -ForegroundColor $red
    exit 1
}

Write-Host "Local database setup complete!" -ForegroundColor $green
Write-Host "You can now run the application with SQL database enabled." -ForegroundColor $green
Write-Host "Make sure your .env.local file has the following settings:" -ForegroundColor $yellow
Write-Host "REACT_APP_USE_SQL_DATABASE=true" -ForegroundColor $yellow
Write-Host "REACT_APP_SQL_SERVER=$sqlServer" -ForegroundColor $yellow
Write-Host "REACT_APP_SQL_DATABASE=$sqlDatabase" -ForegroundColor $yellow
Write-Host "REACT_APP_SQL_USER=$sqlUser" -ForegroundColor $yellow
Write-Host "REACT_APP_SQL_PASSWORD=********" -ForegroundColor $yellow 