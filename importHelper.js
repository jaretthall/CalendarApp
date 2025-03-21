/**
 * This file provides helper functions for diagnosing and fixing import issues
 * with the calendar-import-template.json file
 */

/**
 * Validates that a JSON string is in the correct format for import
 * @param {string} jsonString - The JSON string to validate
 * @returns {Object} An object with validation results
 */
function validateJsonFormat(jsonString) {
  try {
    // Try to parse the JSON
    const parsed = JSON.parse(jsonString);
    const results = { valid: true, errors: [] };
    
    // Check if it's an object (not an array)
    if (Array.isArray(parsed)) {
      results.valid = false;
      results.errors.push("Data appears to be an array. Please ensure your JSON is an object with providers, clinicTypes, and shifts properties.");
    }
    
    // Check for required properties
    const requiredProps = ['providers', 'clinicTypes', 'shifts'];
    for (const prop of requiredProps) {
      if (!parsed[prop]) {
        results.valid = false;
        results.errors.push(`Missing required property: ${prop}`);
      } else if (!Array.isArray(parsed[prop])) {
        results.valid = false;
        results.errors.push(`Property ${prop} must be an array`);
      }
    }
    
    return results;
  } catch (error) {
    return {
      valid: false,
      errors: [`Invalid JSON format: ${error.message}`]
    };
  }
}

/**
 * Creates a minimal valid template for import
 * @returns {string} A JSON string with a minimal valid template
 */
function createMinimalTemplate() {
  const template = {
    providers: [
      {
        id: "provider1",
        firstName: "John",
        lastName: "Doe",
        color: "#4f46e5",
        isActive: true
      }
    ],
    clinicTypes: [
      {
        id: "clinicType1",
        name: "Primary Care",
        color: "#3b82f6",
        isActive: true
      }
    ],
    shifts: [
      {
        id: "shift1",
        providerId: "provider1",
        clinicTypeId: "clinicType1",
        startDate: "2023-07-21T08:00:00.000Z",
        endDate: "2023-07-21T17:00:00.000Z",
        isVacation: false
      }
    ]
  };
  
  return JSON.stringify(template, null, 2);
}

/**
 * Fixes common issues with the import data format
 * @param {string} jsonString - The JSON string to fix
 * @returns {string} A fixed JSON string
 */
function fixImportFormat(jsonString) {
  try {
    let data = JSON.parse(jsonString);
    
    // If it's an array, try to convert it to an object
    if (Array.isArray(data)) {
      const fixedData = {};
      
      // Try to detect arrays of providers, clinicTypes, and shifts
      data.forEach(item => {
        if (item.color && (item.firstName || item.name)) {
          if (!fixedData.providers) fixedData.providers = [];
          if (item.firstName) fixedData.providers.push(item);
          else if (item.name && !item.startDate) {
            if (!fixedData.clinicTypes) fixedData.clinicTypes = [];
            fixedData.clinicTypes.push(item);
          }
        } else if (item.startDate && item.endDate) {
          if (!fixedData.shifts) fixedData.shifts = [];
          fixedData.shifts.push(item);
        }
      });
      
      return JSON.stringify(fixedData, null, 2);
    }
    
    // If it's already an object but has extra properties, extract just what we need
    const fixedData = {
      providers: Array.isArray(data.providers) ? data.providers : [],
      clinicTypes: Array.isArray(data.clinicTypes) ? data.clinicTypes : [],
      shifts: Array.isArray(data.shifts) ? data.shifts : []
    };
    
    return JSON.stringify(fixedData, null, 2);
  } catch (error) {
    console.error("Could not fix JSON format:", error);
    return createMinimalTemplate();
  }
}

// Usage instructions
console.log(`
IMPORT TEMPLATE HELPER

This script provides functions to help with calendar data import issues.

If you're seeing an error like:
"Data appears to be an array. Please ensure your JSON is an object with providers, clinicTypes, and shifts properties."

Make sure your JSON has this structure:
{
  "providers": [ ... array of provider objects ... ],
  "clinicTypes": [ ... array of clinic type objects ... ],
  "shifts": [ ... array of shift objects ... ]
}

And not this structure:
[ ... array of mixed objects ... ]

You can use the functions in this file to validate and fix your JSON:
- validateJsonFormat(jsonString) - Check if your JSON is valid for import
- fixImportFormat(jsonString) - Attempt to fix common formatting issues
- createMinimalTemplate() - Get a minimal valid template
`);

// Export functions for use in Node.js or browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    validateJsonFormat,
    fixImportFormat,
    createMinimalTemplate
  };
} 