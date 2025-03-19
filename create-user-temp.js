// Script to create a test user in Firebase Authentication
const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword } = require('firebase/auth');
require('dotenv').config();

// Firebase configuration with values directly from .env.local
const firebaseConfig = {
  apiKey: "AIzaSyC8HbeEYkFb99Av6lA4uBGPdgSRtMHHMEo",
  authDomain: "calendarapp-1148.firebaseapp.com",
  projectId: "calendarapp-1148",
  storageBucket: "calendarapp-1148.firebasestorage.app",
  messagingSenderId: "48561938511",
  appId: "1:48561938511:web:78aee1298a65a050510a3a",
  measurementId: "G-S19CRE4XM8"
};

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