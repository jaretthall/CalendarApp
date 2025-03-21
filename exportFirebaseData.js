// exportFirebaseData.js
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { initializeApp } from "firebase/app";
import fs from "fs";

// Your Firebase configuration
// Replace with your actual Firebase config
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Exports all data from Firebase collections into a JSON file format
 * that matches the import template structure
 */
async function exportFirebaseData() {
  try {
    // Get all providers
    const providersSnapshot = await getDocs(collection(db, "providers"));
    const providers = providersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Get all clinic types
    const clinicTypesSnapshot = await getDocs(collection(db, "clinicTypes"));
    const clinicTypes = clinicTypesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Get all shifts
    const shiftsSnapshot = await getDocs(collection(db, "shifts"));
    const shifts = shiftsSnapshot.docs.map(doc => {
      const data = doc.data();
      
      // Convert Firebase Timestamps to ISO strings for exports
      return {
        id: doc.id,
        ...data,
        startDate: data.startDate?.toDate().toISOString() || null,
        endDate: data.endDate?.toDate().toISOString() || null,
        recurrenceEndDate: data.recurrenceEndDate?.toDate()?.toISOString() || null,
      };
    });

    // Get all notes
    const notesSnapshot = await getDocs(collection(db, "notes"));
    const notes = notesSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        date: data.date?.toDate().toISOString() || null,
      };
    });

    // Create the export object in the format expected by the import template
    const exportData = {
      version: "1.0",
      exportDate: new Date().toISOString(),
      providers,
      clinicTypes,
      shifts,
      notes
    };

    // Convert to JSON
    const jsonData = JSON.stringify(exportData, null, 2);

    // Write to file
    fs.writeFileSync("calendar-data-export.json", jsonData);

    console.log("Data exported successfully to calendar-data-export.json");
    return exportData;
  } catch (error) {
    console.error("Error exporting data:", error);
    throw error;
  }
}

// Run the export
exportFirebaseData()
  .then(() => {
    console.log("Export completed!");
    process.exit(0);
  })
  .catch(err => {
    console.error("Export failed:", err);
    process.exit(1);
  }); 