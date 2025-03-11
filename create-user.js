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

// Create admin user
const email = 'admin@clinicamedicos.org';
const password = 'FamMed25!';

createUserWithEmailAndPassword(auth, email, password)
  .then((userCredential) => {
    // User created successfully
    const user = userCredential.user;
    console.log('Admin user created successfully:', user.uid);
    console.log('Email:', email);
    console.log('Password:', password);
    process.exit(0);
  })
  .catch((error) => {
    // Error creating user
    console.error('Error creating admin user:', error.code, error.message);
    
    // If error is because user already exists, show a different message
    if (error.code === 'auth/email-already-in-use') {
      console.log('Admin user already exists. You can use the existing account to log in.');
    }
    
    process.exit(1);
  }); 