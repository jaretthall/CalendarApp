import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Switch,
  FormControlLabel,
  Button,
  Divider,
  Alert,
  Snackbar,
  CircularProgress,
  Card,
  CardContent,
  Grid,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import {
  CloudDownload,
  Sync as SyncIcon,
  Backup as BackupIcon,
  Restore as RestoreIcon
} from '@mui/icons-material';
import { useSync } from '../../contexts/SyncContext';
import { useAuth } from '../../contexts/AuthContext';

const SyncSettings: React.FC = () => {
  const { 
    syncStatus, 
    lastSyncTime, 
    syncNow, 
    toggleAutoSync, 
    isAutoSyncEnabled,
    exportData,
    importData,
    createBackup,
    getAvailableBackups
  } = useSync();
  
  const { isAuthenticated } = useAuth();
  
  const [backups, setBackups] = useState<{ name: string, lastModified: string, size: number }[]>([]);
  const [isLoadingBackups, setIsLoadingBackups] = useState(false);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [backupSuccess, setBackupSuccess] = useState(false);
  
  // Load available backups
  useEffect(() => {
    const loadBackups = async () => {
      if (isAuthenticated) {
        setIsLoadingBackups(true);
        try {
          const backupFiles = await getAvailableBackups();
          setBackups(backupFiles);
        } catch (error) {
          console.error('Error loading backups:', error);
        } finally {
          setIsLoadingBackups(false);
        }
      }
    };
    
    loadBackups();
  }, [isAuthenticated, getAvailableBackups]);
  
  const handleExport = async () => {
    try {
      setIsExporting(true);
      await exportData();
      setExportSuccess(true);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };
  
  const handleCreateBackup = async () => {
    try {
      setIsCreatingBackup(true);
      await createBackup();
      
      // Refresh the backups list
      const backupFiles = await getAvailableBackups();
      setBackups(backupFiles);
      
      setBackupSuccess(true);
    } catch (error) {
      console.error('Backup creation failed:', error);
    } finally {
      setIsCreatingBackup(false);
    }
  };
  
  const handleImport = async (fileName: string) => {
    setIsImporting(true);
    setImportError(null);
    
    try {
      const success = await importData(fileName);
      
      if (success) {
        setImportSuccess(true);
      } else {
        setImportError('Import failed. Please try again.');
      }
    } catch (error) {
      console.error('Import error:', error);
      setImportError('Import failed. Please try again.');
    } finally {
      setIsImporting(false);
    }
  };
  
  const handleCloseSnackbar = () => {
    setImportSuccess(false);
    setExportSuccess(false);
    setBackupSuccess(false);
  };
  
  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };
  
  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Sync Settings
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Database Synchronization
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body1">
                  Status: {syncStatus.charAt(0).toUpperCase() + syncStatus.slice(1)}
                </Typography>
                {lastSyncTime && (
                  <Typography variant="body2" color="text.secondary">
                    Last synced: {lastSyncTime.toLocaleString()}
                  </Typography>
                )}
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Button
                  variant="contained"
                  startIcon={syncStatus === 'syncing' ? <CircularProgress size={20} color="inherit" /> : <SyncIcon />}
                  onClick={() => syncNow()}
                  disabled={syncStatus === 'syncing' || !isAuthenticated}
                  sx={{ mr: 2 }}
                >
                  Sync Now
                </Button>
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={isAutoSyncEnabled}
                      onChange={toggleAutoSync}
                      disabled={!isAuthenticated}
                    />
                  }
                  label="Auto-sync changes"
                />
              </Box>
              
              {!isAuthenticated && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  You need to be logged in to sync with the database.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Backup & Restore
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" paragraph>
                  Create a backup of your calendar data or export it to Firebase Storage.
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="outlined"
                    startIcon={isExporting ? <CircularProgress size={20} color="inherit" /> : <CloudDownload />}
                    onClick={handleExport}
                    disabled={isExporting || !isAuthenticated}
                  >
                    {isExporting ? 'Exporting...' : 'Export Data'}
                  </Button>
                  
                  <Button
                    variant="outlined"
                    startIcon={isCreatingBackup ? <CircularProgress size={20} color="inherit" /> : <BackupIcon />}
                    onClick={handleCreateBackup}
                    disabled={isCreatingBackup || !isAuthenticated}
                  >
                    {isCreatingBackup ? 'Creating...' : 'Create Backup'}
                  </Button>
                </Box>
              </Box>
              
              <Divider sx={{ my: 3 }} />
              
              <Box>
                <Typography variant="body2" paragraph>
                  Restore from a previous backup:
                </Typography>
                
                {isLoadingBackups ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : backups.length > 0 ? (
                  <List>
                    {backups.slice(0, 5).map((backup, index) => (
                      <ListItem 
                        key={index}
                        secondaryAction={
                          <Button
                            variant="text"
                            size="small"
                            startIcon={<RestoreIcon />}
                            onClick={() => handleImport(backup.name)}
                            disabled={isImporting}
                          >
                            Restore
                          </Button>
                        }
                      >
                        <ListItemText
                          primary={backup.name}
                          secondary={`${new Date(backup.lastModified).toLocaleString()} - ${formatFileSize(backup.size)}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No backups available.
                  </Typography>
                )}
                
                {importError && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    {importError}
                  </Alert>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      <Snackbar
        open={importSuccess}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity="success">
          Data imported successfully!
        </Alert>
      </Snackbar>
      
      <Snackbar
        open={exportSuccess}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity="success">
          Data exported successfully!
        </Alert>
      </Snackbar>
      
      <Snackbar
        open={backupSuccess}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity="success">
          Backup created successfully!
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SyncSettings; 