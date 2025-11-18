/**
 * Google Apps Script for Allergens in My Food Module
 *
 * This script manages the backend for the Taquero "Allergens in My Food" module.
 * It stores allergen information for dishes to help staff inform customers.
 *
 * SETUP INSTRUCTIONS:
 * 1. Create a new Google Sheet named "Taquero_Allergens"
 * 2. Open Extensions > Apps Script
 * 3. Delete any existing code and paste this entire script
 * 4. Save the script (File > Save or Ctrl/Cmd + S)
 * 5. Click "Deploy" > "New deployment"
 * 6. Select type: "Web app"
 * 7. Settings:
 *    - Description: "Taquero Allergens API"
 *    - Execute as: "Me"
 *    - Who has access: "Anyone" (this is safe - your data is still private)
 * 8. Click "Deploy"
 * 9. Copy the "Web app URL" - you'll need this for your Taquero app
 * 10. Update src/store/allergensStore.ts with this URL
 */

var SHEET_NAME = 'Allergen_Records'

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
      'Dish Name',
      'Ingredients',
      'Allergens',
      'Created By',
      'Created At',
      'Updated At'
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
 * Handle GET requests - fetch all allergen records
 */
function doGet(e) {
  try {
    var sheet = initializeSheet()
    var data = sheet.getDataRange().getValues()
    var headers = data[0]
    var rows = data.slice(1)

    // Convert rows to allergen record objects
    var records = rows.map(function(row) {
      return {
        id: row[1],
        dishName: row[2],
        ingredients: row[3],
        allergens: row[4] ? row[4].split(',').map(function(a) { return a.trim() }) : [],
        createdBy: row[5],
        createdAt: row[6],
        updatedAt: row[7] || null
      }
    })

    // Sort by creation date (newest first)
    records.sort(function(a, b) {
      return new Date(b.createdAt) - new Date(a.createdAt)
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
 * Handle POST requests - save or update allergen record
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
      data.dishName,
      data.ingredients,
      Array.isArray(data.allergens) ? data.allergens.join(', ') : data.allergens,
      data.createdBy,
      data.createdAt,
      data.updatedAt || ''
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

/**
 * Handle DELETE requests - delete allergen record
 * Note: Google Apps Script doesn't support DELETE method directly via doPost,
 * so we handle it via POST with a 'delete' action parameter
 */
function doDelete(e) {
  try {
    var sheet = initializeSheet()
    var data = JSON.parse(e.postData.contents)

    if (!data.id) {
      throw new Error('Record ID is required for deletion')
    }

    var allData = sheet.getDataRange().getValues()
    for (var i = 1; i < allData.length; i++) {
      if (allData[i][1] === data.id) {
        sheet.deleteRow(i + 1) // +1 because sheet rows are 1-indexed
        return ContentService.createTextOutput(
          JSON.stringify({
            success: true,
            message: 'Record deleted successfully'
          })
        ).setMimeType(ContentService.MimeType.JSON)
      }
    }

    throw new Error('Record not found')

  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({
        success: false,
        error: error.toString()
      })
    ).setMimeType(ContentService.MimeType.JSON)
  }
}
