# Example Product Requirements Document (PRD) for calendar Application

---

## **Project Overview**
The goal of this project is to develop a web application that allows supervisors to manage and monitor employee schedules using a calendar interface. The application will enable users to assign color-coded blocks to each employee for easy identification of their schedules across multiple days. Supervisors can add, modify, and remove employees and their associated color schemes. The application will support recurring shifts, conflict detection, and data export/import functionality. The initial target audience is small to medium-sized teams, but scalability for larger organizations is a consideration. 
**Key Differentiator**: Focus on day-based scheduling (no hourly shifts) with robust conflict resolution for recurring shifts.

---

## **Objectives**
- Provide a user-friendly interface for managing employee schedules.
- Allow color-coded visualization of employee schedules.
- Enable easy addition, modification, and removal of employees.
- Implement data export functionality for backups.
- Include an option to export schedules as PDFs.
- Support recurring shifts that repeat based on selected days.
- Ensure the application runs smoothly on modern web browsers.

## **Scope**
The application will be a web-based application with the following features:
- Calendar view (monthly and weekly, as specified in Functional Requirements).
- Color-coded schedule blocks for each employee.
- Employee management (add, edit, delete).
- Local storage for schedule data with optional cloud backup.
- Export schedules as PDF.
- Data export/import functionality for backups.
- Recurring shifts management.
- Conflict detection for overlapping shifts (e.g., same employee scheduled twice on a day).


## **Functional Requirements**
### 1. **User Interface**
- **Calendar View**: Display a calendar with weekly and monthly views.
- **Color Coding**: Assign unique colors to each employee for their schedule blocks.
- **Navigation**: Buttons to switch between weeks and months.
- **Employee List**: Sidebar or dropdown to list all employees with their assigned colors.
- **Accessibility**: Ensure keyboard navigation and screen reader compatibility.

### 2. **Employee Management**
- **Add Employee**: Form to add a new employee with name and color selection.
- **Edit Employee**: Option to change an employee's name or color.
- **Delete Employee**: Remove an employee from the schedule with confirmation prompts.

### 3. **Schedule Management**
- **Assign Shifts**: Click on a calendar day to assign it to employees. One-time shifts can be converted to recurring shifts via a modal interface.
- **Recurring Shifts**: 
  - **Repeat Every**: Specify the frequency (e.g., weekly).
  - **Days of the Week**: Select specific days for the shift to repeat.
  - **End Date**: Set an end date for the recurring shift.
  - **Remove Recurrence**: Option to remove the recurrence and keep individual shifts.
- **View Shifts**: Hover over or click on a shift to see details (employee name, day).
- **Edit Shifts**: Modify existing shifts (change employee, day, recurrence).

### 4. **Conflict Resolution**
- **Conflict Detection**: Automatically flag scheduling conflicts (e.g., overlapping shifts for the same employee).
- **Conflict Alerts**: Display warnings during shift assignment or editing **with options to override or resolve**.

### 5. **Data Storage**
- **Local Storage**: Save schedule data locally on the user's browser using IndexedDB or localStorage.
- **Data Backup**: Option to export/import schedule data for backup in JSON format.

### 6. **Export Functionality**
- **Export as PDF**: Export the current calendar view (weekly or monthly) as a PDF file with customizable headers/footers.
- **Data Export**: Export all schedule data to a file for backup purposes.
- **Data Import**: Import schedule data from a previously exported backup file with validation checks**.


## **Non-Functional Requirements**
- **Performance**: The application should load and respond quickly, even with 100+ employees/shifts. Benchmark: <2s load time on average hardware.
- **Usability**: Intuitive interface with minimal learning curve. 
- **Target**: First-time users should complete core tasks within 5 minutes.
- **Compatibility**: Should run on modern web browsers (Chrome, Firefox, Edge, Safari) including mobile browsers (view-only mode).
- **Security**: Ensure data is stored securely using encryption for local storage and is not easily accessible to unauthorized users.
- **Scalability**: Architecture should support horizontal scaling via cloud services (e.g., AWS, Firebase) for future expansion.


