import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Container,
  Alert
} from '@mui/material';
import { useLocation } from 'react-router-dom';
import SyncSettings from './SyncSettings';
import ProvidersSettings from './ProvidersSettings';
import ClinicsSettings from './ClinicsSettings';
import AccountSettings from './AccountSettings';
import ShiftPatternReport from './ShiftPatternReport';
import { useAuth } from '../../contexts/AuthContext';
import { People, LocationOn, Sync, Settings as SettingsIcon, Assessment } from '@mui/icons-material';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const a11yProps = (index: number) => {
  return {
    id: `settings-tab-${index}`,
    'aria-controls': `settings-tabpanel-${index}`,
  };
};

// Function to get the tab index from the URL
const getTabFromUrl = (search: string): number => {
  const params = new URLSearchParams(search);
  const tabParam = params.get('tab');
  
  // Map the tab name to index
  switch (tabParam) {
    case 'sync':
      return 0;
    case 'providers':
      return 1;
    case 'clinics':
      return 2;
    case 'display':
      return 3;
    case 'reports':
      return 4;
    case 'account':
      return 5;
    default:
      return 0;
  }
};

const SettingsPage: React.FC = () => {
  const location = useLocation();
  const initialTab = getTabFromUrl(location.search);
  const [tabValue, setTabValue] = useState(initialTab);
  const { isAuthenticated, isReadOnly } = useAuth();
  
  // Update the tab when the URL changes
  useEffect(() => {
    setTabValue(getTabFromUrl(location.search));
  }, [location.search]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ width: '100%', mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Settings
        </Typography>
        
        <Paper sx={{ width: '100%', mt: 3 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="settings tabs"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab icon={<Sync />} label="Synchronization" {...a11yProps(0)} />
            <Tab icon={<People />} label="Providers" {...a11yProps(1)} />
            <Tab icon={<LocationOn />} label="Clinic Types" {...a11yProps(2)} />
            <Tab icon={<SettingsIcon />} label="Display" {...a11yProps(3)} />
            <Tab icon={<Assessment />} label="Reports" {...a11yProps(4)} />
            <Tab icon={<SettingsIcon />} label="Account" {...a11yProps(5)} disabled={!isAuthenticated || isReadOnly} />
          </Tabs>
          
          <TabPanel value={tabValue} index={0}>
            <SyncSettings />
          </TabPanel>
          
          <TabPanel value={tabValue} index={1}>
            <ProvidersSettings />
          </TabPanel>
          
          <TabPanel value={tabValue} index={2}>
            <ClinicsSettings />
          </TabPanel>
          
          <TabPanel value={tabValue} index={3}>
            <Typography variant="h6">Display Settings</Typography>
            <Typography variant="body1" sx={{ mt: 2 }}>
              Display settings will be implemented in a future update.
            </Typography>
          </TabPanel>
          
          <TabPanel value={tabValue} index={4}>
            <Typography variant="h6">Reports</Typography>
            <Typography variant="body1" sx={{ mt: 2, mb: 3 }}>
              Generate and download reports to analyze scheduling patterns.
            </Typography>
            <ShiftPatternReport />
          </TabPanel>
          
          <TabPanel value={tabValue} index={5}>
            {isReadOnly ? (
              <Alert severity="info">
                Please log in with full access to manage account settings.
              </Alert>
            ) : (
              <AccountSettings />
            )}
          </TabPanel>
        </Paper>
      </Box>
    </Container>
  );
};

export default SettingsPage; 