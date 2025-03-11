#!/bin/bash
# Deploy Database Schema to Azure SQL Database
# This script deploys the database schema to Azure SQL Database

# Configuration - Replace these with your actual values
RESOURCE_GROUP="calendar-app-rg"
SQL_SERVER="calendar-app-sql"
SQL_DATABASE="CalendarApp"
SQL_USER="sqladmin"
SQL_PASSWORD="YourStrongPassword123"
SCHEMA_FILE="database/schema.sql"

# Text colors
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Azure CLI is installed
echo -e "${CYAN}Checking if Azure CLI is installed...${NC}"
if ! command -v az &> /dev/null; then
    echo -e "${RED}Azure CLI is not installed. Please install it from https://docs.microsoft.com/en-us/cli/azure/install-azure-cli${NC}"
    exit 1
fi

echo -e "${GREEN}Azure CLI is available.${NC}"

# Check if sqlcmd is available
echo -e "${CYAN}Checking if sqlcmd is available...${NC}"
if ! command -v sqlcmd &> /dev/null; then
    echo -e "${RED}sqlcmd is not available. Please install SQL Server Command Line Tools.${NC}"
    echo -e "${YELLOW}You can download it from: https://docs.microsoft.com/en-us/sql/tools/sqlcmd-utility${NC}"
    exit 1
fi

echo -e "${GREEN}sqlcmd is available.${NC}"

# Check if schema file exists
echo -e "${CYAN}Checking if schema file exists...${NC}"
if [ ! -f "$SCHEMA_FILE" ]; then
    echo -e "${RED}Schema file not found: $SCHEMA_FILE${NC}"
    exit 1
fi

# Login to Azure
echo -e "${CYAN}Logging in to Azure...${NC}"
az login
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to login to Azure. Please try again.${NC}"
    exit 1
fi

# Get the SQL Server FQDN
echo -e "${CYAN}Getting SQL Server FQDN...${NC}"
SQL_SERVER_FQDN=$(az sql server show --resource-group $RESOURCE_GROUP --name $SQL_SERVER --query "fullyQualifiedDomainName" -o tsv)
if [ $? -ne 0 ] || [ -z "$SQL_SERVER_FQDN" ]; then
    echo -e "${RED}Failed to get SQL Server FQDN. Please check the resource group and server name.${NC}"
    exit 1
fi

echo -e "${GREEN}SQL Server FQDN: $SQL_SERVER_FQDN${NC}"

# Add client IP to firewall rules
echo -e "${CYAN}Adding client IP to firewall rules...${NC}"
CLIENT_IP=$(curl -s https://api.ipify.org)
az sql server firewall-rule create --resource-group $RESOURCE_GROUP --server $SQL_SERVER --name "DeploymentClient" --start-ip-address $CLIENT_IP --end-ip-address $CLIENT_IP
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}Failed to add client IP to firewall rules. Continuing anyway...${NC}"
fi

# Deploy schema
echo -e "${CYAN}Deploying schema to Azure SQL Database...${NC}"
cat $SCHEMA_FILE | sqlcmd -S $SQL_SERVER_FQDN -U $SQL_USER -P $SQL_PASSWORD -d $SQL_DATABASE
if [ $? -ne 0 ]; then
    echo -e "${RED}Error deploying schema.${NC}"
    exit 1
fi

echo -e "${GREEN}Schema deployed successfully.${NC}"

# Verify database objects
echo -e "${CYAN}Verifying database objects...${NC}"
VERIFY_QUERY="SELECT 'Tables: ' + CAST(COUNT(*) AS VARCHAR) FROM sys.tables;
SELECT 'Providers: ' + CAST(COUNT(*) AS VARCHAR) FROM Providers;
SELECT 'ClinicTypes: ' + CAST(COUNT(*) AS VARCHAR) FROM ClinicTypes;"

sqlcmd -S $SQL_SERVER_FQDN -U $SQL_USER -P $SQL_PASSWORD -d $SQL_DATABASE -Q "$VERIFY_QUERY"
if [ $? -ne 0 ]; then
    echo -e "${RED}Error verifying database objects.${NC}"
    exit 1
fi

# Remove client IP from firewall rules
echo -e "${CYAN}Removing client IP from firewall rules...${NC}"
az sql server firewall-rule delete --resource-group $RESOURCE_GROUP --server $SQL_SERVER --name "DeploymentClient" --yes
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}Failed to remove client IP from firewall rules. Please remove it manually.${NC}"
fi

echo -e "${GREEN}Azure SQL Database deployment complete!${NC}"
echo -e "${YELLOW}Make sure to update your production environment variables with the following settings:${NC}"
echo -e "${YELLOW}REACT_APP_USE_SQL_DATABASE=true${NC}"
echo -e "${YELLOW}REACT_APP_SQL_SERVER=$SQL_SERVER_FQDN${NC}"
echo -e "${YELLOW}REACT_APP_SQL_DATABASE=$SQL_DATABASE${NC}"
echo -e "${YELLOW}REACT_APP_SQL_USER=$SQL_USER${NC}"
echo -e "${YELLOW}REACT_APP_SQL_PASSWORD=********${NC}" 