// Real implementation of DatabaseService for SQL Server
import { ConnectionPool, TYPES } from 'mssql';
import { v4 as uuidv4 } from 'uuid';

// Types
interface Provider {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  color: string;
  status: string;
}

interface ClinicType {
  id: string;
  name: string;
  color: string;
  status: string;
}

interface Shift {
  id: string;
  providerId: string;
  clinicTypeId?: string;
  startDate: string;
  endDate: string;
  isVacation: boolean;
  isRecurring: boolean;
  recurrencePattern?: string;
  recurrenceEndDate?: string;
  seriesId?: string;
  notes?: string;
  location?: string;
}

interface DatabaseConfig {
  server: string;
  database: string;
  user: string;
  password: string;
  port?: number;
  encrypt?: boolean;
  trustServerCertificate?: boolean;
}

class RealDatabaseService {
  private pool: ConnectionPool | null = null;
  private isConnected: boolean = false;
  private config: DatabaseConfig | null = null;

  // Initialize the database connection
  async initialize(config: DatabaseConfig): Promise<boolean> {
    try {
      this.config = config;
      
      // Create connection pool
      this.pool = new ConnectionPool({
        server: config.server,
        database: config.database,
        user: config.user,
        password: config.password,
        port: config.port || 1433,
        options: {
          encrypt: config.encrypt !== false, // Default to true
          trustServerCertificate: config.trustServerCertificate === true, // Default to false
        }
      });
      
      // Connect to the database
      await this.pool.connect();
      this.isConnected = true;
      console.log("SQL Server database connection established");
      return true;
    } catch (error) {
      console.error("Error connecting to SQL Server:", error);
      return false;
    }
  }

