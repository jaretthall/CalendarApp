import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  Radio,
  Paper
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { format, parseISO } from 'date-fns';
import { useShifts, Shift } from '../../contexts/ShiftContext';
import { useProviders } from '../../contexts/EmployeeContext';
import { useClinicTypes } from '../../contexts/LocationContext';
import { useAuth } from '../../contexts/AuthContext';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import InfoIcon from '@mui/icons-material/Info';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import EventRepeatIcon from '@mui/icons-material/EventRepeat';
import DateRangeIcon from '@mui/icons-material/DateRange';

// Define the recurrence pattern type to match the Shift interface
type RecurrencePattern = 'daily' | 'weekly' | 'biweekly' | 'monthly';

// Define the delete option type
type DeleteOptionType = 'entire' | 'specific-day';

// Define the edit mode type
type EditModeType = 'view' | 'edit';

// Define the edit scope type
type EditScopeType = 'this' | 'multiday' | 'series';

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
  
  // State for delete options
  const [deleteSeries, setDeleteSeries] = useState(false);
  const [deleteOption, setDeleteOption] = useState<DeleteOptionType>('entire');
  const [specificDeleteDate, setSpecificDeleteDate] = useState<string | null>(null);
  
  // State for edit mode and scope
  const [editMode, setEditMode] = useState<EditModeType>('view');
  const [editScope, setEditScope] = useState<EditScopeType>('this');
  
  // Effect to initialize form data when the modal opens
  useEffect(() => {
    if (modalState.isOpen && modalState.mode === 'edit' && modalState.shift && !formInitialized.current) {
      setFormData({
        ...modalState.shift
      });
      
      // If it's a multi-day shift, set the specific delete date to the first day by default
      if (modalState.shift.startDate !== modalState.shift.endDate) {
        setSpecificDeleteDate(modalState.shift.startDate);
      }
      
      // Reset edit mode to view when opening an existing shift
      setEditMode('view');
      
      formInitialized.current = true;
    } else if (modalState.isOpen && modalState.mode === 'add' && !formInitialized.current) {
      // For add mode, initialize with the selected date
      const initialDate = modalState.date || format(new Date(), 'yyyy-MM-dd');
      
      setFormData({
        providerId: activeProviders.length > 0 ? activeProviders[0].id : '',
        clinicTypeId: activeClinicTypes.length > 0 ? activeClinicTypes[0].id : '',
        startDate: initialDate,
        endDate: initialDate,
        isVacation: false,
        notes: '',
        isRecurring: false,
        recurrencePattern: 'weekly' as RecurrencePattern,
        recurrenceEndDate: ''
      });
      
      // For add mode, start in edit mode
      setEditMode('edit');
      
      formInitialized.current = true;
    }
  }, [modalState, activeProviders, activeClinicTypes]);
  
  // Reset form initialized flag when the modal closes
  useEffect(() => {
    if (!modalState.isOpen) {
      formInitialized.current = false;
      setDeleteSeries(false);
      setDeleteOption('entire');
      setSpecificDeleteDate(null);
      setEditMode('view');
      setEditScope('this');
    }
  }, [modalState.isOpen]);

  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Handle select field changes
  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handle date picker changes
  const handleDateChange = (name: string, date: Date | null) => {
    if (date) {
      const dateStr = format(date, 'yyyy-MM-dd');
      
      // If changing start date and it's after end date, update end date too
      if (name === 'startDate' && formData.endDate && dateStr > formData.endDate) {
        setFormData({
          ...formData,
          [name]: dateStr,
          endDate: dateStr
        });
      } else {
        setFormData({
          ...formData,
          [name]: dateStr
        });
      }
    }
  };

  // Handle specific delete date change
  const handleSpecificDeleteDateChange = (date: Date | null) => {
    if (date) {
      setSpecificDeleteDate(format(date, 'yyyy-MM-dd'));
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!isAuthenticated) return;
    
    try {
      if (modalState.mode === 'add') {
        // Add new shift
        await addShift(formData as Omit<Shift, 'id'>);
      } else if (modalState.mode === 'edit' && modalState.shift) {
        // Update existing shift
        const updateSeries = editScope === 'series' || (editScope === 'multiday' && modalState.shift.isRecurring);
        await updateShift(modalState.shift.id, formData, updateSeries);
      }
      
      // Close modal and refresh shifts
      closeModal();
      await forceRefreshShifts();
    } catch (error) {
      console.error('Error submitting shift:', error);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!isAuthenticated || !modalState.shift) return;
    
    try {
      // Determine if we're deleting a series
      const shouldDeleteSeries = editScope === 'series';
      
      // If deleting a specific day from a multi-day shift
      if (deleteOption === 'specific-day' && specificDeleteDate && editScope === 'multiday') {
        // Logic for deleting a specific day would go here
        // This would require backend support for splitting shifts
        console.log('Deleting specific day:', specificDeleteDate);
        
        // For now, just delete the entire shift as a placeholder
        await deleteShift(modalState.shift.id, shouldDeleteSeries);
      } else {
        // Delete the entire shift or series
        await deleteShift(modalState.shift.id, shouldDeleteSeries);
      }
      
      // Close modal and refresh shifts
      closeModal();
      await forceRefreshShifts();
    } catch (error) {
      console.error('Error deleting shift:', error);
    }
  };

  // Handle edit button click
  const handleEditClick = () => {
    setEditMode('edit');
  };

  // Calculate if this is a multi-day shift
  const isMultiDayShift = useMemo(() => {
    if (!modalState.shift) return false;
    return modalState.shift.startDate !== modalState.shift.endDate;
  }, [modalState.shift]);

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

  // Get provider and clinic type names for display
  const providerName = useMemo(() => {
    if (!formData.providerId) return '';
    const provider = activeProviders.find(p => p.id === formData.providerId);
    return provider ? `${provider.firstName} ${provider.lastName}` : '';
  }, [formData.providerId, activeProviders]);

  const clinicTypeName = useMemo(() => {
    if (!formData.clinicTypeId) return '';
    const clinicType = activeClinicTypes.find(c => c.id === formData.clinicTypeId);
    return clinicType ? clinicType.name : '';
  }, [formData.clinicTypeId, activeClinicTypes]);

  return (
    <Dialog open={modalState.isOpen} onClose={closeModal} maxWidth="md" fullWidth>
      <DialogTitle>
        {modalState.mode === 'add' ? 'Add Shift' : (editMode === 'view' ? 'Shift Details' : 'Edit Shift')}
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
        
        {/* View Mode */}
        {editMode === 'view' && modalState.mode === 'edit' && (
          <Box sx={{ mt: 2 }}>
            <Paper elevation={0} variant="outlined" sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                {providerName}
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <DateRangeIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary">Date</Typography>
                      <Typography variant="body1">
                        {isMultiDayShift 
                          ? `${formData.startDate ? format(parseISO(formData.startDate), 'MMM d, yyyy') : 'N/A'} - ${formData.endDate ? format(parseISO(formData.endDate), 'MMM d, yyyy') : 'N/A'}`
                          : formData.startDate ? format(parseISO(formData.startDate), 'MMM d, yyyy') : 'N/A'}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <LocationOnIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary">Location</Typography>
                      <Typography variant="body1">{clinicTypeName}</Typography>
                    </Box>
                  </Box>
                </Grid>
                
                {isRecurringSeries && (
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <EventRepeatIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">Recurring Pattern</Typography>
                        <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                          {formData.recurrencePattern} 
                          {formData.recurrenceEndDate && formData.recurrenceEndDate.trim() ? 
                            ` until ${format(parseISO(formData.recurrenceEndDate), 'MMM d, yyyy')}` : 
                            ''}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                )}
                
                {formData.notes && (
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                      <InfoIcon sx={{ mr: 1, mt: 0.5, color: 'primary.main' }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">Notes</Typography>
                        <Typography variant="body1">{formData.notes}</Typography>
                      </Box>
                    </Box>
                  </Grid>
                )}
                
                {formData.isVacation && (
                  <Grid item xs={12}>
                    <Alert severity="info" icon={false}>
                      <Typography variant="body2">
                        This is marked as vacation time
                      </Typography>
                    </Alert>
                  </Grid>
                )}
              </Grid>
            </Paper>
            
            {/* Edit Options Button */}
            <Button 
              variant="contained" 
              color="primary" 
              fullWidth 
              startIcon={<EditIcon />}
              onClick={handleEditClick}
              disabled={!isAuthenticated}
            >
              Edit This Shift
            </Button>
          </Box>
        )}
        
        {/* Edit Mode */}
        {editMode === 'edit' && (
          <Box sx={{ mt: 2 }}>
            {/* Edit Scope Selection - Only show for existing shifts */}
            {modalState.mode === 'edit' && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ 
                  backgroundColor: 'primary.light', 
                  color: 'primary.contrastText',
                  p: 1,
                  borderRadius: 1
                }}>
                  What would you like to edit?
                </Typography>
                
                <RadioGroup
                  value={editScope}
                  onChange={(e) => setEditScope(e.target.value as EditScopeType)}
                >
                  <FormControlLabel 
                    value="this" 
                    control={<Radio />} 
                    label={
                      <Box>
                        <Typography variant="body1">
                          Only this occurrence ({modalState.shift?.startDate ? format(parseISO(modalState.shift.startDate), 'MMM d, yyyy') : 'N/A'})
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Changes will only affect this specific shift
                        </Typography>
                      </Box>
                    }
                  />
                  
                  {isMultiDayShift && (
                    <FormControlLabel 
                      value="multiday" 
                      control={<Radio />} 
                      label={
                        <Box>
                          <Typography variant="body1">
                            This multi-day shift ({modalState.shift?.startDate ? format(parseISO(modalState.shift.startDate), 'MMM d, yyyy') : 'N/A'} - {modalState.shift?.endDate ? format(parseISO(modalState.shift.endDate), 'MMM d, yyyy') : 'N/A'})
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Changes will affect all days in this multi-day shift
                          </Typography>
                        </Box>
                      }
                    />
                  )}
                  
                  {isRecurringSeries && (
                    <FormControlLabel 
                      value="series" 
                      control={<Radio />} 
                      label={
                        <Box>
                          <Typography variant="body2">
                            All recurring shifts in this series
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Changes will affect all shifts in this recurring pattern
                          </Typography>
                        </Box>
                      }
                    />
                  )}
                </RadioGroup>
              </Box>
            )}
            
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
                  <InputLabel id="clinic-type-label">Location</InputLabel>
                  <Select
                    labelId="clinic-type-label"
                    name="clinicTypeId"
                    value={formData.clinicTypeId || ''}
                    onChange={handleSelectChange}
                    label="Location"
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
                  value={formData.startDate && formData.startDate.trim() ? parseISO(formData.startDate) : null}
                  onChange={(newValue) => handleDateChange('startDate', newValue)}
                  slotProps={{ textField: { fullWidth: true } }}
                  disabled={Boolean(!isAuthenticated || (editMode === 'edit' && editScope === 'series' && isRecurringSeries))}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="End Date"
                  value={formData.endDate && formData.endDate.trim() ? parseISO(formData.endDate) : null}
                  onChange={(newValue) => handleDateChange('endDate', newValue)}
                  slotProps={{ textField: { fullWidth: true } }}
                  disabled={Boolean(!isAuthenticated || (editMode === 'edit' && editScope === 'series' && isRecurringSeries))}
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      name="isVacation"
                      checked={formData.isVacation || false}
                      onChange={handleChange}
                      disabled={!isAuthenticated}
                    />
                  }
                  label="Mark as vacation"
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  name="notes"
                  label="Notes"
                  value={formData.notes || ''}
                  onChange={handleChange}
                  fullWidth
                  multiline
                  rows={2}
                  disabled={!isAuthenticated}
                />
              </Grid>
            </Grid>
            
            {/* Section 2: Recurrence Options */}
            <Typography variant="h6" gutterBottom sx={{ 
              backgroundColor: 'primary.light', 
              color: 'primary.contrastText',
              p: 1,
              borderRadius: 1
            }}>
              Recurrence
            </Typography>
            
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      name="isRecurring"
                      checked={formData.isRecurring || false}
                      onChange={handleChange}
                      disabled={!isAuthenticated || (modalState.mode === 'edit' && editScope !== 'series')}
                    />
                  }
                  label="Recurring shift"
                />
              </Grid>
              
              <Grid item xs={12}>
                <Collapse in={formData.isRecurring || false}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel id="recurrence-pattern-label">Recurrence Pattern</InputLabel>
                        <Select
                          labelId="recurrence-pattern-label"
                          name="recurrencePattern"
                          value={formData.recurrencePattern || 'weekly'}
                          onChange={handleSelectChange}
                          label="Recurrence Pattern"
                          disabled={!isAuthenticated || (modalState.mode === 'edit' && editScope !== 'series')}
                        >
                          <MenuItem value="daily">Daily</MenuItem>
                          <MenuItem value="weekly">Weekly</MenuItem>
                          <MenuItem value="biweekly">Biweekly</MenuItem>
                          <MenuItem value="monthly">Monthly</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <DatePicker
                        label="Series End Date"
                        value={formData.recurrenceEndDate && formData.recurrenceEndDate.trim() ? parseISO(formData.recurrenceEndDate) : null}
                        onChange={(newValue) => handleDateChange('recurrenceEndDate', newValue)}
                        slotProps={{ textField: { fullWidth: true } }}
                        disabled={Boolean(!isAuthenticated || !formData.isRecurring)}
                      />
                    </Grid>
                  </Grid>
                </Collapse>
              </Grid>
            </Grid>
            
            {/* Delete Options - Only show for existing shifts */}
            {modalState.mode === 'edit' && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ 
                  backgroundColor: 'error.light', 
                  color: 'error.contrastText',
                  p: 1,
                  borderRadius: 1
                }}>
                  Delete Options
                </Typography>
                
                {/* If it's a multi-day shift, show day-specific deletion options */}
                {isMultiDayShift && editScope === 'multiday' && (
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
                                Delete entire shift ({modalState.shift?.startDate ? format(parseISO(modalState.shift.startDate), 'MMM d, yyyy') : 'N/A'} - {modalState.shift?.endDate ? format(parseISO(modalState.shift.endDate), 'MMM d, yyyy') : 'N/A'})
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
                    
                    <Collapse in={deleteOption === 'specific-day'}>
                      <Box sx={{ mt: 2 }}>
                        <DatePicker 
                          label="Select Date to Delete"
                          value={specificDeleteDate ? (specificDeleteDate.trim() ? parseISO(specificDeleteDate) : null) : null}
                          onChange={handleSpecificDeleteDateChange}
                          minDate={modalState.shift?.startDate ? parseISO(modalState.shift.startDate) : undefined}
                          maxDate={modalState.shift?.endDate ? parseISO(modalState.shift.endDate) : undefined}
                          disabled={Boolean(deleteOption !== 'specific-day')}
                        />
                      </Box>
                    </Collapse>
                  </Box>
                )}
                
                {/* Series deletion options */}
                {isRecurringSeries && editScope === 'series' && (
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
                          disabled={!isAuthenticated}
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
        )}
      </DialogContent>
      
      <DialogActions>
        {modalState.mode === 'edit' && editMode === 'edit' && (
          <Button 
            onClick={handleDelete} 
            color="error"
            variant="contained"
            disabled={!isAuthenticated}
            startIcon={<DeleteIcon />}
            sx={{ mr: 'auto' }}
          >
            {editScope === 'this' 
              ? 'Delete This Occurrence' 
              : editScope === 'multiday' 
                ? (deleteOption === 'specific-day' ? 'Delete Selected Day' : 'Delete Multi-Day Shift')
                : (deleteSeries ? 'Delete All Recurring Shifts' : 'Delete This Series')}
          </Button>
        )}
        
        <Button onClick={closeModal}>Cancel</Button>
        
        {editMode === 'edit' && (
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={!isAuthenticated}
          >
            {modalState.mode === 'add' ? 'Add' : 'Save Changes'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ShiftModal; 