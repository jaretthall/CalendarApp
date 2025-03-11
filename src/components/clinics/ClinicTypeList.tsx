import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  InputAdornment,
  Tooltip
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Search,
  LocationOn
} from '@mui/icons-material';
import { useClinicTypes, ClinicType } from '../../contexts/LocationContext';
import { useAuth } from '../../contexts/AuthContext';
import databaseService from '../../services/DatabaseService';

const ClinicTypeList: React.FC = () => {
  const { clinicTypes, refreshClinicTypes } = useClinicTypes();
  const { isAuthenticated, isAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clinicTypeToDelete, setClinicTypeToDelete] = useState<ClinicType | null>(null);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleDeleteClick = (clinicType: ClinicType) => {
    setClinicTypeToDelete(clinicType);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (clinicTypeToDelete) {
      try {
        await databaseService.deleteClinicType(clinicTypeToDelete.id);
        await refreshClinicTypes();
      } catch (error) {
        console.error('Error deleting clinic type:', error);
      }
    }
    setDeleteDialogOpen(false);
    setClinicTypeToDelete(null);
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setClinicTypeToDelete(null);
  };

  const filteredClinicTypes = clinicTypes.filter(clinicType => {
    return clinicType.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Clinic Types
        </Typography>
        
        {isAdmin && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<Add />}
            component={Link}
            to="/clinics/add"
          >
            Add Clinic Type
          </Button>
        )}
      </Box>
      
      <Paper sx={{ mb: 3, p: 2 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search clinic types..."
          value={searchTerm}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />
        
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredClinicTypes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} align="center">
                    <Box sx={{ py: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <LocationOn sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="body1" color="text.secondary">
                        No clinic types found
                      </Typography>
                      {searchTerm && (
                        <Typography variant="body2" color="text.secondary">
                          Try adjusting your search
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                filteredClinicTypes.map(clinicType => (
                  <TableRow key={clinicType.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box
                          sx={{
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            backgroundColor: clinicType.color,
                            mr: 2
                          }}
                        />
                        {clinicType.name}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={clinicType.status.charAt(0).toUpperCase() + clinicType.status.slice(1)}
                        size="small"
                        color={clinicType.status === 'active' ? 'success' : 'error'}
                      />
                    </TableCell>
                    <TableCell align="right">
                      {isAdmin && (
                        <>
                          <IconButton
                            component={Link}
                            to={`/clinics/edit/${clinicType.id}`}
                            color="primary"
                            size="small"
                          >
                            <Edit />
                          </IconButton>
                          <IconButton
                            color="error"
                            size="small"
                            onClick={() => handleDeleteClick(clinicType)}
                          >
                            <Delete />
                          </IconButton>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      
      {isAdmin && (
        <Dialog
          open={deleteDialogOpen}
          onClose={handleDeleteCancel}
        >
          <DialogTitle>Delete Clinic Type</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete {clinicTypeToDelete ? clinicTypeToDelete.name : 'this clinic type'}? 
              This action cannot be undone and may affect shifts assigned to this clinic type.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDeleteCancel}>Cancel</Button>
            <Button onClick={handleDeleteConfirm} color="error" autoFocus>
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

export default ClinicTypeList; 