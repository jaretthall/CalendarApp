import React, { useState } from 'react';
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
  Tooltip,
  Avatar
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Search,
  LocationOn
} from '@mui/icons-material';
import { useClinicTypes, ClinicType } from '../../contexts/LocationContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import databaseService from '../../services/DatabaseService';

const ClinicsSettings: React.FC = () => {
  const { clinicTypes, refreshClinicTypes } = useClinicTypes();
  const { /* isAdmin */ } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clinicTypeToDelete, setClinicTypeToDelete] = useState<ClinicType | null>(null);
  const navigate = useNavigate();

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
        setDeleteDialogOpen(false);
        setClinicTypeToDelete(null);
      } catch (error) {
        console.error('Error deleting clinic type:', error);
      }
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setClinicTypeToDelete(null);
  };

  const handleAddClinic = () => {
    navigate('/clinics/add');
  };

  const handleEditClinic = (id: string) => {
    navigate(`/clinics/edit/${id}`);
  };

  // Filter clinic types based on search term
  const filteredClinicTypes = clinicTypes.filter(clinicType => {
    return clinicType.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Manage Clinic Types</Typography>
        {/* Always show add button for debugging */}
        <Button
          variant="contained"
          color="primary"
          startIcon={<Add />}
          onClick={handleAddClinic}
        >
          Add Clinic Type
        </Button>
      </Box>

      <TextField
        fullWidth
        variant="outlined"
        placeholder="Search clinic types..."
        value={searchTerm}
        onChange={handleSearchChange}
        sx={{ mb: 3 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search />
            </InputAdornment>
          ),
        }}
      />

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredClinicTypes.length > 0 ? (
              filteredClinicTypes.map((clinicType) => (
                <TableRow key={clinicType.id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar sx={{ bgcolor: clinicType.color, mr: 2 }}>
                        <LocationOn />
                      </Avatar>
                      {clinicType.name}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={clinicType.status === 'active' ? 'Active' : 'Inactive'}
                      color={clinicType.status === 'active' ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    {/* Always show edit buttons for debugging */}
                    <>
                      <Tooltip title="Edit">
                        <IconButton
                          color="primary"
                          onClick={() => handleEditClinic(clinicType.id)}
                        >
                          <Edit />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          color="error"
                          onClick={() => handleDeleteClick(clinicType)}
                        >
                          <Delete />
                        </IconButton>
                      </Tooltip>
                    </>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} align="center">
                  {searchTerm ? 'No clinic types match your search.' : 'No clinic types found.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete {clinicTypeToDelete?.name}? 
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error">Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ClinicsSettings; 