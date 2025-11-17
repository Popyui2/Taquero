/**
 * Google Apps Script for Proving Cooling Method Module
 *
 * This script manages the backend for the Taquero "Proving Cooling Method" module.
 * It stores cooling method validation data in a Google Sheet.
 *
 * SETUP INSTRUCTIONS:
 * 1. Create a new Google Sheet named "Taquero_Proving_Cooling"
 * 2. Open Extensions > Apps Script
 * 3. Delete any existing code and paste this entire script
 * 4. Save the script (File > Save or Ctrl/Cmd + S)
 * 5. Click "Deploy" > "New deployment"
 * 6. Select type: "Web app"
 * 7. Settings:
 *    - Description: "Taquero Proving Cooling API"
 *    - Execute as: "Me"
 *    - Who has access: "Anyone" (this is safe - your data is still private)
 * 8. Click "Deploy"
 * 9. Copy the "Web app URL" - you'll need this for your Taquero app
 * 10. Update src/store/provingCoolingStore.ts with this URL
 */

var SHEET_NAME = 'Proving_Cooling_Methods'

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
      'Food Item',
      'Cooling Method',
      'Batch Number',
      'Date',
      'Start Time',
      'Start Temp (°C)',
      '2nd Time Check',
      '2nd Temp Check (°C)',
      '3rd Time Check',
      '3rd Temp Check (°C)',
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
 * Handle GET requests - fetch all cooling methods
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
      var batchNumber = row[4]

      if (!methodsMap[methodId]) {
        methodsMap[methodId] = {
          id: row[1],
          foodItem: row[2],
          coolingMethod: row[3],
          batches: [],
          createdBy: row[14],
          createdAt: row[15],
          status: 'in-progress'
        }
      }

      // Add batch
      methodsMap[methodId].batches.push({
        batchNumber: batchNumber,
        date: row[5],
        startTime: row[6],
        startTemp: row[7],
        secondTimeCheck: row[8],
        secondTempCheck: row[9],
        thirdTimeCheck: row[10],
        thirdTempCheck: row[11],
        completedBy: row[12],
        timestamp: row[15] // Use created at as timestamp
      })

      // Update status based on batch count
      if (methodsMap[methodId].batches.length === 3) {
        methodsMap[methodId].status = 'proven'
        methodsMap[methodId].provenAt = row[15]
      }
    })

    // Convert map to array and sort by creation date (newest first)
    var methods = Object.values(methodsMap).sort(function(a, b) {
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
 * Handle POST requests - save new batch data
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
      data.foodItem,
      data.coolingMethod,
      data.batchNumber,
      data.date,
      data.startTime,
      data.startTemp,
      data.secondTimeCheck,
      data.secondTempCheck,
      data.thirdTimeCheck,
      data.thirdTempCheck,
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
        message: 'Cooling batch saved successfully'
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
