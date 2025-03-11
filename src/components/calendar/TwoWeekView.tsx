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
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addWeeks,
  subWeeks
} from 'date-fns';
import { useShifts } from '../../contexts/ShiftContext';
import { useClinicTypes } from '../../contexts/LocationContext';
import { useAuth } from '../../contexts/AuthContext';
import CalendarDay from './CalendarDay';

const TwoWeekView: React.FC = () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const theme = useTheme();
  const { openAddModal } = useShifts();
  const { getActiveClinicTypes } = useClinicTypes();
  const { isAuthenticated } = useAuth();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [splitView, setSplitView] = useState(true); // Default to split view
  const activeClinicTypes = getActiveClinicTypes();

  const handlePrevWeeks = () => {
    setCurrentDate(subWeeks(currentDate, 2));
  };

  const handleNextWeeks = () => {
    setCurrentDate(addWeeks(currentDate, 2));
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

  // Get days for the current two weeks
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const twoWeeksEnd = endOfWeek(addWeeks(weekStart, 1), { weekStartsOn: 0 });
  const daysInTwoWeeks = eachDayOfInterval({ start: weekStart, end: twoWeeksEnd });

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" component="h1">
          {`${format(weekStart, 'MMM d')} - ${format(twoWeeksEnd, 'MMM d, yyyy')}`}
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={handlePrevWeeks}>
            <ArrowBack />
          </IconButton>
          
          <IconButton onClick={handleToday} sx={{ mx: 1 }}>
            <Typography variant="button">Today</Typography>
          </IconButton>
          
          <IconButton onClick={handleNextWeeks}>
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
          // Two Week view with horizontal split (one on top of the other)
          <Box>
            {activeClinicTypes.map(clinicType => (
              <Paper sx={{ p: 2, mb: 3 }} key={clinicType.id}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  {clinicType.name}
                </Typography>
                
                <Grid container>
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <Grid item xs={12 / 7} key={day} sx={{ textAlign: 'center', p: 1, borderBottom: '1px solid #e0e0e0' }}>
                      <Typography variant="subtitle2">
                        {day}
                      </Typography>
                    </Grid>
                  ))}
                  
                  {daysInTwoWeeks.map((day, index) => (
                    <Grid item xs={12 / 7} key={index} sx={{ height: '120px', borderBottom: index < 7 ? '1px solid #e0e0e0' : 'none' }}>
                      <CalendarDay 
                        date={day} 
                        isCurrentMonth={true}
                        clinicTypeId={clinicType.id}
                        onClick={() => isAuthenticated && openAddModal(format(day, 'yyyy-MM-dd'))}
                      />
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            ))}
          </Box>
        ) : (
          <Paper sx={{ p: 2 }}>
            <Grid container>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <Grid item xs={12 / 7} key={day} sx={{ textAlign: 'center', p: 1, borderBottom: '1px solid #e0e0e0' }}>
                  <Typography variant="subtitle2">
                    {day}
                  </Typography>
                </Grid>
              ))}
              
              {daysInTwoWeeks.map((day, index) => (
                <Grid item xs={12 / 7} key={index} sx={{ height: '120px', borderBottom: index < 7 ? '1px solid #e0e0e0' : 'none' }}>
                  <CalendarDay 
                    date={day} 
                    isCurrentMonth={true}
                    onClick={() => isAuthenticated && openAddModal(format(day, 'yyyy-MM-dd'))}
                  />
                </Grid>
              ))}
            </Grid>
          </Paper>
        )}
      </Box>
    </Box>
  );
};

export default TwoWeekView; 