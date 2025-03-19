// Script to create a test user in Firebase Authentication
const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword } = require('firebase/auth');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env.local or .env file
const result = dotenv.config({ path: path.resolve(process.cwd(), '.env.local') }) || 
               dotenv.config({ path: path.resolve(process.cwd(), '.env') });

if (result.error) {
  console.warn('Warning: .env file not found. Using environment variables or defaults.');
}

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// Check if required configuration is available
if (!firebaseConfig.apiKey) {
  console.error('Error: Firebase API key not found in environment variables.');
  console.error('Please ensure your .env or .env.local file contains REACT_APP_FIREBASE_API_KEY');
  process.exit(1);
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Create admin users
const adminEmailFull = 'admin@clinicamedicos.org';
const adminUsernameEmail = 'Admin@clinicamedicos.org';
const password = 'FamMed25!';

// Read-only user credentials (must match those in AuthContext.tsx)
const readOnlyEmail = 'readonly@example.com';
const readOnlyPassword = 'readonly';

// Function to create a user and handle errors
const createUser = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log(`User created successfully with email ${email}:`, user.uid);
    return true;
  } catch (error) {
    console.error(`Error creating user ${email}:`, error.code, error.message);
    
    // If error is because user already exists, show a different message
    if (error.code === 'auth/email-already-in-use') {
      console.log(`User ${email} already exists. You can use the existing account to log in.`);
    }
    return false;
  }
};

// Create both admin users and read-only user
async function createUsers() {
  console.log('Creating users...');
  
  await createUser(adminEmailFull, password);
  await createUser(adminUsernameEmail, password);
  
  // Create the read-only user
  await createUser(readOnlyEmail, readOnlyPassword);
  
  console.log('User creation process completed.');
  console.log('You can log in with:');
  console.log(`1. Email: ${adminEmailFull}, Password: ${password}`);
  console.log(`2. Username: Admin, Password: ${password}`);
  console.log(`3. Read-only: ${readOnlyEmail}, Password: ${readOnlyPassword}`);
  
  process.exit(0);
}

createUsers(); 