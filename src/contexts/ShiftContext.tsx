import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { addDays, format, parseISO, differenceInDays, addMonths } from 'date-fns';
import databaseService from '../services/DatabaseService';
import { useAuth } from './AuthContext';

export interface Shift {
  id: string;
  providerId: string;
  clinicTypeId: string;
  startDate: string; // ISO string
  endDate: string; // ISO string
  isVacation: boolean;
  notes?: string;
  isRecurring: boolean;
  recurrencePattern?: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  recurrenceEndDate?: string; // ISO string
  seriesId?: string; // For recurring shifts
  location?: string; // Location information
}

// Interface for shifts from the database
interface DatabaseShift {
  id: string;
  providerId: string;
  clinicTypeId?: string;
  startDate: string;
  endDate: string;
  isVacation: boolean;
  notes?: string;
  isRecurring: boolean;
  recurrencePattern?: string;
  recurrenceEndDate?: string;
  seriesId?: string;
  location?: string;
}

interface ShiftModalState {
  isOpen: boolean;
  shift?: Shift;
  date?: string; // ISO string
  mode: 'add' | 'edit';
  key?: string; // Unique key to force re-render
}

interface ShiftContextType {
  shifts: Shift[];
  modalState: ShiftModalState;
  addShift: (shift: Omit<Shift, 'id'>) => void;
  updateShift: (id: string, shift: Partial<Shift>, updateSeries?: boolean) => void;
  deleteShift: (id: string, deleteSeries?: boolean) => void;
  getShiftById: (id: string) => Shift | undefined;
  getShiftsByDateRange: (startDate: string, endDate: string) => Shift[];
  getShiftsByProvider: (providerId: string) => Shift[];
  getShiftsByClinicType: (clinicTypeId: string) => Shift[];
  openAddModal: (date: string) => void;
  openEditModal: (shift: Shift) => void;
  closeModal: () => void;
  exportShifts: () => string;
  importShifts: (shiftsData: string) => void;
  refreshShifts: () => Promise<boolean>;
  forceRefreshShifts: () => Promise<boolean>;
}

const ShiftContext = createContext<ShiftContextType | undefined>(undefined);

