// Firebase Storage Service
import { format } from 'date-fns';
import { ref, uploadBytes, getDownloadURL, listAll, getMetadata } from 'firebase/storage';
import { storage, auth } from '../config/firebase-config';

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
      // Check if user is authenticated
      if (!auth.currentUser) {
        console.warn('Firebase Storage service initialization failed: User not authenticated');
        return false;
      }
      
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
    try {
      // Ensure user is authenticated
      if (!auth.currentUser) {
        throw new Error("User not authenticated");
      }
      
      // Get the token
      const token = await auth.currentUser.getIdToken();
      
      const originalUrl = await getDownloadURL(fileRef);
      
      // For local development, use the proxy
      if (this.isLocalhost) {
        // Replace the Firebase Storage URL with our proxy URL
        return originalUrl.replace('https://firebasestorage.googleapis.com', '/firebase-api');
      }
      
      // For production, append the auth token as a query parameter
      // This helps ensure the request is authenticated
      return `${originalUrl}?auth=${token}`;
    } catch (error) {
      console.error("Error getting download URL:", error);
      throw error;
    }
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
      // Ensure user is authenticated
      if (!auth.currentUser) {
        console.error("User not authenticated when trying to export data");
        return {
          success: false,
          message: "User not authenticated",
          timestamp: new Date().toISOString()
        };
      }
      
      // Get token to verify authentication
      const token = await auth.currentUser.getIdToken();
      console.log("User authenticated with token for export:", token ? "Valid token" : "No token");
      
      const fileName = `calendar_${format(new Date(), "yyyy-MM-dd_HH-mm-ss")}.json`;
      const filePath = `${this.calendarFolderPath}/${fileName}`;
      const fileRef = ref(storage, filePath);
      
      // Convert data to JSON string
      const jsonData = JSON.stringify(data);
      
      // Convert string to Blob
      const blob = new Blob([jsonData], { type: 'application/json' });
      
      try {
        // Upload to Firebase Storage with metadata
        await uploadBytes(fileRef, blob, {
          contentType: 'application/json',
          customMetadata: {
            'uploaded-by': auth.currentUser.uid,
            'uploaded-at': new Date().toISOString(),
            'content-type': 'application/json'
          }
        });
        
        console.log(`File ${fileName} uploaded successfully`);
        
        return {
          success: true,
          message: "Data exported to Firebase Storage successfully",
          timestamp: new Date().toISOString(),
          recordsProcessed: data.shifts ? data.shifts.length : 0,
          fileName
        };
      } catch (storageError: any) {
        const errorCode = storageError.code || 'unknown';
        const errorMessage = storageError.message || 'Unknown error';
        console.error(`Firebase Storage error during export (${errorCode}):`, errorMessage);
        
        return {
          success: false,
          message: `Error exporting to Firebase Storage: ${errorMessage} (${errorCode})`,
          timestamp: new Date().toISOString()
        };
      }
    } catch (error: any) {
      const errorMessage = error.message || "Unknown error";
      console.error("Error exporting data to Firebase Storage:", error);
      
      return {
        success: false,
        message: `Error exporting data: ${errorMessage}`,
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

  // Create a backup of the data
  async createBackup(data: any): Promise<SyncResult> {
    if (!this.isInitialized) {
      return {
        success: false,
        message: "Firebase Storage service not initialized",
        timestamp: new Date().toISOString()
      };
    }

    try {
      // Ensure user is authenticated
      if (!auth.currentUser) {
        console.error("User not authenticated when trying to create backup");
        return {
          success: false,
          message: "User not authenticated",
          timestamp: new Date().toISOString()
        };
      }
      
      // Get token to verify authentication
      const token = await auth.currentUser.getIdToken();
      console.log("User authenticated with token for backup:", token ? "Valid token" : "No token");
      
      const fileName = `backup_${format(new Date(), "yyyy-MM-dd_HH-mm-ss")}.json`;
      const filePath = `${this.backupFolderPath}/${fileName}`;
      const fileRef = ref(storage, filePath);
      
      // Convert data to JSON string
      const jsonData = JSON.stringify(data);
      
      // Convert string to Blob
      const blob = new Blob([jsonData], { type: 'application/json' });
      
      try {
        // Upload to Firebase Storage with metadata
        await uploadBytes(fileRef, blob, {
          contentType: 'application/json',
          customMetadata: {
            'uploaded-by': auth.currentUser.uid,
            'uploaded-at': new Date().toISOString(),
            'content-type': 'application/json',
            'backup-type': 'manual'
          }
        });
        
        console.log(`Backup ${fileName} created successfully`);
        
        return {
          success: true,
          message: "Backup created successfully",
          timestamp: new Date().toISOString(),
          recordsProcessed: data.shifts ? data.shifts.length : 0,
          fileName
        };
      } catch (storageError: any) {
        const errorCode = storageError.code || 'unknown';
        const errorMessage = storageError.message || 'Unknown error';
        console.error(`Firebase Storage error during backup (${errorCode}):`, errorMessage);
        
        return {
          success: false,
          message: `Error creating backup: ${errorMessage} (${errorCode})`,
          timestamp: new Date().toISOString()
        };
      }
    } catch (error: any) {
      const errorMessage = error.message || "Unknown error";
      console.error("Error creating backup:", error);
      
      return {
        success: false,
        message: `Error creating backup: ${errorMessage}`,
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
      // Ensure user is authenticated
      if (!auth.currentUser) {
        console.error("User not authenticated when trying to access backups");
        return {
          files: [],
          result: {
            success: false,
            message: "User not authenticated",
            timestamp: new Date().toISOString()
          }
        };
      }
      
      // Get token to verify authentication
      const token = await auth.currentUser.getIdToken();
      console.log("User authenticated with token:", token ? "Valid token" : "No token");
      
      const folderRef = ref(storage, this.backupFolderPath);
      
      try {
        const result = await listAll(folderRef);
        
        // Process files
        const filesPromises = result.items.map(async (item) => {
          try {
            const metadata = await getMetadata(item);
            return {
              name: item.name,
              lastModified: metadata.timeCreated,
              size: metadata.size
            };
          } catch (metadataError: any) {
            console.error(`Error getting metadata for ${item.name}:`, metadataError);
            return {
              name: item.name,
              lastModified: new Date().toISOString(),
              size: 0
            };
          }
        });
        
        const files = await Promise.all(filesPromises);
        
        // Sort files by lastModified (newest first)
        files.sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());
        
        return {
          files,
          result: {
            success: true,
            message: "Backups retrieved successfully",
            timestamp: new Date().toISOString()
          }
        };
      } catch (storageError: any) {
        const errorCode = storageError.code || 'unknown';
        const errorMessage = storageError.message || 'Unknown error';
        console.error(`Firebase Storage error (${errorCode}):`, errorMessage);
        
        return {
          files: [],
          result: {
            success: false,
            message: `Error getting available backups: ${errorMessage} (${errorCode})`,
            timestamp: new Date().toISOString()
          }
        };
      }
    } catch (error: any) {
      const errorMessage = error.message || "Unknown error";
      console.error("Error getting available backups:", error);
      
      return {
        files: [],
        result: {
          success: false,
          message: `Error getting available backups: ${errorMessage}`,
          timestamp: new Date().toISOString()
        }
      };
    }
  }
}

// Create and export a singleton instance
const firebaseStorageService = new FirebaseStorageService();
export default firebaseStorageService; 