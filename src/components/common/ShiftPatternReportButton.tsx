import React, { useState } from 'react';
import { Button, CircularProgress, Tooltip } from '@mui/material';
import { PictureAsPdf } from '@mui/icons-material';
import { collection, getDocs } from 'firebase/firestore';
import { firestore } from '../../config/firebase-config';
import { generateShiftPatternPdf } from '../../utils/ShiftPatternExport';

// Define the types to match those expected by generateShiftPatternPdf
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

interface ShiftPatternReportButtonProps {
  variant?: 'text' | 'outlined' | 'contained';
  color?: 'inherit' | 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
  size?: 'small' | 'medium' | 'large';
  tooltip?: string;
  fullWidth?: boolean;
}

/**
 * A reusable button component for generating shift pattern reports.
 * Can be placed on any page where administrators need to access reports.
 */
const ShiftPatternReportButton: React.FC<ShiftPatternReportButtonProps> = ({
  variant = 'contained',
  color = 'primary',
  size = 'medium',
  tooltip = 'Generate a PDF report showing recurring shift patterns',
  fullWidth = false
}) => {
  const [loading, setLoading] = useState(false);
  
  const handleGenerateReport = async () => {
    setLoading(true);
    try {
      // Fetch all the necessary data
      const providersSnapshot = await getDocs(collection(firestore, 'providers'));
      const providers = providersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Provider[];
      
      const clinicTypesSnapshot = await getDocs(collection(firestore, 'clinicTypes'));
      const clinicTypes = clinicTypesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ClinicType[];
      
      const shiftsSnapshot = await getDocs(collection(firestore, 'shifts'));
      const shifts = shiftsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Shift[];
      
      // Generate the PDF
      await generateShiftPatternPdf(providers, clinicTypes, shifts);
    } catch (error) {
      console.error('Error generating shift pattern report:', error);
      // In a real app, you might want to show an error message to the user
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Tooltip title={tooltip}>
      <span>
        <Button
          variant={variant}
          color={color}
          size={size}
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PictureAsPdf />}
          onClick={handleGenerateReport}
          disabled={loading}
          fullWidth={fullWidth}
        >
          {loading ? 'Generating...' : 'Shift Pattern Report'}
        </Button>
      </span>
    </Tooltip>
  );
};

export default ShiftPatternReportButton; 