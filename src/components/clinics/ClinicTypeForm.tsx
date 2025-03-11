import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Grid,
  CircularProgress,
  Alert,
  SelectChangeEvent,
  Tabs,
  Tab,
  InputAdornment
} from '@mui/material';
import { useClinicTypes, ClinicType } from '../../contexts/LocationContext';
import databaseService from '../../services/DatabaseService';

// Sample colors for clinic types
const CLINIC_COLORS = [
  '#4caf50', '#2196f3', '#f44336', '#ff9800', '#9c27b0',
  '#3f51b5', '#e91e63', '#009688', '#673ab7', '#ffc107',
  '#795548', '#607d8b', '#8bc34a', '#00bcd4', '#ffeb3b'
];

interface FormErrors {
  name?: string;
  color?: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = (props) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`color-tabpanel-${index}`}
      aria-labelledby={`color-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const ClinicTypeForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { refreshClinicTypes, getClinicTypeById } = useClinicTypes();
  
  const [formData, setFormData] = useState<Omit<ClinicType, 'id'>>({
    name: '',
    color: CLINIC_COLORS[0],
    status: 'active'
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [colorTabValue, setColorTabValue] = useState(0);
  const [customColor, setCustomColor] = useState('#000000');

  useEffect(() => {
    if (id) {
      const clinicType = getClinicTypeById(id);
      if (clinicType) {
        setFormData({
          name: clinicType.name,
          color: clinicType.color,
          status: clinicType.status
        });
        setCustomColor(clinicType.color);
        setIsEditMode(true);
        
        // If the color is not in the preset colors, switch to custom color tab
        if (!CLINIC_COLORS.includes(clinicType.color)) {
          setColorTabValue(1);
        }
      } else {
        navigate('/clinics');
      }
    }
  }, [id, getClinicTypeById, navigate]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.color) {
      newErrors.color = 'Color is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error when field is edited
    if (errors[name as keyof FormErrors]) {
      setErrors({
        ...errors,
        [name]: undefined
      });
    }
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleColorSelect = (color: string) => {
    setFormData({
      ...formData,
      color
    });
    
    if (errors.color) {
      setErrors({
        ...errors,
        color: undefined
      });
    }
  };

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    setCustomColor(color);
    setFormData({
      ...formData,
      color
    });
    
    if (errors.color) {
      setErrors({
        ...errors,
        color: undefined
      });
    }
  };

  const handleColorTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setColorTabValue(newValue);
    if (newValue === 1) {
      // When switching to custom color tab, update form data with current custom color
      setFormData({
        ...formData,
        color: customColor
      });
    } else if (newValue === 0) {
      // When switching to preset colors tab, update form data with first preset color
      setFormData({
        ...formData,
        color: CLINIC_COLORS[0]
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setSubmitError('');
    
    try {
      if (isEditMode && id) {
        await databaseService.updateClinicType(id, formData);
      } else {
        await databaseService.addClinicType(formData);
      }
      
      // Refresh clinic types in context
      await refreshClinicTypes();
      
      navigate('/clinics');
    } catch (error) {
      setSubmitError('An error occurred while saving the clinic type.');
      console.error('Error saving clinic type:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1">
          {isEditMode ? 'Edit Clinic Type' : 'Add Clinic Type'}
        </Typography>
      </Box>
      
      <Paper sx={{ p: 3 }}>
        {submitError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {submitError}
          </Alert>
        )}
        
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                name="name"
                label="Clinic Name"
                value={formData.name}
                onChange={handleInputChange}
                fullWidth
                required
                error={!!errors.name}
                helperText={errors.name}
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel id="status-label">Status</InputLabel>
                <Select
                  labelId="status-label"
                  name="status"
                  value={formData.status}
                  onChange={handleSelectChange}
                  label="Status"
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Display Color
              </Typography>
              
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={colorTabValue} onChange={handleColorTabChange} aria-label="color selection tabs">
                  <Tab label="Preset Colors" id="color-tab-0" aria-controls="color-tabpanel-0" />
                  <Tab label="Custom Color" id="color-tab-1" aria-controls="color-tabpanel-1" />
                </Tabs>
              </Box>
              
              <TabPanel value={colorTabValue} index={0}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                  {CLINIC_COLORS.map((color) => (
                    <Box
                      key={color}
                      onClick={() => handleColorSelect(color)}
                      sx={{
                        width: 40,
                        height: 40,
                        backgroundColor: color,
                        borderRadius: '50%',
                        cursor: 'pointer',
                        border: formData.color === color ? '3px solid #000' : '1px solid #ccc',
                        '&:hover': {
                          opacity: 0.8,
                        },
                      }}
                    />
                  ))}
                </Box>
              </TabPanel>
              
              <TabPanel value={colorTabValue} index={1}>
                <TextField
                  type="color"
                  value={customColor}
                  onChange={handleCustomColorChange}
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Box
                          sx={{
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            backgroundColor: customColor,
                            mr: 1
                          }}
                        />
                      </InputAdornment>
                    ),
                  }}
                />
              </TabPanel>
              
              {errors.color && (
                <FormHelperText error>{errors.color}</FormHelperText>
              )}
            </Grid>
            
            <Grid item xs={12} sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/clinics')}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : null}
                >
                  {isEditMode ? 'Save Changes' : 'Add Clinic Type'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default ClinicTypeForm; 