## **Technical Specifications**
- **Frontend**: 
  - HTML, CSS, JavaScript (React.js recommended for state management).
  - UI Framework: Material-UI or Ant Design for consistent components.
- **Backend**: 
  - Node.js with Express.js for server-side logic.
  - Integration with Airtable: Use Airtable API for CRUD operations if cloud storage is enabled.
- **Database**: 
  - Primary: Local storage (IndexedDB) for offline access.
  - Secondary: Airtable for optional cloud sync (future enhancement).
- **PDF Library**: jsPDF with html2canvas for accurate calendar rendering.
- **Version Control**: Azure DevOps for CI/CD pipelines.


## **Milestones**
1. **Project Setup**: Set up the development environment and initial project structure. 
2. **UI Design**: Develop the basic calendar interface and employee management forms. 
3. **Core Functionality**: Implement employee management and basic schedule assignment. 
4. **Recurring Shifts**: Add functionality for creating and managing recurring shifts. 
5. **Conflict Resolution**: Implement conflict detection and alerts. 
6. **Data Storage**: Integrate local storage and backup features. 
7. **Export Functionality**: Implement PDF export and data export/import features. 
8. **Testing**: Conduct thorough testing for bugs and usability issues. 
9. **Deployment**: Deploy the application to a web server using Netlify or Vercel.


## **Risks and Mitigation**
- **Risk**: Data loss due to local storage failure.
  - **Mitigation**: Implement data export/import functionality + periodic backup reminders.
- **Risk**: Airtable API rate limits affecting scalability.
  - **Mitigation**: Use local storage as the primary database; Airtable as optional.
- **Risk**: Complexity in recurring shift logic.
  - **Mitigation**: Use tested libraries like `rrule` for recurrence rules.
- **Risk**: GDPR compliance for EU users.
  - **Mitigation**: Encrypt locally stored data and provide data deletion workflows.


## **Future Enhancements**
- **Cloud Sync**: Option to sync data with Airtable/Firebase for multi-device access.
- **Notifications**: Email/SMS reminders for upcoming shifts.
- **Reporting**: Generate CSV/PDF reports on employee availability and shift coverage.
- **Role-Based Access**: Add permissions for admins, managers, and viewers.
- **Audit Log**: Track changes to shifts and employee details.

## Documentation

1. **Overview**: Briefly describe the purpose and functionality of the application.
2. **User Guide**:


   - **Getting Started**: Instructions on how to set up and access the application.
   - **Using the Calendar**: How to navigate and interact with the calendar interface.
   - **Employee Management**: Steps to add, edit, and delete employees.
   - **Shift Management**: How to assign, edit, and manage shifts, including recurring shifts.
   - **Exporting Data**: Instructions for exporting schedules as PDFs and backing up data.
3. **Technical Guide**: 
   - **Architecture**: Visual overview of frontend/backend/data flow.
   - **Database Schema**: ER diagram for local storage and Airtable tables.
   - **API Documentation**: Example endpoints for Airtable integration (if used).
4. **Troubleshooting**: Common issues and solutions. "Data not loading," "PDF export errors," etc.
5. **Future Enhancements**: Planned features and improvements.

## Proposed File Structure

