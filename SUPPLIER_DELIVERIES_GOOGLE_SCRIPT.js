/**
 * TAQUERO - SUPPLIER DELIVERIES MODULE
 * Google Apps Script Backend
 *
 * PURPOSE: Record all deliveries from suppliers for food safety compliance and traceability.
 * Critical for recalls - if there's a problem with food, you can trace it back to the supplier and batch.
 *
 * DEPLOYMENT INSTRUCTIONS:
 * 1. Create new Google Sheet named "Taquero_Supplier_Deliveries"
 * 2. Extensions > Apps Script
 * 3. Paste this code
 * 4. Save (Ctrl/Cmd + S)
 * 5. Deploy > New deployment
 * 6. Type: "Web app"
 * 7. Execute as: "Me"
 * 8. Who has access: "Anyone"
 * 9. Deploy and copy Web app URL
 * 10. Update deliveriesStore.ts with the URL
 */

var SHEET_NAME = 'Supplier_Deliveries'

/**
 * Initialize or get the sheet
 */
function initializeSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet()
  var sheet = ss.getSheetByName(SHEET_NAME)

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME)
    var headers = [
      'Unix Timestamp',
      'Delivery ID',
      'Delivery Date',
      'Supplier Name',
      'Supplier Contact',
      'Batch/Lot ID',
      'Type of Food',
      'Quantity',
      'Unit',
      'Requires Temp Check',
      'Temperature',
      'Task Done By',
      'Notes',
      'Created By',
      'Created At',
      'Updated At',
      'Status'
    ]
    sheet.getRange(1, 1, 1, headers.length).setValues([headers])
    sheet.getRange(1, 1, 1, headers.length)
      .setFontWeight('bold')
      .setBackground('#4285f4')
      .setFontColor('#ffffff')
    sheet.setFrozenRows(1)
  }
  return sheet
}

/**
 * Handle GET requests - Fetch all active delivery records
 */
function doGet(e) {
  try {
    var sheet = initializeSheet()
    var data = sheet.getDataRange().getValues()
    var headers = data[0]
    var rows = data.slice(1)

    // Filter out deleted records (status column is index 16)
    var records = rows
      .filter(function(row) {
        return row[16] !== 'deleted'
      })
      .map(function(row) {
        return {
          id: row[1],
          deliveryDate: row[2],
          supplierName: row[3],
          supplierContact: row[4],
          batchLotId: row[5] || undefined,
          typeOfFood: row[6],
          quantity: row[7],
          unit: row[8],
          requiresTempCheck: row[9] === 'true' || row[9] === true,
          temperature: row[10] !== '' && row[10] !== null ? parseFloat(row[10]) : undefined,
          taskDoneBy: row[11],
          notes: row[12] || undefined,
          createdBy: row[13],
          createdAt: row[14],
          updatedAt: row[15] || undefined,
          status: row[16] || 'active'
        }
      })

    // Sort by delivery date descending (most recent first)
    records.sort(function(a, b) {
      return new Date(b.deliveryDate) - new Date(a.deliveryDate)
    })

    return ContentService.createTextOutput(
      JSON.stringify({ success: true, data: records })
    ).setMimeType(ContentService.MimeType.JSON)
  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, error: error.toString() })
    ).setMimeType(ContentService.MimeType.JSON)
  }
}

/**
 * Handle POST requests - Save or update delivery records
 */
function doPost(e) {
  try {
    var sheet = initializeSheet()
    var data = JSON.parse(e.postData.contents)

    // Check if updating existing record
    var existingRowIndex = -1
    if (data.id) {
      var allData = sheet.getDataRange().getValues()
      for (var i = 1; i < allData.length; i++) {
        if (allData[i][1] === data.id) {
          existingRowIndex = i + 1
          break
        }
      }
    }

    var row = [
      data.unixTimestamp || Math.floor(Date.now() / 1000),
      data.id,
      data.deliveryDate,
      data.supplierName,
      data.supplierContact,
      data.batchLotId || '',
      data.typeOfFood,
      data.quantity,
      data.unit,
      data.requiresTempCheck,
      data.temperature !== undefined && data.temperature !== null ? data.temperature : '',
      data.taskDoneBy,
      data.notes || '',
      data.createdBy,
      data.createdAt,
      data.updatedAt || '',
      data.status || 'active'
    ]

    if (existingRowIndex > 0) {
      // Update existing record
      sheet.getRange(existingRowIndex, 1, 1, row.length).setValues([row])
    } else {
      // Append new record
      sheet.appendRow(row)
    }

    // Sort by Unix Timestamp descending (most recent first)
    var lastRow = sheet.getLastRow()
    if (lastRow > 1) {
      var range = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn())
      range.sort([{column: 1, ascending: false}])
    }

    return ContentService.createTextOutput(
      JSON.stringify({ success: true })
    ).setMimeType(ContentService.MimeType.JSON)
  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, error: error.toString() })
    ).setMimeType(ContentService.MimeType.JSON)
  }
}
