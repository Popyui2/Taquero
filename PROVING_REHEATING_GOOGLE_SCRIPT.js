/**
 * Google Apps Script for Proving Reheating Method Module
 *
 * This script manages the backend for the Taquero "Proving Reheating Method" module.
 * It stores reheating method validation data with 3-batch validation system.
 *
 * SETUP INSTRUCTIONS:
 * 1. Create a new Google Sheet named "Taquero_Proving_Reheating"
 * 2. Open Extensions > Apps Script
 * 3. Delete any existing code and paste this entire script
 * 4. Save the script (File > Save or Ctrl/Cmd + S)
 * 5. Click "Deploy" > "New deployment"
 * 6. Select type: "Web app"
 * 7. Settings:
 *    - Description: "Taquero Proving Reheating API"
 *    - Execute as: "Me"
 *    - Who has access: "Anyone" (this is safe - your data is still private)
 * 8. Click "Deploy"
 * 9. Copy the "Web app URL" - you'll need this for your Taquero app
 * 10. Update src/store/provingReheatingStore.ts with this URL
 */

var SHEET_NAME = 'Proving_Reheating_Methods'

/**
 * Creates the sheet with proper headers if it doesn't exist
 */
function initializeSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet()
  var sheet = ss.getSheetByName(SHEET_NAME)

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME)

    // Set headers
    var headers = [
      'Unix Timestamp',
      'Method ID',
      'Item Description',
      'Reheating Method',
      'Batch Number',
      'Batch Date',
      'Internal Temp (°C)',
      'Completed By',
      'Status',
      'Created By',
      'Created At'
    ]

    sheet.getRange(1, 1, 1, headers.length).setValues([headers])

    // Format header row
    sheet.getRange(1, 1, 1, headers.length)
      .setFontWeight('bold')
      .setBackground('#4285f4')
      .setFontColor('#ffffff')

    // Freeze header row
    sheet.setFrozenRows(1)

    // Auto-resize columns
    for (var i = 1; i <= headers.length; i++) {
      sheet.autoResizeColumn(i)
    }
  }

  return sheet
}

/**
 * Handle GET requests - fetch all reheating methods
 */
function doGet(e) {
  try {
    var sheet = initializeSheet()
    var data = sheet.getDataRange().getValues()
    var headers = data[0]
    var rows = data.slice(1)

    // Group batches by method ID
    var methodsMap = {}

    rows.forEach(function(row) {
      var methodId = row[1]

      if (!methodsMap[methodId]) {
        methodsMap[methodId] = {
          id: methodId,
          itemDescription: row[2],
          reheatingMethod: row[3],
          batches: [],
          status: 'in-progress',
          createdBy: row[9],
          createdAt: row[10],
          provenAt: null
        }
      }

      // Add batch
      methodsMap[methodId].batches.push({
        batchNumber: row[4],
        date: row[5],
        internalTemp: row[6],
        completedBy: row[7],
        timestamp: new Date(row[0] * 1000).toISOString()
      })

      // Update status if this batch makes it proven
      if (row[8] === 'proven') {
        methodsMap[methodId].status = 'proven'
        // The newest batch with 'proven' status is when it was proven
        var timestamp = new Date(row[0] * 1000).toISOString()
        if (!methodsMap[methodId].provenAt || timestamp > methodsMap[methodId].provenAt) {
          methodsMap[methodId].provenAt = timestamp
        }
      }
    })

    // Convert map to array
    var methods = Object.values(methodsMap)

    // Sort by creation date (newest first)
    methods.sort(function(a, b) {
      return new Date(b.createdAt) - new Date(a.createdAt)
    })

    return ContentService.createTextOutput(
      JSON.stringify({
        success: true,
        data: methods,
        count: methods.length
      })
    ).setMimeType(ContentService.MimeType.JSON)

  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({
        success: false,
        error: error.toString()
      })
    ).setMimeType(ContentService.MimeType.JSON)
  }
}

/**
 * Handle POST requests - save new batch for a method
 */
function doPost(e) {
  try {
    var sheet = initializeSheet()

    // Parse incoming data
    var data = JSON.parse(e.postData.contents)

    // Prepare row data
    var row = [
      data.unixTimestamp || Math.floor(Date.now() / 1000),
      data.methodId,
      data.itemDescription,
      data.reheatingMethod,
      data.batchNumber,
      data.date,
      data.internalTemp,
      data.completedBy,
      data.status,
      data.createdBy,
      data.createdAt
    ]

    // Append the row
    sheet.appendRow(row)

    // Sort by Unix Timestamp (column 1) in descending order
    var lastRow = sheet.getLastRow()
    if (lastRow > 1) {
      var range = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn())
      range.sort([{column: 1, ascending: false}])
    }

    return ContentService.createTextOutput(
      JSON.stringify({
        success: true,
        message: 'Batch saved successfully'
      })
    ).setMimeType(ContentService.MimeType.JSON)

  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({
        success: false,
        error: error.toString()
      })
    ).setMimeType(ContentService.MimeType.JSON)
  }
}