export const ShiftProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [modalState, setModalState] = useState<ShiftModalState>({
    isOpen: false,
    mode: 'add',
    key: uuidv4() // Initialize with a unique key
  });
  const [loading, setLoading] = useState<boolean>(true);
  const { isAuthenticated, isReadOnly } = useAuth();

  // Map database shifts to application format
  const mapDbShiftToShift = (shift: DatabaseShift): Shift => {
    // Validate recurrencePattern
    let validRecurrencePattern: 'daily' | 'weekly' | 'biweekly' | 'monthly' | undefined = undefined;
    if (shift.recurrencePattern) {
      if (['daily', 'weekly', 'biweekly', 'monthly'].includes(shift.recurrencePattern)) {
        validRecurrencePattern = shift.recurrencePattern as 'daily' | 'weekly' | 'biweekly' | 'monthly';
      }
    }
    
    return {
      ...shift,
      clinicTypeId: shift.clinicTypeId || '', // Ensure clinicTypeId is never undefined
      recurrencePattern: validRecurrencePattern
    };
  };

  // Load shifts from database when component mounts
  useEffect(() => {
    const loadShifts = async () => {
      try {
        setLoading(true);
        const shiftsData = await databaseService.getAllShifts();
        
        // Map database shifts to application shifts
        const mappedShifts = shiftsData.map(mapDbShiftToShift);
        
        // Sort shifts by date
        mappedShifts.sort((a, b) => {
          return a.startDate.localeCompare(b.startDate);
        });
        
        setShifts(mappedShifts);
      } catch (error) {
        console.error('Error loading shifts:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadShifts();
  }, []);

  // Refresh shifts - load the current shifts from the database
  const refreshShifts = useCallback(async () => {
    try {
      // Get current date and date 12 months from now for initial load
      const today = new Date();
      const oneYearLater = addMonths(today, 12);
      const startDate = format(today, 'yyyy-MM-dd');
      const endDate = format(oneYearLater, 'yyyy-MM-dd');
      
      console.log(`Refreshing shifts from ${startDate} to ${endDate}`);
      
      // Get shifts in the date range
      const shiftsData = await databaseService.getShiftsByDateRange(startDate, endDate);
      
      // Extract series IDs to load complete series
      const seriesIds = new Set<string>();
      shiftsData.forEach((shift: DatabaseShift) => {
        if (shift.seriesId) {
          seriesIds.add(shift.seriesId);
        }
      });
      
      // Additional collection for shifts outside the date range that are part of a series
      let additionalSeriesShifts: DatabaseShift[] = [];
      
      // For each series ID, ensure we have all shifts in that series
      for (const seriesId of Array.from(seriesIds)) {
        const seriesShifts = await databaseService.getShiftsBySeries(seriesId);
        // Only add shifts that aren't already in the date range result
        const shiftIdsInDateRange = new Set(shiftsData.map((s: DatabaseShift) => s.id));
        const newSeriesShifts = seriesShifts.filter((s: DatabaseShift) => !shiftIdsInDateRange.has(s.id));
        additionalSeriesShifts = [...additionalSeriesShifts, ...newSeriesShifts];
      }
      
      // Combine all shifts
      const combinedShifts = [...shiftsData, ...additionalSeriesShifts];
      
      // Convert database shifts to the expected format
      const formattedShifts: Shift[] = combinedShifts.map(mapDbShiftToShift);
      
      setShifts(formattedShifts);
      return true;
    } catch (error) {
      console.error('Error refreshing shifts:', error);
      return false;
    }
  }, []);
  
  // Re-fetch shifts when auth state changes
  useEffect(() => {
    console.log('Auth state changed in ShiftContext', { isAuthenticated, isReadOnly });
    
    // Only force a refresh if we're not in initial loading state
    if (!loading) {
      refreshShifts();
    }
  }, [isAuthenticated, isReadOnly, loading, refreshShifts]);

  // Add event listener for auth state changes
  useEffect(() => {
    const handleAuthStateChanged = () => {
      console.log('Auth state change event detected in ShiftContext');
      // Only force a refresh if we're not in initial loading state
      if (!loading) {
        refreshShifts();
      }
    };
    
    // Listen for custom auth state change events
    window.addEventListener('auth-state-changed', handleAuthStateChanged);
    
    // Cleanup
    return () => {
      window.removeEventListener('auth-state-changed', handleAuthStateChanged);
    };
  }, [loading, refreshShifts]);

  const addShift = async (shift: Omit<Shift, 'id'>) => {
    // Check if user is authenticated and not in read-only mode
    if (!isAuthenticated || isReadOnly) {
      console.warn('Cannot add shift: User not authenticated or in read-only mode');
      return;
    }
    
    console.log('Adding shift:', shift);
    
    try {
      // If it's a recurring shift, generate the series
      if (shift.isRecurring && shift.recurrencePattern && shift.recurrenceEndDate) {
        const seriesId = uuidv4();
        
        // Add the first shift with the series ID
        const firstShiftWithSeries = {
          ...shift,
          seriesId
        };
        
        const firstShiftId = await databaseService.addShift(firstShiftWithSeries);
        
        if (!firstShiftId) {
          console.error('Failed to add first shift in series');
          return;
        }
        
        // Add the first shift to our local state
        const firstShift: Shift = {
          ...firstShiftWithSeries,
          id: firstShiftId
        };
        
        // Start building our new shifts array with existing shifts and our new first shift
        const updatedShifts = [...shifts, firstShift];
        
        // Calculate the duration of the shift in days
        const startDate = parseISO(shift.startDate);
        const endDate = parseISO(shift.endDate);
        const shiftDuration = differenceInDays(endDate, startDate);
        
        // Generate recurring shifts based on the pattern
        let currentDate = startDate;
        const recurrenceEndDate = parseISO(shift.recurrenceEndDate);
        
        let iterationCount = 0;
        const MAX_ITERATIONS = 300; // Increased from 100 to 300 for longer recurrences
        
        while (iterationCount < MAX_ITERATIONS) {
          let nextDate: Date;
          
          // Calculate the next occurrence based on the pattern
          switch (shift.recurrencePattern) {
            case 'daily':
              nextDate = addDays(currentDate, 1);
              break;
            case 'weekly':
              nextDate = addDays(currentDate, 7);
              break;
            case 'biweekly':
              nextDate = addDays(currentDate, 14);
              break;
            case 'monthly':
              // Create a new date to avoid mutating the original
              nextDate = new Date(currentDate);
              nextDate.setMonth(nextDate.getMonth() + 1);
              break;
            default:
              nextDate = addDays(currentDate, 7); // Default to weekly
          }
          
          // Break if we've passed the recurrence end date
          if (nextDate > recurrenceEndDate) {
            break;
          }
          
          // Add the recurring shift
          const nextShiftStartDate = format(nextDate, 'yyyy-MM-dd');
          const nextShiftEndDate = format(addDays(nextDate, shiftDuration), 'yyyy-MM-dd');
          
          const recurrenceShift = {
            ...shift,
            seriesId,
            startDate: nextShiftStartDate,
            endDate: nextShiftEndDate
          };
          
          const newShiftId = await databaseService.addShift(recurrenceShift);
          
          if (newShiftId) {
            // Add to our local state
            updatedShifts.push({
              ...recurrenceShift,
              id: newShiftId
            });
          }
          
          // Move to the next date
          currentDate = nextDate;
          iterationCount++;
        }
        
        if (iterationCount >= MAX_ITERATIONS) {
          console.warn('Reached maximum number of iterations when generating recurring shifts');
        }
        
        // Update our state with all the new shifts
        setShifts(updatedShifts);
      } else {
        // Add a single shift to the database
        const newShiftId = await databaseService.addShift(shift);
        
        // Add to our local state if we got an ID back
        if (newShiftId) {
          setShifts([
            ...shifts,
            {
              ...shift,
              id: newShiftId
            }
          ]);
        }
      }
    } catch (error) {
      console.error('Error adding shift:', error);
    }
  };

  const updateShift = async (id: string, updatedShift: Partial<Shift>, updateSeries = false) => {
    // Check if user is authenticated and not in read-only mode
    if (!isAuthenticated || isReadOnly) {
      console.warn('Cannot update shift: User not authenticated or in read-only mode');
      return;
    }
    
    console.log('Updating shift:', id, updatedShift, 'Update series:', updateSeries);
    
    let shiftToUpdate = shifts.find(s => s.id === id);
    
    if (!shiftToUpdate) {
      console.log('Shift not found in local state, attempting to refresh shifts first');
      // Try to refresh shifts first to ensure we have the latest data
      await forceRefreshShifts();
      
      // Try to find the shift again after refresh
      shiftToUpdate = shifts.find(s => s.id === id);
      
      if (!shiftToUpdate) {
        console.error('Shift not found even after refresh:', id);
        return;
      }
    }
    
    try {
      // Now we know shiftToUpdate is defined
      const seriesId = shiftToUpdate.seriesId;
      const isRecurring = shiftToUpdate.isRecurring;
      
      // If this is part of a recurring series and we're updating the entire series
      if (seriesId && isRecurring && updateSeries) {
        console.log('Updating entire recurring series:', seriesId);
        
        // Get all shifts in this series
        const seriesShifts = shifts.filter(s => s.seriesId === seriesId);
        
        if (seriesShifts.length === 0) {
          console.error('No shifts found in series:', seriesId);
          return;
        }
        
        // Find the first shift in the series (by start date)
        const firstShift = seriesShifts.reduce((earliest, current) => {
          return parseISO(current.startDate) < parseISO(earliest.startDate) ? current : earliest;
        }, seriesShifts[0]);
        
        // Check if we need to recalculate the entire series
        // This is needed if we're changing dates or recurrence pattern
        const needsRecalculation = 
          updatedShift.startDate !== undefined || 
          updatedShift.endDate !== undefined || 
          updatedShift.recurrencePattern !== undefined || 
          updatedShift.recurrenceEndDate !== undefined;
        
        if (needsRecalculation) {
          try {
            // Remove all existing shifts in the series
            const nonSeriesShifts = shifts.filter(s => s.seriesId !== seriesId);
            
            // Create a new base shift with updated properties
            const baseShift: Omit<Shift, 'id'> = {
              ...firstShift,
              ...updatedShift,
              // Ensure we keep the seriesId
              seriesId: firstShift.seriesId
            };
            
            // Validate dates
            if (!baseShift.startDate || !baseShift.endDate || !baseShift.recurrenceEndDate) {
              console.error('Missing required dates for recurring shift');
              return;
            }
            
            // Ensure end date is not before start date
            if (parseISO(baseShift.endDate) < parseISO(baseShift.startDate)) {
              baseShift.endDate = baseShift.startDate;
            }
            
            // Ensure recurrence end date is not before start date
            if (parseISO(baseShift.recurrenceEndDate) < parseISO(baseShift.startDate)) {
              baseShift.recurrenceEndDate = format(
                addMonths(parseISO(baseShift.startDate), 3),
                'yyyy-MM-dd'
              );
            }
            
            // Calculate the duration of the shift in days
            const startDate = parseISO(baseShift.startDate);
            const endDate = parseISO(baseShift.endDate);
            const shiftDuration = differenceInDays(endDate, startDate);
            
            // Generate new recurring shifts based on the updated pattern
            const newSeriesShifts: Shift[] = [];
            
            // First, delete all shifts in the series except the first one from the database
            for (const shift of seriesShifts) {
              if (shift.id !== firstShift.id) {
                await databaseService.deleteShift(shift.id);
              }
            }
            
            // Update the first shift in the database
            const updatedFirstShift = {
              ...baseShift,
              id: firstShift.id
            } as Shift;
            
            await databaseService.updateShift(firstShift.id, updatedFirstShift);
            
            // Add the first shift to our new array
            newSeriesShifts.push(updatedFirstShift);
            
            // Generate the rest of the series
            let currentDate = startDate;
            const recurrenceEndDate = parseISO(baseShift.recurrenceEndDate);
            
            // Prevent infinite loops by limiting the number of iterations
            let iterationCount = 0;
            const MAX_ITERATIONS = 300; // Increased from 100 to 300 for longer recurrences
            
            while (iterationCount < MAX_ITERATIONS) {
              let nextDate: Date;
              
              // Calculate the next occurrence based on the pattern
              switch (baseShift.recurrencePattern) {
                case 'daily':
                  nextDate = addDays(currentDate, 1);
                  break;
                case 'weekly':
                  nextDate = addDays(currentDate, 7);
                  break;
                case 'biweekly':
                  nextDate = addDays(currentDate, 14);
                  break;
                case 'monthly':
                  // Create a new date to avoid mutating the original
                  nextDate = new Date(currentDate);
                  nextDate.setMonth(nextDate.getMonth() + 1);
                  break;
                default:
                  nextDate = addDays(currentDate, 7); // Default to weekly
              }
              
              // Break if we've passed the recurrence end date
              if (nextDate > recurrenceEndDate) {
                break;
              }
              
              // Format dates for the new shift
              const nextShiftStartDate = format(nextDate, 'yyyy-MM-dd');
              const nextShiftEndDate = format(addDays(nextDate, shiftDuration), 'yyyy-MM-dd');
              
              // Create a new shift
              const newShift = {
                ...baseShift,
                id: uuidv4(),
                startDate: nextShiftStartDate,
                endDate: nextShiftEndDate
              } as Shift;
              
              // Add to database
              const newShiftId = await databaseService.addShift(newShift);
              
              // Add to our array
              newSeriesShifts.push({
                ...newShift,
                id: newShiftId || newShift.id
              });
              
              // Move to the next date
              currentDate = nextDate;
              iterationCount++;
            }
            
            if (iterationCount >= MAX_ITERATIONS) {
              console.warn('Reached maximum number of iterations when generating recurring shifts');
            }
            
            console.log('Updating recurring shifts:', newSeriesShifts.length, 'shifts');
            setShifts([...nonSeriesShifts, ...newSeriesShifts]);
          } catch (error) {
            console.error('Error updating recurring shifts:', error);
          }
        } else {
          // For non-date updates (like provider, clinic type, etc.), update each shift in the series
          for (const shift of seriesShifts) {
            await databaseService.updateShift(shift.id, updatedShift);
          }
          
          // Update local state
          setShifts(
            shifts.map(shift => 
              shift.seriesId === seriesId 
                ? { ...shift, ...updatedShift } 
                : shift
            )
          );
        }
      } else {
        // If this is part of a recurring series but we're only updating this instance
        if (seriesId && isRecurring && !updateSeries) {
          console.log('Updating single shift in recurring pattern - breaking from series');
          
          // Create a copy without the series ID to break it from the pattern
          const individualShift = {
            ...shiftToUpdate,
            ...updatedShift,
            seriesId: undefined,
            // Ensure we're explicitly setting isRecurring to false when breaking from series
            isRecurring: false,
            // Clear recurrence fields when breaking from series
            recurrencePattern: undefined,
            recurrenceEndDate: undefined
          };
          
          // Update in database
          await databaseService.updateShift(id, individualShift);
          
          // Update in local state
          setShifts(
            shifts.map(shift => 
              shift.id === id ? individualShift : shift
            )
          );
        } else {
          // Regular single shift update
          console.log('Updating single shift');
          
          // Update in database
          await databaseService.updateShift(id, updatedShift);
          
          // Update in local state
          setShifts(
            shifts.map(shift => 
              shift.id === id ? { ...shift, ...updatedShift } : shift
            )
          );
        }
      }
    } catch (error) {
      console.error('Error updating shift:', error);
    }
  };

  const deleteShift = async (id: string, deleteSeries = false) => {
    // Check if user is authenticated and not in read-only mode
    if (!isAuthenticated || isReadOnly) {
      console.warn('Cannot delete shift: User not authenticated or in read-only mode');
      return;
    }
    
    console.log('Deleting shift:', id, 'Delete series:', deleteSeries);
    
    let shiftToDelete = shifts.find(s => s.id === id);
    
    if (!shiftToDelete) {
      console.log('Shift not found in local state, attempting to refresh shifts first');
      // Try to refresh shifts first to ensure we have the latest data
      await forceRefreshShifts();
      
      // Try to find the shift again after refresh
      shiftToDelete = shifts.find(s => s.id === id);
      
      if (!shiftToDelete) {
        console.error('Shift not found even after refresh:', id);
        
        // Even if the specific shift is not found, we can still try to delete the series
        // by its ID if we're in delete series mode and have the ID in the modal state
        if (deleteSeries && modalState.shift?.seriesId) {
          console.log('Attempting to delete series by seriesId:', modalState.shift.seriesId);
          
          try {
            // Delete all shifts in the series from the database first
            const shiftsToDelete = shifts.filter(s => s.seriesId === modalState.shift?.seriesId);
            for (const shift of shiftsToDelete) {
              await databaseService.deleteShift(shift.id);
            }
            
            // Then update local state
            setShifts(shifts.filter(shift => shift.seriesId !== modalState.shift?.seriesId));
          } catch (error) {
            console.error('Error deleting shift series:', error);
          }
        }
        
        return;
      }
    }
    
    try {
      // Now we know shiftToDelete is defined
      const seriesId = shiftToDelete.seriesId;
      
      if (deleteSeries && seriesId) {
        // Delete all shifts in the series from the database first
        const shiftsToDelete = shifts.filter(s => s.seriesId === seriesId);
        console.log('Deleting all shifts in series:', seriesId, shiftsToDelete.length, 'shifts');
        
        for (const shift of shiftsToDelete) {
          await databaseService.deleteShift(shift.id);
        }
        
        // Then update local state
        setShifts(shifts.filter(shift => shift.seriesId !== seriesId));
      } else {
        // Delete only this shift from the database first
        console.log('Deleting single shift:', id);
        await databaseService.deleteShift(id);
        
        // Create a new array with the filtered shifts to avoid reference issues
        const updatedShifts = shifts.filter(shift => shift.id !== id);
        
        // If this was part of a series, handle series cleanup
        if (seriesId) {
          const remainingSeriesShifts = shifts.filter(
            shift => shift.seriesId === seriesId && shift.id !== id
          );
          
          if (remainingSeriesShifts.length === 0) {
            console.log('Last shift in series deleted, cleaning up series:', seriesId);
          } else if (remainingSeriesShifts.length === 1) {
            // If only one shift remains in the series, remove the series ID from it
            console.log('Only one shift remains in series, removing series ID');
            const lastShift = remainingSeriesShifts[0];
            
            // Update in database
            await databaseService.updateShift(lastShift.id, {
              ...lastShift,
              seriesId: undefined,
              isRecurring: false
            });
            
            // Update in local state
            updatedShifts.forEach(shift => {
              if (shift.id === lastShift.id) {
                shift.seriesId = undefined;
                shift.isRecurring = false;
              }
            });
          }
        }
        
        // Update the shifts state with our modified array
        setShifts(updatedShifts);
      }
    } catch (error) {
      console.error('Error deleting shift:', error);
    }
  };

  const getShiftById = (id: string) => {
    return shifts.find(shift => shift.id === id);
  };

  const getShiftsByDateRange = (startDate: string, endDate: string) => {
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    
    return shifts.filter(shift => {
      const shiftStart = parseISO(shift.startDate);
      const shiftEnd = parseISO(shift.endDate);
      
      // Check if the shift overlaps with the date range
      return (shiftStart <= end && shiftEnd >= start);
    });
  };

  const getShiftsByProvider = (providerId: string) => {
    return shifts.filter(shift => shift.providerId === providerId);
  };

  const getShiftsByClinicType = (clinicTypeId: string) => {
    return shifts.filter(shift => shift.clinicTypeId === clinicTypeId);
  };

  const openAddModal = (date: string) => {
    console.log('Opening add modal for date:', date);
    
    // For better UX, check authentication before opening modal
    if (!isAuthenticated || isReadOnly) {
      // Still allow users to see the modal but they'll see an info message inside
      console.log('User in read-only mode trying to add shift');
    }
    
    // First close any existing modal to reset state
    setModalState({
      isOpen: false,
      mode: 'add',
      shift: undefined, // Explicitly clear the shift reference
      key: uuidv4()
    });
    
    // Then open the new modal with a slight delay to ensure state is reset
    setTimeout(() => {
      setModalState({
        isOpen: true,
        date,
        mode: 'add',
        shift: undefined, // Explicitly ensure no shift data is present
        key: uuidv4() // Generate a new key to force re-render
      });
    }, 50);
  };

  const openEditModal = (shift: Shift) => {
    console.log('Opening edit modal for shift:', shift);
    
    // For better UX, check authentication before opening modal
    if (!isAuthenticated || isReadOnly) {
      // Still allow users to see the modal but they'll see an info message inside
      console.log('User in read-only mode trying to edit shift');
    }
    
    // First close any existing modal to reset state
    setModalState({
      isOpen: false,
      mode: 'edit',
      key: uuidv4()
    });
    
    // Then open the new modal with a slight delay to ensure state is reset
    setTimeout(() => {
      setModalState({
        isOpen: true,
        shift,
        mode: 'edit',
        key: uuidv4() // Generate a new key to force re-render
      });
    }, 50);
  };

  const closeModal = () => {
    console.log('Closing modal');
    
    setModalState({
      isOpen: false,
      mode: 'add',
      shift: undefined, // Explicitly clear the shift reference
      key: uuidv4() // Generate a new key to force re-render
    });
  };

  const exportShifts = () => {
    return JSON.stringify(shifts);
  };

  const importShifts = (shiftsData: string) => {
    try {
      const parsedShifts = JSON.parse(shiftsData);
      if (Array.isArray(parsedShifts)) {
        setShifts(parsedShifts);
      }
    } catch (error) {
      console.error('Error importing shifts:', error);
    }
  };

  // Force a refresh - this is called when changes are made
  const forceRefreshShifts = useCallback(async () => {
    return refreshShifts();
  }, [refreshShifts]);

  return (
    <ShiftContext.Provider
      value={{
        shifts,
        modalState,
        addShift,
        updateShift,
        deleteShift,
        getShiftById,
        getShiftsByDateRange,
        getShiftsByProvider,
        getShiftsByClinicType,
        openAddModal,
        openEditModal,
        closeModal,
        exportShifts,
        importShifts,
        refreshShifts,
        forceRefreshShifts
      }}
    >
      {children}
    </ShiftContext.Provider>
  );
};

export const useShifts = () => {
  const context = useContext(ShiftContext);
  if (context === undefined) {
    throw new Error('useShifts must be used within a ShiftProvider');
  }
  return context;
}; 