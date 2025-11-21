/**
 * Google Apps Script for Customer Complaints Information Module
 *
 * This script manages customer complaint records
 * Tracks complaints, investigations, and resolutions
 * Required by MPI to show complaints are taken seriously
 *
 * Spreadsheet Structure:
 * Column A: Unix Timestamp (for sorting)
 * Column B: Complaint ID
 * Column C: Customer Name
 * Column D: Customer Contact
 * Column E: Purchase Date
 * Column F: Purchase Time
 * Column G: Food Item
 * Column H: Batch/Lot Number
 * Column I: Complaint Description
 * Column J: Complaint Type
 * Column K: Cause Investigation
 * Column L: Action Taken Immediate
 * Column M: Action Taken Preventive
 * Column N: Resolved By
 * Column O: Resolution Date
 * Column P: Complaint Status
 * Column Q: Linked Incident ID
 * Column R: Notes
 * Column S: Created At
 * Column T: Updated At
 * Column U: Status (active/deleted)
 */

function doGet(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const data = sheet.getDataRange().getValues();

    // Skip header row and filter out deleted records
    const records = data.slice(1)
      .filter(row => row[20] !== 'deleted') // Column U: Status
      .map(row => ({
        id: row[1],
        customerName: row[2],
        customerContact: row[3],
        purchaseDate: row[4],
        purchaseTime: row[5],
        foodItem: row[6],
        batchLotNumber: row[7] || undefined,
        complaintDescription: row[8],
        complaintType: row[9] || undefined,
        causeInvestigation: row[10],
        actionTakenImmediate: row[11],
        actionTakenPreventive: row[12],
        resolvedBy: row[13],
        resolutionDate: row[14],
        complaintStatus: row[15],
        linkedIncidentId: row[16] || undefined,
        notes: row[17] || undefined,
        createdAt: row[18],
        updatedAt: row[19] || undefined,
        status: row[20]
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
    if (!data.id || !data.customerName || !data.customerContact ||
        !data.purchaseDate || !data.purchaseTime || !data.foodItem ||
        !data.complaintDescription || !data.causeInvestigation ||
        !data.actionTakenImmediate || !data.actionTakenPreventive ||
        !data.resolvedBy || !data.resolutionDate || !data.complaintStatus) {
      throw new Error('Missing required fields');
    }

    // Check if record exists (look for ID in column B)
    const allData = sheet.getDataRange().getValues();
    let rowIndex = -1;

    for (let i = 1; i < allData.length; i++) {
      if (allData[i][1] === data.id) {
        rowIndex = i + 1; // Sheet rows are 1-indexed
        break;
      }
    }

    // Prepare row data
    const rowData = [
      data.unixTimestamp || Math.floor(new Date(data.createdAt).getTime() / 1000), // A: Unix Timestamp
      data.id,                           // B: Complaint ID
      data.customerName,                 // C: Customer Name
      data.customerContact,              // D: Customer Contact
      data.purchaseDate,                 // E: Purchase Date
      data.purchaseTime,                 // F: Purchase Time
      data.foodItem,                     // G: Food Item
      data.batchLotNumber || '',         // H: Batch/Lot Number
      data.complaintDescription,         // I: Complaint Description
      data.complaintType || '',          // J: Complaint Type
      data.causeInvestigation,           // K: Cause Investigation
      data.actionTakenImmediate,         // L: Action Taken Immediate
      data.actionTakenPreventive,        // M: Action Taken Preventive
      data.resolvedBy,                   // N: Resolved By
      data.resolutionDate,               // O: Resolution Date
      data.complaintStatus,              // P: Complaint Status
      data.linkedIncidentId || '',       // Q: Linked Incident ID
      data.notes || '',                  // R: Notes
      data.createdAt,                    // S: Created At
      data.updatedAt || '',              // T: Updated At
      data.status || 'active'            // U: Status
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
