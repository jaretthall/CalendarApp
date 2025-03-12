import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { addDays, format, parseISO, differenceInDays, addMonths } from 'date-fns';
import databaseService from '../services/DatabaseService';

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
  refreshShifts: () => Promise<void>;
}

const ShiftContext = createContext<ShiftContextType | undefined>(undefined);

export const ShiftProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [, setLoading] = useState<boolean>(true);

  const [modalState, setModalState] = useState<ShiftModalState>({
    isOpen: false,
    mode: 'add',
    key: uuidv4() // Initialize with a unique key
  });

  // Load shifts from database
  const loadShifts = useCallback(async () => {
    setLoading(true);
    try {
      // Get current date and date 3 months from now for initial load
      const today = new Date();
      const threeMonthsLater = addMonths(today, 3);
      const startDate = format(today, 'yyyy-MM-dd');
      const endDate = format(threeMonthsLater, 'yyyy-MM-dd');
      
      const shiftsData = await databaseService.getShiftsByDateRange(startDate, endDate);
      
      // Convert database shifts to the expected format
      const formattedShifts: Shift[] = shiftsData.map((shift: DatabaseShift) => {
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
      });
      
      setShifts(formattedShifts);
    } catch (error) {
      console.error('Error loading shifts:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadShifts();
  }, [loadShifts]);

  const addShift = async (shift: Omit<Shift, 'id'>) => {
    console.log('Adding shift:', shift);
    
    try {
      // If it's a recurring shift, generate the series
      if (shift.isRecurring && shift.recurrencePattern && shift.recurrenceEndDate) {
        const seriesId = uuidv4();
        
        // Add the first shift with the series ID
        const firstShiftId = await databaseService.addShift({
          ...shift,
          seriesId
        });
        
        if (!firstShiftId) {
          console.error('Failed to add first shift in series');
          return;
        }
        
        // Calculate the duration of the shift in days
        const startDate = parseISO(shift.startDate);
        const endDate = parseISO(shift.endDate);
        const shiftDuration = differenceInDays(endDate, startDate);
        
        // Generate recurring shifts based on the pattern
        let currentDate = startDate;
        const recurrenceEndDate = parseISO(shift.recurrenceEndDate);
        
        while (true) {
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
          
          await databaseService.addShift({
            ...shift,
            seriesId,
            startDate: nextShiftStartDate,
            endDate: nextShiftEndDate
          });
          
          // Move to the next date
          currentDate = nextDate;
        }
      } else {
        // Add a single shift
        await databaseService.addShift(shift);
      }
      
      // Refresh shifts after adding
      await loadShifts();
    } catch (error) {
      console.error('Error adding shift:', error);
    }
  };

  const updateShift = (id: string, updatedShift: Partial<Shift>, updateSeries = false) => {
    console.log('Updating shift:', id, updatedShift, 'Update series:', updateSeries);
    
    const shiftToUpdate = shifts.find(s => s.id === id);
    
    if (!shiftToUpdate) {
      console.error('Shift not found:', id);
      return;
    }
    
    if (updateSeries && shiftToUpdate.seriesId) {
      // Get all shifts in the series
      const seriesShifts = shifts.filter(s => s.seriesId === shiftToUpdate.seriesId);
      
      if (seriesShifts.length === 0) {
        console.error('No shifts found in series:', shiftToUpdate.seriesId);
        return;
      }
      
      // Find the first shift in the series (chronologically)
      const firstShift = seriesShifts.reduce((earliest, current) => {
        return parseISO(current.startDate) < parseISO(earliest.startDate) ? current : earliest;
      }, seriesShifts[0]);
      
      // If we're updating dates or recurrence pattern, we need to recalculate all shifts
      const needsRecalculation = 
        updatedShift.startDate !== undefined || 
        updatedShift.endDate !== undefined || 
        updatedShift.recurrencePattern !== undefined ||
        updatedShift.recurrenceEndDate !== undefined;
      
      if (needsRecalculation) {
        try {
          // Remove all existing shifts in the series
          const nonSeriesShifts = shifts.filter(s => s.seriesId !== shiftToUpdate.seriesId);
          
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
          
          // Add the first shift
          newSeriesShifts.push({
            ...baseShift,
            id: firstShift.id // Keep the original ID for the first shift
          } as Shift);
          
          // Generate the rest of the series
          let currentDate = startDate;
          const recurrenceEndDate = parseISO(baseShift.recurrenceEndDate);
          
          // Map to keep track of existing shift IDs to reuse
          const existingShiftIds = new Map<string, string>();
          seriesShifts.forEach(shift => {
            if (shift.id !== firstShift.id) {
              existingShiftIds.set(shift.startDate, shift.id);
            }
          });
          
          // Prevent infinite loops by limiting the number of iterations
          let iterationCount = 0;
          const MAX_ITERATIONS = 100; // Reasonable limit for most use cases
          
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
            
            // Check if we have an existing shift ID for this date
            const existingId = existingShiftIds.get(nextShiftStartDate) || uuidv4();
            
            // Add the recurring shift
            newSeriesShifts.push({
              ...baseShift,
              id: existingId,
              startDate: nextShiftStartDate,
              endDate: nextShiftEndDate
            } as Shift);
            
            // Move to the next date
            currentDate = nextDate;
            iterationCount++;
          }
          
          if (iterationCount >= MAX_ITERATIONS) {
            console.warn('Reached maximum number of iterations when generating recurring shifts');
          }
          
          console.log('Updating recurring shifts:', newSeriesShifts);
          setShifts([...nonSeriesShifts, ...newSeriesShifts]);
        } catch (error) {
          console.error('Error updating recurring shifts:', error);
        }
      } else {
        // For non-date updates (like provider, clinic type, etc.), just update all shifts
        setShifts(
          shifts.map(shift => 
            shift.seriesId === shiftToUpdate.seriesId 
              ? { ...shift, ...updatedShift } 
              : shift
          )
        );
      }
    } else {
      // Update only this shift
      setShifts(
        shifts.map(shift => 
          shift.id === id ? { ...shift, ...updatedShift } : shift
        )
      );
    }
  };

  const deleteShift = (id: string, deleteSeries = false) => {
    console.log('Deleting shift:', id, 'Delete series:', deleteSeries);
    
    const shiftToDelete = shifts.find(s => s.id === id);
    
    if (!shiftToDelete) {
      console.error('Shift not found:', id);
      
      // Even if the specific shift is not found, we can still try to delete the series
      // by its ID if we're in delete series mode and have the ID in the modal state
      if (deleteSeries && modalState.shift?.seriesId) {
        console.log('Attempting to delete series by seriesId:', modalState.shift.seriesId);
        setShifts(
          shifts.filter(shift => shift.seriesId !== modalState.shift?.seriesId)
        );
      }
      
      return;
    }
    
    if (deleteSeries && shiftToDelete.seriesId) {
      // Delete all shifts in the series
      console.log('Deleting all shifts in series:', shiftToDelete.seriesId);
      setShifts(
        shifts.filter(shift => shift.seriesId !== shiftToDelete.seriesId)
      );
    } else {
      // Delete only this shift
      console.log('Deleting single shift:', id);
      
      // Create a new array with the filtered shifts to avoid reference issues
      const updatedShifts = shifts.filter(shift => shift.id !== id);
      
      // If this was part of a series, handle series cleanup
      if (shiftToDelete.seriesId) {
        const remainingSeriesShifts = shifts.filter(
          shift => shift.seriesId === shiftToDelete.seriesId && shift.id !== id
        );
        
        if (remainingSeriesShifts.length === 0) {
          console.log('Last shift in series deleted, cleaning up series:', shiftToDelete.seriesId);
        } else if (remainingSeriesShifts.length === 1) {
          // If only one shift remains in the series, remove the series ID from it
          console.log('Only one shift remains in series, removing series ID');
          const lastShift = remainingSeriesShifts[0];
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

  // Update the refreshShifts function to expose it to consumers
  const refreshShifts = async () => {
    await loadShifts();
  };

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
        refreshShifts
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