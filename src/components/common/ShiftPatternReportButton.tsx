import React, { useState } from 'react';
import { Button, CircularProgress, Tooltip } from '@mui/material';
import { PictureAsPdf } from '@mui/icons-material';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { generateShiftPatternPdf } from '../../utils/ShiftPatternExport';

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
      const providersSnapshot = await getDocs(collection(db, 'providers'));
      const providers = providersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      const clinicTypesSnapshot = await getDocs(collection(db, 'clinicTypes'));
      const clinicTypes = clinicTypesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      const shiftsSnapshot = await getDocs(collection(db, 'shifts'));
      const shifts = shiftsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
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