// Script to create a test user in Firebase Authentication
const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword } = require('firebase/auth');

// Firebase configuration
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

// Create a test user
const email = 'test@example.com';
const password = 'Test123!';

createUserWithEmailAndPassword(auth, email, password)
  .then((userCredential) => {
    // User created successfully
    const user = userCredential.user;
    console.log('User created successfully:', user.uid);
    process.exit(0);
  })
  .catch((error) => {
    // Error creating user
    console.error('Error creating user:', error.code, error.message);
    process.exit(1);
  }); 