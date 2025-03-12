import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Box,
  Typography,
  SelectChangeEvent,
  Grid,
  Collapse,
  Alert,
  RadioGroup,
  Radio
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { format, parseISO, addMonths, addDays, differenceInDays } from 'date-fns';
import { useShifts, Shift } from '../../contexts/ShiftContext';
import { useProviders } from '../../contexts/EmployeeContext';
import { useClinicTypes } from '../../contexts/LocationContext';
import { useAuth } from '../../contexts/AuthContext';
import DeleteIcon from '@mui/icons-material/Delete';

// Define the recurrence pattern type to match the Shift interface
type RecurrencePattern = 'daily' | 'weekly' | 'biweekly' | 'monthly';

// Define delete option type
type DeleteOptionType = 'entire' | 'specific-day';

const ShiftModal: React.FC = () => {
  const { 
    modalState, 
    closeModal, 
    addShift, 
    updateShift, 
    deleteShift, 
    forceRefreshShifts 
  } = useShifts();
  const { getActiveProviders } = useProviders();
  const { getActiveClinicTypes } = useClinicTypes();
  const { isAuthenticated } = useAuth();
  
  const activeProviders = getActiveProviders();
  const activeClinicTypes = getActiveClinicTypes();
  
  // Use a ref to track if the form has been initialized
  const formInitialized = useRef(false);
  
  // Initialize form data with default values
  const [formData, setFormData] = useState<Partial<Shift>>({
    providerId: activeProviders.length > 0 ? activeProviders[0].id : '',
    clinicTypeId: activeClinicTypes.length > 0 ? activeClinicTypes[0].id : '',
    startDate: '',
    endDate: '',
    isVacation: false,
    notes: '',
    isRecurring: false,
    recurrencePattern: 'weekly' as RecurrencePattern,
    recurrenceEndDate: ''
  });
  
  const [deleteSeries, setDeleteSeries] = useState(false);
  const [deleteOption, setDeleteOption] = useState<DeleteOptionType>('entire');
  const [specificDeleteDate, setSpecificDeleteDate] = useState<string | null>(null);
  const [updateScope, setUpdateScope] = useState<'this' | 'future' | 'all'>('this');

  // Reset form when modal opens/closes
  useEffect(() => {
    console.log('Modal state changed:', modalState);
    
    // Always reset form data when modal state changes
    if (!modalState.isOpen) {
      // Reset form data to defaults when modal closes
      setFormData({
        providerId: activeProviders.length > 0 ? activeProviders[0].id : '',
        clinicTypeId: activeClinicTypes.length > 0 ? activeClinicTypes[0].id : '',
        startDate: '',
        endDate: '',
        isVacation: false,
        notes: '',
        isRecurring: false,
        recurrencePattern: 'weekly' as RecurrencePattern,
        recurrenceEndDate: ''
      });
      // Reset other state
      setUpdateScope('this');
      setDeleteSeries(false);
      // Reset the initialization flag when modal closes
      formInitialized.current = false;
      return;
    }
    
    // Force refresh shifts data to ensure we have the complete series
    if (modalState.isOpen && modalState.mode === 'edit' && modalState.shift?.seriesId) {
      console.log('Forcing refresh to ensure complete series data is loaded');
      forceRefreshShifts().then(() => {
        console.log('Shifts refreshed for series data');
      });
    }
    
    if (modalState.isOpen && !formInitialized.current) {
      if (modalState.mode === 'add' && modalState.date) {
        // Set default end date to same as start date
        const startDate = new Date(modalState.date);
        const recurrenceEndDate = addMonths(startDate, 3);
        
        // Create a completely fresh object for new shifts
        const newFormData: Partial<Shift> = {
          providerId: activeProviders.length > 0 ? activeProviders[0].id : '',
          clinicTypeId: activeClinicTypes.length > 0 ? activeClinicTypes[0].id : '',
          startDate: modalState.date,
          endDate: modalState.date,
          isVacation: false,
          notes: '',
          isRecurring: false,
          recurrencePattern: 'weekly' as RecurrencePattern,
          recurrenceEndDate: format(recurrenceEndDate, 'yyyy-MM-dd')
        };
        
        console.log('Setting form data for add mode:', newFormData);
        setFormData(newFormData);
        setUpdateScope('this');
        setDeleteSeries(false);
        formInitialized.current = true;
      } else if (modalState.mode === 'edit' && modalState.shift) {
        // When editing, ensure we have a recurrence end date if it's a recurring shift
        const shift = { ...modalState.shift };
        
        if (shift.isRecurring && !shift.recurrenceEndDate && shift.startDate) {
          const startDate = parseISO(shift.startDate);
          const recurrenceEndDate = addMonths(startDate, 3);
          shift.recurrenceEndDate = format(recurrenceEndDate, 'yyyy-MM-dd');
        }
        
        console.log('Setting form data for edit mode:', shift);
        setFormData(shift);
        setUpdateScope('this');
        setDeleteSeries(false);
        formInitialized.current = true;
      }
    }
  }, [modalState, activeProviders, activeClinicTypes, forceRefreshShifts]);

  // Memoize handlers to prevent unnecessary re-renders
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isAuthenticated) return;
    
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    console.log(`Input changed: ${name} = ${newValue}`);
    
    setFormData(prevData => ({
      ...prevData,
      [name]: newValue
    }));
  }, [isAuthenticated]);

  const handleSelectChange = useCallback((e: SelectChangeEvent) => {
    if (!isAuthenticated) return;
    
    const { name, value } = e.target;
    console.log(`Select changed: ${name} = ${value}`);
    
    if (name === 'recurrencePattern') {
      // Ensure recurrencePattern is properly typed
      setFormData(prevData => ({
        ...prevData,
        [name]: value as RecurrencePattern
      }));
    } else {
      setFormData(prevData => ({
        ...prevData,
        [name]: value
      }));
    }
  }, [isAuthenticated]);

  const handleDateChange = useCallback((name: string, date: Date | null) => {
    if (!isAuthenticated) return;
    
    if (date) {
      const formattedDate = format(date, 'yyyy-MM-dd');
      console.log(`Date changed: ${name} = ${formattedDate}`);
      
      // If changing start date and end date is before start date, update end date too
      if (name === 'startDate') {
        setFormData(prevData => {
          const updatedData = {
            ...prevData,
            [name]: formattedDate
          };
          
          // If end date is empty or before start date, set it to start date
          if (!prevData.endDate || parseISO(prevData.endDate) < date) {
            updatedData.endDate = formattedDate;
          }
          
          return updatedData;
        });
      } else {
        // Only update the specific date field that was changed
        setFormData(prevData => ({
          ...prevData,
          [name]: formattedDate
        }));
      }
    }
  }, [isAuthenticated]);

  const handleRecurringToggle = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (!isAuthenticated) return;
    
    const checked = event.target.checked;
    console.log(`Recurring toggled: ${checked}`);
    
    // If toggling on and we have a start date, set a default recurrence end date
    setFormData(prevData => {
      if (checked && prevData.startDate) {
        const startDate = parseISO(prevData.startDate);
        const recurrenceEndDate = addMonths(startDate, 3);
        
        return {
          ...prevData,
          isRecurring: checked,
          recurrencePattern: 'weekly' as RecurrencePattern, // Set default pattern with proper type
          recurrenceEndDate: format(recurrenceEndDate, 'yyyy-MM-dd')
        };
      } else {
        return {
          ...prevData,
          isRecurring: checked,
          // Clear recurrence fields if toggling off
          recurrencePattern: checked ? prevData.recurrencePattern : undefined,
          recurrenceEndDate: checked ? prevData.recurrenceEndDate : undefined
        };
      }
    });
  }, [isAuthenticated]);

  const handleSubmit = useCallback(() => {
    if (!isAuthenticated) {
      closeModal();
      return;
    }
    
    console.log('Submitting form data:', formData);
    
    if (
      !formData.providerId ||
      !formData.clinicTypeId ||
      !formData.startDate ||
      !formData.endDate
    ) {
      console.error('Missing required fields');
      return;
    }

    // Ensure recurrence fields are properly set
    const shiftToSubmit = { ...formData } as Omit<Shift, 'id'>;
    
    if (shiftToSubmit.isRecurring) {
      if (!shiftToSubmit.recurrencePattern) {
        shiftToSubmit.recurrencePattern = 'weekly' as RecurrencePattern;
      }
      
      if (!shiftToSubmit.recurrenceEndDate && shiftToSubmit.startDate) {
        const startDate = parseISO(shiftToSubmit.startDate);
        const recurrenceEndDate = addMonths(startDate, 3);
        shiftToSubmit.recurrenceEndDate = format(recurrenceEndDate, 'yyyy-MM-dd');
      }
    } else {
      // Clear recurrence fields if not recurring
      delete shiftToSubmit.recurrencePattern;
      delete shiftToSubmit.recurrenceEndDate;
      delete shiftToSubmit.seriesId;
    }

    try {
      if (modalState.mode === 'add') {
        addShift(shiftToSubmit);
      } else if (modalState.mode === 'edit' && modalState.shift) {
        // Determine if we should update all occurrences based on the update scope
        const shouldUpdateSeries = updateScope === 'all';
        updateShift(modalState.shift.id, shiftToSubmit, shouldUpdateSeries);
      } else {
        console.error('Cannot update shift: No shift data in modal state');
      }
      
      // Force a refresh after adding or updating to ensure consistency
      setTimeout(async () => {
        try {
          await forceRefreshShifts();
          console.log('Shifts refreshed successfully after submit');
        } catch (error) {
          console.error('Error refreshing shifts after submit:', error);
        }
      }, 500);
    } catch (error) {
      console.error('Error saving shift:', error);
    }

    closeModal();
  }, [formData, modalState, isAuthenticated, updateScope, addShift, updateShift, closeModal, forceRefreshShifts]);

  // Check if the current shift spans multiple days
  const isMultiDayShift = useMemo(() => {
    if (modalState.mode === 'edit' && modalState.shift) {
      return modalState.shift.startDate !== modalState.shift.endDate;
    }
    return false;
  }, [modalState]);

  // Generate dates for the date selector
  const shiftDates = useMemo(() => {
    if (modalState.mode === 'edit' && modalState.shift && isMultiDayShift) {
      const dates: { date: string; label: string }[] = [];
      const startDate = parseISO(modalState.shift.startDate);
      const endDate = parseISO(modalState.shift.endDate);
      let currentDate = startDate;
      
      while (currentDate <= endDate) {
        const dateStr = format(currentDate, 'yyyy-MM-dd');
        dates.push({
          date: dateStr,
          label: format(currentDate, 'EEE, MMM d, yyyy')
        });
        currentDate = addDays(currentDate, 1);
      }
      
      return dates;
    }
    return [];
  }, [modalState.mode, modalState.shift, isMultiDayShift]);

  // Initialize the specific delete date when the modal opens or when shift changes
  useEffect(() => {
    if (modalState.mode === 'edit' && modalState.shift && isMultiDayShift && shiftDates.length > 0) {
      setSpecificDeleteDate(shiftDates[0].date);
    }
  }, [modalState.mode, modalState.shift, isMultiDayShift, shiftDates]);

  // Add a function to handle specific day deletion
  const handleSpecificDayDelete = useCallback(() => {
    if (!isAuthenticated || !modalState.shift || !specificDeleteDate) {
      closeModal();
      return;
    }

    // If the shift is just one day, delete it normally
    if (modalState.shift.startDate === modalState.shift.endDate) {
      deleteShift(modalState.shift.id, deleteSeries);
      closeModal();
      return;
    }

    try {
      // For multi-day shifts, we need to split the shift
      const shift = modalState.shift;
      const startDate = parseISO(shift.startDate);
      const endDate = parseISO(shift.endDate);
      const deleteDate = parseISO(specificDeleteDate);

      console.log(`Deleting specific day: ${specificDeleteDate} from shift ${shift.id}`);
      console.log(`Shift dates: ${shift.startDate} to ${shift.endDate}`);
      
      // For recurring shifts, we need to break this instance from the series first
      const isPartOfSeries = shift.seriesId && shift.isRecurring;
      
      // If deleting the first day
      if (format(startDate, 'yyyy-MM-dd') === specificDeleteDate) {
        // Update the start date to the day after
        const newStartDate = format(addDays(deleteDate, 1), 'yyyy-MM-dd');
        console.log(`Updating shift start date to: ${newStartDate}`);
        
        // If this is part of a series, we need to break it from the series first
        if (isPartOfSeries) {
          console.log('Breaking shift from series before updating');
          // Create a modified shift without the seriesId
          const updatedShift = { 
            ...shift, 
            startDate: newStartDate,
            seriesId: undefined,
            isRecurring: false,
            recurrencePattern: undefined,
            recurrenceEndDate: undefined
          };
          // Update the shift with the new data
          updateShift(shift.id, updatedShift, false);
        } else {
          // Regular update for non-recurring shifts
          updateShift(shift.id, { startDate: newStartDate }, false);
        }
      } 
      // If deleting the last day
      else if (format(endDate, 'yyyy-MM-dd') === specificDeleteDate) {
        // Update the end date to the day before
        const newEndDate = format(addDays(deleteDate, -1), 'yyyy-MM-dd');
        console.log(`Updating shift end date to: ${newEndDate}`);
        
        // If this is part of a series, we need to break it from the series first
        if (isPartOfSeries) {
          console.log('Breaking shift from series before updating');
          // Create a modified shift without the seriesId
          const updatedShift = { 
            ...shift, 
            endDate: newEndDate,
            seriesId: undefined,
            isRecurring: false,
            recurrencePattern: undefined,
            recurrenceEndDate: undefined
          };
          // Update the shift with the new data
          updateShift(shift.id, updatedShift, false);
        } else {
          // Regular update for non-recurring shifts
          updateShift(shift.id, { endDate: newEndDate }, false);
        }
      } 
      // If deleting a day in the middle, we need to split the shift into two
      else {
        // First, update the current shift to end the day before the deleted day
        const newEndDate = format(addDays(deleteDate, -1), 'yyyy-MM-dd');
        console.log(`Updating first part end date to: ${newEndDate}`);
        
        // If this is part of a series, we need to break it from the series first
        if (isPartOfSeries) {
          console.log('Breaking shift from series before splitting');
          // Create a modified shift without the seriesId
          const updatedShift = { 
            ...shift, 
            endDate: newEndDate,
            seriesId: undefined,
            isRecurring: false,
            recurrencePattern: undefined,
            recurrenceEndDate: undefined
          };
          // Update the shift with the new data
          updateShift(shift.id, updatedShift, false);
        } else {
          // Regular update for non-recurring shifts
          updateShift(shift.id, { endDate: newEndDate }, false);
        }
        
        // Then create a new shift starting the day after the deleted day
        const newStartDate = format(addDays(deleteDate, 1), 'yyyy-MM-dd');
        
        const newShift: Omit<Shift, 'id'> = {
          providerId: shift.providerId,
          clinicTypeId: shift.clinicTypeId,
          startDate: newStartDate,
          endDate: shift.endDate,
          isVacation: shift.isVacation,
          notes: shift.notes,
          // For the new shift, don't include it in the recurring series
          isRecurring: false,
          recurrencePattern: undefined,
          recurrenceEndDate: undefined,
          seriesId: undefined
        };
        
        console.log(`Creating new shift from: ${newStartDate} to ${shift.endDate}`);
        addShift(newShift);
      }
      
      // Force a refresh after specific day deletion to ensure consistency
      setTimeout(async () => {
        try {
          await forceRefreshShifts();
          console.log('Shifts refreshed successfully after specific day deletion');
        } catch (error) {
          console.error('Error refreshing shifts after specific day deletion:', error);
        }
      }, 500);
    } catch (error) {
      console.error('Error deleting specific day:', error);
    }
    
    closeModal();
  }, [isAuthenticated, modalState.shift, specificDeleteDate, deleteShift, deleteSeries, updateShift, addShift, closeModal, forceRefreshShifts]);

  const handleDelete = useCallback(() => {
    if (!isAuthenticated) {
      closeModal();
      return;
    }
    
    if (modalState.mode === 'edit') {
      if (modalState.shift) {
        // If it's a multi-day shift and we're deleting a specific day
        if (deleteOption === 'specific-day' && 
            modalState.shift.startDate !== modalState.shift.endDate && 
            specificDeleteDate) {
          handleSpecificDayDelete();
        } else {
          // Regular delete for the entire shift
          deleteShift(modalState.shift.id, deleteSeries);
          
          // Force a refresh after deleting to ensure consistency
          setTimeout(() => {
            forceRefreshShifts();
          }, 500);
          
          closeModal();
        }
      } else {
        console.error('Cannot delete shift: No shift data in modal state');
        // Still close the modal to prevent user from being stuck
        closeModal();
      }
    }
  }, [isAuthenticated, modalState, deleteSeries, deleteOption, specificDeleteDate, deleteShift, handleSpecificDayDelete, closeModal, forceRefreshShifts]);

  // Debug render
  console.log('Rendering ShiftModal with formData:', formData);

  // Add an effect that runs when the modal key changes
  useEffect(() => {
    // Reset form initialized flag when the modal key changes
    // This ensures we always get fresh form data
    if (modalState.key) {
      formInitialized.current = false;
    }
  }, [modalState.key]);

  // Helper function to determine if a shift is part of a recurring series
  const isRecurringSeries = useMemo(() => {
    return modalState.mode === 'edit' && modalState.shift?.seriesId && modalState.shift?.isRecurring;
  }, [modalState]);

  return (
    <Dialog open={modalState.isOpen} onClose={closeModal} maxWidth="md" fullWidth>
      <DialogTitle>
        {modalState.mode === 'add' ? 'Add Shift' : 'Edit Shift'}
        {modalState.mode === 'edit' && modalState.shift?.seriesId && (
          <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
            {isMultiDayShift ? 'This is a multi-day shift' : 'This is a single-day shift'}
            {isRecurringSeries ? ' that is part of a recurring pattern' : ''}
          </Typography>
        )}
      </DialogTitle>
      
      <DialogContent>
        {!isAuthenticated && (
          <Alert severity="info" sx={{ mb: 2, mt: 1 }}>
            You need to log in to add or edit shifts. Please log in using the icon in the header.
          </Alert>
        )}
        
        <Box sx={{ mt: 2 }}>
          {/* Section 1: Basic Shift Information */}
          <Typography variant="h6" gutterBottom sx={{ 
            backgroundColor: 'primary.light', 
            color: 'primary.contrastText',
            p: 1,
            borderRadius: 1
          }}>
            Shift Details
          </Typography>
          
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="provider-label">Provider</InputLabel>
                <Select
                  labelId="provider-label"
                  name="providerId"
                  value={formData.providerId || ''}
                  onChange={handleSelectChange}
                  label="Provider"
                  disabled={!isAuthenticated}
                >
                  {activeProviders.map(provider => (
                    <MenuItem key={provider.id} value={provider.id}>
                      {`${provider.firstName} ${provider.lastName}`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="clinic-type-label">Clinic Type</InputLabel>
                <Select
                  labelId="clinic-type-label"
                  name="clinicTypeId"
                  value={formData.clinicTypeId || ''}
                  onChange={handleSelectChange}
                  label="Clinic Type"
                  disabled={!isAuthenticated}
                >
                  {activeClinicTypes.map(clinicType => (
                    <MenuItem key={clinicType.id} value={clinicType.id}>
                      {clinicType.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    name="isVacation"
                    checked={formData.isVacation || false}
                    onChange={handleInputChange}
                    disabled={!isAuthenticated}
                  />
                }
                label="Vacation"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                name="notes"
                label="Notes"
                value={formData.notes || ''}
                onChange={handleInputChange}
                fullWidth
                multiline
                rows={2}
                disabled={!isAuthenticated}
              />
            </Grid>
          </Grid>
          
          {/* Section 2: Shift Duration */}
          <Typography variant="h6" gutterBottom sx={{ 
            backgroundColor: 'secondary.light', 
            color: 'secondary.contrastText',
            p: 1,
            borderRadius: 1
          }}>
            Shift Duration
          </Typography>
          
          <Box sx={{ mb: 1 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              A shift can span a single day or multiple consecutive days
            </Typography>
          </Box>
          
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6}>
              <DatePicker
                label="Start Date"
                value={formData.startDate ? parseISO(formData.startDate) : null}
                onChange={(date) => handleDateChange('startDate', date)}
                slotProps={{ textField: { fullWidth: true, disabled: !isAuthenticated } }}
                disabled={!isAuthenticated}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <DatePicker
                label="End Date"
                value={formData.endDate ? parseISO(formData.endDate) : null}
                onChange={(date) => handleDateChange('endDate', date)}
                slotProps={{ textField: { fullWidth: true, disabled: !isAuthenticated } }}
                disabled={!isAuthenticated}
              />
              {formData.startDate && formData.endDate && formData.startDate !== formData.endDate && (
                <Typography variant="caption" color="primary" sx={{ display: 'block', mt: 0.5 }}>
                  This is a multi-day shift spanning {
                    differenceInDays(
                      parseISO(formData.endDate), 
                      parseISO(formData.startDate)
                    ) + 1
                  } days
                </Typography>
              )}
            </Grid>
          </Grid>
          
          {/* Section 3: Recurrence Pattern */}
          <Typography variant="h6" gutterBottom sx={{ 
            backgroundColor: 'info.light', 
            color: 'info.contrastText',
            p: 1,
            borderRadius: 1
          }}>
            Recurrence Pattern
          </Typography>
          
          <Box sx={{ mb: 1 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              A shift can repeat according to a pattern (weekly, biweekly, etc.)
            </Typography>
          </Box>
          
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    name="isRecurring"
                    checked={formData.isRecurring || false}
                    onChange={handleRecurringToggle}
                    disabled={!isAuthenticated || (modalState.mode === 'edit' && modalState.shift?.seriesId !== undefined)}
                  />
                }
                label="Set as recurring"
              />
              {modalState.mode === 'edit' && modalState.shift?.seriesId && !formData.isRecurring && (
                <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>
                  This shift is part of a recurring pattern but recurrence has been disabled. Saving will remove it from the pattern.
                </Typography>
              )}
              
              {/* Add clarifying message for multi-day recurring shifts */}
              {formData.isRecurring && formData.startDate && formData.endDate && 
               formData.startDate !== formData.endDate && (
                <Alert severity="info" sx={{ mt: 1, mb: 1 }}>
                  <Typography variant="body2">
                    <strong>Note:</strong> This is both a multi-day shift and a recurring shift.
                  </Typography>
                  <Typography variant="body2">
                    • When editing a single instance, it will be removed from the recurring series.
                  </Typography>
                  <Typography variant="body2">
                    • When deleting a specific day, that day will be removed from this instance only.
                  </Typography>
                </Alert>
              )}
            </Grid>
            
            <Collapse in={formData.isRecurring || false} sx={{ width: '100%' }}>
              <Grid container spacing={2} sx={{ mt: 0.5, pl: 2 }}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel id="recurrence-pattern-label">Recurrence Pattern</InputLabel>
                    <Select
                      labelId="recurrence-pattern-label"
                      name="recurrencePattern"
                      value={formData.recurrencePattern || 'weekly'}
                      onChange={handleSelectChange}
                      label="Recurrence Pattern"
                      disabled={!isAuthenticated}
                    >
                      <MenuItem value="daily">Daily</MenuItem>
                      <MenuItem value="weekly">Weekly</MenuItem>
                      <MenuItem value="biweekly">Bi-weekly</MenuItem>
                      <MenuItem value="monthly">Monthly</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <DatePicker
                    label="Recurrence End Date"
                    value={formData.recurrenceEndDate ? parseISO(formData.recurrenceEndDate) : null}
                    onChange={(date) => handleDateChange('recurrenceEndDate', date)}
                    slotProps={{ textField: { fullWidth: true, disabled: !isAuthenticated } }}
                    disabled={!isAuthenticated}
                  />
                </Grid>
              </Grid>
            </Collapse>
          </Grid>
          
          {/* Section 4: Update Options for Edit Mode */}
          {modalState.mode === 'edit' && isRecurringSeries && (
            <>
              <Typography variant="h6" gutterBottom sx={{ 
                backgroundColor: 'warning.light', 
                color: 'warning.contrastText',
                p: 1,
                borderRadius: 1
              }}>
                Update Scope
              </Typography>
              
              <Box sx={{ 
                mt: 2, 
                p: 2, 
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                bgcolor: 'background.paper',
                mb: 3
              }}>
                <Typography variant="subtitle2" gutterBottom>
                  Choose which occurrences to update
                </Typography>
                
                {/* Add clarifying message for multi-day recurring shifts */}
                {isMultiDayShift && (
                  <Alert severity="info" sx={{ mt: 1, mb: 2 }}>
                    <Typography variant="body2">
                      <strong>Note:</strong> When updating a multi-day shift in a recurring series:
                    </Typography>
                    <Typography variant="body2">
                      • "Only this occurrence" will break this instance from the series
                    </Typography>
                    <Typography variant="body2">
                      • "All occurrences" will update the entire recurring pattern
                    </Typography>
                  </Alert>
                )}
                
                <FormControl component="fieldset">
                  <RadioGroup
                    value={updateScope}
                    onChange={(e) => setUpdateScope(e.target.value as 'this' | 'future' | 'all')}
                  >
                    <FormControlLabel 
                      value="this" 
                      control={<Radio />} 
                      label={
                        <Box>
                          <Typography variant="body2">
                            Only this occurrence
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Changes apply only to this specific shift
                          </Typography>
                        </Box>
                      }
                    />
                    <FormControlLabel 
                      value="future" 
                      control={<Radio />} 
                      label={
                        <Box>
                          <Typography variant="body2">
                            This and all future occurrences
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Changes apply to this shift and all future shifts in this pattern
                          </Typography>
                        </Box>
                      }
                      disabled={true} // Future implementation
                    />
                    <FormControlLabel 
                      value="all" 
                      control={<Radio />} 
                      label={
                        <Box>
                          <Typography variant="body2">
                            All occurrences
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Changes apply to all shifts in this recurrence pattern
                          </Typography>
                        </Box>
                      }
                    />
                  </RadioGroup>
                </FormControl>
              </Box>
            </>
          )}
          
          {/* Section 5: Delete Options for Edit Mode */}
          {modalState.mode === 'edit' && (
            <Box sx={{ mb: 2 }}>
              {/* If it's a multi-day shift, show day-specific deletion options */}
              {isMultiDayShift && (
                <Box sx={{ 
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  p: 2,
                  mb: 2,
                  bgcolor: 'background.paper'
                }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Delete Options for Multi-Day Shift
                  </Typography>
                  
                  {/* Add clarifying message for multi-day recurring shifts */}
                  {modalState.shift?.isRecurring && modalState.shift?.seriesId && (
                    <Alert severity="info" sx={{ mt: 1, mb: 2 }}>
                      <Typography variant="body2">
                        <strong>Note:</strong> When deleting a specific day from a recurring shift, 
                        this instance will be removed from the recurring series.
                      </Typography>
                    </Alert>
                  )}
                  
                  <FormControl component="fieldset">
                    <RadioGroup
                      value={deleteOption}
                      onChange={(e) => setDeleteOption(e.target.value as DeleteOptionType)}
                    >
                      <FormControlLabel 
                        value="entire" 
                        control={<Radio size="small" />} 
                        label={
                          <Box>
                            <Typography variant="body2">
                              Delete entire shift ({format(parseISO(modalState.shift?.startDate || ''), 'MMM d, yyyy')} - {format(parseISO(modalState.shift?.endDate || ''), 'MMM d, yyyy')})
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Removes the complete shift span
                            </Typography>
                          </Box>
                        }
                      />
                      <FormControlLabel 
                        value="specific-day" 
                        control={<Radio size="small" />} 
                        label={
                          <Box>
                            <Typography variant="body2">
                              Delete only a specific day
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Removes a single day from this shift span
                            </Typography>
                          </Box>
                        }
                      />
                    </RadioGroup>
                  </FormControl>
                  
                  {deleteOption === 'specific-day' && shiftDates.length > 0 && (
                    <FormControl fullWidth sx={{ mt: 1 }}>
                      <InputLabel id="specific-day-label">Select Day to Remove</InputLabel>
                      <Select
                        labelId="specific-day-label"
                        value={specificDeleteDate || shiftDates[0].date}
                        onChange={(e) => setSpecificDeleteDate(e.target.value)}
                        label="Select Day to Remove"
                        size="small"
                      >
                        {shiftDates.map(date => (
                          <MenuItem key={date.date} value={date.date}>
                            {date.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                </Box>
              )}
              
              {/* If it's a recurring series, show series deletion options */}
              {isRecurringSeries && (
                <Box sx={{ 
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  p: 2,
                  mb: 2, 
                  bgcolor: 'background.paper'
                }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Delete Options for Recurring Pattern
                  </Typography>
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={deleteSeries}
                        onChange={(e) => isAuthenticated && setDeleteSeries(e.target.checked)}
                        disabled={!isAuthenticated || deleteOption !== 'entire'}
                        color="error"
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body2">
                          Delete all shifts in this recurring pattern
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Removes all related shifts following the same recurrence pattern
                        </Typography>
                      </Box>
                    }
                  />
                </Box>
              )}
            </Box>
          )}
        </Box>
      </DialogContent>
      
      <DialogActions>
        {modalState.mode === 'edit' && (
          <Button 
            onClick={handleDelete} 
            color="error"
            variant="contained"
            disabled={!isAuthenticated}
            startIcon={<DeleteIcon />}
            sx={{ mr: 'auto' }}
          >
            {deleteOption === 'specific-day' && isMultiDayShift 
              ? 'Delete Selected Day' 
              : deleteSeries 
                ? 'Delete All Recurring Shifts'
                : 'Delete Shift'}
          </Button>
        )}
        
        <Button onClick={closeModal}>Cancel</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained"
          disabled={!isAuthenticated}
        >
          {modalState.mode === 'add' ? 'Add' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ShiftModal; 