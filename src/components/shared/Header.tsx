import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Box,
  Tooltip,
  useMediaQuery,
  useTheme,
  Badge,
  Chip,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  Menu as MenuIcon,
  AccountCircle,
  Today,
  SettingsOutlined as SettingsIcon,
  ViewDay,
  ViewWeek,
  Login,
  CloudDownload,
  CloudUpload,
  CloudOff,
  CloudSync,
  CloudQueue,
  Sync as SyncIcon,
  CheckCircle,
  Warning,
  Error as ErrorIcon,
  PictureAsPdf,
  Logout
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useShifts } from '../../contexts/ShiftContext';
import { useAuth } from '../../contexts/AuthContext';
import { useSync } from '../../contexts/SyncContext';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { useSnackbar } from 'notistack';

interface HeaderProps {
  toggleDrawer: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleDrawer }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { exportShifts, importShifts } = useShifts();
  const { isAdmin, isAuthenticated, logout, isReadOnly } = useAuth();
  const [viewAnchorEl, setViewAnchorEl] = useState<null | HTMLElement>(null);
  const [exportAnchorEl, setExportAnchorEl] = useState<null | HTMLElement>(null);
  const [userAnchorEl, setUserAnchorEl] = useState<null | HTMLElement>(null);
  
  // Use the real sync context
  const { syncStatus, lastSyncTime, syncNow, pendingChanges } = useSync();

  const { enqueueSnackbar } = useSnackbar();

  const handleViewMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setViewAnchorEl(event.currentTarget);
  };

  const handleViewMenuClose = () => {
    setViewAnchorEl(null);
  };

  const handleExportMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setExportAnchorEl(event.currentTarget);
  };

  const handleExportMenuClose = () => {
    setExportAnchorEl(null);
  };

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setUserAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserAnchorEl(null);
  };

  const handleExportPDF = () => {
    const calendarElement = document.getElementById('calendar-container');
    if (calendarElement) {
      html2canvas(calendarElement).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'mm',
          format: 'a4'
        });
        
        // Get current date for header and filename
        const currentDate = new Date();
        const monthYear = format(currentDate, 'MMMM yyyy');
        const dateTimeForFilename = format(currentDate, 'yyyy-MM-dd_HH-mm-ss');
        
        // Add header with month and year
        pdf.setFontSize(18);
        pdf.setTextColor(0, 0, 0);
        pdf.text(monthYear, 10, 10);
        
        // Add a line under the header
        pdf.setDrawColor(0, 0, 0);
        pdf.setLineWidth(0.5);
        pdf.line(10, 15, 285, 15);
        
        // Add the calendar image with some padding from the header
        const imgWidth = 280;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        pdf.addImage(imgData, 'PNG', 10, 20, imgWidth, imgHeight);
        
        // Save with date and time in filename
        pdf.save(`calendar-${dateTimeForFilename}.pdf`);
      });
    }
    handleExportMenuClose();
  };

  const handleExportData = () => {
    if (!isAdmin) return;
    
    const data = exportShifts();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    // Update filename to include date and time
    const dateTimeForFilename = format(new Date(), 'yyyy-MM-dd_HH-mm-ss');
    a.download = `schedule-backup-${dateTimeForFilename}.json`;
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    handleExportMenuClose();
  };

  const handleImportData = () => {
    if (!isAdmin) return;
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files.length > 0) {
        const file = target.files[0];
        const reader = new FileReader();
        reader.onload = (event) => {
          const result = event.target?.result;
          if (typeof result === 'string') {
            importShifts(result);
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
    handleExportMenuClose();
  };

  const handleLogin = () => {
    navigate('/login');
    handleUserMenuClose();
  };

  const handleLogout = async () => {
    try {
      console.log('Initiating logout');
      await logout();
      console.log('Logout successful, navigating home');
      // Force a navigation to home page
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Error during logout:', error);
      // Show error notification if available
      if (enqueueSnackbar) {
        enqueueSnackbar('Logout failed. Please try again.', { variant: 'error' });
      }
    } finally {
      handleUserMenuClose();
    }
  };

  // Get sync icon and color based on status
  const getSyncStatusIcon = () => {
    switch (syncStatus) {
      case 'synced':
        return <CheckCircle color="success" />;
      case 'syncing':
        return <SyncIcon color="primary" />;
      case 'error':
        return <ErrorIcon color="error" />;
      case 'offline':
        return <CloudQueue color="disabled" />;
      default:
        return <CloudQueue />;
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getSyncTooltipText = () => {
    const timeString = lastSyncTime ? 
      `Last synced: ${lastSyncTime.toLocaleTimeString()}` : 
      'Not synced yet';
    
    switch (syncStatus) {
      case 'synced':
        return `All changes saved. ${timeString}`;
      case 'syncing':
        return `Syncing changes...`;
      case 'error':
        return `Sync failed. Click to retry.`;
      case 'offline':
        return `Working offline. Changes will sync when connection is restored.`;
      default:
        return timeString;
    }
  };

  // Add this function to navigate to reports tab
  const handleReportsClick = () => {
    navigate('/settings?tab=reports');
    handleExportMenuClose();
  };

  return (
    <AppBar 
      position="static"
      sx={{
        background: 'linear-gradient(90deg, #FFFFFF 0%, #FFEB3B 33%, #FF9800 66%, #F44336 100%)',
        color: '#000000'
      }}
    >
      <Toolbar>
        <IconButton
          edge="start"
          color="inherit"
          aria-label="menu"
          onClick={toggleDrawer}
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <img 
            src="/assets/logo.png" 
            alt="Provider Schedule Logo" 
            style={{ height: 40, marginRight: 10 }}
          />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, display: { xs: 'none', sm: 'block' } }}>
            Provider Schedule
          </Typography>
        </Box>
        
        <Box sx={{ flexGrow: 1 }} />
        
        <Box sx={{ display: 'flex' }}>
          <Tooltip title="View Options">
            <Button 
              color="inherit"
              onClick={handleViewMenuOpen}
              startIcon={<ViewWeek />}
              sx={{ mr: 1 }}
            >
              {!isMobile && "View"}
            </Button>
          </Tooltip>
          <Menu
            anchorEl={viewAnchorEl}
            open={Boolean(viewAnchorEl)}
            onClose={handleViewMenuClose}
          >
            <MenuItem 
              component={Link} 
              to="/"
              onClick={handleViewMenuClose}
            >
              <ViewDay /> Month View
            </MenuItem>
            <MenuItem 
              component={Link} 
              to="/three-month"
              onClick={handleViewMenuClose}
            >
              <ViewWeek /> Three Month View
            </MenuItem>
          </Menu>
          
          <Tooltip title="Today">
            <IconButton color="inherit" component={Link} to="/">
              <Today />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Export/Import">
            <Button 
              color="inherit" 
              startIcon={<CloudDownload />}
              onClick={handleExportMenuOpen}
              sx={{ ml: 1 }}
            >
              {!isMobile && "Export"}
            </Button>
          </Tooltip>
          <Menu
            anchorEl={exportAnchorEl}
            open={Boolean(exportAnchorEl)}
            onClose={handleExportMenuClose}
          >
            <MenuItem onClick={handleExportPDF}>
              <PictureAsPdf sx={{ mr: 1 }} /> Export Calendar as PDF
            </MenuItem>
            <MenuItem onClick={handleReportsClick}>
              <PictureAsPdf sx={{ mr: 1 }} /> Shift Patterns Report
            </MenuItem>
            {isAdmin && (
              <>
                <MenuItem onClick={handleExportData}>
                  <CloudDownload sx={{ mr: 1 }} /> Backup Data
                </MenuItem>
                <MenuItem onClick={handleImportData}>
                  <CloudUpload sx={{ mr: 1 }} /> Restore Data
                </MenuItem>
              </>
            )}
          </Menu>
          
          <Tooltip title="Sync Status">
            <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
              <IconButton 
                color="inherit" 
                onClick={syncNow}
                size="small"
              >
                {syncStatus === 'syncing' ? (
                  <CircularProgress color="inherit" size={24} />
                ) : (
                  getSyncStatusIcon()
                )}
              </IconButton>
              {pendingChanges > 0 && (
                <Chip 
                  label={`${pendingChanges} pending`} 
                  size="small" 
                  color="warning" 
                  sx={{ ml: 1 }}
                />
              )}
            </Box>
          </Tooltip>
          
          {/* Settings Button */}
          <Tooltip title="Settings">
            <Button 
              color="inherit"
              component={Link}
              to="/settings"
              startIcon={<SettingsIcon />}
              sx={{ mr: 1 }}
            >
              {!isMobile && "Settings"}
            </Button>
          </Tooltip>
          
          <Tooltip title={isAuthenticated ? "Account" : "Login"}>
            <IconButton 
              color="inherit" 
              onClick={handleUserMenuOpen}
              sx={{ ml: 1 }}
            >
              {isAuthenticated ? (
                <Badge color="success" variant="dot">
                  <AccountCircle />
                </Badge>
              ) : (
                <Login />
              )}
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={userAnchorEl}
            open={Boolean(userAnchorEl)}
            onClose={handleUserMenuClose}
          >
            {isAuthenticated ? (
              <>
                {isReadOnly && (
                  <MenuItem onClick={handleLogin}>
                    <Login sx={{ mr: 1 }} /> Login
                  </MenuItem>
                )}
                <MenuItem onClick={handleLogout}>
                  <Logout sx={{ mr: 1 }} /> Logout
                </MenuItem>
              </>
            ) : (
              <MenuItem onClick={handleLogin}>
                <Login sx={{ mr: 1 }} /> Login
              </MenuItem>
            )}
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header; 