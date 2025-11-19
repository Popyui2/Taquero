/**
 * Google Apps Script for Cleaning & Closing Module
 *
 * This script manages the "Cleaning & Closing" module
 * Tracks cleaning tasks, methods, and completion records
 *
 * Spreadsheet Structure:
 * Column A: ID
 * Column B: Cleaning Task
 * Column C: Date Completed
 * Column D: Cleaning Method
 * Column E: Completed By
 * Column F: Notes
 * Column G: Created At
 * Column H: Updated At
 * Column I: Status
 * Column J: Unix Timestamp (for sorting)
 */

function doGet(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const data = sheet.getDataRange().getValues();

    // Skip header row and filter out deleted records
    const records = data.slice(1)
      .filter(row => row[8] !== 'deleted') // Column I: Status
      .map(row => ({
        id: row[0],
        cleaningTask: row[1],
        dateCompleted: row[2],
        cleaningMethod: row[3],
        completedBy: row[4],
        notes: row[5] || undefined,
        createdAt: row[6],
        updatedAt: row[7] || undefined,
        status: row[8]
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
    if (!data.id || !data.cleaningTask || !data.dateCompleted ||
        !data.cleaningMethod || !data.completedBy) {
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
      data.cleaningTask,                 // B: Cleaning Task
      data.dateCompleted,                // C: Date Completed
      data.cleaningMethod,               // D: Cleaning Method
      data.completedBy,                  // E: Completed By
      data.notes || '',                  // F: Notes
      data.createdAt,                    // G: Created At
      data.updatedAt || '',              // H: Updated At
      data.status || 'active',           // I: Status
      data.unixTimestamp || Math.floor(new Date(data.createdAt).getTime() / 1000) // J: Unix Timestamp
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
