# Calendar Application

A modern web application for managing healthcare provider schedules, built with React, Material-UI, and Azure services.

## Features

- **Authentication**: Microsoft Authentication Library (MSAL) for Azure AD authentication
- **Modern UI**: Material-UI components for a responsive design
- **Backend Integration**: Azure Functions with Cosmos DB for data storage
- **Deployment**: Azure Static Web Apps with CI/CD pipeline
- **Multiple Calendar Views**: Month, Two Week, and Three Month views
- **Color-coded Employee Shifts**: Visual representation of employee schedules
- **Vacation Tracking**: Track employee vacations
- **Recurring Shift Scheduling**: Set up recurring shifts with various patterns
- **Multi-location Support**: Support for multiple locations with split views
- **Data Backup and Restore**: Export and import schedule data
- **PDF Export**: Export calendar views as PDF

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm 9.x or later
- Azure subscription (for deployment)

### Local Development

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Update the values as needed
4. Start the development server:
   ```
   npm start
   ```

## Project Structure

- `src/`: React application source code
  - `components/`: UI components
    - `calendar/`: Calendar-related components
    - `employees/`: Employee management components
    - `shared/`: Shared UI components
  - `contexts/`: React contexts for state management
  - `hooks/`: Custom React hooks
  - `styles/`: CSS and styling files
  - `utils/`: Utility functions
- `public/`: Static assets and HTML template

## Environment Variables

The application requires the following environment variables:

- `REACT_APP_AZURE_CLIENT_ID`: Azure AD client ID
- `REACT_APP_AZURE_TENANT_ID`: Azure AD tenant ID
- `REACT_APP_REDIRECT_URI`: Authentication redirect URI
- `REACT_APP_API_ENDPOINT`: Azure Function API endpoint

## Database Setup

The application can use either local storage or a SQL database for data persistence. For local development with SQL:

1. Follow the instructions in [DATABASE_SETUP.md](DATABASE_SETUP.md) to set up a local SQL Server database
2. Configure the application to use the SQL database by setting the appropriate environment variables

For production deployment, the application will use Azure SQL Database. See the deployment section for details.

## License

This project is licensed under the MIT License - see the LICENSE file for details. 

## Deployment to Azure

This application is configured for deployment to Azure Static Web Apps with GitHub Actions for CI/CD.

### Prerequisites for Deployment

1. An Azure account with an active subscription
2. A GitHub account with this repository
3. Azure CLI installed (optional, for manual deployment)

### Deployment Steps

#### 1. Create Azure Resources

1. **Azure AD App Registration**:
   - Go to Azure Portal > Azure Active Directory > App Registrations
   - Create a new registration for the application
   - Configure the redirect URIs (add both local and production URLs)
   - Note the Application (client) ID and Directory (tenant) ID
   - Under "Authentication", enable "Access tokens" and "ID tokens"

2. **Azure SQL Database** (if using SQL storage):
   - Create a new SQL Server and Database in Azure
   - Configure firewall rules to allow connections
   - Note the server name, database name, and credentials
   - Deploy the database schema:
     - Option 1: Use Azure Data Studio to connect and run the schema.sql script
     - Option 2: Use the Azure CLI:
       ```
       az sql db import --admin-password <password> --admin-user <username> --auth-type SQL --database-name <database> --resource-group <resource-group> --server <server> --storage-key <storage-key> --storage-key-type StorageAccessKey --storage-uri <storage-uri>
       ```
     - Option 3: Use SQL Server Management Studio to deploy the schema

3. **SharePoint Integration** (if using SharePoint):
   - Set up a SharePoint site
   - Note the Site ID, Drive ID, and Folder ID for document storage

#### 2. Set Up Azure Static Web Apps

1. Go to Azure Portal and search for "Static Web Apps"
2. Click "Create" and fill in the details:
   - Select your subscription and resource group
   - Name your app
   - Choose a region close to your users
   - For "Deployment details":
     - Select GitHub as the source
     - Authenticate and select your repository and branch
   - For "Build details":
     - Select "React" as the build preset
     - App location: "/"
     - API location: "" (leave empty if not using Azure Functions)
     - Output location: "build"
   - Click "Review + create" and then "Create"

3. After creation, Azure will automatically add a GitHub Actions workflow file to your repository.

#### 3. Configure GitHub Secrets

In your GitHub repository:
1. Go to Settings > Secrets and variables > Actions
2. Add the following secrets:
   - `AZURE_STATIC_WEB_APPS_API_TOKEN`: (automatically added by Azure)
   - `REACT_APP_AZURE_CLIENT_ID`: Your Azure AD client ID
   - `REACT_APP_AZURE_TENANT_ID`: Your Azure AD tenant ID
   - `REACT_APP_REDIRECT_URI`: Your production URL (e.g., https://your-app-name.azurestaticapps.net)
   - `REACT_APP_SHAREPOINT_SITE_ID`: Your SharePoint site ID
   - `REACT_APP_SHAREPOINT_DRIVE_ID`: Your SharePoint drive ID
   - `REACT_APP_SHAREPOINT_FOLDER_ID`: Your SharePoint folder ID
   - `REACT_APP_SQL_SERVER`: Your SQL server name
   - `REACT_APP_SQL_DATABASE`: Your SQL database name
   - `REACT_APP_SQL_USER`: Your SQL username
   - `REACT_APP_SQL_PASSWORD`: Your SQL password
   - `REACT_APP_USE_SHAREPOINT_SYNC`: Set to "true" to enable SharePoint sync
   - `REACT_APP_USE_SQL_DATABASE`: Set to "true" to use SQL database
   - `REACT_APP_USE_LOCAL_STORAGE`: Set to "false" in production

#### 4. Deploy the Application

1. Push changes to your main branch to trigger the GitHub Actions workflow
2. Monitor the deployment in the "Actions" tab of your GitHub repository
3. Once deployed, your app will be available at the URL provided by Azure Static Web Apps

#### 5. Custom Domain (Optional)

1. In Azure Portal, go to your Static Web App
2. Navigate to "Custom domains"
3. Follow the instructions to add and validate your custom domain

### Troubleshooting Deployment

- **Authentication Issues**: Ensure redirect URIs are correctly configured in Azure AD
- **CORS Errors**: Check that your API's CORS settings allow your Static Web App's domain
- **Environment Variables**: Verify all required environment variables are set in GitHub Secrets
- **Build Failures**: Check the GitHub Actions logs for specific error messages

### Manual Deployment

If you prefer to deploy manually:

1. Build the application locally:
   ```
   npm run build
   ```

2. Deploy using Azure CLI:
   ```
   az staticwebapp create --name your-app-name --resource-group your-resource-group --source build --location "West US 2"
   ```

3. Or deploy using the Azure Static Web Apps CLI:
   ```
   npm install -g @azure/static-web-apps-cli
   swa deploy ./build --env production
   ``` 