1. **Frontend**:
   - `src/`
     - `components/`: 
       - `calendar/`: Dedicated components for calendar views (e.g., `WeekView.js`, `MonthView.js`).
       - `employees/`: Components for employee management (e.g., `EmployeeForm.js`, `EmployeeList.js`).
       - `shared/`: Reusable UI components (e.g., `ColorPicker.js`, `ConfirmationModal.js`).
     - `contexts/`: React contexts or Vue stores for global state (e.g., `ScheduleContext.js`).
     - `hooks/`: Custom React hooks (e.g., `useCalendarNavigation.js`).
     - `styles/`: 
       - `global.scss`: Global styles and variables.
       - `components/`: Component-specific SCSS/CSS modules.
     - `utils/`: 
       - `dateHelpers.js`: Date formatting and recurrence logic.
       - `pdfGenerator.js`: PDF export utilities.
       - `validation.js`: Input validation for forms.
     - `App.jsx`/`App.vue`: Main application component.
     - `main.jsx`/`main.js`: Entry point.
   - `public/`: 
     - `index.html`: Base HTML file.
     - `assets/`: Images, icons, or fonts.

2. **Backend** (if applicable for future cloud sync):
   - `server/`
     - `routes/`: 
       - `api/`: RESTful endpoints (e.g., `shifts.js`, `employees.js`).
     - `models/`: Database schemas (e.g., `Shift.js`, `Employee.js`).
     - `controllers/`: Business logic (e.g., `shiftController.js`).
     - `middleware/`: Auth, error handling, or validation middleware.
     - `services/`: External integrations (e.g., Airtable API wrapper).
     - `app.js`: Server setup and configuration.


3. **Config**:
   - `config/`: 
     - `env/`: Environment variables (e.g., `.env.development`, `.env.production`).
     - `airtable.js`: Airtable API configuration.
     - `.env.example`: Template for required environment variables.


4. **Tests**:
   - `tests/`:
     - `unit/`: Unit tests for components, utils, and hooks.
     - `integration/`: Integration tests for API endpoints or complex workflows.
     - `e2e/`: End-to-end tests (e.g., Cypress or Playwright).


5. **Documentation**:
   - `docs/`:
     - `user-guide/`: Step-by-step user documentation.
     - `technical/`: 
       - `architecture.md`: High-level system design.
       - `api-reference.md`: API endpoint details.
     - `diagrams/`: ER diagrams, flowcharts, or wireframes.


6. **Scripts** (Optional but helpful):
   - `scripts/`: 
     - `seed-db.js`: Script to populate test data.
     - `migrate.js`: Database schema migration scripts.

## **Database Schema**
### **Users Table**
#### **ID**: Unique identifier for each user [formula (RECORD_ID())]
#### **Email**: User's email address [single line text field]
#### **Name**: User's name [single line text field]
#### **Role**: User's role in the application [single select field with options: admin, manager, viewer]
#### **Status**: Current status of the user [single select field with options: active, inactive]
#### **Last Modified**: Timestamp of the last modification [formula (DATETIME_NOW())]
#### **Last Modified By**: User who last modified the record [formula (CURRENT_USER())]
#### **Employees**: Link to the Employees table.
#### **Shifts**: Link to the Shifts table.

### **Employees Table**
#### **ID**: Unique identifier for each employee [formula (RECORD_ID())]
#### **Name**: Employee's name [single line text field]
#### **Display Color**: Color assigned to the employee for schedule visualization [color field]
#### **Status**: Current status of the employee [single select field with options: active, inactive]
#### **Created By**: User who created the record [formula (CURRENT_USER())]
#### **Created At**: Timestamp of when the employee was created [formula (DATETIME_NOW())]
#### **Last Modified**: Timestamp of the last modification [formula (DATETIME_NOW())]
#### **Last Modified By**: User who last modified the record [formula (CURRENT_USER())]
#### **Shifts**: Link to the Shifts table.

