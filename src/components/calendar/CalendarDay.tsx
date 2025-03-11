import React from 'react';
import { Box, Typography, Paper, Tooltip } from '@mui/material';
import { format, isToday } from 'date-fns';
import { useShifts } from '../../contexts/ShiftContext';
import { useProviders } from '../../contexts/EmployeeContext';
import { useAuth } from '../../contexts/AuthContext';

interface CalendarDayProps {
  date: Date;
  isCurrentMonth: boolean;
  clinicTypeId?: string;
  onClick: () => void;
}

const CalendarDay: React.FC<CalendarDayProps> = ({ 
  date, 
  isCurrentMonth, 
  clinicTypeId,
  onClick 
}) => {
  const { shifts, getShiftsByDateRange, openEditModal } = useShifts();
  const { getProviderById } = useProviders();
  const { isAuthenticated } = useAuth();
  
  const dateStr = format(date, 'yyyy-MM-dd');
  const dayShifts = getShiftsByDateRange(dateStr, dateStr)
    .filter(shift => !clinicTypeId || shift.clinicTypeId === clinicTypeId);
  
  // Separate regular shifts and vacations
  const regularShifts = dayShifts.filter(shift => !shift.isVacation);
  const vacationShifts = dayShifts.filter(shift => shift.isVacation);
  
  const handleShiftClick = (e: React.MouseEvent, shiftId: string) => {
    e.stopPropagation(); // Prevent day click from triggering
    
    if (!isAuthenticated) return;
    
    const shift = shifts.find(s => s.id === shiftId);
    if (shift) {
      openEditModal(shift);
    }
  };

  return (
    <Paper
      elevation={0}
      onClick={onClick}
      sx={{
        height: '100%',
        minHeight: 100,
        p: 1,
        backgroundColor: isToday(date) ? 'rgba(25, 118, 210, 0.1)' : 'transparent',
        opacity: isCurrentMonth ? 1 : 0.5,
        border: '1px solid #e0e0e0',
        cursor: isAuthenticated ? 'pointer' : 'default',
        '&:hover': {
          backgroundColor: isAuthenticated ? 'rgba(0, 0, 0, 0.04)' : 'transparent',
        },
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Typography
        variant="body2"
        align="right"
        sx={{
          fontWeight: isToday(date) ? 'bold' : 'normal',
          color: isToday(date) ? 'primary.main' : 'text.primary',
        }}
      >
        {format(date, 'd')}
      </Typography>
      
      <Box sx={{ 
        mt: 1, 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: 0.5, 
        flex: 1 
      }}>
        {regularShifts.map(shift => {
          const provider = getProviderById(shift.providerId);
          if (!provider) return null;
          
          const shiftElement = (
            <Box
              key={shift.id}
              onClick={(e) => handleShiftClick(e, shift.id)}
              sx={{
                backgroundColor: provider.color,
                width: '20px',
                height: '20px',
                borderRadius: '2px',
                cursor: isAuthenticated ? 'pointer' : 'default',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: '0.6rem',
                fontWeight: 'bold',
                '&:hover': {
                  opacity: isAuthenticated ? 0.8 : 1,
                },
              }}
            >
              {provider.firstName.charAt(0)}{provider.lastName.charAt(0)}
            </Box>
          );
          
          return (
            <Tooltip 
              key={shift.id}
              title={`${provider.firstName} ${provider.lastName}`}
              arrow
            >
              {shiftElement}
            </Tooltip>
          );
        })}
      </Box>
      
      {/* Vacation bar at the bottom */}
      {vacationShifts.length > 0 && (
        <Box sx={{ 
          mt: 'auto', 
          pt: 0.5,
          display: 'flex',
          flexDirection: 'column',
          gap: 0.5
        }}>
          {vacationShifts.map(shift => {
            const provider = getProviderById(shift.providerId);
            if (!provider) return null;
            
            const vacationElement = (
              <Box
                key={shift.id}
                onClick={(e) => handleShiftClick(e, shift.id)}
                sx={{
                  backgroundColor: '#f44336',
                  color: '#fff',
                  p: 0.5,
                  borderRadius: 1,
                  fontSize: '0.7rem',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  cursor: isAuthenticated ? 'pointer' : 'default',
                  '&:hover': {
                    opacity: isAuthenticated ? 0.8 : 1,
                  },
                }}
              >
                {`${provider.firstName.charAt(0)}${provider.lastName.charAt(0)} (Vacation)`}
              </Box>
            );
            
            return (
              <Tooltip 
                key={shift.id}
                title={`${provider.firstName} ${provider.lastName} (Vacation)`}
                arrow
              >
                {vacationElement}
              </Tooltip>
            );
          })}
        </Box>
      )}
    </Paper>
  );
};

export default CalendarDay; 