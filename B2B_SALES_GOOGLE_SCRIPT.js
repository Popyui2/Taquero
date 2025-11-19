/**
 * Google Apps Script for B2B Sales Module
 *
 * This script manages the "Selling Food to Other Businesses" module
 * Tracks food products sold to business customers
 *
 * Spreadsheet Structure:
 * Column A: ID
 * Column B: Business Name
 * Column C: Contact Details
 * Column D: Product Supplied
 * Column E: Quantity
 * Column F: Unit
 * Column G: Date Supplied
 * Column H: Task Done By
 * Column I: Notes
 * Column J: Created At
 * Column K: Updated At
 * Column L: Status
 * Column M: Unix Timestamp (for sorting)
 */

function doGet(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const data = sheet.getDataRange().getValues();

    // Skip header row and filter out deleted records
    const records = data.slice(1)
      .filter(row => row[11] !== 'deleted') // Column L: Status
      .map(row => ({
        id: row[0],
        businessName: row[1],
        contactDetails: row[2],
        productSupplied: row[3],
        quantity: row[4],
        unit: row[5],
        dateSupplied: row[6],
        taskDoneBy: row[7],
        notes: row[8] || undefined,
        createdAt: row[9],
        updatedAt: row[10] || undefined,
        status: row[11]
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
    if (!data.id || !data.businessName || !data.contactDetails ||
        !data.productSupplied || data.quantity === undefined ||
        !data.unit || !data.dateSupplied) {
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
      data.businessName,                 // B: Business Name
      data.contactDetails,               // C: Contact Details
      data.productSupplied,              // D: Product Supplied
      data.quantity,                     // E: Quantity
      data.unit,                         // F: Unit
      data.dateSupplied,                 // G: Date Supplied
      data.taskDoneBy,                   // H: Task Done By
      data.notes || '',                  // I: Notes
      data.createdAt,                    // J: Created At
      data.updatedAt || '',              // K: Updated At
      data.status || 'active',           // L: Status
      data.unixTimestamp || Math.floor(new Date(data.createdAt).getTime() / 1000) // M: Unix Timestamp
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
