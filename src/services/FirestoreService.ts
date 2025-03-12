// Firestore Database Service
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  Timestamp,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';
import { firestore } from '../config/firebase-config';

// Collection names
const PROVIDERS_COLLECTION = 'providers';
const SHIFTS_COLLECTION = 'shifts';
const CLINIC_TYPES_COLLECTION = 'clinicTypes';
const SYNC_LOGS_COLLECTION = 'syncLogs';

// Types
export interface Provider {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  color: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClinicType {
  id: string;
  name: string;
  color: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Shift {
  id: string;
  providerId: string;
  clinicTypeId?: string;
  startDate: string; // ISO string
  endDate: string; // ISO string
  isVacation: boolean;
  isRecurring: boolean;
  recurrencePattern?: string;
  recurrenceEndDate?: string; // ISO string
  seriesId?: string;
  notes?: string;
  location?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SyncLog {
  id: string;
  syncType: string;
  status: string;
  sharePointPath?: string;
  fileName?: string;
  recordsProcessed?: number;
  errorMessage?: string;
  syncedAt: Date;
}

class FirestoreService {
  // Initialize the service
  async initialize(): Promise<boolean> {
    try {
      console.log('Firestore service initialized');
      return true;
    } catch (error) {
      console.error('Error initializing Firestore service:', error);
      return false;
    }
  }

  // Providers
  async getProviders(): Promise<Provider[]> {
    try {
      const providersQuery = query(
        collection(firestore, PROVIDERS_COLLECTION)
      );
      
      const snapshot = await getDocs(providersQuery);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          color: data.color,
          status: data.status,
          createdAt: (data.createdAt as Timestamp).toDate(),
          updatedAt: (data.updatedAt as Timestamp).toDate()
        };
      });
    } catch (error) {
      console.error('Error getting providers:', error);
      return [];
    }
  }

