/**
 * Google Apps Script for Trace Your Food Module
 *
 * This script manages traceability exercise records
 * Documents product tracing from supplier to customer
 * Required by MPI to prove traceability system works
 *
 * Spreadsheet Structure:
 * Column A: ID
 * Column B: Trace Date
 * Column C: Product Type
 * Column D: Brand
 * Column E: Batch/Lot Information
 * Column F: Supplier Name
 * Column G: Supplier Contact
 * Column H: Manufacturer Name
 * Column I: Manufacturer Contact
 * Column J: Date Received
 * Column K: Performed By
 * Column L: Other Information
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
        traceDate: row[1],
        productType: row[2],
        brand: row[3],
        batchLotInfo: row[4],
        supplierName: row[5],
        supplierContact: row[6],
        manufacturerName: row[7],
        manufacturerContact: row[8],
        dateReceived: row[9] || undefined,
        performedBy: row[10],
        otherInfo: row[11] || undefined,
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
    if (!data.id || !data.traceDate || !data.productType || !data.brand ||
        !data.batchLotInfo || !data.supplierName || !data.supplierContact ||
        !data.manufacturerName || !data.manufacturerContact || !data.performedBy) {
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
      data.traceDate,                    // B: Trace Date
      data.productType,                  // C: Product Type
      data.brand,                        // D: Brand
      data.batchLotInfo,                 // E: Batch/Lot Information
      data.supplierName,                 // F: Supplier Name
      data.supplierContact,              // G: Supplier Contact
      data.manufacturerName,             // H: Manufacturer Name
      data.manufacturerContact,          // I: Manufacturer Contact
      data.dateReceived || '',           // J: Date Received
      data.performedBy,                  // K: Performed By
      data.otherInfo || '',              // L: Other Information
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
