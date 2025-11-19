/**
 * Google Apps Script for When Something Goes Wrong Module
 *
 * This script manages incident reporting for food safety issues
 * Tracks what went wrong, fixes, and preventive actions
 *
 * Spreadsheet Structure:
 * Column A: ID
 * Column B: Incident Date
 * Column C: Person Responsible
 * Column D: Staff Involved
 * Column E: Category
 * Column F: What Went Wrong
 * Column G: What Did to Fix
 * Column H: Preventive Action
 * Column I: Severity
 * Column J: Incident Status
 * Column K: Follow-up Date
 * Column L: Notes
 * Column M: Created At
 * Column N: Updated At
 * Column O: Status
 * Column P: Unix Timestamp (for sorting)
 */

function doGet(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const data = sheet.getDataRange().getValues();

    // Skip header row and filter out deleted records
    const records = data.slice(1)
      .filter(row => row[14] !== 'deleted') // Column O: Status
      .map(row => ({
        id: row[0],
        incidentDate: row[1],
        personResponsible: row[2],
        staffInvolved: row[3],
        category: row[4],
        whatWentWrong: row[5],
        whatDidToFix: row[6],
        preventiveAction: row[7],
        severity: row[8],
        incidentStatus: row[9],
        followUpDate: row[10] || undefined,
        notes: row[11] || undefined,
        createdAt: row[12],
        updatedAt: row[13] || undefined,
        status: row[14]
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
      data.incidentDate,                 // B: Incident Date
      data.personResponsible,            // C: Person Responsible
      data.staffInvolved,                // D: Staff Involved
      data.category,                     // E: Category
      data.whatWentWrong,                // F: What Went Wrong
      data.whatDidToFix,                 // G: What Did to Fix
      data.preventiveAction,             // H: Preventive Action
      data.severity,                     // I: Severity
      data.incidentStatus,               // J: Incident Status
      data.followUpDate || '',           // K: Follow-up Date
      data.notes || '',                  // L: Notes
      data.createdAt,                    // M: Created At
      data.updatedAt || '',              // N: Updated At
      data.status || 'active',           // O: Status
      data.unixTimestamp || Math.floor(new Date(data.createdAt).getTime() / 1000) // P: Unix Timestamp
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
