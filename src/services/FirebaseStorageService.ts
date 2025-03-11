// Firebase Storage Service
import { format } from 'date-fns';
import { ref, uploadBytes, getDownloadURL, listAll, getMetadata } from 'firebase/storage';
import { storage } from '../config/firebase-config';

// Types
interface SyncResult {
  success: boolean;
  message: string;
  timestamp: string;
  recordsProcessed?: number;
  fileName?: string;
}

class FirebaseStorageService {
  private isInitialized: boolean = false;
  private backupFolderPath: string = 'backups';
  private calendarFolderPath: string = 'calendar';
  private isLocalhost: boolean = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  // Initialize the service
  async initialize(): Promise<boolean> {
    try {
      this.isInitialized = true;
      console.log('Firebase Storage service initialized');
      return true;
    } catch (error: any) {
      console.error('Error initializing Firebase Storage service:', error);
      return false;
    }
  }

  // Helper method to get download URL and handle CORS
  private async getProxiedDownloadURL(fileRef: any): Promise<string> {
    const originalUrl = await getDownloadURL(fileRef);
    
    // For local development, use the proxy
    if (this.isLocalhost) {
      // Replace the Firebase Storage URL with our proxy URL
      return originalUrl.replace('https://firebasestorage.googleapis.com', '/firebase-api');
    }
    
    return originalUrl;
  }

