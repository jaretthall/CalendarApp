// Azure Configuration
export const azureConfig = {
  // Azure AD (Microsoft Identity Platform) Configuration
  auth: {
    clientId: process.env.REACT_APP_AZURE_CLIENT_ID || '',
    authority: `https://login.microsoftonline.com/${process.env.REACT_APP_AZURE_TENANT_ID || ''}`,
    redirectUri: process.env.REACT_APP_REDIRECT_URI || window.location.origin,
  },
  
  // SQL Database Configuration
  database: {
    server: process.env.REACT_APP_SQL_SERVER || '',
    database: process.env.REACT_APP_SQL_DATABASE || '',
    user: process.env.REACT_APP_SQL_USER || '',
    password: process.env.REACT_APP_SQL_PASSWORD || '',
    port: process.env.REACT_APP_SQL_PORT ? parseInt(process.env.REACT_APP_SQL_PORT) : 1433,
    encrypt: process.env.REACT_APP_SQL_ENCRYPT !== 'false',
    trustServerCertificate: process.env.REACT_APP_SQL_TRUST_SERVER_CERTIFICATE === 'true',
  },
  
  // API Configuration (for when we move to a backend API)
  api: {
    baseUrl: process.env.REACT_APP_API_BASE_URL || '',
    scopes: ['api://your-api-client-id/access_as_user'],
  },
  
  // Feature Flags
  features: {
    useSqlDatabase: process.env.REACT_APP_USE_SQL_DATABASE === 'true',
    useLocalStorage: process.env.REACT_APP_USE_LOCAL_STORAGE !== 'false',
  }
};

// MSAL Configuration
export const msalConfig = {
  auth: {
    clientId: azureConfig.auth.clientId,
    authority: azureConfig.auth.authority,
    redirectUri: azureConfig.auth.redirectUri,
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: false,
  },
};

// Login Request
export const loginRequest = {
  scopes: ['User.Read'],
};

export default azureConfig; 