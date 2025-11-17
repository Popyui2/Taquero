/**
 * Google Apps Script for Cooling Batch Checks Module
 *
 * This script manages the backend for the Taquero "Cooling Batch Checks" module.
 * It stores weekly cooling check data for freshly cooked food in a Google Sheet.
 *
 * SETUP INSTRUCTIONS:
 * 1. Create a new Google Sheet named "Taquero_Cooling_Batch_Checks"
 * 2. Open Extensions > Apps Script
 * 3. Delete any existing code and paste this entire script
 * 4. Save the script (File > Save or Ctrl/Cmd + S)
 * 5. Click "Deploy" > "New deployment"
 * 6. Select type: "Web app"
 * 7. Settings:
 *    - Description: "Taquero Cooling Batch Checks API"
 *    - Execute as: "Me"
 *    - Who has access: "Anyone" (this is safe - your data is still private)
 * 8. Click "Deploy"
 * 9. Copy the "Web app URL" - you'll need this for your Taquero app
 * 10. Update src/store/coolingBatchCheckStore.ts with this URL
 *
 * NOTE: This script can be shared with other modules using the ?module parameter
 */

var SHEET_NAME = 'Cooling_Batch_Checks'

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
      'Record ID',
      'Food Type',
      'Date Cooked',
      'Start Time',
      'Start Temp (°C)',
      '2nd Time Check',
      '2nd Temp Check (°C)',
      '3rd Time Check',
      '3rd Temp Check (°C)',
      'Cooling Method',
      'Completed By'
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
 * Handle GET requests - fetch all batch check records
 */
function doGet(e) {
  try {
    var sheet = initializeSheet()
    var data = sheet.getDataRange().getValues()
    var headers = data[0]
    var rows = data.slice(1)

    // Convert rows to record objects
    var records = rows.map(function(row) {
      return {
        id: row[1],
        foodType: row[2],
        dateCooked: row[3],
        startTime: row[4],
        startTemp: row[5],
        secondTimeCheck: row[6],
        secondTempCheck: row[7],
        thirdTimeCheck: row[8],
        thirdTempCheck: row[9],
        coolingMethod: row[10],
        completedBy: row[11],
        timestamp: new Date(row[0] * 1000).toISOString() // Convert Unix timestamp back to ISO
      }
    })

    // Sort by timestamp (newest first)
    records.sort(function(a, b) {
      return new Date(b.timestamp) - new Date(a.timestamp)
    })

    return ContentService.createTextOutput(
      JSON.stringify({
        success: true,
        data: records,
        count: records.length
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
 * Handle POST requests - save new batch check record
 */
function doPost(e) {
  try {
    var sheet = initializeSheet()

    // Parse incoming data
    var data = JSON.parse(e.postData.contents)

    // Prepare row data
    var row = [
      data.unixTimestamp || Math.floor(Date.now() / 1000),
      data.id,
      data.foodType,
      data.dateCooked,
      data.startTime,
      data.startTemp,
      data.secondTimeCheck,
      data.secondTempCheck,
      data.thirdTimeCheck,
      data.thirdTempCheck,
      data.coolingMethod,
      data.completedBy
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
        message: 'Batch check record saved successfully'
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
