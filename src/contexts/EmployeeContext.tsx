import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import databaseService from '../services/DatabaseService';

export interface Provider {
  id: string;
  firstName: string;
  lastName: string;
  color: string;
  status: 'active' | 'inactive';
  email?: string;
}

// Interface for providers from the database
interface DatabaseProvider {
  id: string;
  firstName: string;
  lastName: string;
  color: string;
  status: string;
  email?: string;
}

interface ProviderContextType {
  providers: Provider[];
  loading: boolean;
  addProvider: (provider: Omit<Provider, 'id'>) => Promise<void>;
  updateProvider: (id: string, provider: Partial<Provider>) => Promise<void>;
  deleteProvider: (id: string) => Promise<void>;
  getProviderById: (id: string) => Provider | undefined;
  getActiveProviders: () => Provider[];
  refreshProviders: () => Promise<void>;
}

const ProviderContext = createContext<ProviderContextType | undefined>(undefined);

// Sample colors for providers - keep this for new providers
const PROVIDER_COLORS = [
  '#4caf50', '#2196f3', '#f44336', '#ff9800', '#9c27b0',
  '#3f51b5', '#e91e63', '#009688', '#673ab7', '#ffc107',
  '#795548', '#607d8b', '#8bc34a', '#00bcd4', '#ffeb3b'
];

export const ProviderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Load providers from database
  const loadProviders = useCallback(async () => {
    setLoading(true);
    try {
      const providersData = await databaseService.getProviders();
      // Convert database providers to the expected format
      const formattedProviders: Provider[] = providersData.map((provider: DatabaseProvider) => ({
        ...provider,
        status: provider.status === 'active' ? 'active' : 'inactive' // Ensure status is either 'active' or 'inactive'
      }));
      setProviders(formattedProviders);
    } catch (error) {
      console.error('Error loading providers:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadProviders();
  }, [loadProviders]);

  const addProvider = async (provider: Omit<Provider, 'id'>) => {
    try {
      // Assign a color if not provided
      if (!provider.color) {
        const usedColors = providers.map(p => p.color);
        const availableColors = PROVIDER_COLORS.filter(color => !usedColors.includes(color));
        provider.color = availableColors.length > 0 
          ? availableColors[0] 
          : PROVIDER_COLORS[Math.floor(Math.random() * PROVIDER_COLORS.length)];
      }
      
      await databaseService.addProvider(provider);
      await loadProviders(); // Refresh the list
    } catch (error) {
      console.error('Error adding provider:', error);
    }
  };

  const updateProvider = async (id: string, updatedProvider: Partial<Provider>) => {
    try {
      await databaseService.updateProvider(id, updatedProvider);
      await loadProviders(); // Refresh the list
    } catch (error) {
      console.error('Error updating provider:', error);
    }
  };

  const deleteProvider = async (id: string) => {
    try {
      await databaseService.deleteProvider(id);
      await loadProviders(); // Refresh the list
    } catch (error) {
      console.error('Error deleting provider:', error);
    }
  };

  const getProviderById = (id: string) => {
    return providers.find(provider => provider.id === id);
  };

  const getActiveProviders = () => {
    return providers.filter(provider => provider.status === 'active');
  };

  const refreshProviders = async () => {
    await loadProviders();
  };

  return (
    <ProviderContext.Provider
      value={{
        providers,
        loading,
        addProvider,
        updateProvider,
        deleteProvider,
        getProviderById,
        getActiveProviders,
        refreshProviders
      }}
    >
      {children}
    </ProviderContext.Provider>
  );
};

export const useProviders = () => {
  const context = useContext(ProviderContext);
  if (context === undefined) {
    throw new Error('useProviders must be used within a ProviderProvider');
  }
  return context;
}; 