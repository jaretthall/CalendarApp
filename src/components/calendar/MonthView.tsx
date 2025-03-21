import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  IconButton,
  useTheme,
  ToggleButtonGroup,
  ToggleButton,
  Tooltip,
  Divider
} from '@mui/material';
import {
  ArrowBack,
  ArrowForward,
  ViewDay,
  ViewWeek
} from '@mui/icons-material';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isToday,
  isSameMonth,
  addMonths,
  subMonths
} from 'date-fns';
import { useShifts } from '../../contexts/ShiftContext';
import { useClinicTypes } from '../../contexts/LocationContext';
import { useAuth } from '../../contexts/AuthContext';
import { useProviders } from '../../contexts/EmployeeContext';
import NotesSection from './NotesSection';
import ShiftPatternReportButton from '../common/ShiftPatternReportButton';
import './Calendar.css';

const MonthView: React.FC = () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const theme = useTheme();
  const { shifts, openAddModal, openEditModal } = useShifts();
  const { getActiveClinicTypes } = useClinicTypes();
  const { isAuthenticated } = useAuth();
  const { getProviderById } = useProviders();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [splitView, setSplitView] = useState(false); // Default to combined view
  const activeClinicTypes = getActiveClinicTypes();
  
  useEffect(() => {
    console.log('MonthView rendered with date:', currentDate);
  }, [currentDate]);

  const handlePrevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleViewChange = (
    event: React.MouseEvent<HTMLElement>,
    newView: boolean | null
  ) => {
    if (newView !== null) {
      setSplitView(newView);
    }
  };

  // Get days for the current month
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Add days from previous and next month to fill the calendar grid
  const startDay = monthStart.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const endDay = monthEnd.getDay();
  
  const prevMonthDays = Array.from({ length: startDay }, (_, i) => 
    subMonths(monthStart, 1).setDate(
      endOfMonth(subMonths(monthStart, 1)).getDate() - startDay + i + 1
    )
  ).map(date => new Date(date));
  
  const nextMonthDays = Array.from({ length: 6 - endDay }, (_, i) => 
    addMonths(monthEnd, 1).setDate(i + 1)
  ).map(date => new Date(date));
  
  const allDays = [...prevMonthDays, ...daysInMonth, ...nextMonthDays];
  
  // Group days into weeks
  const weeks: Date[][] = [];
  for (let i = 0; i < allDays.length; i += 7) {
    weeks.push(allDays.slice(i, i + 7));
  }

  // Function to handle day click
  const handleDayClick = (date: Date) => {
    if (isAuthenticated) {
      const dateStr = format(date, 'yyyy-MM-dd');
      openAddModal(dateStr);
    }
  };

  // Function to handle shift click
  const handleShiftClick = (e: React.MouseEvent, shiftId: string) => {
    e.stopPropagation(); // Prevent day click from triggering
    if (isAuthenticated) {
      const shift = shifts.find(s => s.id === shiftId);
      if (shift) {
        openEditModal(shift);
      }
    }
  };

  // Function to render a day cell with shifts
  const renderDay = (day: Date, clinicTypeId?: string) => {
    const isCurrentMonthDay = isSameMonth(day, currentDate);
    const isTodayDay = isToday(day);
    const dateStr = format(day, 'yyyy-MM-dd');
    
    // Get shifts for this day and clinic type
    const dayShifts = shifts.filter(shift => 
      (shift.startDate <= dateStr && shift.endDate >= dateStr) &&
      (!clinicTypeId || shift.clinicTypeId === clinicTypeId)
    );
    
    // Separate regular shifts and vacations
    const regularShifts = dayShifts.filter(shift => !shift.isVacation);
    const vacationShifts = dayShifts.filter(shift => shift.isVacation);
    
    return (
      <Box
        onClick={() => handleDayClick(day)}
        sx={{
          height: '100%',
          minHeight: '60px',
          p: 0.5,
          backgroundColor: isTodayDay ? 'rgba(25, 118, 210, 0.1)' : 'transparent',
          opacity: isCurrentMonthDay ? 1 : 0.5,
          border: '1px solid #e0e0e0',
          display: 'flex',
          flexDirection: 'column',
          cursor: isAuthenticated ? 'pointer' : 'default',
          '&:hover': {
            backgroundColor: isAuthenticated ? 'rgba(0, 0, 0, 0.04)' : 'transparent',
          },
        }}
      >
        <Typography
          variant="caption"
          sx={{
            fontWeight: isTodayDay ? 'bold' : 'normal',
            color: isTodayDay ? 'primary.main' : 'text.primary',
            textAlign: 'right',
            width: '100%',
          }}
        >
          {format(day, 'd')}
        </Typography>
        
        <Box sx={{ 
          mt: 0.5, 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: 0.5, 
          flex: 1 
        }}>
          {regularShifts.map(shift => {
            const provider = getProviderById(shift.providerId);
            if (!provider) return null;
            
            return (
              <Tooltip 
                key={shift.id} 
                title={`${provider.firstName} ${provider.lastName}`}
                arrow
              >
                <Box
                  onClick={(e) => handleShiftClick(e, shift.id)}
                  sx={{
                    backgroundColor: provider.color,
                    width: '20px',
                    height: '20px',
                    borderRadius: '2px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: '0.6rem',
                    fontWeight: 'bold',
                    cursor: isAuthenticated ? 'pointer' : 'default',
                    '&:hover': {
                      opacity: isAuthenticated ? 0.8 : 1,
                    },
                  }}
                >
                  {provider.firstName.charAt(0)}{provider.lastName.charAt(0)}
                </Box>
              </Tooltip>
            );
          })}
        </Box>
        
        {/* Vacation indicators */}
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
              
              return (
                <Tooltip 
                  key={shift.id} 
                  title={`${provider.firstName} ${provider.lastName} (Vacation)`}
                  arrow
                >
                  <Box
                    onClick={(e) => handleShiftClick(e, shift.id)}
                    sx={{
                      backgroundColor: '#f44336',
                      color: '#fff',
                      p: 0.25,
                      borderRadius: 1,
                      fontSize: '0.6rem',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      cursor: isAuthenticated ? 'pointer' : 'default',
                      '&:hover': {
                        opacity: isAuthenticated ? 0.8 : 1,
                      },
                    }}
                  >
                    {`${provider.firstName.charAt(0)}${provider.lastName.charAt(0)}`}
                  </Box>
                </Tooltip>
              );
            })}
          </Box>
        )}
      </Box>
    );
  };

  return (
    <React.Fragment>
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" component="h1">
            {format(currentDate, 'MMMM yyyy')}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton onClick={handlePrevMonth}>
              <ArrowBack />
            </IconButton>
            
            <IconButton onClick={handleToday} sx={{ mx: 1 }}>
              <Typography variant="button">Today</Typography>
            </IconButton>
            
            <IconButton onClick={handleNextMonth}>
              <ArrowForward />
            </IconButton>
            
            <ToggleButtonGroup
              value={splitView}
              exclusive
              onChange={handleViewChange}
              aria-label="view mode"
              size="small"
              sx={{ ml: 2 }}
            >
              <ToggleButton value={false} aria-label="combined view">
                <ViewDay />
              </ToggleButton>
              <ToggleButton value={true} aria-label="split view">
                <ViewWeek />
              </ToggleButton>
            </ToggleButtonGroup>
            
            <Divider orientation="vertical" flexItem sx={{ mx: 2 }} />
            
            <ShiftPatternReportButton 
              variant="outlined" 
              size="small"
              tooltip="Generate a PDF report showing recurring shift patterns rather than individual shifts"
            />
          </Box>
        </Box>
        
        <Box id="calendar-container" className="calendar-container">
          {splitView && activeClinicTypes.length > 1 ? (
            // Split view code
            <Grid container spacing={2}>
              {activeClinicTypes.map(clinicType => (
                <Grid item xs={12} md={6} key={clinicType.id}>
                  <Paper sx={{ p: 2, mb: 2 }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      {clinicType.name}
                    </Typography>
                    
                    <Grid container className="calendar-grid">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <Grid item xs={12 / 7} key={day} className="calendar-day-header">
                          <Typography variant="subtitle2" align="center">
                            {day}
                          </Typography>
                        </Grid>
                      ))}
                      
                      {weeks.map((week, weekIndex) => (
                        <React.Fragment key={`week-${weekIndex}`}>
                          {week.map((day, dayIndex) => (
                            <Grid item xs={12 / 7} key={`${weekIndex}-${dayIndex}`}>
                              {renderDay(day, clinicType.id)}
                            </Grid>
                          ))}
                        </React.Fragment>
                      ))}
                    </Grid>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          ) : (
            // Combined view code
            <Paper sx={{ p: 2 }}>
              <Grid container className="calendar-grid">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <Grid item xs={12 / 7} key={day} className="calendar-day-header">
                    <Typography variant="subtitle2" align="center">
                      {day}
                    </Typography>
                  </Grid>
                ))}
                
                {weeks.map((week, weekIndex) => (
                  <React.Fragment key={`week-${weekIndex}`}>
                    {week.map((day, dayIndex) => (
                      <Grid item xs={12 / 7} key={`${weekIndex}-${dayIndex}`}>
                        {renderDay(day)}
                      </Grid>
                    ))}
                  </React.Fragment>
                ))}
              </Grid>
            </Paper>
          )}
        </Box>
      </Box>
      
      {/* Notes Section */}
      <NotesSection date={currentDate} />
    </React.Fragment>
  );
};

export default MonthView; 