// Script to create a test user in Firebase Authentication
const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword } = require('firebase/auth');
require('dotenv').config();

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-S19CRE4XM8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Create admin users
const adminEmailFull = 'admin@clinicamedicos.org';
const adminUsernameEmail = 'Admin@clinicamedicos.org';
const password = 'FamMed25!';

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

// Create both admin users
async function createAdminUsers() {
  console.log('Creating admin users...');
  
  await createUser(adminEmailFull, password);
  await createUser(adminUsernameEmail, password);
  
  console.log('Admin user creation process completed.');
  console.log('You can log in with either:');
  console.log(`1. Email: ${adminEmailFull}, Password: ${password}`);
  console.log(`2. Username: Admin, Password: ${password}`);
  
  process.exit(0);
}

createAdminUsers(); 