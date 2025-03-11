import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Divider, 
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Chip,
  Modal,
  IconButton
} from '@mui/material';
import { format, parseISO } from 'date-fns';
import CloseIcon from '@mui/icons-material/Close';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useProviders } from '../../contexts/EmployeeContext';
import { useShifts } from '../../contexts/ShiftContext';
import { useClinicTypes } from '../../contexts/LocationContext';

interface ProviderScheduleListProps {
  providerId: string | null;
  onClose: () => void;
  open: boolean;
}

const ProviderScheduleList: React.FC<ProviderScheduleListProps> = ({ providerId, onClose, open }) => {
  const { getProviderById, providers } = useProviders();
  const { getShiftsByProvider } = useShifts();
  const { getClinicTypeById } = useClinicTypes();
  const [loading, setLoading] = useState<boolean>(true);
  const [months, setMonths] = useState<{[key: string]: any[]}>({});
  const reportRef = useRef<HTMLDivElement>(null);
  const [provider, setProvider] = useState<any | null>(null);

  // Debug log
  useEffect(() => {
    if (open) {
      console.log("ProviderScheduleList opened with providerId:", providerId);
      console.log("Available providers:", providers);
    }
  }, [open, providerId, providers]);

  // Fetch provider data and shifts
  useEffect(() => {
    if (providerId && open) {
      setLoading(true);
      console.log("Fetching data for provider ID:", providerId);
      
      // Get provider data
      const providerData = getProviderById(providerId);
      console.log("Provider data:", providerData);
      
      if (providerData) {
        setProvider({
          id: providerData.id,
          name: `${providerData.firstName} ${providerData.lastName}`,
          email: '',
          color: providerData.color
        });
        
        // Get shifts for this provider
        const providerShifts = getShiftsByProvider(providerId);
        console.log("Provider shifts:", providerShifts);
        
        // Enhance shifts with clinic type information
        const enhancedShifts = providerShifts.map(shift => {
          const clinicType = getClinicTypeById(shift.clinicTypeId);
          return {
            ...shift,
            clinicName: clinicType ? clinicType.name : 'Unknown Clinic',
            location: clinicType ? clinicType.name : 'Unknown Location'
          };
        });
        
        // Sort all shifts chronologically
        const sortedShifts = [...enhancedShifts].sort((a, b) => 
          parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime()
        );
        
        // Group shifts by month
        const groupedByMonth: {[key: string]: any[]} = {};
        
        sortedShifts.forEach(shift => {
          const monthKey = format(parseISO(shift.startDate), 'MMMM yyyy');
          
          if (!groupedByMonth[monthKey]) {
            groupedByMonth[monthKey] = [];
          }
          
          groupedByMonth[monthKey].push(shift);
        });
        
        // Sort months chronologically
        const sortedMonths: {[key: string]: any[]} = {};
        const monthKeys = Object.keys(groupedByMonth).sort((a, b) => {
          const dateA = new Date(a);
          const dateB = new Date(b);
          return dateA.getTime() - dateB.getTime();
        });
        
        monthKeys.forEach(month => {
          sortedMonths[month] = groupedByMonth[month];
        });
        
        setMonths(sortedMonths);
        setLoading(false);
      } else {
        // Handle case when provider is not found
        console.error("Provider not found for ID:", providerId);
        setLoading(false);
        setMonths({});
      }
    } else if (open) {
      // Handle case when modal is open but no provider is selected
      console.log("Modal open but no provider selected");
      setLoading(false);
      setProvider(null);
      setMonths({});
    }
  }, [providerId, open, getProviderById, getShiftsByProvider, providers, getClinicTypeById]);

  // Handle PDF export
  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    
    try {
      const canvas = await html2canvas(reportRef.current);
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgWidth = 210; // A4 width in mm
      const imgHeight = canvas.height * imgWidth / canvas.width;
      
      // Add title
      const title = provider ? `${provider.name}'s Schedule` : 'Provider Schedule';
      pdf.setFontSize(16);
      pdf.text(title, 105, 15, { align: 'center' });
      
      // Add date
      const today = new Date();
      pdf.setFontSize(10);
      pdf.text(`Generated on ${format(today, 'MMMM d, yyyy')}`, 105, 22, { align: 'center' });
      
      pdf.addImage(imgData, 'PNG', 0, 30, imgWidth, imgHeight);
      
      // Generate filename with provider name or default
      const filename = provider 
        ? `${provider.name.replace(/\s+/g, '_')}_Schedule_${format(today, 'yyyy-MM-dd')}.pdf`
        : `Provider_Schedule_${format(today, 'yyyy-MM-dd')}.pdf`;
      
      pdf.save(filename);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="provider-schedule-modal"
    >
      <Paper 
        sx={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)', 
          width: '90%', 
          maxWidth: 800, 
          maxHeight: '90vh', 
          overflow: 'auto', 
          p: 3, 
          borderRadius: 2 
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" component="h2">
            {provider ? `${provider.name}'s Schedule` : 'Loading...'}
          </Typography>
          <Box>
            <IconButton 
              onClick={handleExportPDF} 
              color="primary" 
              sx={{ mr: 1 }}
              aria-label="export to PDF"
            >
              <PictureAsPdfIcon />
            </IconButton>
            <IconButton 
              onClick={onClose} 
              color="default"
              aria-label="close"
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box ref={reportRef}>
            {/* Legend */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CalendarTodayIcon sx={{ mr: 0.5, color: 'primary.main' }} />
                <Typography variant="body2">Regular Shift</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <EventBusyIcon sx={{ mr: 0.5, color: 'error.main' }} />
                <Typography variant="body2">Vacation Day</Typography>
              </Box>
            </Box>
            
            {/* Shifts grouped by month */}
            {Object.keys(months).length > 0 ? (
              Object.entries(months).map(([month, monthShifts]) => (
                <Box key={month} sx={{ mb: 4 }}>
                  <Typography variant="h6" sx={{ mb: 1, bgcolor: 'primary.main', color: 'white', p: 1, borderRadius: 1 }}>
                    {month}
                  </Typography>
                  
                  <List>
                    {monthShifts.map(shift => (
                      <ListItem 
                        key={shift.id}
                        sx={{ 
                          borderLeft: `4px solid ${provider?.color || '#ccc'}`,
                          mb: 1,
                          bgcolor: shift.isVacation ? 'rgba(244, 67, 54, 0.1)' : 'background.paper',
                          '&:hover': { bgcolor: shift.isVacation ? 'rgba(244, 67, 54, 0.2)' : 'rgba(0, 0, 0, 0.04)' }
                        }}
                      >
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              {shift.isVacation ? (
                                <EventBusyIcon sx={{ mr: 1, color: 'error.main' }} />
                              ) : (
                                <CalendarTodayIcon sx={{ mr: 1, color: 'primary.main' }} />
                              )}
                              <Typography variant="body1" fontWeight="medium">
                                {format(parseISO(shift.startDate), 'EEEE, MMMM d, yyyy')}
                                {shift.startDate !== shift.endDate && 
                                  ` - ${format(parseISO(shift.endDate), 'EEEE, MMMM d, yyyy')}`}
                              </Typography>
                            </Box>
                          }
                          secondary={
                            <Box sx={{ display: 'flex', flexDirection: 'column', mt: 0.5 }}>
                              <Typography variant="body2">
                                {shift.isVacation ? 'Vacation' : 'Shift'}
                                {shift.clinicName && ` - ${shift.clinicName}`}
                              </Typography>
                              <Box sx={{ display: 'flex', mt: 0.5, alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                                {shift.isRecurring && (
                                  <Chip 
                                    label="Recurring" 
                                    size="small" 
                                    variant="outlined"
                                  />
                                )}
                                {shift.recurrencePattern && (
                                  <Chip 
                                    label={shift.recurrencePattern.charAt(0).toUpperCase() + shift.recurrencePattern.slice(1)} 
                                    size="small" 
                                    variant="outlined"
                                  />
                                )}
                              </Box>
                              {shift.notes && (
                                <Typography variant="body2" sx={{ mt: 0.5, fontStyle: 'italic' }}>
                                  Note: {shift.notes}
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              ))
            ) : (
              <Typography variant="body1" sx={{ textAlign: 'center', py: 4 }}>
                {provider ? 'No shifts scheduled for this provider.' : 'No provider selected.'}
              </Typography>
            )}
          </Box>
        )}
      </Paper>
    </Modal>
  );
};

export default ProviderScheduleList; 