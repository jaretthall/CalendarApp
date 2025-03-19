// Script to create a read-only user in Firebase Authentication
const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword } = require('firebase/auth');

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