  // Export data to Firebase Storage
  async exportToStorage(data: any): Promise<SyncResult> {
    if (!this.isInitialized) {
      return {
        success: false,
        message: "Firebase Storage service not initialized",
        timestamp: new Date().toISOString()
      };
    }

    try {
      const fileName = `calendar_${format(new Date(), "yyyy-MM-dd_HH-mm-ss")}.json`;
      const filePath = `${this.calendarFolderPath}/${fileName}`;
      const fileRef = ref(storage, filePath);
      
      // Convert data to JSON string
      const jsonData = JSON.stringify(data);
      
      // Convert string to Blob
      const blob = new Blob([jsonData], { type: 'application/json' });
      
      // Upload to Firebase Storage with metadata
      await uploadBytes(fileRef, blob, {
        contentType: 'application/json',
        customMetadata: {
          'Access-Control-Allow-Origin': '*'
        }
      });
      
      return {
        success: true,
        message: "Data exported to Firebase Storage successfully",
        timestamp: new Date().toISOString(),
        recordsProcessed: data.shifts ? data.shifts.length : 0,
        fileName
      };
    } catch (error: any) {
      console.error("Error exporting to Firebase Storage:", error);
      return {
        success: false,
        message: `Error exporting to Firebase Storage: ${error.message || "Unknown error"}`,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Import data from Firebase Storage
  async importFromStorage(fileName: string): Promise<{ data: any | null, result: SyncResult }> {
    if (!this.isInitialized) {
      return {
        data: null,
        result: {
          success: false,
          message: "Firebase Storage service not initialized",
          timestamp: new Date().toISOString()
        }
      };
    }

    try {
      const filePath = `${this.calendarFolderPath}/${fileName}`;
      const fileRef = ref(storage, filePath);
      
      // Get download URL
      const downloadURL = await this.getProxiedDownloadURL(fileRef);
      
      // Fetch the file
      const response = await fetch(downloadURL);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Parse JSON data
      const data = await response.json();
      
      return {
        data,
        result: {
          success: true,
          message: "Data imported from Firebase Storage successfully",
          timestamp: new Date().toISOString(),
          recordsProcessed: data.shifts ? data.shifts.length : 0,
          fileName
        }
      };
    } catch (error: any) {
      console.error("Error importing from Firebase Storage:", error);
      return {
        data: null,
        result: {
          success: false,
          message: `Error importing from Firebase Storage: ${error.message || "Unknown error"}`,
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  // Get the latest calendar file
  async getLatestCalendarFile(): Promise<{ data: any | null, result: SyncResult }> {
    if (!this.isInitialized) {
      return {
        data: null,
        result: {
          success: false,
          message: "Firebase Storage service not initialized",
          timestamp: new Date().toISOString()
        }
      };
    }

    try {
      const folderRef = ref(storage, this.calendarFolderPath);
      const filesList = await listAll(folderRef);
      
      if (filesList.items.length === 0) {
        return {
          data: null,
          result: {
            success: false,
            message: "No calendar files found in Firebase Storage",
            timestamp: new Date().toISOString()
          }
        };
      }
      
      // Get metadata for all files to find the latest one
      const filesWithMetadata = await Promise.all(
        filesList.items.map(async (fileRef) => {
          const metadata = await getMetadata(fileRef);
          return {
            ref: fileRef,
            name: fileRef.name,
            updated: metadata.updated
          };
        })
      );
      
      // Sort by updated date (newest first)
      filesWithMetadata.sort((a, b) => 
        new Date(b.updated).getTime() - new Date(a.updated).getTime()
      );
      
      // Get the latest file
      const latestFile = filesWithMetadata[0];
      
      // Get download URL
      const downloadURL = await this.getProxiedDownloadURL(latestFile.ref);
      
      // Fetch the file
      const response = await fetch(downloadURL);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Parse JSON data
      const data = await response.json();
      
      return {
        data,
        result: {
          success: true,
          message: "Latest calendar file retrieved from Firebase Storage successfully",
          timestamp: new Date().toISOString(),
          recordsProcessed: data.shifts ? data.shifts.length : 0,
          fileName: latestFile.name
        }
      };
    } catch (error: any) {
      console.error("Error getting latest calendar file from Firebase Storage:", error);
      return {
        data: null,
        result: {
          success: false,
          message: `Error getting latest calendar file: ${error.message || "Unknown error"}`,
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  // Create a backup of the calendar data
  async createBackup(data: any): Promise<SyncResult> {
    if (!this.isInitialized) {
      return {
        success: false,
        message: "Firebase Storage service not initialized",
        timestamp: new Date().toISOString()
      };
    }

    try {
      const fileName = `backup_${format(new Date(), "yyyy-MM-dd_HH-mm-ss")}.json`;
      const filePath = `${this.backupFolderPath}/${fileName}`;
      const fileRef = ref(storage, filePath);
      
      // Convert data to JSON string
      const jsonData = JSON.stringify(data);
      
      // Convert string to Blob
      const blob = new Blob([jsonData], { type: 'application/json' });
      
      // Upload to Firebase Storage with metadata
      await uploadBytes(fileRef, blob, {
        contentType: 'application/json',
        customMetadata: {
          'Access-Control-Allow-Origin': '*'
        }
      });
      
      return {
        success: true,
        message: "Backup created in Firebase Storage successfully",
        timestamp: new Date().toISOString(),
        recordsProcessed: data.shifts ? data.shifts.length : 0,
        fileName
      };
    } catch (error: any) {
      console.error("Error creating backup in Firebase Storage:", error);
      return {
        success: false,
        message: `Error creating backup: ${error.message || "Unknown error"}`,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Get available backups
  async getAvailableBackups(): Promise<{ files: { name: string, lastModified: string, size: number }[], result: SyncResult }> {
    if (!this.isInitialized) {
      return {
        files: [],
        result: {
          success: false,
          message: "Firebase Storage service not initialized",
          timestamp: new Date().toISOString()
        }
      };
    }

    try {
      // For development environment, return mock data to avoid CORS issues
      if (this.isLocalhost) {
        console.log('Using mock backup data in development environment');
        
        // Generate some mock backup files
        const mockFiles = [
          {
            name: `backup_${format(new Date(), "yyyy-MM-dd")}_10-30-00.json`,
            lastModified: new Date().toISOString(),
            size: 1024 * 10 // 10KB
          },
          {
            name: `backup_${format(new Date(Date.now() - 86400000), "yyyy-MM-dd")}_15-45-00.json`, // Yesterday
            lastModified: new Date(Date.now() - 86400000).toISOString(),
            size: 1024 * 8 // 8KB
          },
          {
            name: `backup_${format(new Date(Date.now() - 86400000 * 2), "yyyy-MM-dd")}_09-15-00.json`, // 2 days ago
            lastModified: new Date(Date.now() - 86400000 * 2).toISOString(),
            size: 1024 * 12 // 12KB
          }
        ];
        
        return {
          files: mockFiles,
          result: {
            success: true,
            message: "Mock backup files retrieved successfully",
            timestamp: new Date().toISOString()
          }
        };
      }
      
      // For production, use the actual Firebase Storage
      const folderRef = ref(storage, this.backupFolderPath);
      const filesList = await listAll(folderRef);
      
      if (filesList.items.length === 0) {
        return {
          files: [],
          result: {
            success: true,
            message: "No backup files found in Firebase Storage",
            timestamp: new Date().toISOString()
          }
        };
      }
      
      // Get metadata for all files
      const filesWithMetadata = await Promise.all(
        filesList.items.map(async (fileRef) => {
          const metadata = await getMetadata(fileRef);
          return {
            name: fileRef.name,
            lastModified: metadata.updated,
            size: metadata.size
          };
        })
      );
      
      // Sort by updated date (newest first)
      filesWithMetadata.sort((a, b) => 
        new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
      );
      
      return {
        files: filesWithMetadata,
        result: {
          success: true,
          message: "Backup files retrieved from Firebase Storage successfully",
          timestamp: new Date().toISOString()
        }
      };
    } catch (error: any) {
      console.error("Error getting available backups from Firebase Storage:", error);
      
      // Return empty array with error message
      return {
        files: [],
        result: {
          success: false,
          message: `Error getting available backups: ${error.message || "Unknown error"}`,
          timestamp: new Date().toISOString()
        }
      };
    }
  }
}

// Create and export a singleton instance
const firebaseStorageService = new FirebaseStorageService();
export default firebaseStorageService; 