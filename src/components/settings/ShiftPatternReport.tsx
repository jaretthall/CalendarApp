import React, { useState, useEffect } from 'react';
import { 
  Button, 
  Box, 
  Typography, 
  CircularProgress, 
  Alert,
  Paper
} from '@mui/material';
import { PictureAsPdf, Download } from '@mui/icons-material';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { firestore } from '../../config/firebase-config';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format, parseISO, isMonday, isTuesday, isWednesday, isThursday, isFriday, isSaturday, isSunday, getDay } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { useSnackbar } from 'notistack';

// Add the missing types for jsPDF-autotable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: typeof autoTable;
  }
}

// Define the types to match the expected types in the application
interface Provider {
  id: string;
  firstName: string;
  lastName: string;
}

interface ClinicType {
  id: string;
  name: string;
}

interface Shift {
  id: string;
  providerId: string;
  clinicTypeId?: string;
  startDate: string | any;
  endDate: string | any;
  isVacation: boolean;
  isRecurring: boolean;
  recurrencePattern?: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  recurrenceEndDate?: string | any;
  seriesId?: string;
  notes?: string;
  location?: string;
}

// Define additional types for the grouped data structure
interface ShiftSeries {
  seriesId: string;
  pattern?: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  startDate: string | any;
  endDate: string | any;
  recurrenceEndDate?: string | any;
  clinicTypeId?: string;
  isVacation: boolean;
  location?: string;
  notes?: string;
  shifts: Shift[];
  firstShift: Shift;
}

interface ProviderData {
  provider: Provider;
  recurringShiftSeries: ShiftSeries[];
  oneTimeShifts: Shift[];
}

/**
 * Component for generating and downloading shift pattern reports
 * Shows recurring shift patterns and one-time shifts by provider
 */
