import React, { useState } from 'react';
import { Box, Button, Typography, Divider } from '@mui/material';
import { Download, Upload } from '@mui/icons-material';
import { exportAndDownloadData } from './exportFirebaseDataWeb';
import { getFirestore } from 'firebase/firestore';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import ImportDataDialog from './importTemplate';

/**
 * A component that provides both Export and Import functionality
 * for the calendar application data
 */
const ExportImportButtons: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('Operation completed successfully');

  const handleExport = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const db = getFirestore();
      await exportAndDownloadData(db);
      setSuccessMessage('Data exported successfully');
      setSuccess(true);
    } catch (err) {
      console.error("Export failed:", err);
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setLoading(false);
    }
  };

  const handleImport = (data: any) => {
    // You will need to implement this function to import the data into Firebase
    // This will depend on your app's specific requirements and data structure
    console.log("Importing data:", data);
    setSuccessMessage('Data imported successfully');
    setSuccess(true);
  };

  const handleCloseSnackbar = () => {
    setError(null);
    setSuccess(false);
  };

  return (
    <Box sx={{ my: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Data Management
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Button
          variant="contained"
          onClick={handleExport}
          disabled={loading}
          startIcon={<Download />}
        >
          {loading ? 'Exporting...' : 'Export Data'}
        </Button>
        
        <Button
          variant="outlined"
          onClick={() => setImportDialogOpen(true)}
          disabled={loading}
          startIcon={<Upload />}
        >
          Import Data
        </Button>
      </Box>
      
      <Divider sx={{ my: 2 }} />
      
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        Export your data for backup or to transfer to another system.
        Import previously exported data to restore a backup.
      </Typography>

      {/* Import Dialog */}
      <ImportDataDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onImportData={handleImport}
      />

      {/* Error Snackbar */}
      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity="error">
          {error}
        </Alert>
      </Snackbar>

      {/* Success Snackbar */}
      <Snackbar 
        open={success} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity="success">
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ExportImportButtons; 