import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  IconButton,
  useTheme,
  ToggleButtonGroup,
  ToggleButton
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
  isSameMonth,
  addMonths,
  subMonths,
  isToday
} from 'date-fns';
import { useShifts } from '../../contexts/ShiftContext';
import { useClinicTypes } from '../../contexts/LocationContext';
import { useAuth } from '../../contexts/AuthContext';

const ThreeMonthView: React.FC = () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const theme = useTheme();
  const { shifts, openAddModal } = useShifts();
  const { getActiveClinicTypes } = useClinicTypes();
  const { isAuthenticated } = useAuth();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [splitView, setSplitView] = useState(true); // Default to split view
  const activeClinicTypes = getActiveClinicTypes();

  const handlePrevMonths = () => {
    setCurrentDate(subMonths(currentDate, 3));
  };

  const handleNextMonths = () => {
    setCurrentDate(addMonths(currentDate, 3));
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

  // Generate three months
  const months = [
    currentDate,
    addMonths(currentDate, 1),
    addMonths(currentDate, 2)
  ];

  // Function to generate calendar grid for a month
  const generateMonthGrid = (date: Date, clinicTypeId?: string) => {
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);
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

    return (
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          {format(date, 'MMMM yyyy')}
        </Typography>
        
        <Grid container>
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
            <Grid item xs={12 / 7} key={day} sx={{ textAlign: 'center', p: 0.5, borderBottom: '1px solid #e0e0e0' }}>
              <Typography variant="caption">
                {day}
              </Typography>
            </Grid>
          ))}
          
          {weeks.map((week, weekIndex) => (
            <React.Fragment key={`week-${weekIndex}`}>
              {week.map((day, dayIndex) => {
                const isCurrentMonthDay = isSameMonth(day, date);
                const isTodayDay = isToday(day);
                
                // Get shifts for this day and clinic type
                const dateStr = format(day, 'yyyy-MM-dd');
                const dayShifts = shifts.filter(shift => 
                  (shift.startDate <= dateStr && shift.endDate >= dateStr) &&
                  (!clinicTypeId || shift.clinicTypeId === clinicTypeId)
                );
                
                // Count shifts by type
                const regularShifts = dayShifts.filter(shift => !shift.isVacation);
                const vacationShifts = dayShifts.filter(shift => shift.isVacation);
                
                return (
                  <Grid 
                    item 
                    xs={12 / 7} 
                    key={`${weekIndex}-${dayIndex}`}
                    onClick={() => isAuthenticated && openAddModal(dateStr)}
                    sx={{
                      height: '40px',
                      p: 0.5,
                      textAlign: 'center',
                      backgroundColor: isTodayDay ? 'rgba(25, 118, 210, 0.1)' : 'transparent',
                      opacity: isCurrentMonthDay ? 1 : 0.5,
                      border: '1px solid #e0e0e0',
                      cursor: isAuthenticated ? 'pointer' : 'default',
                      position: 'relative',
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
                      }}
                    >
                      {format(day, 'd')}
                    </Typography>
                    
                    {/* Indicators for shifts */}
                    {regularShifts.length > 0 && (
                      <Box
                        sx={{
                          position: 'absolute',
                          bottom: 2,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          backgroundColor: 'primary.main',
                        }}
                      />
                    )}
                    
                    {vacationShifts.length > 0 && (
                      <Box
                        sx={{
                          position: 'absolute',
                          bottom: 2,
                          left: '30%',
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          backgroundColor: 'error.main',
                        }}
                      />
                    )}
                  </Grid>
                );
              })}
            </React.Fragment>
          ))}
        </Grid>
      </Box>
    );
  };

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" component="h1">
          Three Month View
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={handlePrevMonths}>
            <ArrowBack />
          </IconButton>
          
          <IconButton onClick={handleToday} sx={{ mx: 1 }}>
            <Typography variant="button">Today</Typography>
          </IconButton>
          
          <IconButton onClick={handleNextMonths}>
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
        </Box>
      </Box>
      
      <Box id="calendar-container" className="calendar-container">
        {splitView && activeClinicTypes.length > 1 ? (
          // Three Month view with horizontal split (one on top of the other)
          <Box>
            {activeClinicTypes.map(clinicType => (
              <Paper sx={{ p: 2, mb: 3 }} key={clinicType.id}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  {clinicType.name}
                </Typography>
                
                <Grid container spacing={2}>
                  {months.map((month, index) => (
                    <Grid item xs={12} md={4} key={index}>
                      {generateMonthGrid(month, clinicType.id)}
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            ))}
          </Box>
        ) : (
          <Paper sx={{ p: 2 }}>
            <Grid container spacing={2}>
              {months.map((month, index) => (
                <Grid item xs={12} md={4} key={index}>
                  {generateMonthGrid(month)}
                </Grid>
              ))}
            </Grid>
          </Paper>
        )}
      </Box>
    </Box>
  );
};

export default ThreeMonthView; 