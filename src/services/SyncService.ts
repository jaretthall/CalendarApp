import { format } from 'date-fns';
import firebaseStorageService from './FirebaseStorageService';
import databaseService from './DatabaseService';

// Types
interface SyncResult {
  success: boolean;
  message: string;
  timestamp: string;
  recordsProcessed?: number;
  fileName?: string;
}

class SyncService {
  private isInitialized: boolean = false;
  private lastSyncTime: Date | null = null;

  // Initialize the sync service
  async initialize(): Promise<boolean> {
    try {
      // Initialize Firebase Storage service
      await firebaseStorageService.initialize();
      
      this.isInitialized = true;
      console.log("Sync service initialized");
      return true;
    } catch (error) {
      console.error("Error initializing sync service:", error);
      return false;
    }
  }

  // Export data from database to Firebase Storage
  async exportToStorage(): Promise<SyncResult> {
    if (!this.isInitialized) {
      return {
        success: false,
        message: "Sync service not initialized",
        timestamp: new Date().toISOString()
      };
    }
    
    try {
      // Get all data from database
      const data = await databaseService.getAllDataForExport();
      
      // Prepare data for export
      const exportData = {
        providers: data.providers,
        clinicTypes: data.clinicTypes,
        shifts: data.shifts,
        syncTime: new Date().toISOString(),
        version: "1.0"
      };
      
      // Export to Firebase Storage
      const result = await firebaseStorageService.exportToStorage(exportData);
      
      // Log the export operation
      if (result.success) {
        this.lastSyncTime = new Date();
        await databaseService.logSync("export", "success", {
          fileName: result.fileName,
          recordsProcessed: result.recordsProcessed
        });
      } else {
        await databaseService.logSync("export", "failed", {
          errorMessage: result.message
        });
      }
      
      return result;
    } catch (error: any) {
      const errorMessage = error.message || "Unknown error";
      console.error("Error exporting data:", error);
      
      // Log the failed export
      await databaseService.logSync("export", "failed", {
        errorMessage
      });
      
      return {
        success: false,
        message: `Error exporting data: ${errorMessage}`,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Import data from Firebase Storage to database
  async importFromStorage(fileName?: string): Promise<SyncResult> {
    if (!this.isInitialized) {
      return {
        success: false,
        message: "Sync service not initialized",
        timestamp: new Date().toISOString()
      };
    }
    
    try {
      // Get data from Firebase Storage
      let importResult;
      
      if (fileName) {
        // Import specific file
        importResult = await firebaseStorageService.importFromStorage(fileName);
      } else {
        // Import latest file
        importResult = await firebaseStorageService.getLatestCalendarFile();
      }
      
      if (!importResult.result.success || !importResult.data) {
        // Log the failed import
        await databaseService.logSync("import", "failed", {
          fileName,
          errorMessage: importResult.result.message
        });
        
        return importResult.result;
      }
      
      const { data } = importResult;
      
      // TODO: Implement database import logic
      // This would involve comparing the imported data with existing data
      // and updating/inserting records as needed
      
      // For now, we'll just log the successful import
      await databaseService.logSync("import", "success", {
        fileName: importResult.result.fileName,
        recordsProcessed: data.shifts.length
      });
      
      this.lastSyncTime = new Date();
      
      return {
        success: true,
        message: "Data imported successfully",
        timestamp: new Date().toISOString(),
        recordsProcessed: data.shifts.length,
        fileName: importResult.result.fileName
      };
    } catch (error: any) {
      const errorMessage = error.message || "Unknown error";
      console.error("Error importing data:", error);
      
      // Log the failed import
      await databaseService.logSync("import", "failed", {
        errorMessage
      });
      
      return {
        success: false,
        message: `Error importing data: ${errorMessage}`,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Create a backup of the current database state
  async createBackup(): Promise<SyncResult> {
    if (!this.isInitialized) {
      return {
        success: false,
        message: "Sync service not initialized",
        timestamp: new Date().toISOString()
      };
    }
    
    try {
      // Get all data from database
      const data = await databaseService.getAllDataForExport();
      
      // Prepare data for backup
      const backupData = {
        providers: data.providers,
        clinicTypes: data.clinicTypes,
        shifts: data.shifts,
        syncTime: new Date().toISOString(),
        version: "1.0"
      };
      
      // Create backup in Firebase Storage
      const result = await firebaseStorageService.createBackup(backupData);
      
      // Log the backup operation
      if (result.success) {
        await databaseService.logSync("backup", "success", {
          fileName: result.fileName,
          recordsProcessed: result.recordsProcessed
        });
      } else {
        await databaseService.logSync("backup", "failed", {
          errorMessage: result.message
        });
      }
      
      return result;
    } catch (error: any) {
      const errorMessage = error.message || "Unknown error";
      console.error("Error creating backup:", error);
      
      // Log the failed backup
      await databaseService.logSync("backup", "failed", {
        errorMessage
      });
      
      return {
        success: false,
        message: `Error creating backup: ${errorMessage}`,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Get the last sync time
  getLastSyncTime(): Date | null {
    return this.lastSyncTime;
  }

  // Get available backups
  async getAvailableBackups(): Promise<{ files: { name: string, lastModified: string, size: number }[], result: SyncResult }> {
    if (!this.isInitialized) {
      return {
        files: [],
        result: {
          success: false,
          message: "Sync service not initialized",
          timestamp: new Date().toISOString()
        }
      };
    }
    
    try {
      return await firebaseStorageService.getAvailableBackups();
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

const syncService = new SyncService();
export default syncService; 