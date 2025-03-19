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
import { Note, Comment } from '../contexts/NoteContext';

// Collection names
const PROVIDERS_COLLECTION = 'providers';
const SHIFTS_COLLECTION = 'shifts';
const CLINIC_TYPES_COLLECTION = 'clinicTypes';
const SYNC_LOGS_COLLECTION = 'syncLogs';
const NOTES_COLLECTION = 'calendarNotes';
const COMMENTS_COLLECTION = 'calendarComments';

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

// Notes and Comments interfaces for Firestore
export interface FirestoreNote {
  id: string;
  monthYear: string;
  content: string;
  lastModifiedBy?: string;
  createdAt: Date;
  modifiedAt: Date;
}

export interface FirestoreComment {
  id: string;
  monthYear: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: Date;
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
          createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(),
          updatedAt: data.updatedAt ? (data.updatedAt as Timestamp).toDate() : new Date()
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
          createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(),
          updatedAt: data.updatedAt ? (data.updatedAt as Timestamp).toDate() : new Date()
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
          createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(),
          updatedAt: data.updatedAt ? (data.updatedAt as Timestamp).toDate() : new Date()
        };
      });
    } catch (error) {
      console.error(`Error getting shifts for series ${seriesId}:`, error);
      return [];
    }
  }

  async addShift(shift: Omit<Shift, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> {
    try {
      // Create a clean object without undefined values
      const shiftData: any = {
        providerId: shift.providerId,
        clinicTypeId: shift.clinicTypeId || '',
        startDate: shift.startDate,
        endDate: shift.endDate,
        isVacation: shift.isVacation,
        isRecurring: shift.isRecurring,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      // Only add properties that are defined
      if (shift.recurrencePattern) {
        shiftData.recurrencePattern = shift.recurrencePattern;
      }
      
      if (shift.recurrenceEndDate) {
        shiftData.recurrenceEndDate = shift.recurrenceEndDate;
      }
      
      if (shift.seriesId) {
        shiftData.seriesId = shift.seriesId;
      }
      
      if (shift.notes) {
        shiftData.notes = shift.notes;
      }
      
      if (shift.location) {
        shiftData.location = shift.location;
      }
      
      const docRef = await addDoc(collection(firestore, SHIFTS_COLLECTION), shiftData);
      
      return docRef.id;
    } catch (error) {
      console.error('Error adding shift:', error);
      return null;
    }
  }

  async updateShift(id: string, shift: Partial<Shift>): Promise<boolean> {
    try {
      const docRef = doc(firestore, SHIFTS_COLLECTION, id);
      
      // Create a clean object without undefined values
      const updateData: any = {
        updatedAt: serverTimestamp()
      };
      
      // Only add properties that are defined and not undefined
      if (shift.providerId !== undefined) {
        updateData.providerId = shift.providerId;
      }
      
      if (shift.clinicTypeId !== undefined) {
        updateData.clinicTypeId = shift.clinicTypeId || '';
      }
      
      if (shift.startDate !== undefined) {
        updateData.startDate = shift.startDate;
      }
      
      if (shift.endDate !== undefined) {
        updateData.endDate = shift.endDate;
      }
      
      if (shift.isVacation !== undefined) {
        updateData.isVacation = shift.isVacation;
      }
      
      if (shift.isRecurring !== undefined) {
        updateData.isRecurring = shift.isRecurring;
      }
      
      if (shift.recurrencePattern !== undefined) {
        updateData.recurrencePattern = shift.recurrencePattern;
      }
      
      if (shift.recurrenceEndDate !== undefined) {
        updateData.recurrenceEndDate = shift.recurrenceEndDate;
      }
      
      if (shift.seriesId !== undefined) {
        updateData.seriesId = shift.seriesId;
      }
      
      if (shift.notes !== undefined) {
        updateData.notes = shift.notes;
      }
      
      if (shift.location !== undefined) {
        updateData.location = shift.location;
      }
      
      await updateDoc(docRef, updateData);
      
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
          createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(),
          updatedAt: data.updatedAt ? (data.updatedAt as Timestamp).toDate() : new Date()
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
    shifts: Shift[],
    notes: FirestoreNote[],
    comments: FirestoreComment[]
  }> {
    try {
      // Get all providers
      const providers = await this.getProviders();
      
      // Get all clinic types
      const clinicTypes = await this.getClinicTypes();
      
      // Get all shifts
      const shifts = await this.getAllShifts();
      
      // Get all notes
      const notesQuery = query(collection(firestore, NOTES_COLLECTION));
      const notesSnapshot = await getDocs(notesQuery);
      const notes = notesSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          monthYear: data.monthYear,
          content: data.content,
          lastModifiedBy: data.lastModifiedBy,
          createdAt: (data.createdAt as Timestamp).toDate(),
          modifiedAt: (data.modifiedAt as Timestamp).toDate()
        };
      });
      
      // Get all comments
      const commentsQuery = query(collection(firestore, COMMENTS_COLLECTION));
      const commentsSnapshot = await getDocs(commentsQuery);
      const comments = commentsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          monthYear: data.monthYear,
          userId: data.userId,
          userName: data.userName,
          content: data.content,
          createdAt: (data.createdAt as Timestamp).toDate()
        };
      });
      
      return { providers, clinicTypes, shifts, notes, comments };
    } catch (error) {
      console.error('Error getting all data for export:', error);
      return { providers: [], clinicTypes: [], shifts: [], notes: [], comments: [] };
    }
  }

  async migrateData(data: {
    providers?: any[],
    clinicTypes?: any[],
    shifts?: any[],
    notes?: any[],
    comments?: any[]
  }): Promise<boolean> {
    try {
      // Migrate providers
      if (data.providers && data.providers.length > 0) {
        for (const provider of data.providers) {
          const { id, ...providerData } = provider;
          await setDoc(doc(firestore, PROVIDERS_COLLECTION, id), {
            ...providerData,
            createdAt: providerData.createdAt instanceof Date 
              ? Timestamp.fromDate(providerData.createdAt) 
              : providerData.createdAt,
            updatedAt: providerData.updatedAt instanceof Date 
              ? Timestamp.fromDate(providerData.updatedAt) 
              : providerData.updatedAt
          });
        }
      }
      
      // Migrate clinic types
      if (data.clinicTypes && data.clinicTypes.length > 0) {
        for (const clinicType of data.clinicTypes) {
          const { id, ...clinicTypeData } = clinicType;
          await setDoc(doc(firestore, CLINIC_TYPES_COLLECTION, id), {
            ...clinicTypeData,
            createdAt: clinicTypeData.createdAt instanceof Date 
              ? Timestamp.fromDate(clinicTypeData.createdAt) 
              : clinicTypeData.createdAt,
            updatedAt: clinicTypeData.updatedAt instanceof Date 
              ? Timestamp.fromDate(clinicTypeData.updatedAt) 
              : clinicTypeData.updatedAt
          });
        }
      }
      
      // Migrate shifts
      if (data.shifts && data.shifts.length > 0) {
        for (const shift of data.shifts) {
          const { id, ...shiftData } = shift;
          await setDoc(doc(firestore, SHIFTS_COLLECTION, id), {
            ...shiftData,
            createdAt: shiftData.createdAt instanceof Date 
              ? Timestamp.fromDate(shiftData.createdAt) 
              : shiftData.createdAt,
            updatedAt: shiftData.updatedAt instanceof Date 
              ? Timestamp.fromDate(shiftData.updatedAt) 
              : shiftData.updatedAt
          });
        }
      }
      
      // Migrate notes
      if (data.notes && data.notes.length > 0) {
        for (const note of data.notes) {
          const { id, ...noteData } = note;
          await setDoc(doc(firestore, NOTES_COLLECTION, id), {
            ...noteData,
            createdAt: noteData.createdAt instanceof Date 
              ? Timestamp.fromDate(noteData.createdAt) 
              : noteData.createdAt,
            modifiedAt: noteData.modifiedAt instanceof Date 
              ? Timestamp.fromDate(noteData.modifiedAt) 
              : noteData.modifiedAt
          });
        }
      }
      
      // Migrate comments
      if (data.comments && data.comments.length > 0) {
        for (const comment of data.comments) {
          const { id, ...commentData } = comment;
          await setDoc(doc(firestore, COMMENTS_COLLECTION, id), {
            ...commentData,
            createdAt: commentData.createdAt instanceof Date 
              ? Timestamp.fromDate(commentData.createdAt) 
              : commentData.createdAt
          });
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error migrating data:', error);
      return false;
    }
  }

  // Notes methods
  async getNoteForMonth(monthYear: string): Promise<Note | null> {
    try {
      const notesQuery = query(
        collection(firestore, NOTES_COLLECTION),
        where('monthYear', '==', monthYear)
      );
      
      const snapshot = await getDocs(notesQuery);
      
      if (snapshot.empty) {
        return null;
      }
      
      const doc = snapshot.docs[0]; // Should only be one note per month
      const data = doc.data();
      
      return {
        monthYear: data.monthYear,
        content: data.content,
        lastModifiedBy: data.lastModifiedBy,
        createdAt: (data.createdAt instanceof Timestamp) 
          ? data.createdAt.toDate().toISOString() 
          : data.createdAt,
        modifiedAt: (data.modifiedAt instanceof Timestamp) 
          ? data.modifiedAt.toDate().toISOString() 
          : data.modifiedAt
      };
    } catch (error) {
      console.error(`Error getting note for month ${monthYear}:`, error);
      return null;
    }
  }

  async saveNote(note: Note): Promise<Note> {
    try {
      const notesQuery = query(
        collection(firestore, NOTES_COLLECTION),
        where('monthYear', '==', note.monthYear)
      );
      
      const snapshot = await getDocs(notesQuery);
      
      if (snapshot.empty) {
        // Create new note
        const docRef = await addDoc(collection(firestore, NOTES_COLLECTION), {
          monthYear: note.monthYear,
          content: note.content,
          lastModifiedBy: note.lastModifiedBy,
          createdAt: serverTimestamp(),
          modifiedAt: serverTimestamp()
        });
        
        // Get the created note to return
        const newNoteDoc = await getDoc(docRef);
        const newNoteData = newNoteDoc.data();
        
        return {
          monthYear: note.monthYear,
          content: note.content,
          lastModifiedBy: note.lastModifiedBy,
          createdAt: newNoteData?.createdAt.toDate().toISOString() || new Date().toISOString(),
          modifiedAt: newNoteData?.modifiedAt.toDate().toISOString() || new Date().toISOString()
        };
      } else {
        // Update existing note
        const docRef = snapshot.docs[0].ref;
        await updateDoc(docRef, {
          content: note.content,
          lastModifiedBy: note.lastModifiedBy,
          modifiedAt: serverTimestamp()
        });
        
        return {
          ...note,
          modifiedAt: new Date().toISOString()
        };
      }
    } catch (error) {
      console.error(`Error saving note for month ${note.monthYear}:`, error);
      // Return the original note if error occurs
      return note;
    }
  }

  // Comments methods
  async getCommentsForMonth(monthYear: string): Promise<Comment[]> {
    try {
      const commentsQuery = query(
        collection(firestore, COMMENTS_COLLECTION),
        where('monthYear', '==', monthYear)
      );
      
      const snapshot = await getDocs(commentsQuery);
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          monthYear: data.monthYear,
          userId: data.userId,
          userName: data.userName,
          content: data.content,
          createdAt: (data.createdAt instanceof Timestamp) 
            ? data.createdAt.toDate().toISOString() 
            : data.createdAt
        };
      });
    } catch (error) {
      console.error(`Error getting comments for month ${monthYear}:`, error);
      return [];
    }
  }

  async addComment(comment: Comment): Promise<boolean> {
    try {
      await addDoc(collection(firestore, COMMENTS_COLLECTION), {
        monthYear: comment.monthYear,
        userId: comment.userId,
        userName: comment.userName,
        content: comment.content,
        createdAt: serverTimestamp()
      });
      
      return true;
    } catch (error) {
      console.error('Error adding comment:', error);
      return false;
    }
  }

  async deleteComment(commentId: string): Promise<boolean> {
    try {
      const docRef = doc(firestore, COMMENTS_COLLECTION, commentId);
      await deleteDoc(docRef);
      
      return true;
    } catch (error) {
      console.error(`Error deleting comment with ID ${commentId}:`, error);
      return false;
    }
  }
}

const firestoreService = new FirestoreService();
export default firestoreService; 