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
  Divider,
  SelectChangeEvent,
  Grid,
  Collapse,
  Alert,
  RadioGroup,
  Radio
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { format, parseISO, addMonths, addDays } from 'date-fns';
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
  const { modalState, closeModal, addShift, updateShift, deleteShift } = useShifts();
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
  
  const [updateSeries, setUpdateSeries] = useState(false);
  const [deleteSeries, setDeleteSeries] = useState(false);
  const [deleteOption, setDeleteOption] = useState<DeleteOptionType>('entire');
  const [specificDeleteDate, setSpecificDeleteDate] = useState<string | null>(null);

  // Reset form when modal opens/closes
  useEffect(() => {
    console.log('Modal state changed:', modalState);
    
    if (modalState.isOpen && !formInitialized.current) {
      if (modalState.mode === 'add' && modalState.date) {
        // Set default end date to same as start date
        const startDate = new Date(modalState.date);
        const recurrenceEndDate = addMonths(startDate, 3);
        
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
        setUpdateSeries(false);
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
        setUpdateSeries(false);
        setDeleteSeries(false);
        formInitialized.current = true;
      }
    } else if (!modalState.isOpen) {
      // Reset the initialization flag when modal closes
      formInitialized.current = false;
    }
  }, [modalState, activeProviders, activeClinicTypes]);

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
    }

    try {
      if (modalState.mode === 'add') {
        addShift(shiftToSubmit);
      } else if (modalState.mode === 'edit' && modalState.shift) {
        updateShift(modalState.shift.id, shiftToSubmit, updateSeries);
      } else {
        console.error('Cannot update shift: No shift data in modal state');
      }
    } catch (error) {
      console.error('Error saving shift:', error);
    }

    closeModal();
  }, [formData, modalState, isAuthenticated, updateSeries, addShift, updateShift, closeModal]);

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

      // If deleting the first day
      if (format(startDate, 'yyyy-MM-dd') === specificDeleteDate) {
        // Update the start date to the day after
        const newStartDate = format(addDays(deleteDate, 1), 'yyyy-MM-dd');
        console.log(`Updating shift start date to: ${newStartDate}`);
        updateShift(shift.id, { startDate: newStartDate }, false);
      } 
      // If deleting the last day
      else if (format(endDate, 'yyyy-MM-dd') === specificDeleteDate) {
        // Update the end date to the day before
        const newEndDate = format(addDays(deleteDate, -1), 'yyyy-MM-dd');
        console.log(`Updating shift end date to: ${newEndDate}`);
        updateShift(shift.id, { endDate: newEndDate }, false);
      } 
      // If deleting a day in the middle, we need to split the shift into two
      else {
        // First, update the current shift to end the day before the deleted day
        const newEndDate = format(addDays(deleteDate, -1), 'yyyy-MM-dd');
        console.log(`Updating first part end date to: ${newEndDate}`);
        updateShift(shift.id, { endDate: newEndDate }, false);
        
        // Then create a new shift starting the day after the deleted day
        const newStartDate = format(addDays(deleteDate, 1), 'yyyy-MM-dd');
        
        const newShift: Omit<Shift, 'id'> = {
          providerId: shift.providerId,
          clinicTypeId: shift.clinicTypeId,
          startDate: newStartDate,
          endDate: shift.endDate,
          isVacation: shift.isVacation,
          notes: shift.notes,
          isRecurring: shift.isRecurring,
          recurrencePattern: shift.recurrencePattern,
          recurrenceEndDate: shift.recurrenceEndDate,
          seriesId: shift.seriesId
        };
        
        console.log(`Creating new shift from: ${newStartDate} to ${shift.endDate}`);
        addShift(newShift);
      }
    } catch (error) {
      console.error('Error deleting specific day:', error);
    }
    
    closeModal();
  }, [isAuthenticated, modalState.shift, specificDeleteDate, deleteShift, deleteSeries, updateShift, addShift, closeModal]);

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
          closeModal();
        }
      } else {
        console.error('Cannot delete shift: No shift data in modal state');
        // Still close the modal to prevent user from being stuck
        closeModal();
      }
    }
  }, [isAuthenticated, modalState, deleteSeries, deleteOption, specificDeleteDate, deleteShift, handleSpecificDayDelete, closeModal]);

  // Debug render
  console.log('Rendering ShiftModal with formData:', formData);

  return (
    <Dialog open={modalState.isOpen} onClose={closeModal} maxWidth="sm" fullWidth>
      <DialogTitle>
        {modalState.mode === 'add' ? 'Add Shift' : 'Edit Shift'}
        {modalState.mode === 'edit' && modalState.shift?.seriesId && (
          <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
            This shift is part of a recurring series
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
          <Grid container spacing={2}>
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
            
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1">Recurring Shift</Typography>
            </Grid>
            
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
                label="Recurring"
              />
              {modalState.mode === 'edit' && modalState.shift?.seriesId && !formData.isRecurring && (
                <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>
                  This shift is part of a series but recurrence has been disabled. Saving will remove it from the series.
                </Typography>
              )}
            </Grid>
            
            <Collapse in={formData.isRecurring || false}>
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
            
            {modalState.mode === 'edit' && modalState.shift?.seriesId && (
              <Grid item xs={12}>
                <Box sx={{ 
                  mt: 2, 
                  p: 2, 
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  bgcolor: 'background.paper'
                }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Series Options
                  </Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={updateSeries}
                        onChange={(e) => isAuthenticated && setUpdateSeries(e.target.checked)}
                        disabled={!isAuthenticated}
                        color="primary"
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body2">
                          Update all shifts in this series
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Apply these changes to all recurring instances
                        </Typography>
                      </Box>
                    }
                  />
                </Box>
              </Grid>
            )}
          </Grid>
        </Box>
      </DialogContent>
      
      <DialogActions>
        {modalState.mode === 'edit' && (
          <>
            <Box sx={{ mr: 2 }}>
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
                    Delete Options
                  </Typography>
                  
                  <FormControl component="fieldset">
                    <RadioGroup
                      value={deleteOption}
                      onChange={(e) => setDeleteOption(e.target.value as DeleteOptionType)}
                    >
                      <FormControlLabel 
                        value="entire" 
                        control={<Radio size="small" />} 
                        label="Delete entire shift" 
                      />
                      <FormControlLabel 
                        value="specific-day" 
                        control={<Radio size="small" />} 
                        label="Delete specific day" 
                      />
                    </RadioGroup>
                  </FormControl>
                  
                  {deleteOption === 'specific-day' && shiftDates.length > 0 && (
                    <FormControl fullWidth sx={{ mt: 1 }}>
                      <InputLabel id="specific-day-label">Select Day</InputLabel>
                      <Select
                        labelId="specific-day-label"
                        value={specificDeleteDate || shiftDates[0].date}
                        onChange={(e) => setSpecificDeleteDate(e.target.value)}
                        label="Select Day"
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
              
              <Button 
                onClick={handleDelete} 
                color="error"
                variant="contained"
                disabled={!isAuthenticated}
                startIcon={<DeleteIcon />}
              >
                {deleteOption === 'specific-day' && isMultiDayShift 
                  ? 'Delete Selected Day' 
                  : 'Delete Shift'}
              </Button>
            </Box>
            
            {modalState.shift?.seriesId && deleteOption === 'entire' && (
              <FormControlLabel
                control={
                  <Switch
                    checked={deleteSeries}
                    onChange={(e) => isAuthenticated && setDeleteSeries(e.target.checked)}
                    disabled={!isAuthenticated || deleteOption !== 'entire'}
                    color="error"
                    size="small"
                  />
                }
                label="Delete all in series"
              />
            )}
          </>
        )}
        
        <Box sx={{ flexGrow: 1 }} />
        
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