### **Shifts Table**
#### **ID**: Unique identifier for each shift [formula (RECORD_ID())]
#### **Employee**: Link to the Employees table.
#### **Assignee**: Person assigned to the shift.
#### **Start Date**: Start date of the shift [date field (2/3/2025)].
#### **End Date**: End date of the shift [date field (2/3/2025)].
#### **Schedule Type**: Type of schedule [single select field with options: recurring, one-time].
#### **Notes**: Additional notes about the shift [long text field].
#### **Recurring Pattern**: Pattern for recurring shifts [single select field with options: daily, weekly, every other week, monthly].
#### **Recurrence Rule**: Rules for recurrence [single select field with options: weekly, every other week, monthly].
#### **Created By**: User who created the record [formula (CURRENT_USER())]
#### **Created At**: Timestamp of when the shift was created [formula (DATETIME_NOW())]
#### **Last Modified**: Timestamp of the last modification [formula (DATETIME_NOW())]
#### **Last Modified By**: User who last modified the record [formula (CURRENT_USER())]


## **Conclusion**
This PRD outlines the requirements for a supervisor-focused scheduling tool with day-based shifts, conflict resolution, and offline capabilities. By prioritizing simplicity and scalability, the application aims to reduce administrative overhead while ensuring clarity in team management. 

- Airtable Integration: If Airtable is the primary database, ensure the services/ folder includes a wrapper for its API.
- Local Storage: Since the app uses browser storage, document how data is structured in docs/technical/storage.md.
- Conflict Detection: Add a utils/conflictDetection.js file for shift conflict logic.

### **Next steps**: Finalize UI wireframes and conduct a technical feasibility review for Airtable integration.

One-Time, Multiple-Day Shift
Definition: A shift that spans multiple consecutive days but occurs only once.
Characteristics:
- It is scheduled for a specific start and end date.
- It does not repeat after the initial occurrence.
Example: An employee is assigned to work from Monday to Wednesday of a particular week, and this schedule does not repeat in subsequent weeks.

Recurring Series of Multiple-Day Shifts
Definition: A shift pattern that repeats over a series of days on a regular basis.
Characteristics:
- It involves a set of days that repeat according to a specified frequency (e.g., weekly).
- The recurrence can be set to continue indefinitely or until a specified end date.
Example: An employee works Monday to Wednesday every week, and this pattern continues for several weeks or until a specified end date.

### Version 2.0 Architecture

#### Overview
Version 2.0 represents a significant shift from the original architecture, moving from a static single-user application to a multi-user SharePoint-integrated solution.

#### Key Changes from v1
- Repository moved from `provider-schedule-static` to `provider-schedule-v2`
- Integration with Microsoft authentication
- SharePoint-based file storage for multi-user access
- Real-time schedule synchronization across users

#### Deployment Structure
- **Azure DevOps Repository**: https://red-wave-084efcf0f.4.azurestaticapps.net
- **SharePoint Integration**: 
  - Folder: `/Shared Documents/Provider Schedule`
  - Files:
    - `latest.json` - Most recent schedule state
    - `schedule-backup-[timestamp].json` - Versioned backups

#### Authentication Flow
1. User accesses application through SharePoint button/link
2. Microsoft authentication triggered
3. On successful auth, app loads latest schedule from SharePoint
4. Changes automatically sync to SharePoint for other users

#### Data Flow
1. **Initial Load**:
   - Check SharePoint for `latest.json`
   - Fall back to localStorage if SharePoint unavailable
   - Initialize application with most recent data

2. **Save Operations**:
   - Save to SharePoint with timestamp
   - Update `latest.json` for quick access
   - Maintain localStorage backup
   - Log changes in audit trail

3. **Multi-user Sync**:
   - Each save creates new timestamped backup
   - Other users load most recent version on access
   - Conflict resolution based on timestamp

#### SharePoint Integration
- **Location**: Clinica Medicos SharePoint site
- **Access Control**: Microsoft authentication required
- **Backup Strategy**: 
  - Automatic versioning through timestamped files
  - Local storage fallback
  - Manual export option for administrators

#### User Access Levels
1. **Administrators**:
   - Full access to all features
   - Can export/import data
   - Manage user permissions
2. **Providers**:
   - View and modify schedules
   - Cannot delete or manage users
3. **Viewers**:
   - Read-only access
   - Can view but not modify schedules 