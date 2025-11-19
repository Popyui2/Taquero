/**
 * Google Apps Script for Transported Food Temperature Checks Module
 *
 * This script manages the backend for the Taquero "Transported Food Temperature Checks" module.
 * It stores temperature check records for food transported for more than 4 hours out of temperature control.
 *
 * SETUP INSTRUCTIONS:
 * 1. Create a new Google Sheet named "Taquero_Transport_Temp_Checks"
 * 2. Open Extensions > Apps Script
 * 3. Delete any existing code and paste this entire script
 * 4. Save the script (File > Save or Ctrl/Cmd + S)
 * 5. Click "Deploy" > "New deployment"
 * 6. Select type: "Web app"
 * 7. Settings:
 *    - Description: "Taquero Transport Temp Checks API"
 *    - Execute as: "Me"
 *    - Who has access: "Anyone" (this is safe - your data is still private)
 * 8. Click "Deploy"
 * 9. Copy the "Web app URL" - you'll need this for your Taquero app
 * 10. Update src/store/transportTempChecksStore.ts with this URL
 */

var SHEET_NAME = 'Transport_Temp_Check_Records'

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
      'Transport ID',
      'Check Date',
      'Type of Food',
      'Temperature (°C)',
      'Task Done By',
      'Notes',
      'Created At',
      'Updated At',
      'Status'
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
 * Handle GET requests - fetch all transport temperature check records
 */
function doGet(e) {
  try {
    var sheet = initializeSheet()
    var data = sheet.getDataRange().getValues()
    var headers = data[0]
    var rows = data.slice(1)

    // Convert rows to transport temp check record objects (filter out deleted records)
    var records = rows
      .filter(function(row) {
        return row[9] !== 'deleted' // Filter out deleted records
      })
      .map(function(row) {
        return {
          id: row[1],
          checkDate: row[2],
          typeOfFood: row[3],
          temperature: row[4],
          taskDoneBy: row[5],
          notes: row[6] || null,
          createdAt: row[7],
          updatedAt: row[8] || null,
          status: row[9] || 'active'
        }
      })

    // Sort by check date (newest first)
    records.sort(function(a, b) {
      return new Date(b.checkDate) - new Date(a.checkDate)
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
 * Handle POST requests - save or update transport temperature check record
 */
function doPost(e) {
  try {
    var sheet = initializeSheet()

    // Parse incoming data
    var data = JSON.parse(e.postData.contents)

    // Check if this is an update (has existing ID)
    var existingRowIndex = -1
    if (data.id) {
      var allData = sheet.getDataRange().getValues()
      for (var i = 1; i < allData.length; i++) {
        if (allData[i][1] === data.id) {
          existingRowIndex = i + 1 // +1 because sheet rows are 1-indexed
          break
        }
      }
    }

    // Prepare row data
    var row = [
      data.unixTimestamp || Math.floor(Date.now() / 1000),
      data.id,
      data.checkDate,
      data.typeOfFood,
      data.temperature,
      data.taskDoneBy,
      data.notes || '',
      data.createdAt,
      data.updatedAt || '',
      data.status || 'active'
    ]

    if (existingRowIndex > 0) {
      // Update existing row
      sheet.getRange(existingRowIndex, 1, 1, row.length).setValues([row])
    } else {
      // Append new row
      sheet.appendRow(row)
    }

    // Sort by Unix Timestamp (column 1) in descending order
    var lastRow = sheet.getLastRow()
    if (lastRow > 1) {
      var range = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn())
      range.sort([{column: 1, ascending: false}])
    }

    return ContentService.createTextOutput(
      JSON.stringify({
        success: true,
        message: existingRowIndex > 0 ? 'Record updated successfully' : 'Record saved successfully'
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
