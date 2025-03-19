import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import Header from './components/shared/Header';
import Sidebar from './components/shared/Sidebar';
import MonthView from './components/calendar/MonthView';
import ThreeMonthView from './components/calendar/ThreeMonthView';
import ProviderForm from './components/providers/ProviderForm';
import ShiftModal from './components/calendar/ShiftModal';
import LoginPage from './components/auth/LoginPage';
import SettingsPage from './components/settings/SettingsPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { ShiftProvider } from './contexts/ShiftContext';
import { ProviderProvider } from './contexts/EmployeeContext';
import { ClinicTypeProvider } from './contexts/LocationContext';
import { AuthProvider } from './contexts/AuthContext';
import { SyncProvider } from './contexts/SyncContext';
import { NoteProvider } from './contexts/NoteContext';
import { migrateLocalStorageToFirestore, populateFirestoreWithSampleData } from './utils/dataMigration';
import ClinicTypeForm from './components/clinics/ClinicTypeForm';
import firestoreService from './services/FirestoreService';

const App: React.FC = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [initializing, setInitializing] = useState<boolean>(true);
  const [initializationError, setInitializationError] = useState<string | null>(null);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize Firestore
        await firestoreService.initialize();
        
        // Migrate data from localStorage if needed
        await migrateLocalStorageToFirestore();
        
        // Populate with sample data if empty
        await populateFirestoreWithSampleData();
        
        setInitializing(false);
      } catch (error) {
        console.error('Error initializing app:', error);
        setInitializationError('Failed to initialize the application. Please try again later.');
        setInitializing(false);
      }
    };
    
    initializeApp();
  }, []);

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  if (initializing) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh' 
      }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Initializing application...
        </Typography>
      </Box>
    );
  }

  if (initializationError) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh',
        p: 3,
        textAlign: 'center'
      }}>
        <Typography variant="h5" color="error" gutterBottom>
          Initialization Error
        </Typography>
        <Typography variant="body1">
          {initializationError}
        </Typography>
      </Box>
    );
  }

  return (
    <AuthProvider>
      <SyncProvider>
        <ProviderProvider>
          <ClinicTypeProvider>
            <ShiftProvider>
              <NoteProvider>
                <Routes>
                  <Route path="/login" element={<LoginPage />} />
                  
                  {/* Public route for MonthView */}
                  <Route
                    path="/"
                    element={
                      <Box className="app-container">
                        <Header toggleDrawer={toggleDrawer} />
                        <Box sx={{ display: 'flex' }}>
                          <Sidebar open={drawerOpen} onClose={toggleDrawer} />
                          <Box component="main" className="content-container">
                            <MonthView />
                            <ShiftModal />
                          </Box>
                        </Box>
                      </Box>
                    }
                  />
                  
                  {/* Settings page - accessible to all but with some features restricted */}
                  <Route
                    path="/settings"
                    element={
                      <Box className="app-container">
                        <Header toggleDrawer={toggleDrawer} />
                        <Box sx={{ display: 'flex' }}>
                          <Sidebar open={drawerOpen} onClose={toggleDrawer} />
                          <Box component="main" className="content-container">
                            <SettingsPage />
                          </Box>
                        </Box>
                      </Box>
                    }
                  />
                  
                  {/* Protected routes */}
                  <Route element={<ProtectedRoute />}>
                    <Route
                      path="/*"
                      element={
                        <Box className="app-container">
                          <Header toggleDrawer={toggleDrawer} />
                          <Box sx={{ display: 'flex' }}>
                            <Sidebar open={drawerOpen} onClose={toggleDrawer} />
                            <Box component="main" className="content-container">
                              <Routes>
                                <Route path="/three-month" element={<ThreeMonthView />} />
                                
                                {/* Admin-only routes */}
                                <Route element={<ProtectedRoute requireAdmin={true} />}>
                                  <Route path="/providers/add" element={<ProviderForm />} />
                                  <Route path="/providers/edit/:id" element={<ProviderForm />} />
                                  <Route path="/clinics/add" element={<ClinicTypeForm />} />
                                  <Route path="/clinics/edit/:id" element={<ClinicTypeForm />} />
                                </Route>
                              </Routes>
                              <ShiftModal />
                            </Box>
                          </Box>
                        </Box>
                      }
                    />
                  </Route>
                </Routes>
              </NoteProvider>
            </ShiftProvider>
          </ClinicTypeProvider>
        </ProviderProvider>
      </SyncProvider>
    </AuthProvider>
  );
};

export default App; 