import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  Alert,
  Paper
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useShifts } from '../../contexts/ShiftContext';
import { useAuth } from '../../contexts/AuthContext';

const AccountSettings: React.FC = () => {
  const { isAuthenticated, currentUser, isReadOnly } = useAuth();
  const { shifts, forceRefreshShifts } = useShifts();
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleOpenDeleteDialog = () => {
    setOpenDeleteDialog(true);
    setConfirmText('');
    setError('');
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setConfirmText('');
    setError('');
  };

  const handleDeleteAllShifts = async () => {
    if (confirmText !== 'DELETE ALL SHIFTS') {
      setError('Please type "DELETE ALL SHIFTS" to confirm');
      return;
    }

    try {
      // Call the function to delete all shifts
      await deleteAllShifts();
      setSuccess('All shifts have been deleted successfully');
      handleCloseDeleteDialog();
    } catch (error) {
      console.error('Error deleting all shifts:', error);
      setError('An error occurred while deleting shifts');
    }
  };

  // Function to delete all shifts
  const deleteAllShifts = async () => {
    // Security check - cannot delete shifts in read-only mode
    if (isReadOnly) {
      console.error('Cannot delete shifts in read-only mode');
      throw new Error('Operation not permitted in read-only mode');
    }
    
    // Get the FirestoreService directly
    const databaseService = await import('../../services/DatabaseService').then(module => module.default);
    
    // Get all shifts from Firestore
    const shiftsCollection = await databaseService.getAllShifts();
    
    // Delete each shift
    for (const shift of shiftsCollection) {
      await databaseService.deleteShift(shift.id);
    }
    
    // Force refresh the shifts context
    await forceRefreshShifts();
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Account Settings
      </Typography>
      
      {!isAuthenticated || isReadOnly ? (
        <Alert severity="info">
          Please log in with full access to manage account settings.
        </Alert>
      ) : (
        <>
          {currentUser && (
            <Paper sx={{ p: 2, mb: 3 }}>
              <Typography variant="subtitle1">
                Logged in as: {currentUser.email}
              </Typography>
            </Paper>
          )}
          
          <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
            Danger Zone
          </Typography>
          
          <Paper 
            sx={{ 
              p: 2, 
              border: '1px solid #f44336',
              borderRadius: 1
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="subtitle1" color="error">
                  Delete All Shifts
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  This will permanently delete all shifts from the database. This action cannot be undone.
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Current shift count: <strong>{shifts.length}</strong>
                </Typography>
              </Box>
              
              <Button 
                variant="outlined" 
                color="error" 
                startIcon={<DeleteIcon />}
                onClick={handleOpenDeleteDialog}
                disabled={shifts.length === 0 || isReadOnly}
              >
                Delete All Shifts
              </Button>
            </Box>
          </Paper>
          
          {success && (
            <Alert severity="success" sx={{ mt: 2 }}>
              {success}
            </Alert>
          )}
          
          {/* Confirmation Dialog */}
          <Dialog
            open={openDeleteDialog}
            onClose={handleCloseDeleteDialog}
            aria-labelledby="delete-dialog-title"
            aria-describedby="delete-dialog-description"
          >
            <DialogTitle id="delete-dialog-title" color="error">
              Delete All Shifts
            </DialogTitle>
            <DialogContent>
              <DialogContentText id="delete-dialog-description">
                This action will permanently delete all {shifts.length} shifts from the database. This cannot be undone.
              </DialogContentText>
              <DialogContentText sx={{ mt: 2, fontWeight: 'bold' }}>
                To confirm, type "DELETE ALL SHIFTS" in the field below:
              </DialogContentText>
              <TextField
                autoFocus
                margin="dense"
                fullWidth
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                error={!!error}
                helperText={error}
                sx={{ mt: 1 }}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
              <Button 
                onClick={handleDeleteAllShifts} 
                color="error" 
                variant="contained"
                disabled={confirmText !== 'DELETE ALL SHIFTS'}
              >
                Delete All Shifts
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}
    </Box>
  );
};

export default AccountSettings; 