  async getProviderById(id: string): Promise<Provider | null> {
    try {
      const docRef = doc(firestore, PROVIDERS_COLLECTION, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          color: data.color,
          status: data.status,
          createdAt: (data.createdAt as Timestamp).toDate(),
          updatedAt: (data.updatedAt as Timestamp).toDate()
        };
      }
      
      return null;
    } catch (error) {
      console.error(`Error getting provider with ID ${id}:`, error);
      return null;
    }
  }

  async addProvider(provider: Omit<Provider, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> {
    try {
      const docRef = await addDoc(collection(firestore, PROVIDERS_COLLECTION), {
        ...provider,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error adding provider:', error);
      return null;
    }
  }

  async updateProvider(id: string, provider: Partial<Provider>): Promise<boolean> {
    try {
      const docRef = doc(firestore, PROVIDERS_COLLECTION, id);
      await updateDoc(docRef, {
        ...provider,
        updatedAt: serverTimestamp()
      });
      
      return true;
    } catch (error) {
      console.error(`Error updating provider with ID ${id}:`, error);
      return false;
    }
  }

  async deleteProvider(id: string): Promise<boolean> {
    try {
      // Delete the provider
      const docRef = doc(firestore, PROVIDERS_COLLECTION, id);
      await deleteDoc(docRef);
      
      // Also delete all shifts for this provider
      const shiftsQuery = query(
        collection(firestore, SHIFTS_COLLECTION),
        where('providerId', '==', id)
      );
      
      const snapshot = await getDocs(shiftsQuery);
      const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      
      return true;
    } catch (error) {
      console.error(`Error deleting provider with ID ${id}:`, error);
      return false;
    }
  }

  // Clinic Types
  async getClinicTypes(): Promise<ClinicType[]> {
    try {
      const clinicTypesQuery = query(
        collection(firestore, CLINIC_TYPES_COLLECTION)
      );
      
      const snapshot = await getDocs(clinicTypesQuery);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          color: data.color,
          status: data.status,
          createdAt: (data.createdAt as Timestamp).toDate(),
          updatedAt: (data.updatedAt as Timestamp).toDate()
        };
      });
    } catch (error) {
      console.error('Error getting clinic types:', error);
      return [];
    }
  }

  async getClinicTypeById(id: string): Promise<ClinicType | null> {
    try {
      const docRef = doc(firestore, CLINIC_TYPES_COLLECTION, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          name: data.name,
          color: data.color,
          status: data.status,
          createdAt: (data.createdAt as Timestamp).toDate(),
          updatedAt: (data.updatedAt as Timestamp).toDate()
        };
      }
      
      return null;
    } catch (error) {
      console.error(`Error getting clinic type with ID ${id}:`, error);
      return null;
    }
  }

  async addClinicType(clinicType: Omit<ClinicType, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> {
    try {
      const docRef = await addDoc(collection(firestore, CLINIC_TYPES_COLLECTION), {
        ...clinicType,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error adding clinic type:', error);
      return null;
    }
  }

  async updateClinicType(id: string, clinicType: Partial<ClinicType>): Promise<boolean> {
    try {
      const docRef = doc(firestore, CLINIC_TYPES_COLLECTION, id);
      await updateDoc(docRef, {
        ...clinicType,
        updatedAt: serverTimestamp()
      });
      
      return true;
    } catch (error) {
      console.error(`Error updating clinic type with ID ${id}:`, error);
      return false;
    }
  }

  async deleteClinicType(id: string): Promise<boolean> {
    try {
      // Delete the clinic type
      const docRef = doc(firestore, CLINIC_TYPES_COLLECTION, id);
      await deleteDoc(docRef);
      
      // Update shifts that use this clinic type to remove the reference
      const shiftsQuery = query(
        collection(firestore, SHIFTS_COLLECTION),
        where('clinicTypeId', '==', id)
      );
      
      const snapshot = await getDocs(shiftsQuery);
      const updatePromises = snapshot.docs.map(doc => 
        updateDoc(doc.ref, { 
          clinicTypeId: null,
          updatedAt: serverTimestamp()
        })
      );
      await Promise.all(updatePromises);
      
      return true;
    } catch (error) {
      console.error(`Error deleting clinic type with ID ${id}:`, error);
      return false;
    }
  }

  // Shifts
  async getShiftsByDateRange(startDate: string, endDate: string): Promise<Shift[]> {
    try {
      // Get all shifts that overlap with the date range
      const shiftsQuery = query(
        collection(firestore, SHIFTS_COLLECTION),
        where('startDate', '<=', endDate),
        where('endDate', '>=', startDate)
      );
      
      const snapshot = await getDocs(shiftsQuery);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          providerId: data.providerId,
          clinicTypeId: data.clinicTypeId,
          startDate: data.startDate,
          endDate: data.endDate,
          isVacation: data.isVacation,
          isRecurring: data.isRecurring,
          recurrencePattern: data.recurrencePattern,
          recurrenceEndDate: data.recurrenceEndDate,
          seriesId: data.seriesId,
          notes: data.notes,
          location: data.location,
          createdAt: (data.createdAt as Timestamp).toDate(),
          updatedAt: (data.updatedAt as Timestamp).toDate()
        };
      });
    } catch (error) {
      console.error('Error getting shifts by date range:', error);
      return [];
    }
  }

  async getShiftsByProvider(providerId: string): Promise<Shift[]> {
    try {
      const shiftsQuery = query(
        collection(firestore, SHIFTS_COLLECTION),
        where('providerId', '==', providerId)
      );
      
      const snapshot = await getDocs(shiftsQuery);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          providerId: data.providerId,
          clinicTypeId: data.clinicTypeId,
          startDate: data.startDate,
          endDate: data.endDate,
          isVacation: data.isVacation,
          isRecurring: data.isRecurring,
          recurrencePattern: data.recurrencePattern,
          recurrenceEndDate: data.recurrenceEndDate,
          seriesId: data.seriesId,
          notes: data.notes,
          location: data.location,
          createdAt: (data.createdAt as Timestamp).toDate(),
          updatedAt: (data.updatedAt as Timestamp).toDate()
        };
      });
    } catch (error) {
      console.error(`Error getting shifts for provider ${providerId}:`, error);
      return [];
    }
  }

  async getShiftsBySeries(seriesId: string): Promise<Shift[]> {
    try {
      const shiftsQuery = query(
        collection(firestore, SHIFTS_COLLECTION),
        where('seriesId', '==', seriesId)
      );
      
      const snapshot = await getDocs(shiftsQuery);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          providerId: data.providerId,
          clinicTypeId: data.clinicTypeId,
          startDate: data.startDate,
          endDate: data.endDate,
          isVacation: data.isVacation,
          isRecurring: data.isRecurring,
          recurrencePattern: data.recurrencePattern,
          recurrenceEndDate: data.recurrenceEndDate,
          seriesId: data.seriesId,
          notes: data.notes,
          location: data.location,
          createdAt: (data.createdAt as Timestamp).toDate(),
          updatedAt: (data.updatedAt as Timestamp).toDate()
        };
      });
    } catch (error) {
      console.error(`Error getting shifts for series ${seriesId}:`, error);
      return [];
    }
  }

  async addShift(shift: Omit<Shift, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> {
    try {
      const docRef = await addDoc(collection(firestore, SHIFTS_COLLECTION), {
        ...shift,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error adding shift:', error);
      return null;
    }
  }

  async updateShift(id: string, shift: Partial<Shift>): Promise<boolean> {
    try {
      const docRef = doc(firestore, SHIFTS_COLLECTION, id);
      await updateDoc(docRef, {
        ...shift,
        updatedAt: serverTimestamp()
      });
      
      return true;
    } catch (error) {
      console.error(`Error updating shift with ID ${id}:`, error);
      return false;
    }
  }

  async deleteShift(id: string): Promise<boolean> {
    try {
      const docRef = doc(firestore, SHIFTS_COLLECTION, id);
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      console.error(`Error deleting shift with ID ${id}:`, error);
      return false;
    }
  }

  async deleteShiftSeries(seriesId: string): Promise<number> {
    try {
      const shiftsQuery = query(
        collection(firestore, SHIFTS_COLLECTION),
        where('seriesId', '==', seriesId)
      );
      
      const snapshot = await getDocs(shiftsQuery);
      const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      
      return snapshot.docs.length;
    } catch (error) {
      console.error(`Error deleting shift series ${seriesId}:`, error);
      return 0;
    }
  }

  // Get all shifts from the database
  async getAllShifts(): Promise<Shift[]> {
    try {
      const shiftsQuery = query(collection(firestore, SHIFTS_COLLECTION));
      const snapshot = await getDocs(shiftsQuery);
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          providerId: data.providerId,
          clinicTypeId: data.clinicTypeId,
          startDate: data.startDate,
          endDate: data.endDate,
          isVacation: data.isVacation,
          isRecurring: data.isRecurring,
          recurrencePattern: data.recurrencePattern,
          recurrenceEndDate: data.recurrenceEndDate,
          seriesId: data.seriesId,
          notes: data.notes,
          location: data.location,
          createdAt: (data.createdAt as Timestamp).toDate(),
          updatedAt: (data.updatedAt as Timestamp).toDate()
        };
      });
    } catch (error) {
      console.error('Error getting all shifts:', error);
      return [];
    }
  }

  // Sync Logs
  async logSync(syncType: string, status: string, details: { 
    fileName?: string, 
    recordsProcessed?: number,
    errorMessage?: string 
  }): Promise<boolean> {
    try {
      // Create a clean object without undefined values
      const logData: any = {
        syncType,
        status,
        syncedAt: serverTimestamp()
      };
      
      // Only add properties that are defined
      if (details.fileName !== undefined) {
        logData.fileName = details.fileName;
      }
      
      if (details.recordsProcessed !== undefined) {
        logData.recordsProcessed = details.recordsProcessed;
      }
      
      if (details.errorMessage !== undefined) {
        logData.errorMessage = details.errorMessage;
      }
      
      await addDoc(collection(firestore, SYNC_LOGS_COLLECTION), logData);
      
      return true;
    } catch (error) {
      console.error('Error logging sync:', error);
      return false;
    }
  }

  // Data Export/Import
  async getAllDataForExport(): Promise<{
    providers: Provider[],
    clinicTypes: ClinicType[],
    shifts: Shift[]
  }> {
    try {
      // Get all providers
      const providers = await this.getProviders();
      
      // Get all clinic types
      const clinicTypes = await this.getClinicTypes();
      
      // Get all shifts
      const shiftsQuery = query(collection(firestore, SHIFTS_COLLECTION));
      const shiftsSnapshot = await getDocs(shiftsQuery);
      const shifts = shiftsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          providerId: data.providerId,
          clinicTypeId: data.clinicTypeId,
          startDate: data.startDate,
          endDate: data.endDate,
          isVacation: data.isVacation,
          isRecurring: data.isRecurring,
          recurrencePattern: data.recurrencePattern,
          recurrenceEndDate: data.recurrenceEndDate,
          seriesId: data.seriesId,
          notes: data.notes,
          location: data.location,
          createdAt: (data.createdAt as Timestamp).toDate(),
          updatedAt: (data.updatedAt as Timestamp).toDate()
        };
      });
      
      return {
        providers,
        clinicTypes,
        shifts
      };
    } catch (error) {
      console.error('Error exporting data:', error);
      return {
        providers: [],
        clinicTypes: [],
        shifts: []
      };
    }
  }

  async migrateData(data: {
    providers?: any[],
    clinicTypes?: any[],
    shifts?: any[]
  }): Promise<boolean> {
    try {
      // Import providers
      if (data.providers && data.providers.length > 0) {
        for (const provider of data.providers) {
          const { id, ...providerData } = provider;
          
          // Add timestamps if they don't exist
          if (!providerData.createdAt) {
            providerData.createdAt = serverTimestamp();
          }
          if (!providerData.updatedAt) {
            providerData.updatedAt = serverTimestamp();
          }
          
          // Use setDoc to maintain the same ID
          await setDoc(doc(firestore, PROVIDERS_COLLECTION, id), providerData);
        }
      }
      
      // Import clinic types
      if (data.clinicTypes && data.clinicTypes.length > 0) {
        for (const clinicType of data.clinicTypes) {
          const { id, ...clinicTypeData } = clinicType;
          
          // Add timestamps if they don't exist
          if (!clinicTypeData.createdAt) {
            clinicTypeData.createdAt = serverTimestamp();
          }
          if (!clinicTypeData.updatedAt) {
            clinicTypeData.updatedAt = serverTimestamp();
          }
          
          // Use setDoc to maintain the same ID
          await setDoc(doc(firestore, CLINIC_TYPES_COLLECTION, id), clinicTypeData);
        }
      }
      
      // Import shifts
      if (data.shifts && data.shifts.length > 0) {
        for (const shift of data.shifts) {
          const { id, ...shiftData } = shift;
          
          // Add timestamps if they don't exist
          if (!shiftData.createdAt) {
            shiftData.createdAt = serverTimestamp();
          }
          if (!shiftData.updatedAt) {
            shiftData.updatedAt = serverTimestamp();
          }
          
          // Use setDoc to maintain the same ID
          await setDoc(doc(firestore, SHIFTS_COLLECTION, id), shiftData);
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error migrating data:', error);
      return false;
    }
  }
}

const firestoreService = new FirestoreService();
export default firestoreService; 