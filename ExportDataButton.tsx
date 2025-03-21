import React, { useState } from 'react';
import { Button } from '@mui/material';
import { Download } from '@mui/icons-material';
import { exportAndDownloadData } from './exportFirebaseDataWeb';
import { getFirestore } from 'firebase/firestore';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

interface ExportDataButtonProps {
  variant?: 'text' | 'outlined' | 'contained';
  size?: 'small' | 'medium' | 'large';
}

/**
 * A button component that exports all Firebase data to a JSON file
 * when clicked
 */
const ExportDataButton: React.FC<ExportDataButtonProps> = ({ 
  variant = 'contained',
  size = 'medium'
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const db = getFirestore();
      await exportAndDownloadData(db);
      setSuccess(true);
    } catch (err) {
      console.error("Export failed:", err);
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setError(null);
    setSuccess(false);
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleExport}
        disabled={loading}
        startIcon={<Download />}
      >
        {loading ? 'Exporting...' : 'Export Data'}
      </Button>

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
          Data exported successfully
        </Alert>
      </Snackbar>
    </>
  );
};

export default ExportDataButton; 