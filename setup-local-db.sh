#!/bin/bash
# Setup Local SQL Database for Calendar App
# This script creates a local SQL Server database for development

# Configuration
SQL_SERVER="localhost"
SQL_DATABASE="CalendarApp"
SQL_USER="sa"
SQL_PASSWORD="YourStrongPassword123"
SCHEMA_FILE="database/schema.sql"

# Text colors
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Docker is installed
echo -e "${CYAN}Checking if Docker is installed...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker is not installed. Please install Docker.${NC}"
    echo -e "${YELLOW}You can download Docker from: https://www.docker.com/products/docker-desktop${NC}"
    exit 1
fi

echo -e "${GREEN}Docker is installed.${NC}"

# Check if SQL Server container is running
echo -e "${CYAN}Checking if SQL Server container is running...${NC}"
SQL_CONTAINER=$(docker ps -q -f name=sql-server-calendar-app)

if [ -z "$SQL_CONTAINER" ]; then
    echo -e "${YELLOW}SQL Server container not found. Creating new container...${NC}"
    
    # Pull SQL Server image
    echo -e "${CYAN}Pulling SQL Server image...${NC}"
    docker pull mcr.microsoft.com/mssql/server:2019-latest
    
    # Create and start SQL Server container
    echo -e "${CYAN}Creating and starting SQL Server container...${NC}"
    docker run -e "ACCEPT_EULA=Y" -e "SA_PASSWORD=$SQL_PASSWORD" \
        -p 1433:1433 --name sql-server-calendar-app \
        -d mcr.microsoft.com/mssql/server:2019-latest
    
    # Wait for SQL Server to start
    echo -e "${CYAN}Waiting for SQL Server to start...${NC}"
    sleep 20
else
    echo -e "${GREEN}SQL Server container is already running.${NC}"
fi

# Check if schema file exists
echo -e "${CYAN}Checking if schema file exists...${NC}"
if [ ! -f "$SCHEMA_FILE" ]; then
    echo -e "${RED}Schema file not found: $SCHEMA_FILE${NC}"
    exit 1
fi

# Create database if it doesn't exist
echo -e "${CYAN}Creating database if it doesn't exist...${NC}"
CREATE_DB_QUERY="IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = '$SQL_DATABASE')
BEGIN
    CREATE DATABASE [$SQL_DATABASE]
    PRINT 'Database created.'
END
ELSE
BEGIN
    PRINT 'Database already exists.'
END"

docker exec -it sql-server-calendar-app /opt/mssql-tools/bin/sqlcmd \
    -S localhost -U $SQL_USER -P $SQL_PASSWORD -Q "$CREATE_DB_QUERY"

if [ $? -ne 0 ]; then
    echo -e "${RED}Error creating database.${NC}"
    exit 1
fi

# Apply schema
echo -e "${CYAN}Applying database schema...${NC}"
cat $SCHEMA_FILE | docker exec -i sql-server-calendar-app /opt/mssql-tools/bin/sqlcmd \
    -S localhost -U $SQL_USER -P $SQL_PASSWORD -d $SQL_DATABASE

if [ $? -ne 0 ]; then
    echo -e "${RED}Error applying schema.${NC}"
    exit 1
fi

echo -e "${GREEN}Schema applied successfully.${NC}"

# Verify database objects
echo -e "${CYAN}Verifying database objects...${NC}"
VERIFY_QUERY="SELECT 'Tables: ' + CAST(COUNT(*) AS VARCHAR) FROM sys.tables;
SELECT 'Providers: ' + CAST(COUNT(*) AS VARCHAR) FROM Providers;
SELECT 'ClinicTypes: ' + CAST(COUNT(*) AS VARCHAR) FROM ClinicTypes;"

docker exec -it sql-server-calendar-app /opt/mssql-tools/bin/sqlcmd \
    -S localhost -U $SQL_USER -P $SQL_PASSWORD -d $SQL_DATABASE -Q "$VERIFY_QUERY"

if [ $? -ne 0 ]; then
    echo -e "${RED}Error verifying database objects.${NC}"
    exit 1
fi

echo -e "${GREEN}Local database setup complete!${NC}"
echo -e "${GREEN}You can now run the application with SQL database enabled.${NC}"
echo -e "${YELLOW}Make sure your .env.local file has the following settings:${NC}"
echo -e "${YELLOW}REACT_APP_USE_SQL_DATABASE=true${NC}"
echo -e "${YELLOW}REACT_APP_SQL_SERVER=$SQL_SERVER${NC}"
echo -e "${YELLOW}REACT_APP_SQL_DATABASE=$SQL_DATABASE${NC}"
echo -e "${YELLOW}REACT_APP_SQL_USER=$SQL_USER${NC}"
echo -e "${YELLOW}REACT_APP_SQL_PASSWORD=********${NC}" 