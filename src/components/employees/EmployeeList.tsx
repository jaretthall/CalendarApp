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
  InputAdornment
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Search,
  PersonOutline
} from '@mui/icons-material';
import { useProviders, Provider } from '../../contexts/EmployeeContext';

const EmployeeList: React.FC = () => {
  const { providers, deleteProvider } = useProviders();
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [providerToDelete, setProviderToDelete] = useState<Provider | null>(null);

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
    }
    setDeleteDialogOpen(false);
    setProviderToDelete(null);
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setProviderToDelete(null);
  };

  const filteredProviders = providers.filter(provider => {
    const fullName = `${provider.firstName} ${provider.lastName}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase());
  });

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Providers
        </Typography>
        
        <Button
          variant="contained"
          color="primary"
          startIcon={<Add />}
          component={Link}
          to="/providers/add"
        >
          Add Provider
        </Button>
      </Box>
      
      <Paper sx={{ mb: 3, p: 2 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search providers..."
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
              {filteredProviders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} align="center">
                    <Box sx={{ py: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <PersonOutline sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="body1" color="text.secondary">
                        No providers found
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
                filteredProviders.map(provider => (
                  <TableRow key={provider.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box
                          sx={{
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            backgroundColor: provider.color,
                            mr: 2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            fontSize: '0.75rem',
                            fontWeight: 'bold'
                          }}
                        >
                          {provider.firstName.charAt(0)}{provider.lastName.charAt(0)}
                        </Box>
                        {`${provider.firstName} ${provider.lastName}`}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={provider.status.charAt(0).toUpperCase() + provider.status.slice(1)}
                        size="small"
                        color={provider.status === 'active' ? 'success' : 'error'}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        component={Link}
                        to={`/providers/edit/${provider.id}`}
                        color="primary"
                        size="small"
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        color="error"
                        size="small"
                        onClick={() => handleDeleteClick(provider)}
                      >
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
      >
        <DialogTitle>Delete Provider</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete {providerToDelete ? `${providerToDelete.firstName} ${providerToDelete.lastName}` : 'this provider'}? 
            This action cannot be undone and will also remove all shifts assigned to this provider.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmployeeList; 