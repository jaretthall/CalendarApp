-- Calendar Application Database Schema

-- Providers table
CREATE TABLE Providers (
    ProviderID INT PRIMARY KEY IDENTITY(1,1),
    FirstName NVARCHAR(100) NOT NULL,
    LastName NVARCHAR(100) NOT NULL,
    Email NVARCHAR(255),
    Color NVARCHAR(7) NOT NULL,
    Status NVARCHAR(20) NOT NULL DEFAULT 'active',
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    ModifiedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

-- ClinicTypes table
CREATE TABLE ClinicTypes (
    ClinicTypeID INT PRIMARY KEY IDENTITY(1,1),
    Name NVARCHAR(100) NOT NULL,
    Color NVARCHAR(7) NOT NULL,
    Status NVARCHAR(20) NOT NULL DEFAULT 'active',
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    ModifiedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

-- Shifts table
CREATE TABLE Shifts (
    ShiftID INT PRIMARY KEY IDENTITY(1,1),
    ProviderID INT NOT NULL,
    ClinicTypeID INT,
    StartDate DATETIME2 NOT NULL,
    EndDate DATETIME2 NOT NULL,
    IsVacation BIT NOT NULL DEFAULT 0,
    IsRecurring BIT NOT NULL DEFAULT 0,
    RecurrencePattern NVARCHAR(20),
    RecurrenceEndDate DATETIME2,
    SeriesID UNIQUEIDENTIFIER,
    Notes NVARCHAR(MAX),
    Location NVARCHAR(100),
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    ModifiedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_Shifts_Providers FOREIGN KEY (ProviderID) REFERENCES Providers(ProviderID),
    CONSTRAINT FK_Shifts_ClinicTypes FOREIGN KEY (ClinicTypeID) REFERENCES ClinicTypes(ClinicTypeID),
    CONSTRAINT CHK_Shifts_DateRange CHECK (EndDate >= StartDate),
    CONSTRAINT CHK_Shifts_RecurrenceEndDate CHECK (RecurrenceEndDate IS NULL OR RecurrenceEndDate >= StartDate)
);

-- Settings table for application configuration
CREATE TABLE Settings (
    SettingID INT PRIMARY KEY IDENTITY(1,1),
    SettingKey NVARCHAR(100) NOT NULL UNIQUE,
    SettingValue NVARCHAR(MAX),
    Description NVARCHAR(255),
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    ModifiedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

-- SyncLogs table to track synchronization with SharePoint
CREATE TABLE SyncLogs (
    SyncLogID INT PRIMARY KEY IDENTITY(1,1),
    SyncType NVARCHAR(50) NOT NULL, -- 'export', 'import', 'backup'
    Status NVARCHAR(20) NOT NULL, -- 'success', 'failed'
    SharePointPath NVARCHAR(255),
    FileName NVARCHAR(255),
    RecordsProcessed INT,
    ErrorMessage NVARCHAR(MAX),
    SyncedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

-- Users table for authentication
CREATE TABLE Users (
    UserID INT PRIMARY KEY IDENTITY(1,1),
    Username NVARCHAR(100) NOT NULL UNIQUE,
    Email NVARCHAR(255) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(255), -- Only used if not using Azure AD
    IsAdmin BIT NOT NULL DEFAULT 0,
    AzureADID NVARCHAR(255), -- For Azure AD integration
    LastLogin DATETIME2,
    Status NVARCHAR(20) NOT NULL DEFAULT 'active',
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    ModifiedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

-- Add new tables for calendar notes and comments

-- CalendarNotes table
CREATE TABLE CalendarNotes (
    NoteID INT PRIMARY KEY IDENTITY(1,1),
    MonthYear NVARCHAR(7) NOT NULL, -- Format: YYYY-MM
    Content NVARCHAR(MAX),
    LastModifiedBy INT, -- Reference to UserID
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    ModifiedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_Notes_Users FOREIGN KEY (LastModifiedBy) REFERENCES Users(UserID)
);

-- CalendarComments table
CREATE TABLE CalendarComments (
    CommentID INT PRIMARY KEY IDENTITY(1,1),
    MonthYear NVARCHAR(7) NOT NULL, -- Format: YYYY-MM
    UserID INT NOT NULL,
    Content NVARCHAR(MAX) NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_Comments_Users FOREIGN KEY (UserID) REFERENCES Users(UserID)
);

-- Create indexes for performance
CREATE INDEX IX_CalendarNotes_MonthYear ON CalendarNotes(MonthYear);
CREATE INDEX IX_CalendarComments_MonthYear ON CalendarComments(MonthYear);

-- Insert sample data
INSERT INTO ClinicTypes (Name, Color) VALUES 
('Main Clinic', '#2196f3'),
('Pediatric', '#ff9800'),
('Urgent Care', '#f44336'),
('Specialty', '#9c27b0');

INSERT INTO Providers (FirstName, LastName, Color) VALUES 
('John', 'Doe', '#4caf50'),
('Jane', 'Smith', '#2196f3'),
('Michael', 'Johnson', '#f44336'),
('Sarah', 'Williams', '#ff9800');

-- Insert settings
INSERT INTO Settings (SettingKey, SettingValue, Description) VALUES
('SharePointSiteUrl', '', 'URL of the SharePoint site for sync'),
('SharePointLibrary', 'CalendarData', 'Document library name in SharePoint'),
('SyncFrequency', 'daily', 'How often to sync with SharePoint'),
('LastSyncTime', NULL, 'Last successful sync timestamp');

-- Create indexes for performance
CREATE INDEX IX_Shifts_ProviderID ON Shifts(ProviderID);
CREATE INDEX IX_Shifts_ClinicTypeID ON Shifts(ClinicTypeID);
CREATE INDEX IX_Shifts_DateRange ON Shifts(StartDate, EndDate);
CREATE INDEX IX_Shifts_SeriesID ON Shifts(SeriesID) WHERE SeriesID IS NOT NULL; 