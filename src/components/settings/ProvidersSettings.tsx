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
  Search
} from '@mui/icons-material';
import { useProviders, Provider } from '../../contexts/EmployeeContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const ProvidersSettings: React.FC = () => {
  const { providers, deleteProvider } = useProviders();
  const { isAdmin, isAuthenticated, currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [providerToDelete, setProviderToDelete] = useState<Provider | null>(null);
  const navigate = useNavigate();

  // Debug admin status
  console.log('ProvidersSettings - Auth Status:', { 
    isAdmin, 
    isAuthenticated,
    userEmail: currentUser?.email
  });

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleDeleteClick = (provider: Provider) => {
    setProviderToDelete(provider);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (providerToDelete) {
      deleteProvider(providerToDelete.id);
      setDeleteDialogOpen(false);
      setProviderToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setProviderToDelete(null);
  };

  const handleAddProvider = () => {
    navigate('/providers/add');
  };

  const handleEditProvider = (id: string) => {
    navigate(`/providers/edit/${id}`);
  };

  // Filter providers based on search term
  const filteredProviders = providers.filter(provider => {
    const fullName = `${provider.firstName} ${provider.lastName}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase());
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Manage Providers</Typography>
        {/* Always show add button for debugging */}
        <Button
          variant="contained"
          color="primary"
          startIcon={<Add />}
          onClick={handleAddProvider}
        >
          Add Provider
        </Button>
      </Box>

      <TextField
        fullWidth
        variant="outlined"
        placeholder="Search providers..."
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
            {filteredProviders.length > 0 ? (
              filteredProviders.map((provider) => (
                <TableRow key={provider.id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar sx={{ bgcolor: provider.color, mr: 2 }}>
                        {provider.firstName.charAt(0)}{provider.lastName.charAt(0)}
                      </Avatar>
                      {provider.firstName} {provider.lastName}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={provider.status === 'active' ? 'Active' : 'Inactive'}
                      color={provider.status === 'active' ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    {/* Always show edit buttons for debugging */}
                    <>
                      <Tooltip title="Edit">
                        <IconButton
                          color="primary"
                          onClick={() => handleEditProvider(provider.id)}
                        >
                          <Edit />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          color="error"
                          onClick={() => handleDeleteClick(provider)}
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
                <TableCell colSpan={4} align="center">
                  {searchTerm ? 'No providers match your search.' : 'No providers found.'}
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
            Are you sure you want to delete {providerToDelete?.firstName} {providerToDelete?.lastName}? 
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

export default ProvidersSettings; 