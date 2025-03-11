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
import { useProviders, Provider } from '../../contexts/EmployeeContext';

// Sample colors for providers
const PROVIDER_COLORS = [
  '#4caf50', '#2196f3', '#f44336', '#ff9800', '#9c27b0',
  '#3f51b5', '#e91e63', '#009688', '#673ab7', '#ffc107',
  '#795548', '#607d8b', '#8bc34a', '#00bcd4', '#ffeb3b'
];

interface FormErrors {
  firstName?: string;
  lastName?: string;
  color?: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
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
        <Box sx={{ p: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const ProviderForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addProvider, updateProvider, getProviderById } = useProviders();
  
  const [formData, setFormData] = useState<Omit<Provider, 'id'>>({
    firstName: '',
    lastName: '',
    color: PROVIDER_COLORS[0],
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
      const provider = getProviderById(id);
      if (provider) {
        setFormData({
          firstName: provider.firstName,
          lastName: provider.lastName,
          color: provider.color,
          status: provider.status
        });
        setCustomColor(provider.color);
        setIsEditMode(true);
        
        // If the color is not in the preset colors, switch to custom color tab
        if (!PROVIDER_COLORS.includes(provider.color)) {
          setColorTabValue(1);
        }
      } else {
        navigate('/providers');
      }
    }
  }, [id, getProviderById, navigate]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
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
        color: PROVIDER_COLORS[0]
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
        updateProvider(id, formData);
      } else {
        addProvider(formData);
      }
      
      navigate('/providers');
    } catch (error) {
      setSubmitError('An error occurred while saving the provider.');
      console.error('Error saving provider:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1">
          {isEditMode ? 'Edit Provider' : 'Add Provider'}
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
            <Grid item xs={12} sm={6}>
              <TextField
                name="firstName"
                label="First Name"
                value={formData.firstName}
                onChange={handleInputChange}
                fullWidth
                required
                error={!!errors.firstName}
                helperText={errors.firstName}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                name="lastName"
                label="Last Name"
                value={formData.lastName}
                onChange={handleInputChange}
                fullWidth
                required
                error={!!errors.lastName}
                helperText={errors.lastName}
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
                  {PROVIDER_COLORS.map((color) => (
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
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <TextField
                      label="Custom Color"
                      value={customColor}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Box
                              sx={{
                                width: 24,
                                height: 24,
                                backgroundColor: customColor,
                                borderRadius: '4px',
                                border: '1px solid #ccc'
                              }}
                            />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <input
                              type="color"
                              value={customColor}
                              onChange={handleCustomColorChange}
                              aria-label="Select custom color"
                              title="Select custom color"
                              style={{ width: '30px', height: '30px' }}
                            />
                          </InputAdornment>
                        )
                      }}
                      onChange={(e) => {
                        setCustomColor(e.target.value);
                        setFormData({
                          ...formData,
                          color: e.target.value
                        });
                      }}
                      fullWidth
                    />
                  </Box>
                </Box>
              </TabPanel>
              
              {errors.color && (
                <FormHelperText error>{errors.color}</FormHelperText>
              )}
            </Grid>
            
            <Grid item xs={12} sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/providers')}
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
                  {isEditMode ? 'Save Changes' : 'Add Provider'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default ProviderForm; 