const ShiftPatternReport: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [clinicTypes, setClinicTypes] = useState<ClinicType[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const { isAuthenticated } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  
  // Fetch all necessary data when component mounts
  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    } else {
      setError('You must be logged in to access this report');
    }
  }, [isAuthenticated]);
  
  // Load all required data from Firestore
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Check authentication
      if (!isAuthenticated) {
        setError('Authentication required. Please log in.');
        setLoading(false);
        return;
      }
      
      // Get all providers
      const providersSnapshot = await getDocs(collection(firestore, 'providers'));
      const providersData = providersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Provider[];
      setProviders(providersData);
      
      // Get all clinic types
      const clinicTypesSnapshot = await getDocs(collection(firestore, 'clinicTypes'));
      const clinicTypesData = clinicTypesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ClinicType[];
      setClinicTypes(clinicTypesData);
      
      // Get all shifts
      const shiftsSnapshot = await getDocs(collection(firestore, 'shifts'));
      const shiftsData = shiftsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Shift[];
      setShifts(shiftsData);
      
      setDataLoaded(true);
      enqueueSnackbar('Data loaded successfully', { variant: 'success' });
    } catch (err) {
      console.error('Error fetching data: ', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Failed to load data: ${errorMessage}`);
      enqueueSnackbar('Error loading data', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };
  
  // Format date for display
  const formatDate = (date: any): string => {
    if (!date) return 'N/A';
    
    // Handle both Firestore timestamps and ISO strings
    if (typeof date === 'string') {
      return format(parseISO(date), 'MMM d, yyyy h:mm a');
    }
    
    // Handle Firestore Timestamp
    if (date.toDate) {
      return format(date.toDate(), 'MMM d, yyyy h:mm a');
    }
    
    return 'Invalid date';
  };
  
  // Format time only (for displaying shift times)
  const formatTime = (date: any): string => {
    if (!date) return 'N/A';
    
    // Handle both Firestore timestamps and ISO strings
    if (typeof date === 'string') {
      return format(parseISO(date), 'h:mm a');
    }
    
    // Handle Firestore Timestamp
    if (date.toDate) {
      return format(date.toDate(), 'h:mm a');
    }
    
    return 'Invalid time';
  };
  
  // Get provider name from provider ID
  const getProviderName = (providerId: string): string => {
    const provider = providers.find(p => p.id === providerId);
    if (!provider) return 'Unknown Provider';
    return `${provider.firstName} ${provider.lastName}`;
  };
  
  // Get clinic type name from clinic type ID
  const getClinicTypeName = (clinicTypeId?: string): string => {
    if (!clinicTypeId) return 'No Clinic';
    const clinicType = clinicTypes.find(c => c.id === clinicTypeId);
    if (!clinicType) return 'Unknown Clinic';
    return clinicType.name;
  };

  // Get weekday names from a date
  const getWeekdayName = (date: Date): string => {
    return format(date, 'EEEE');
  };
  
  // Determine what days of the week a recurring shift occurs on
  const getDaysOfWeek = (firstShift: Shift, pattern: string): string => {
    if (!firstShift.startDate) return 'Unknown days';
    
    const startDate = typeof firstShift.startDate === 'string' 
      ? parseISO(firstShift.startDate) 
      : firstShift.startDate.toDate();
    
    const dayName = getWeekdayName(startDate);
    
    switch (pattern) {
      case 'daily':
        return 'Every day';
      case 'weekly':
        return `Every ${dayName}`;
      case 'biweekly':
        return `Every other ${dayName}`;
      case 'monthly':
        return `Monthly on the ${format(startDate, 'do')} (${dayName}s)`;
      default:
        return dayName;
    }
  };
  
  // Convert recurrence pattern to human-readable text
  const formatRecurrencePattern = (pattern: string | undefined, firstShift: Shift): string => {
    if (!pattern || !firstShift || !firstShift.startDate) return 'N/A';
    
    const startDate = typeof firstShift.startDate === 'string' 
      ? parseISO(firstShift.startDate) 
      : firstShift.startDate.toDate();
    
    const days = getDaysOfWeek(firstShift, pattern);
    
    switch (pattern) {
      case 'daily':
        return 'Daily';
      case 'weekly':
        return days;
      case 'biweekly':
        return days;
      case 'monthly':
        return days;
      default:
        return pattern || 'N/A';
    }
  };
  
  // Group shifts by series for recurring shifts
  const groupShiftsBySeries = (): Map<string, ProviderData> => {
    // Create map of providers
    const providerMap = new Map<string, ProviderData>();
    
    // First, separate shifts by provider
    providers.forEach(provider => {
      const providerShifts = shifts.filter(shift => shift.providerId === provider.id);
      
      // Separate recurring and non-recurring shifts
      const recurringShifts = providerShifts.filter(shift => shift.isRecurring);
      const oneTimeShifts = providerShifts.filter(shift => !shift.isRecurring);
      
      // Group recurring shifts by series ID
      const seriesMap = new Map<string, Shift[]>();
      recurringShifts.forEach(shift => {
        if (!shift.seriesId) return;
        
        if (!seriesMap.has(shift.seriesId)) {
          seriesMap.set(shift.seriesId, []);
        }
        seriesMap.get(shift.seriesId)!.push(shift);
      });
      
      // Structure the data
      providerMap.set(provider.id, {
        provider,
        recurringShiftSeries: Array.from(seriesMap.entries()).map(([seriesId, seriesShifts]) => {
          // Find the first shift in series to extract pattern info
          const firstShift = seriesShifts[0];
          return {
            seriesId,
            pattern: firstShift.recurrencePattern,
            startDate: firstShift.startDate,
            endDate: firstShift.endDate,
            recurrenceEndDate: firstShift.recurrenceEndDate,
            clinicTypeId: firstShift.clinicTypeId,
            isVacation: firstShift.isVacation,
            location: firstShift.location,
            notes: firstShift.notes,
            shifts: seriesShifts,
            firstShift: firstShift // Store the first shift for pattern reference
          };
        }),
        oneTimeShifts
      });
    });
    
    return providerMap;
  };

  // Format the full shift pattern description  
  const formatShiftPatternDescription = (series: ShiftSeries): string => {
    const startTime = formatTime(series.startDate);
    const endTime = formatTime(series.endDate);
    const firstDate = typeof series.startDate === 'string' 
      ? parseISO(series.startDate) 
      : series.startDate.toDate();
    const pattern = formatRecurrencePattern(series.pattern, series.firstShift);
    
    const formattedStartDate = format(firstDate, 'MMM d, yyyy');
    const endDateDisplay = series.recurrenceEndDate ? 
      format(typeof series.recurrenceEndDate === 'string' ? 
        parseISO(series.recurrenceEndDate) : 
        series.recurrenceEndDate.toDate(), 'MMM d, yyyy') : 
      'ongoing';
    
    // For vacation, return specific format
    if (series.isVacation) {
      return `Vacation: ${pattern} from ${formattedStartDate} until ${endDateDisplay}`;
    }
    
    // For regular shifts
    return `${startTime}-${endTime}, ${pattern} from ${formattedStartDate} until ${endDateDisplay}`;
  };
  
  // Generate and download the PDF report
  const generatePdf = () => {
    if (!dataLoaded) {
      setError('Please wait for data to load before generating report');
      return;
    }
    
    if (!isAuthenticated) {
      setError('Authentication required. Please log in.');
      return;
    }
    
    try {
      setLoading(true);
      
      // Create new PDF document
      const doc = new jsPDF();
      
      // Set up document properties
      doc.setProperties({
        title: 'Provider Shift Patterns Report',
        subject: 'Shift scheduling patterns by provider',
        author: 'Calendar Application',
        creator: 'Shift Pattern Report Generator'
      });
      
      // Add title
      doc.setFontSize(18);
      doc.text('Provider Shift Patterns Report', 14, 20);
      doc.setFontSize(11);
      doc.text(`Generated on ${format(new Date(), 'MMM d, yyyy h:mm a')}`, 14, 28);
      
      // Group shifts by provider and series
      const providerMap = groupShiftsBySeries();
      
      let yPosition = 40;
      const pageHeight = doc.internal.pageSize.height;
      
      // Iterate through each provider
      Array.from(providerMap.entries()).forEach(([providerId, data]) => {
        const { provider, recurringShiftSeries, oneTimeShifts } = data;
        
        // Check if we need a new page
        if (yPosition > pageHeight - 40) {
          doc.addPage();
          yPosition = 20;
        }
        
        // Provider header
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 128);
        doc.text(`${provider.firstName} ${provider.lastName}`, 14, yPosition);
        yPosition += 8;
        
        // If provider has no shifts, note that
        if (recurringShiftSeries.length === 0 && oneTimeShifts.length === 0) {
          doc.setFontSize(11);
          doc.setTextColor(100, 100, 100);
          doc.text('No shifts scheduled', 14, yPosition);
          yPosition += 15;
          return;
        }
        
        // Display recurring shift patterns
        if (recurringShiftSeries.length > 0) {
          doc.setFontSize(12);
          doc.setTextColor(0, 0, 0);
          doc.text('Recurring Shift Patterns:', 14, yPosition);
          yPosition += 7;
          
          // Table for recurring shifts with enhanced description
          const recurringTableData = recurringShiftSeries.map((series: ShiftSeries) => {
            const clinicName = getClinicTypeName(series.clinicTypeId || '');
            const patternDescription = formatShiftPatternDescription(series);
            
            return [
              patternDescription,
              clinicName,
              series.location || 'N/A',
              series.notes || ''
            ];
          });
          
          // Add recurring shifts table with updated columns
          autoTable(doc, {
            startY: yPosition,
            head: [['Shift Pattern', 'Clinic', 'Location', 'Notes']],
            body: recurringTableData,
            theme: 'striped',
            headStyles: { fillColor: [66, 133, 244], textColor: 255 },
            margin: { left: 14, right: 14 },
            styles: { overflow: 'linebreak', cellWidth: 'auto' },
            columnStyles: {
              0: { cellWidth: 90 },
              1: { cellWidth: 30 },
              2: { cellWidth: 30 },
              3: { cellWidth: 40 }
            }
          });
          
          // @ts-ignore - TS doesn't recognize the lastAutoTable property
          yPosition = doc.lastAutoTable.finalY + 10;
        }
        
        // Display one-time shifts if any
        if (oneTimeShifts.length > 0) {
          // Check if we need a new page
          if (yPosition > pageHeight - 40) {
            doc.addPage();
            yPosition = 20;
          }
          
          doc.setFontSize(12);
          doc.setTextColor(0, 0, 0);
          doc.text('One-Time Shifts:', 14, yPosition);
          yPosition += 7;
          
          // Table for one-time shifts
          const oneTimeTableData = oneTimeShifts.map(shift => {
            const date = formatDate(shift.startDate).split(' ')[0] + ' ' + formatDate(shift.startDate).split(' ')[1];
            const startTime = formatTime(shift.startDate);
            const endTime = formatTime(shift.endDate);
            const clinicName = getClinicTypeName(shift.clinicTypeId);
            
            return [
              date,
              shift.isVacation ? 'Vacation' : `${startTime} - ${endTime}`,
              clinicName,
              shift.location || 'N/A',
              shift.notes || ''
            ];
          });
          
          // Add one-time shifts table
          autoTable(doc, {
            startY: yPosition,
            head: [['Date', 'Time/Type', 'Clinic', 'Location', 'Notes']],
            body: oneTimeTableData,
            theme: 'striped',
            headStyles: { fillColor: [76, 175, 80], textColor: 255 },
            margin: { left: 14, right: 14 },
            styles: { overflow: 'linebreak', cellWidth: 'auto' },
            columnStyles: {
              0: { cellWidth: 25 },
              1: { cellWidth: 30 },
              2: { cellWidth: 30 },
              3: { cellWidth: 30 },
              4: { cellWidth: 40 }
            }
          });
          
          // @ts-ignore - TS doesn't recognize the lastAutoTable property
          yPosition = doc.lastAutoTable.finalY + 15;
        }
        
        // Add some space after each provider
        yPosition += 5;
      });
      
      // Save the PDF
      doc.save('provider-shift-patterns.pdf');
      enqueueSnackbar('Report generated successfully', { variant: 'success' });
      setLoading(false);
    } catch (err) {
      console.error('Error generating PDF: ', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Failed to generate PDF: ${errorMessage}`);
      enqueueSnackbar('Error generating report', { variant: 'error' });
      setLoading(false);
    }
  };
  
  return (
    <Paper elevation={1} sx={{ p: 3, my: 2 }}>
      <Typography variant="h6" component="h2" gutterBottom>
        Shift Pattern Report
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Generate a PDF report showing recurring shift patterns and one-time shifts for each provider.
        This report emphasizes the scheduling rules rather than individual shift instances.
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PictureAsPdf />}
          onClick={generatePdf}
          disabled={loading || !dataLoaded}
        >
          {loading ? 'Generating...' : 'Generate PDF Report'}
        </Button>
        
        {!dataLoaded && !loading && (
          <Button
            variant="outlined"
            sx={{ ml: 2 }}
            onClick={fetchData}
          >
            Load Data
          </Button>
        )}
        
        {dataLoaded && (
          <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
            Data loaded: {providers.length} providers, {shifts.length} shifts
          </Typography>
        )}
      </Box>
      
      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          The report will include:
        </Typography>
        <ul>
          <li>Recurring shift patterns shown as scheduling rules (e.g., "Every Monday, 9am-5pm")</li>
          <li>Pattern start and end dates for recurring shifts</li>
          <li>One-time shifts listed separately</li>
          <li>Organized by provider for easy review</li>
        </ul>
      </Box>
    </Paper>
  );
};

export default ShiftPatternReport; 