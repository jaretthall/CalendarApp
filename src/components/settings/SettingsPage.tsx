import React, { useState } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Container,
  Alert
} from '@mui/material';
import SyncSettings from './SyncSettings';
import ProvidersSettings from './ProvidersSettings';
import ClinicsSettings from './ClinicsSettings';
import AccountSettings from './AccountSettings';
import { useAuth } from '../../contexts/AuthContext';
import { People, LocationOn, Sync, Settings as SettingsIcon } from '@mui/icons-material';

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

const SettingsPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const { isAuthenticated, isReadOnly } = useAuth();

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
            <Tab icon={<SettingsIcon />} label="Account" {...a11yProps(4)} disabled={!isAuthenticated || isReadOnly} />
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