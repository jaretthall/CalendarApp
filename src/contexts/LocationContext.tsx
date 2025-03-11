import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import databaseService from '../services/DatabaseService';

export interface ClinicType {
  id: string;
  name: string;
  color: string;
  status: string;
}

interface ClinicTypeContextType {
  clinicTypes: ClinicType[];
  loading: boolean;
  getActiveClinicTypes: () => ClinicType[];
  getClinicTypeById: (id: string) => ClinicType | undefined;
  refreshClinicTypes: () => Promise<void>;
}

const ClinicTypeContext = createContext<ClinicTypeContextType | undefined>(undefined);

export const ClinicTypeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [clinicTypes, setClinicTypes] = useState<ClinicType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Load clinic types from database
  const loadClinicTypes = useCallback(async () => {
    setLoading(true);
    try {
      const clinicTypesData = await databaseService.getClinicTypes();
      setClinicTypes(clinicTypesData);
    } catch (error) {
      console.error('Error loading clinic types:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadClinicTypes();
  }, [loadClinicTypes]);

  const getClinicTypeById = (id: string) => {
    return clinicTypes.find(clinicType => clinicType.id === id);
  };

  const getActiveClinicTypes = () => {
    return clinicTypes.filter(clinicType => clinicType.status === 'active');
  };

  const refreshClinicTypes = async () => {
    await loadClinicTypes();
  };

  return (
    <ClinicTypeContext.Provider
      value={{
        clinicTypes,
        loading,
        getClinicTypeById,
        getActiveClinicTypes,
        refreshClinicTypes
      }}
    >
      {children}
    </ClinicTypeContext.Provider>
  );
};

export const useClinicTypes = () => {
  const context = useContext(ClinicTypeContext);
  if (context === undefined) {
    throw new Error('useClinicTypes must be used within a ClinicTypeProvider');
  }
  return context;
}; 