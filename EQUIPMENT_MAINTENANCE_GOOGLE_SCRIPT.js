/**
 * Google Apps Script for Equipment Maintenance Module
 *
 * This script manages the "Equipment Maintenance" module
 * Tracks equipment and facility maintenance including water supply
 *
 * Spreadsheet Structure:
 * Column A: ID
 * Column B: Equipment Name
 * Column C: Date Completed
 * Column D: Performed By
 * Column E: Maintenance Description
 * Column F: Checking Frequency
 * Column G: Notes
 * Column H: Created At
 * Column I: Updated At
 * Column J: Status
 * Column K: Unix Timestamp (for sorting)
 */

function doGet(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const data = sheet.getDataRange().getValues();

    // Skip header row and filter out deleted records
    const records = data.slice(1)
      .filter(row => row[9] !== 'deleted') // Column J: Status
      .map(row => ({
        id: row[0],
        equipmentName: row[1],
        dateCompleted: row[2],
        performedBy: row[3],
        maintenanceDescription: row[4],
        checkingFrequency: row[5] || undefined,
        notes: row[6] || undefined,
        createdAt: row[7],
        updatedAt: row[8] || undefined,
        status: row[9]
      }));

    return ContentService.createTextOutput(
      JSON.stringify({ success: true, data: records })
    ).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, error: error.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const data = JSON.parse(e.postData.contents);

    // Validate required fields
    if (!data.id || !data.equipmentName || !data.dateCompleted ||
        !data.performedBy || !data.maintenanceDescription) {
      throw new Error('Missing required fields');
    }

    // Check if record exists (look for ID in column A)
    const allData = sheet.getDataRange().getValues();
    let rowIndex = -1;

    for (let i = 1; i < allData.length; i++) {
      if (allData[i][0] === data.id) {
        rowIndex = i + 1; // Sheet rows are 1-indexed
        break;
      }
    }

    // Prepare row data
    const rowData = [
      data.id,                           // A: ID
      data.equipmentName,                // B: Equipment Name
      data.dateCompleted,                // C: Date Completed
      data.performedBy,                  // D: Performed By
      data.maintenanceDescription,       // E: Maintenance Description
      data.checkingFrequency || '',      // F: Checking Frequency
      data.notes || '',                  // G: Notes
      data.createdAt,                    // H: Created At
      data.updatedAt || '',              // I: Updated At
      data.status || 'active',           // J: Status
      data.unixTimestamp || Math.floor(new Date(data.createdAt).getTime() / 1000) // K: Unix Timestamp
    ];

    if (rowIndex > 0) {
      // Update existing record
      sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
    } else {
      // Append new record
      sheet.appendRow(rowData);
    }

    return ContentService.createTextOutput(
      JSON.stringify({ success: true })
    ).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, error: error.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}
