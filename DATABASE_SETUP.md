# Setting Up the Local SQL Database

This guide will help you set up a local SQL Server database for the Calendar application.

## Prerequisites

### Windows

1. **SQL Server**: Install SQL Server (Express or Developer Edition)
   - Download from: https://www.microsoft.com/en-us/sql-server/sql-server-downloads
   - During installation, choose "Basic" installation type for simplicity
   - Make sure to note the sa password you set during installation

2. **SQL Server Management Studio (SSMS)** (Optional but recommended)
   - Download from: https://docs.microsoft.com/en-us/sql/ssms/download-sql-server-management-studio-ssms

3. **SQL Command Line Tools**
   - These should be installed with SQL Server, but if not:
   - Download from: https://docs.microsoft.com/en-us/sql/tools/sqlcmd-utility

### macOS/Linux

1. **Docker**
   - Download from: https://www.docker.com/products/docker-desktop
   - We'll run SQL Server in a Docker container

## Setup Instructions

### Automatic Setup (Recommended)

#### Windows

1. Open PowerShell as Administrator
2. Navigate to the project directory
3. Run the setup script:
   ```
   .\setup-local-db.ps1
   ```
4. If you encounter any errors, check the troubleshooting section below

#### macOS/Linux

1. Open Terminal
2. Navigate to the project directory
3. Make the script executable:
   ```
   chmod +x setup-local-db.sh
   ```
4. Run the setup script:
   ```
   ./setup-local-db.sh
   ```
5. If you encounter any errors, check the troubleshooting section below

### Manual Setup

If the automatic setup doesn't work, you can set up the database manually:

#### Windows

1. Open SQL Server Management Studio
2. Connect to your local SQL Server instance
3. Create a new database named `CalendarApp`
4. Open the `database/schema.sql` file in SSMS
5. Execute the script to create the tables and sample data

#### macOS/Linux

1. Start a SQL Server Docker container:
   ```
   docker run -e "ACCEPT_EULA=Y" -e "SA_PASSWORD=YourStrongPassword123" -p 1433:1433 --name sql-server-calendar-app -d mcr.microsoft.com/mssql/server:2019-latest
   ```
2. Wait for the container to start (about 10-20 seconds)
3. Create the database:
   ```
   docker exec -it sql-server-calendar-app /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P YourStrongPassword123 -Q "CREATE DATABASE CalendarApp"
   ```
4. Apply the schema:
   ```
   cat database/schema.sql | docker exec -i sql-server-calendar-app /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P YourStrongPassword123 -d CalendarApp
   ```

## Configuring the Application

After setting up the database, you need to configure the application to use it:

1. Open the `.env.local` file in the project root
2. Make sure the following settings are correct:
   ```
   REACT_APP_USE_SQL_DATABASE=true
   REACT_APP_USE_LOCAL_STORAGE=false
   REACT_APP_SQL_SERVER=localhost
   REACT_APP_SQL_DATABASE=CalendarApp
   REACT_APP_SQL_USER=sa
   REACT_APP_SQL_PASSWORD=YourStrongPassword123
   REACT_APP_SQL_ENCRYPT=false
   REACT_APP_SQL_TRUST_SERVER_CERTIFICATE=true
   ```
3. Replace `YourStrongPassword123` with the actual password you set for the SQL Server sa account

## Troubleshooting

### Connection Issues

- **Error: Cannot connect to localhost**: Make sure SQL Server is running
  - Windows: Check Services app to see if "SQL Server (MSSQLSERVER)" is running
  - macOS/Linux: Check if the Docker container is running with `docker ps`

- **Error: Login failed for user 'sa'**: Check the password in your .env.local file
  - Make sure it matches the password you set during SQL Server installation
  - For Docker, make sure it matches the SA_PASSWORD you set when creating the container

### Schema Issues

- **Error applying schema**: Check if the database already exists and has tables
  - You might need to drop the existing database first:
    - Windows: `sqlcmd -S localhost -U sa -P YourPassword -Q "DROP DATABASE CalendarApp"`
    - macOS/Linux: `docker exec -it sql-server-calendar-app /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P YourPassword -Q "DROP DATABASE CalendarApp"`

## Verifying the Setup

To verify that the database is set up correctly:

1. Start the application:
   ```
   npm start
   ```
2. Open the browser and navigate to the application
3. Check the browser console for any database-related errors
4. Try creating a new provider or shift to test database operations

## Next Steps

Once your local database is working correctly, you can:

1. Customize the database schema as needed
2. Add more sample data for testing
3. Prepare for deployment to Azure SQL Database 