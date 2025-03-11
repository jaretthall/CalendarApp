# Example Calendar App

A modern web application for managing healthcare provider schedules, built with React, Material-UI, and Azure services.

## Features

- **Authentication**: Microsoft Authentication Library (MSAL) for Azure AD authentication
- **Modern UI**: Material-UI components for a responsive design
- **Backend Integration**: Azure Functions with Cosmos DB for data storage
- **Deployment**: Azure Static Web Apps with CI/CD pipeline

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
   - Copy `env/.env` to the root directory as `.env`
   - Update the values as needed
4. Start the development server:
   ```
   npm run dev
   ```
5. Start the Azure Function app (in a separate terminal):
   ```
   cd function-app
   npm start
   ```

### Building for Production

Use the provided build script:
```
./build-and-deploy.ps1
```

Or manually:
1. Build the application:
   ```
   npm run build
   ```
2. Copy the configuration file:
   ```
   Copy-Item -Path "config/staticwebapp.config.json" -Destination "dist/staticwebapp.config.json"
   ```

### Deployment

The application is configured for deployment to Azure Static Web Apps with a CI/CD pipeline. See `config/azure-pipelines.yml` for details.

## Project Structure

- `src/`: React application source code
  - `components/`: UI components
  - `config/`: Configuration files
- `function-app/`: Azure Functions for backend API
- `config/`: Configuration files for deployment
- `env/`: Environment variable templates

## Environment Variables

The application requires the following environment variables:

- `VITE_COSMOS_ENDPOINT`: Azure Cosmos DB endpoint
- `VITE_COSMOS_KEY`: Azure Cosmos DB key
- `VITE_DATABASE_ID`: Cosmos DB database ID
- `VITE_CONTAINER_ID`: Cosmos DB container ID
- `VITE_AZURE_CLIENT_ID`: Azure AD client ID
- `VITE_AZURE_TENANT_ID`: Azure AD tenant ID
- `VITE_REDIRECT_URI`: Authentication redirect URI
- `VITE_API_ENDPOINT`: Azure Function API endpoint
- `VITE_API_URL`: Base URL for API calls

## Troubleshooting

If you encounter issues:

1. Ensure all environment variables are correctly set
2. Check that the Azure Function app is running
3. Verify that the build output contains all necessary files
4. Check browser console for any errors

## License

This project is licensed under the MIT License - see the LICENSE file for details.
