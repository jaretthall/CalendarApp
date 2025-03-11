import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import databaseService from '../services/DatabaseService';
import syncService from '../services/SyncService';

// Define the possible sync statuses
export type SyncStatus = 'synced' | 'syncing' | 'error' | 'offline';

// Define the context interface
interface SyncContextType {
  syncStatus: SyncStatus;
  lastSyncTime: Date | null;
  pendingChanges: number;
  syncNow: () => Promise<void>;
  toggleAutoSync: () => void;
  isAutoSyncEnabled: boolean;
  exportData: () => Promise<void>;
  importData: (fileName?: string) => Promise<boolean>;
  createBackup: () => Promise<void>;
  getAvailableBackups: () => Promise<{ name: string, lastModified: string, size: number }[]>;
}

// Create the context with a default undefined value
const SyncContext = createContext<SyncContextType | undefined>(undefined);

// Provider component
export const SyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [pendingChanges, setPendingChanges] = useState<number>(0);
  const [isAutoSyncEnabled, setIsAutoSyncEnabled] = useState<boolean>(true);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isServiceInitialized, setIsServiceInitialized] = useState<boolean>(false);

  // Initialize sync service
  useEffect(() => {
    const initializeSyncService = async () => {
      if (isAuthenticated && !isServiceInitialized) {
        try {
          const initialized = await syncService.initialize();
          setIsServiceInitialized(initialized);
          
          if (initialized) {
            // Get last sync time
            const lastSync = syncService.getLastSyncTime();
            if (lastSync) {
              setLastSyncTime(lastSync);
            }
          }
        } catch (error) {
          console.error('Error initializing sync service:', error);
        }
      }
    };
    
    initializeSyncService();
  }, [isAuthenticated, isServiceInitialized]);

  // Initialize online/offline event listeners
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync function
  const syncNow = useCallback(async () => {
    if (!isAuthenticated || !isOnline || !isServiceInitialized) {
      setSyncStatus('offline');
      return;
    }

    try {
      setSyncStatus('syncing');
      
      // Export data to Firebase Storage
      const result = await syncService.exportToStorage();
      
      if (result.success) {
        setLastSyncTime(new Date());
        setPendingChanges(0);
        setSyncStatus('synced');
      } else {
        setSyncStatus('error');
      }
    } catch (error) {
      console.error('Sync error:', error);
      setSyncStatus('error');
    }
  }, [isAuthenticated, isOnline, isServiceInitialized]);

  // Toggle auto sync
  const toggleAutoSync = useCallback(() => {
    setIsAutoSyncEnabled(prev => !prev);
  }, []);

  // Export data to Firebase Storage
  const exportData = useCallback(async () => {
    if (!isAuthenticated || !isOnline || !isServiceInitialized) {
      throw new Error('Cannot export data: offline or not authenticated');
    }
    
    try {
      const result = await syncService.exportToStorage();
      if (!result.success) {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Export error:', error);
      throw error;
    }
  }, [isAuthenticated, isOnline, isServiceInitialized]);

  // Import data from Firebase Storage
  const importData = useCallback(async (fileName?: string): Promise<boolean> => {
    if (!isAuthenticated || !isOnline || !isServiceInitialized) {
      throw new Error('Cannot import data: offline or not authenticated');
    }
    
    try {
      const result = await syncService.importFromStorage(fileName);
      return result.success;
    } catch (error) {
      console.error('Import failed:', error);
      return false;
    }
  }, [isAuthenticated, isOnline, isServiceInitialized]);

  // Create a backup
  const createBackup = useCallback(async () => {
    if (!isAuthenticated || !isOnline || !isServiceInitialized) {
      throw new Error('Cannot create backup: offline or not authenticated');
    }
    
    try {
      const result = await syncService.createBackup();
      if (!result.success) {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Backup creation error:', error);
      throw error;
    }
  }, [isAuthenticated, isOnline, isServiceInitialized]);

  // Get available backups
  const getAvailableBackups = useCallback(async () => {
    if (!isAuthenticated || !isOnline || !isServiceInitialized) {
      return [];
    }
    
    try {
      const result = await syncService.getAvailableBackups();
      return result.files;
    } catch (error) {
      console.error('Error getting backups:', error);
      return [];
    }
  }, [isAuthenticated, isOnline, isServiceInitialized]);

  return (
    <SyncContext.Provider
      value={{
        syncStatus,
        lastSyncTime,
        pendingChanges,
        syncNow,
        toggleAutoSync,
        isAutoSyncEnabled,
        exportData,
        importData,
        createBackup,
        getAvailableBackups
      }}
    >
      {children}
    </SyncContext.Provider>
  );
};

export const useSync = () => {
  const context = useContext(SyncContext);
  if (context === undefined) {
    throw new Error('useSync must be used within a SyncProvider');
  }
  return context;
}; 