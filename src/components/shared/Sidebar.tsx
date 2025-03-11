import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Typography,
  Button,
  Chip,
  Avatar,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  CalendarViewMonth,
  Add,
  ViewWeek,
  Settings,
  PictureAsPdf
} from '@mui/icons-material';
import { useProviders } from '../../contexts/EmployeeContext';
import { useClinicTypes } from '../../contexts/LocationContext';
import { useAuth } from '../../contexts/AuthContext';
import ProviderScheduleList from '../provider/ProviderScheduleList';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ open, onClose }) => {
  const location = useLocation();
  const { getActiveProviders } = useProviders();
  const { clinicTypes } = useClinicTypes();
  const { isAdmin, isAuthenticated } = useAuth();
  const activeProviders = getActiveProviders();
  const activeClinicTypes = clinicTypes.filter(ct => ct.status === 'active');
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
  const [scheduleModalOpen, setScheduleModalOpen] = useState<boolean>(false);

  const drawerWidth = 280;

  // Define menu items based on user role
  const menuItems = [
    { text: 'Month View', icon: <CalendarViewMonth />, path: '/' }
  ];

  // Add authenticated-only menu items
  if (isAuthenticated) {
    menuItems.push(
      { text: 'Three Month View', icon: <ViewWeek />, path: '/three-month' }
    );
  }

  // Add settings menu item (accessible to all)
  menuItems.push(
    { text: 'Settings', icon: <Settings />, path: '/settings' }
  );

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
    <Drawer
      variant="temporary"
      open={open}
      onClose={onClose}
      ModalProps={{
        keepMounted: true, // Better open performance on mobile
      }}
      sx={{
        '& .MuiDrawer-paper': { 
          width: drawerWidth,
          boxSizing: 'border-box',
          padding: 2
        },
      }}
    >
      <Box sx={{ mb: 2, mt: 2, textAlign: 'center' }}>
        <img 
          src="/assets/logo.png" 
          alt="Provider Schedule Logo" 
          style={{ height: 60, marginBottom: 10 }}
        />
        <Typography variant="h6" component="div">
          Provider Schedule
        </Typography>
      </Box>
      
      <Divider sx={{ mb: 2 }} />
      
      <List>
        {menuItems.map((item) => (
          <ListItem 
            button 
            key={item.text} 
            component={Link} 
            to={item.path}
            selected={location.pathname === item.path}
            onClick={onClose}
            sx={{
              borderRadius: 1,
              mb: 0.5,
              '&.Mui-selected': {
                backgroundColor: 'primary.light',
                '&:hover': {
                  backgroundColor: 'primary.light',
                },
              },
            }}
          >
            <ListItemIcon>
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
      
      <Divider sx={{ my: 2 }} />
      
      <Box sx={{ px: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle1" fontWeight="bold">
            Providers
          </Typography>
          {isAdmin && (
            <Button 
              variant="outlined" 
              size="small" 
              startIcon={<Add />}
              component={Link}
              to="/providers/add"
              onClick={onClose}
            >
              Add
            </Button>
          )}
        </Box>
        
        <List sx={{ maxHeight: 300, overflow: 'auto' }}>
          {activeProviders.map((provider) => (
            <ListItem 
              key={provider.id} 
              sx={{ 
                px: 0, 
                py: 0.5,
                display: 'flex',
                justifyContent: 'space-between'
              }}
            >
              <Chip
                avatar={
                  <Avatar style={{ backgroundColor: provider.color }}>
                    {provider.firstName.charAt(0)}{provider.lastName.charAt(0)}
                  </Avatar>
                }
                label={`${provider.firstName} ${provider.lastName}`}
                variant="outlined"
                sx={{ 
                  width: 'calc(100% - 40px)', 
                  justifyContent: 'flex-start' 
                }}
              />
              <Tooltip title="Export Schedule as PDF">
                <IconButton 
                  size="small" 
                  color="primary"
                  onClick={() => handleViewSchedule(provider.id)}
                >
                  <PictureAsPdf fontSize="small" />
                </IconButton>
              </Tooltip>
            </ListItem>
          ))}
        </List>
      </Box>
      
      <Divider sx={{ my: 2 }} />
      
      <Box sx={{ px: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle1" fontWeight="bold">
            Clinic Types
          </Typography>
          {isAdmin && (
            <Button 
              variant="outlined" 
              size="small" 
              startIcon={<Add />}
              component={Link}
              to="/clinics/add"
              onClick={onClose}
            >
              Add
            </Button>
          )}
        </Box>
        
        <List sx={{ maxHeight: 200, overflow: 'auto' }}>
          {activeClinicTypes.map((clinicType) => (
            <ListItem key={clinicType.id} sx={{ px: 0, py: 0.5 }}>
              <Chip
                avatar={
                  <Avatar style={{ backgroundColor: clinicType.color }} />
                }
                label={clinicType.name}
                variant="outlined"
                sx={{ width: '100%', justifyContent: 'flex-start' }}
              />
            </ListItem>
          ))}
        </List>
      </Box>

      {/* Provider Schedule Modal with PDF export capability */}
      <ProviderScheduleList
        providerId={selectedProviderId}
        open={scheduleModalOpen}
        onClose={handleCloseScheduleModal}
      />
    </Drawer>
  );
};

export default Sidebar; 