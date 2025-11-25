/**
 * Google Apps Script for When Something Goes Wrong Module
 *
 * Spreadsheet Column Structure:
 * Column A: Unix Timestamp
 * Column B: ID
 * Column C: Incident Date
 * Column D: Person Responsible
 * Column E: Category
 * Column F: What went wrong
 * Column G: What did to fix
 * Column H: Preventive action
 * Column I: Follow-up date
 * Column J: Notes
 * Column K: Created At
 * Column L: Updated At
 * Column M: Status
 */

function doGet(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const data = sheet.getDataRange().getValues();

    // Skip header row and filter out deleted records
    const records = data.slice(1)
      .filter(row => row[12] !== 'deleted') // Column M: Status
      .map(row => ({
        id: row[1],                     // Column B
        incidentDate: row[2],           // Column C
        personResponsible: row[3],      // Column D
        category: row[4],                // Column E
        whatWentWrong: row[5],          // Column F
        whatDidToFix: row[6],           // Column G
        preventiveAction: row[7],       // Column H
        followUpDate: row[8] || undefined,  // Column I
        notes: row[9] || undefined,     // Column J
        createdAt: row[10],             // Column K
        updatedAt: row[11] || undefined, // Column L
        status: row[12],                 // Column M
        severity: 'moderate',            // Default for backward compatibility
        staffInvolved: row[3],           // Use person responsible as fallback
        incidentStatus: 'open'           // Default status
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
    if (!data.id || !data.incidentDate || !data.personResponsible ||
        !data.whatWentWrong || !data.whatDidToFix || !data.preventiveAction) {
      throw new Error('Missing required fields');
    }

    // Check if record exists (look for ID in column B)
    const allData = sheet.getDataRange().getValues();
    let rowIndex = -1;

    for (let i = 1; i < allData.length; i++) {
      if (allData[i][1] === data.id) { // Column B: ID
        rowIndex = i + 1; // Sheet rows are 1-indexed
        break;
      }
    }

    // Calculate Unix timestamp
    const unixTimestamp = Math.floor(new Date(data.createdAt || new Date()).getTime() / 1000);

    // Prepare row data matching column structure
    const rowData = [
      unixTimestamp,                     // A: Unix Timestamp
      data.id,                           // B: ID
      data.incidentDate,                 // C: Incident Date
      data.personResponsible,            // D: Person Responsible
      data.category,                     // E: Category
      data.whatWentWrong,                // F: What went wrong
      data.whatDidToFix,                 // G: What did to fix
      data.preventiveAction,             // H: Preventive action
      data.followUpDate || '',           // I: Follow-up date
      data.notes || '',                  // J: Notes
      data.createdAt || new Date().toISOString(), // K: Created At
      data.updatedAt || '',              // L: Updated At
      data.status || 'active'            // M: Status
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
