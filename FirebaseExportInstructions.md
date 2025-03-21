# How to Export Your Calendar Data from Firebase

I've created several tools to help you export your Firebase data. Here are the steps to use them:

## Option 1: Using the Export Data Button in your App

1. Add the following files to your project:
   - `exportFirebaseDataWeb.js`
   - `ExportDataButton.tsx` (for a standalone button)
   - `ExportImportButtons.tsx` (for a combined export/import interface)

2. Install the required dependency if you haven't already:
   ```bash
   npm install file-saver @types/file-saver --save
   ```

3. Add the export button to one of your existing pages, for example:
   ```tsx
   // In your settings or admin page
   import ExportDataButton from './ExportDataButton';
   
   // Then in your component's JSX
   <ExportDataButton />
   ```

4. Click the "Export Data" button in your app. This will:
   - Connect to your Firebase database
   - Fetch all providers, clinic types, shifts, and notes
   - Convert Firebase timestamps to ISO strings
   - Download a JSON file to your computer

## Option 2: Run a Script to Export Data (Node.js)

If you prefer to export data directly via a script:

1. Make sure your Firebase configuration is available in your environment variables or directly in the script.

2. Run the `exportFirebaseData.js` script:
   ```bash
   node exportFirebaseData.js
   ```

3. This will create a file called `calendar-data-export.json` in your project directory.

## Data Format

The exported data will follow this structure:

```json
{
  "version": "1.0",
  "exportDate": "2023-07-23T15:30:45.123Z",
  "providers": [
    {
      "id": "providerId",
      "firstName": "John",
      "lastName": "Smith",
      "color": "#4f46e5",
      "isActive": true,
      "email": "john.smith@example.com"
    }
    // More providers...
  ],
  "clinicTypes": [
    {
      "id": "clinicTypeId",
      "name": "Primary Care",
      "color": "#3b82f6",
      "isActive": true
    }
    // More clinic types...
  ],
  "shifts": [
    {
      "id": "shiftId",
      "providerId": "providerId",
      "clinicTypeId": "clinicTypeId",
      "startDate": "2023-07-21T08:00:00.000Z",
      "endDate": "2023-07-21T17:00:00.000Z",
      "isVacation": false,
      "notes": "Regular shift",
      "location": "Main Clinic",
      "isRecurring": false,
      "seriesId": null,
      "recurrencePattern": null,
      "recurrenceEndDate": null
    }
    // More shifts...
  ],
  "notes": [
    {
      "id": "noteId",
      "date": "2023-07-01T00:00:00.000Z",
      "content": "Monthly staff meeting scheduled.",
      "type": "monthly"
    }
    // More notes...
  ]
}
```

## Using the Exported Data

Once you have the exported JSON file, you can:

1. Use it as a backup of your Firebase data
2. Import it into another database system
3. Use it to restore your data if needed
4. Share calendar data between different instances of your application

## Note About Field Names

If your Firebase data uses different field names than the template (e.g., `startTime` instead of `startDate`), you may need to modify the export code to match your specific schema.

The current export code assumes these field names:
- For shifts: `startDate`, `endDate`, `recurrenceEndDate`
- For notes: `date`

If your schema uses different names, update the corresponding fields in the `exportFirebaseDataWeb.js` file. 