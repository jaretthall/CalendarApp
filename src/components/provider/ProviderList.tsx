import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemAvatar, 
  Avatar, 
  Button, 
  Divider,
  IconButton,
  Tooltip,
  CircularProgress
} from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PersonIcon from '@mui/icons-material/Person';
import ProviderScheduleList from './ProviderScheduleList';
import { useProviders } from '../../contexts/EmployeeContext';

// Types for display purposes
interface ProviderDisplay {
  id: string;
  name: string;
  email: string;
  color: string;
  location?: string;
}

const ProviderList: React.FC = () => {
  const { providers, loading } = useProviders();
  const [displayProviders, setDisplayProviders] = useState<ProviderDisplay[]>([]);
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
  const [scheduleModalOpen, setScheduleModalOpen] = useState<boolean>(false);

  // Transform providers for display
  useEffect(() => {
    if (providers.length > 0) {
      const formattedProviders = providers.map(provider => ({
        id: provider.id,
        name: `${provider.firstName} ${provider.lastName}`,
        email: provider.email || '',
        color: provider.color,
        // Location would come from the database in a real implementation
        location: 'Main Hospital' // Default location
      }));
      setDisplayProviders(formattedProviders);
    }
  }, [providers]);

  // Handle opening the schedule modal
  const handleViewSchedule = (providerId: string) => {
    setSelectedProviderId(providerId);
    setScheduleModalOpen(true);
  };

  // Handle closing the schedule modal
  const handleCloseScheduleModal = () => {
    setScheduleModalOpen(false);
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 800, mx: 'auto', p: 2 }}>
      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="h5" component="h1" gutterBottom>
          Providers
        </Typography>
        
        <Divider sx={{ mb: 3 }} />
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {displayProviders.length === 0 ? (
              <Typography variant="body1" color="textSecondary" align="center">
                No providers found. Add a provider to get started.
              </Typography>
            ) : (
              <List>
                {displayProviders.map((provider) => (
                  <ListItem
                    key={provider.id}
                    alignItems="flex-start"
                    secondaryAction={
                      <Tooltip title="View Schedule">
                        <IconButton 
                          edge="end" 
                          aria-label="view schedule"
                          onClick={() => handleViewSchedule(provider.id)}
                        >
                          <CalendarMonthIcon />
                        </IconButton>
                      </Tooltip>
                    }
                    sx={{ 
                      mb: 1, 
                      borderLeft: `4px solid ${provider.color}`,
                      borderRadius: 1,
                      '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' }
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: provider.color }}>
                        <PersonIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={provider.name}
                      secondary={
                        <>
                          <Typography component="span" variant="body2" color="textPrimary">
                            {provider.email}
                          </Typography>
                          {provider.location && (
                            <Typography component="div" variant="body2" color="textSecondary">
                              Location: {provider.location}
                            </Typography>
                          )}
                        </>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </>
        )}
      </Paper>
      
      {selectedProviderId && (
        <ProviderScheduleList
          open={scheduleModalOpen}
          onClose={handleCloseScheduleModal}
          providerId={selectedProviderId}
        />
      )}
    </Box>
  );
};

export default ProviderList; 