  // Close the database connection
  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.close();
      this.isConnected = false;
      console.log("SQL Server database connection closed");
    }
  }

  // Helper method to ensure connection is active
  private async ensureConnection(): Promise<void> {
    if (!this.isConnected || !this.pool) {
      if (this.config) {
        await this.initialize(this.config);
      } else {
        throw new Error("Database not initialized");
      }
    }
  }

  // Get all providers
  async getProviders(): Promise<Provider[]> {
    try {
      await this.ensureConnection();
      
      const result = await this.pool!.request()
        .query(`
          SELECT 
            ProviderID as id,
            FirstName as firstName,
            LastName as lastName,
            Email as email,
            Color as color,
            Status as status
          FROM Providers
          WHERE Status = 'active'
        `);
      
      return result.recordset;
    } catch (error) {
      console.error("Error fetching providers:", error);
      return [];
    }
  }

  // Get provider by ID
  async getProviderById(id: string): Promise<Provider | null> {
    try {
      await this.ensureConnection();
      
      const result = await this.pool!.request()
        .input('id', TYPES.VarChar, id)
        .query(`
          SELECT 
            ProviderID as id,
            FirstName as firstName,
            LastName as lastName,
            Email as email,
            Color as color,
            Status as status
          FROM Providers
          WHERE ProviderID = @id
        `);
      
      if (result.recordset.length === 0) {
        return null;
      }
      
      return result.recordset[0];
    } catch (error) {
      console.error("Error fetching provider by ID:", error);
      return null;
    }
  }

  // Add a new provider
  async addProvider(provider: Omit<Provider, 'id'>): Promise<string | null> {
    try {
      await this.ensureConnection();
      
      const newId = uuidv4();
      
      await this.pool!.request()
        .input('id', TYPES.VarChar, newId)
        .input('firstName', TYPES.NVarChar, provider.firstName)
        .input('lastName', TYPES.NVarChar, provider.lastName)
        .input('email', TYPES.NVarChar, provider.email || null)
        .input('color', TYPES.NVarChar, provider.color)
        .input('status', TYPES.NVarChar, provider.status || 'active')
        .query(`
          INSERT INTO Providers (ProviderID, FirstName, LastName, Email, Color, Status)
          VALUES (@id, @firstName, @lastName, @email, @color, @status)
        `);
      
      return newId;
    } catch (error) {
      console.error("Error adding provider:", error);
      return null;
    }
  }

  // Update a provider
  async updateProvider(id: string, provider: Partial<Provider>): Promise<boolean> {
    try {
      await this.ensureConnection();
      
      // Build the SET clause dynamically based on provided fields
      const setClause = Object.entries(provider)
        .map(([key, _]) => {
          // Convert camelCase to PascalCase for SQL
          const pascalKey = key.charAt(0).toUpperCase() + key.slice(1);
          return `${pascalKey} = @${key}`;
        })
        .join(', ');
      
      if (!setClause) {
        return false; // Nothing to update
      }
      
      const request = this.pool!.request().input('id', TYPES.VarChar, id);
      
      // Add parameters for each field
      Object.entries(provider).forEach(([key, value]) => {
        request.input(key, TYPES.NVarChar, value);
      });
      
      const result = await request.query(`
        UPDATE Providers
        SET ${setClause}, ModifiedAt = GETUTCDATE()
        WHERE ProviderID = @id
      `);
      
      return result.rowsAffected[0] > 0;
    } catch (error) {
      console.error("Error updating provider:", error);
      return false;
    }
  }

  // Delete a provider
  async deleteProvider(id: string): Promise<boolean> {
    try {
      await this.ensureConnection();
      
      // Soft delete by updating status
      const result = await this.pool!.request()
        .input('id', TYPES.VarChar, id)
        .query(`
          UPDATE Providers
          SET Status = 'deleted', ModifiedAt = GETUTCDATE()
          WHERE ProviderID = @id
        `);
      
      return result.rowsAffected[0] > 0;
    } catch (error) {
      console.error("Error deleting provider:", error);
      return false;
    }
  }

  // Get all clinic types
  async getClinicTypes(): Promise<ClinicType[]> {
    try {
      await this.ensureConnection();
      
      const result = await this.pool!.request()
        .query(`
          SELECT 
            ClinicTypeID as id,
            Name as name,
            Color as color,
            Status as status
          FROM ClinicTypes
          WHERE Status = 'active'
        `);
      
      return result.recordset;
    } catch (error) {
      console.error("Error fetching clinic types:", error);
      return [];
    }
  }

  // Get shifts by date range
  async getShiftsByDateRange(startDate: string, endDate: string): Promise<Shift[]> {
    try {
      await this.ensureConnection();
      
      const result = await this.pool!.request()
        .input('startDate', TYPES.DateTime2, new Date(startDate))
        .input('endDate', TYPES.DateTime2, new Date(endDate))
        .query(`
          SELECT 
            ShiftID as id,
            ProviderID as providerId,
            ClinicTypeID as clinicTypeId,
            StartDate as startDate,
            EndDate as endDate,
            IsVacation as isVacation,
            IsRecurring as isRecurring,
            RecurrencePattern as recurrencePattern,
            RecurrenceEndDate as recurrenceEndDate,
            SeriesID as seriesId,
            Notes as notes,
            Location as location
          FROM Shifts
          WHERE 
            (StartDate <= @endDate AND EndDate >= @startDate)
        `);
      
      return result.recordset.map((shift: any) => ({
        ...shift,
        startDate: shift.startDate.toISOString(),
        endDate: shift.endDate.toISOString(),
        recurrenceEndDate: shift.recurrenceEndDate ? shift.recurrenceEndDate.toISOString() : undefined
      }));
    } catch (error) {
      console.error("Error fetching shifts by date range:", error);
      return [];
    }
  }

  // Get shifts by provider
  async getShiftsByProvider(providerId: string): Promise<Shift[]> {
    try {
      await this.ensureConnection();
      
      const result = await this.pool!.request()
        .input('providerId', TYPES.VarChar, providerId)
        .query(`
          SELECT 
            ShiftID as id,
            ProviderID as providerId,
            ClinicTypeID as clinicTypeId,
            StartDate as startDate,
            EndDate as endDate,
            IsVacation as isVacation,
            IsRecurring as isRecurring,
            RecurrencePattern as recurrencePattern,
            RecurrenceEndDate as recurrenceEndDate,
            SeriesID as seriesId,
            Notes as notes,
            Location as location
          FROM Shifts
          WHERE ProviderID = @providerId
        `);
      
      return result.recordset.map((shift: any) => ({
        ...shift,
        startDate: shift.startDate.toISOString(),
        endDate: shift.endDate.toISOString(),
        recurrenceEndDate: shift.recurrenceEndDate ? shift.recurrenceEndDate.toISOString() : undefined
      }));
    } catch (error) {
      console.error("Error fetching shifts by provider:", error);
      return [];
    }
  }

  // Add a new shift
  async addShift(shift: Omit<Shift, 'id'>): Promise<string | null> {
    try {
      await this.ensureConnection();
      
      const newId = uuidv4();
      
      await this.pool!.request()
        .input('id', TYPES.VarChar, newId)
        .input('providerId', TYPES.VarChar, shift.providerId)
        .input('clinicTypeId', TYPES.VarChar, shift.clinicTypeId || null)
        .input('startDate', TYPES.DateTime2, new Date(shift.startDate))
        .input('endDate', TYPES.DateTime2, new Date(shift.endDate))
        .input('isVacation', TYPES.Bit, shift.isVacation)
        .input('isRecurring', TYPES.Bit, shift.isRecurring)
        .input('recurrencePattern', TYPES.NVarChar, shift.recurrencePattern || null)
        .input('recurrenceEndDate', TYPES.DateTime2, shift.recurrenceEndDate ? new Date(shift.recurrenceEndDate) : null)
        .input('seriesId', TYPES.UniqueIdentifier, shift.seriesId || null)
        .input('notes', TYPES.NVarChar, shift.notes || null)
        .input('location', TYPES.NVarChar, shift.location || null)
        .query(`
          INSERT INTO Shifts (
            ShiftID, ProviderID, ClinicTypeID, StartDate, EndDate, 
            IsVacation, IsRecurring, RecurrencePattern, RecurrenceEndDate, 
            SeriesID, Notes, Location
          )
          VALUES (
            @id, @providerId, @clinicTypeId, @startDate, @endDate,
            @isVacation, @isRecurring, @recurrencePattern, @recurrenceEndDate,
            @seriesId, @notes, @location
          )
        `);
      
      return newId;
    } catch (error) {
      console.error("Error adding shift:", error);
      return null;
    }
  }

  // Update a shift
  async updateShift(id: string, shift: Partial<Shift>): Promise<boolean> {
    try {
      await this.ensureConnection();
      
      // Build the SET clause dynamically based on provided fields
      const setClauseParts: string[] = [];
      const request = this.pool!.request().input('id', TYPES.VarChar, id);
      
      // Process each field
      if (shift.providerId !== undefined) {
        setClauseParts.push('ProviderID = @providerId');
        request.input('providerId', TYPES.VarChar, shift.providerId);
      }
      
      if (shift.clinicTypeId !== undefined) {
        setClauseParts.push('ClinicTypeID = @clinicTypeId');
        request.input('clinicTypeId', TYPES.VarChar, shift.clinicTypeId || null);
      }
      
      if (shift.startDate !== undefined) {
        setClauseParts.push('StartDate = @startDate');
        request.input('startDate', TYPES.DateTime2, new Date(shift.startDate));
      }
      
      if (shift.endDate !== undefined) {
        setClauseParts.push('EndDate = @endDate');
        request.input('endDate', TYPES.DateTime2, new Date(shift.endDate));
      }
      
      if (shift.isVacation !== undefined) {
        setClauseParts.push('IsVacation = @isVacation');
        request.input('isVacation', TYPES.Bit, shift.isVacation);
      }
      
      if (shift.isRecurring !== undefined) {
        setClauseParts.push('IsRecurring = @isRecurring');
        request.input('isRecurring', TYPES.Bit, shift.isRecurring);
      }
      
      if (shift.recurrencePattern !== undefined) {
        setClauseParts.push('RecurrencePattern = @recurrencePattern');
        request.input('recurrencePattern', TYPES.NVarChar, shift.recurrencePattern || null);
      }
      
      if (shift.recurrenceEndDate !== undefined) {
        setClauseParts.push('RecurrenceEndDate = @recurrenceEndDate');
        request.input('recurrenceEndDate', TYPES.DateTime2, shift.recurrenceEndDate ? new Date(shift.recurrenceEndDate) : null);
      }
      
      if (shift.seriesId !== undefined) {
        setClauseParts.push('SeriesID = @seriesId');
        request.input('seriesId', TYPES.UniqueIdentifier, shift.seriesId || null);
      }
      
      if (shift.notes !== undefined) {
        setClauseParts.push('Notes = @notes');
        request.input('notes', TYPES.NVarChar, shift.notes || null);
      }
      
      if (shift.location !== undefined) {
        setClauseParts.push('Location = @location');
        request.input('location', TYPES.NVarChar, shift.location || null);
      }
      
      if (setClauseParts.length === 0) {
        return false; // Nothing to update
      }
      
      // Add ModifiedAt to the SET clause
      setClauseParts.push('ModifiedAt = GETUTCDATE()');
      
      const setClause = setClauseParts.join(', ');
      
      const result = await request.query(`
        UPDATE Shifts
        SET ${setClause}
        WHERE ShiftID = @id
      `);
      
      return result.rowsAffected[0] > 0;
    } catch (error) {
      console.error("Error updating shift:", error);
      return false;
    }
  }

  // Delete a shift
  async deleteShift(id: string): Promise<boolean> {
    try {
      await this.ensureConnection();
      
      const result = await this.pool!.request()
        .input('id', TYPES.VarChar, id)
        .query(`
          DELETE FROM Shifts
          WHERE ShiftID = @id
        `);
      
      return result.rowsAffected[0] > 0;
    } catch (error) {
      console.error("Error deleting shift:", error);
      return false;
    }
  }

  // Delete shifts in a series
  async deleteShiftSeries(seriesId: string): Promise<number> {
    try {
      await this.ensureConnection();
      
      const result = await this.pool!.request()
        .input('seriesId', TYPES.UniqueIdentifier, seriesId)
        .query(`
          DELETE FROM Shifts
          WHERE SeriesID = @seriesId
        `);
      
      return result.rowsAffected[0];
    } catch (error) {
      console.error("Error deleting shift series:", error);
      return 0;
    }
  }

  // Log a sync operation
  async logSync(syncType: string, status: string, details: { 
    sharePointPath?: string, 
    fileName?: string, 
    recordsProcessed?: number,
    errorMessage?: string 
  }): Promise<boolean> {
    try {
      await this.ensureConnection();
      
      await this.pool!.request()
        .input('syncType', TYPES.NVarChar, syncType)
        .input('status', TYPES.NVarChar, status)
        .input('sharePointPath', TYPES.NVarChar, details.sharePointPath || null)
        .input('fileName', TYPES.NVarChar, details.fileName || null)
        .input('recordsProcessed', TYPES.Int, details.recordsProcessed || null)
        .input('errorMessage', TYPES.NVarChar, details.errorMessage || null)
        .query(`
          INSERT INTO SyncLogs (
            SyncType, Status, SharePointPath, FileName, RecordsProcessed, ErrorMessage
          )
          VALUES (
            @syncType, @status, @sharePointPath, @fileName, @recordsProcessed, @errorMessage
          )
        `);
      
      return true;
    } catch (error) {
      console.error("Error logging sync operation:", error);
      return false;
    }
  }

  // Get all data for export
  async getAllDataForExport(): Promise<{
    providers: Provider[],
    clinicTypes: ClinicType[],
    shifts: Shift[]
  }> {
    try {
      const providers = await this.getProviders();
      const clinicTypes = await this.getClinicTypes();
      
      // Get all shifts (no date filtering)
      await this.ensureConnection();
      const shiftsResult = await this.pool!.request()
        .query(`
          SELECT 
            ShiftID as id,
            ProviderID as providerId,
            ClinicTypeID as clinicTypeId,
            StartDate as startDate,
            EndDate as endDate,
            IsVacation as isVacation,
            IsRecurring as isRecurring,
            RecurrencePattern as recurrencePattern,
            RecurrenceEndDate as recurrenceEndDate,
            SeriesID as seriesId,
            Notes as notes,
            Location as location
          FROM Shifts
        `);
      
      const shifts = shiftsResult.recordset.map((shift: any) => ({
        ...shift,
        startDate: shift.startDate.toISOString(),
        endDate: shift.endDate.toISOString(),
        recurrenceEndDate: shift.recurrenceEndDate ? shift.recurrenceEndDate.toISOString() : undefined
      }));
      
      return {
        providers,
        clinicTypes,
        shifts
      };
    } catch (error) {
      console.error("Error getting all data for export:", error);
      return {
        providers: [],
        clinicTypes: [],
        shifts: []
      };
    }
  }
}

const realDatabaseService = new RealDatabaseService();
export default realDatabaseService; 