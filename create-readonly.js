// Script to create a read-only user in Firebase Authentication
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

// Firebase configuration from environment variables
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

// Read-only user credentials (must match those in AuthContext.tsx)
const readOnlyEmail = 'readonly@example.com';
const readOnlyPassword = 'readonly';

// Function to create a user and handle errors
const createUser = async (email, password) => {
  console.log(`Attempting to create user: ${email}`);
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

// Create the read-only user
async function createReadOnlyUser() {
  console.log('Creating read-only user...');
  
  // Create the read-only user
  await createUser(readOnlyEmail, readOnlyPassword);
  
  console.log('User creation process completed.');
  console.log(`Read-only: ${readOnlyEmail}, Password: ${readOnlyPassword}`);
  
  process.exit(0);
}

createReadOnlyUser(); 