import { getFirestore, collection, getDocs } from "firebase/firestore";
import { saveAs } from 'file-saver';

/**
 * Exports all data from Firebase collections into a JSON file format
 * that matches the import template structure
 * 
 * This browser-compatible version can be used directly in your React app
 * 
 * @param {Object} db - Firestore database instance
 * @returns {Promise<Object>} The exported data object
 */
export async function exportFirebaseData(db) {
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

    return exportData;
  } catch (error) {
    console.error("Error exporting data:", error);
    throw error;
  }
}

/**
 * Export Firebase data and save it as a JSON file in the browser
 * 
 * @param {Object} db - Firestore database instance
 */
export async function exportAndDownloadData(db) {
  try {
    const exportData = await exportFirebaseData(db);
    
    // Convert to JSON
    const jsonData = JSON.stringify(exportData, null, 2);
    
    // Create blob and save file
    const blob = new Blob([jsonData], { type: 'application/json' });
    saveAs(blob, `calendar-data-export-${new Date().toISOString().slice(0, 10)}.json`);
    
    return exportData;
  } catch (error) {
    console.error("Error exporting and downloading data:", error);
    throw error;
  }
} 