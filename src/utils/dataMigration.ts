// Data Migration Utility
import firestoreService from '../services/FirestoreService';

/**
 * Migrates data from localStorage to Firestore
 * @returns Promise<boolean> - True if migration was successful, false otherwise
 */
export const migrateLocalStorageToFirestore = async (): Promise<boolean> => {
  try {
    // Check if there's data in localStorage
    const providersJson = localStorage.getItem('providers');
    const clinicTypesJson = localStorage.getItem('clinicTypes');
    const shiftsJson = localStorage.getItem('shifts');
    
    // If there's no data, skip migration
    if (!providersJson && !clinicTypesJson && !shiftsJson) {
      console.log('No data found in localStorage to migrate.');
      return true;
    }
    
    console.log('Starting data migration from localStorage to Firestore...');
    
    // Parse data from localStorage
    const providers = providersJson ? JSON.parse(providersJson) : [];
    const clinicTypes = clinicTypesJson ? JSON.parse(clinicTypesJson) : [];
    const shifts = shiftsJson ? JSON.parse(shiftsJson) : [];
    
    // Migrate data to Firestore
    try {
      // Sanitize provider data to ensure no undefined values for dates
      const sanitizedProviders = providers.map(provider => ({
        ...provider,
        createdAt: provider.createdAt || new Date().toISOString(),
        updatedAt: provider.updatedAt || new Date().toISOString()
      }));
      
      // Sanitize clinic types data
      const sanitizedClinicTypes = clinicTypes.map(clinicType => ({
        ...clinicType,
        createdAt: clinicType.createdAt || new Date().toISOString(),
        updatedAt: clinicType.updatedAt || new Date().toISOString()
      }));
      
      // Sanitize shifts data
      const sanitizedShifts = shifts.map(shift => ({
        ...shift,
        createdAt: shift.createdAt || new Date().toISOString(),
        updatedAt: shift.updatedAt || new Date().toISOString()
      }));
      
      await firestoreService.migrateData({
        providers: sanitizedProviders,
        clinicTypes: sanitizedClinicTypes,
        shifts: sanitizedShifts
      });
      
      console.log('Data migration completed successfully.');
    } catch (error) {
      console.error('Error migrating data:', error);
      throw error;
    }
    
    // Optionally clear localStorage after successful migration
    // localStorage.removeItem('providers');
    // localStorage.removeItem('clinicTypes');
    // localStorage.removeItem('shifts');
    
    return true;
  } catch (error) {
    console.error('Error migrating data from localStorage to Firestore:', error);
    return false;
  }
};

/**
 * Populates Firestore with sample data if it's empty
 * @returns Promise<boolean> - True if operation was successful, false otherwise
 */
export const populateFirestoreWithSampleData = async (): Promise<boolean> => {
  try {
    // Check if there's already data in Firestore
    const providers = await firestoreService.getProviders();
    const clinicTypes = await firestoreService.getClinicTypes();
    
    // If there's data, skip population
    if (providers.length > 0 || clinicTypes.length > 0) {
      console.log('Firestore already has data, skipping sample data population.');
      return true;
    }
    
    console.log('Populating Firestore with sample data...');
    
    // Sample clinic types
    const sampleClinicTypes = [
      {
        id: '1',
        name: 'Main Clinic',
        color: '#2196f3',
        status: 'active'
      },
      {
        id: '2',
        name: 'Pediatric',
        color: '#ff9800',
        status: 'active'
      },
      {
        id: '3',
        name: 'Urgent Care',
        color: '#f44336',
        status: 'active'
      },
      {
        id: '4',
        name: 'Specialty',
        color: '#9c27b0',
        status: 'active'
      }
    ];
    
    // Sample providers
    const sampleProviders = [
      {
        id: '1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        color: '#4caf50',
        status: 'active'
      },
      {
        id: '2',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        color: '#2196f3',
        status: 'active'
      },
      {
        id: '3',
        firstName: 'Michael',
        lastName: 'Johnson',
        email: 'michael.johnson@example.com',
        color: '#f44336',
        status: 'active'
      },
      {
        id: '4',
        firstName: 'Sarah',
        lastName: 'Williams',
        email: 'sarah.williams@example.com',
        color: '#ff9800',
        status: 'active'
      }
    ];
    
    // Migrate sample data to Firestore
    await firestoreService.migrateData({
      providers: sampleProviders,
      clinicTypes: sampleClinicTypes
    });
    
    console.log('Sample data population completed successfully.');
    return true;
  } catch (error) {
    console.error('Error populating Firestore with sample data:', error);
    return false;
  }
}; 