import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { format, parseISO } from 'date-fns';

// Interfaces that match the database models
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
  startDate: string | any; // ISO string or Firestore timestamp
  endDate: string | any; // ISO string or Firestore timestamp
  isVacation: boolean;
  isRecurring: boolean;
  recurrencePattern?: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  recurrenceEndDate?: string | any; // ISO string or Firestore timestamp
  seriesId?: string;
  notes?: string;
  location?: string;
}

/**
 * Utility class for generating shift pattern exports
 */
export class ShiftPatternExport {
  private providers: Provider[];
  private clinicTypes: ClinicType[];
  private shifts: Shift[];

  constructor(providers: Provider[], clinicTypes: ClinicType[], shifts: Shift[]) {
    this.providers = providers;
    this.clinicTypes = clinicTypes;
    this.shifts = shifts;
  }

  /**
   * Generate and download a PDF report of shift patterns
   * @returns Promise that resolves when PDF is generated
   */
  public async generatePdf(): Promise<void> {
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
    const providerMap = this.groupShiftsBySeries();
    
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
        const recurringTableData = recurringShiftSeries.map(series => {
          const clinicName = this.getClinicTypeName(series.clinicTypeId);
          const patternDescription = this.formatShiftPatternDescription(series);
          
          return [
            patternDescription,
            clinicName,
            series.location || 'N/A',
            series.notes || ''
          ];
        });
        
        // Add recurring shifts table with updated columns
        doc.autoTable({
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
        
        yPosition = (doc as any).lastAutoTable.finalY + 10;
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
          const date = this.formatDate(shift.startDate).split(' ')[0] + ' ' + this.formatDate(shift.startDate).split(' ')[1];
          const startTime = this.formatTime(shift.startDate);
          const endTime = this.formatTime(shift.endDate);
          const clinicName = this.getClinicTypeName(shift.clinicTypeId);
          
          return [
            date,
            shift.isVacation ? 'Vacation' : `${startTime} - ${endTime}`,
            clinicName,
            shift.location || 'N/A',
            shift.notes || ''
          ];
        });
        
        // Add one-time shifts table
        doc.autoTable({
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
        
        yPosition = (doc as any).lastAutoTable.finalY + 15;
      }
      
      // Add some space after each provider
      yPosition += 5;
    });
    
    // Save the PDF
    doc.save('provider-shift-patterns.pdf');
  }

  /**
   * Format date for display
   */
  private formatDate(date: any): string {
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
  }
  
  /**
   * Format time only (for displaying shift times)
   */
  private formatTime(date: any): string {
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
  }
  
  /**
   * Get provider name from provider ID
   */
  private getProviderName(providerId: string): string {
    const provider = this.providers.find(p => p.id === providerId);
    if (!provider) return 'Unknown Provider';
    return `${provider.firstName} ${provider.lastName}`;
  }
  
  /**
   * Get clinic type name from clinic type ID
   */
  private getClinicTypeName(clinicTypeId?: string): string {
    if (!clinicTypeId) return 'No Clinic';
    const clinicType = this.clinicTypes.find(c => c.id === clinicTypeId);
    if (!clinicType) return 'Unknown Clinic';
    return clinicType.name;
  }

  /**
   * Get weekday name from a date
   */
  private getWeekdayName(date: Date): string {
    return format(date, 'EEEE');
  }
  
  /**
   * Determine what days of the week a recurring shift occurs on
   */
  private getDaysOfWeek(firstShift: any, pattern: string): string {
    if (!firstShift.startDate) return 'Unknown days';
    
    const startDate = typeof firstShift.startDate === 'string' 
      ? parseISO(firstShift.startDate) 
      : firstShift.startDate.toDate();
    
    const dayName = this.getWeekdayName(startDate);
    
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
  }
  
  /**
   * Convert recurrence pattern to human-readable text
   */
  private formatRecurrencePattern(pattern?: string, firstShift?: any): string {
    if (!pattern || !firstShift) return 'N/A';
    
    const startDate = typeof firstShift.startDate === 'string' 
      ? parseISO(firstShift.startDate) 
      : firstShift.startDate.toDate();
    
    const days = this.getDaysOfWeek(firstShift, pattern);
    
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
  }

  /**
   * Format the full shift pattern description
   */
  private formatShiftPatternDescription(series: any): string {
    const startTime = this.formatTime(series.startDate);
    const endTime = this.formatTime(series.endDate);
    const firstDate = typeof series.startDate === 'string' 
      ? parseISO(series.startDate) 
      : series.startDate.toDate();
    const pattern = this.formatRecurrencePattern(series.pattern, series.firstShift);
    
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
  }
  
  /**
   * Group shifts by series for recurring shifts
   */
  private groupShiftsBySeries(): Map<string, any> {
    // Create map of providers
    const providerMap = new Map();
    
    // First, separate shifts by provider
    this.providers.forEach(provider => {
      const providerShifts = this.shifts.filter(shift => shift.providerId === provider.id);
      
      // Separate recurring and non-recurring shifts
      const recurringShifts = providerShifts.filter(shift => shift.isRecurring);
      const oneTimeShifts = providerShifts.filter(shift => !shift.isRecurring);
      
      // Group recurring shifts by series ID
      const seriesMap = new Map();
      recurringShifts.forEach(shift => {
        if (!shift.seriesId) return;
        
        if (!seriesMap.has(shift.seriesId)) {
          seriesMap.set(shift.seriesId, []);
        }
        seriesMap.get(shift.seriesId).push(shift);
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
  }
}

/**
 * Generate and download a PDF report of shift patterns
 * @param providers List of all providers
 * @param clinicTypes List of all clinic types
 * @param shifts List of all shifts
 * @returns Promise that resolves when the PDF is generated and downloaded
 */
export const generateShiftPatternPdf = async (
  providers: Provider[],
  clinicTypes: ClinicType[],
  shifts: Shift[]
): Promise<void> => {
  const exporter = new ShiftPatternExport(providers, clinicTypes, shifts);
  return exporter.generatePdf();
}; 