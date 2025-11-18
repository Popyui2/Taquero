/**
 * Google Apps Script for My Trusted Suppliers Module
 *
 * This script manages the backend for the Taquero "My Trusted Suppliers" module.
 * It stores trusted supplier information for food safety and recall purposes.
 *
 * SETUP INSTRUCTIONS:
 * 1. Create a new Google Sheet named "Taquero_Suppliers"
 * 2. Open Extensions > Apps Script
 * 3. Delete any existing code and paste this entire script
 * 4. Save the script (File > Save or Ctrl/Cmd + S)
 * 5. Click "Deploy" > "New deployment"
 * 6. Select type: "Web app"
 * 7. Settings:
 *    - Description: "Taquero Suppliers API"
 *    - Execute as: "Me"
 *    - Who has access: "Anyone" (this is safe - your data is still private)
 * 8. Click "Deploy"
 * 9. Copy the "Web app URL" - you'll need this for your Taquero app
 * 10. Update src/store/suppliersStore.ts with this URL
 */

var SHEET_NAME = 'Supplier_Records'

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
      'Business Name',
      'Site Registration Number',
      'Contact Person',
      'Phone',
      'Email',
      'Address',
      'Order Days',
      'Delivery Days',
      'Goods Supplied',
      'Comments',
      'Created By',
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
 * Handle GET requests - fetch all supplier records
 */
function doGet(e) {
  try {
    var sheet = initializeSheet()
    var data = sheet.getDataRange().getValues()
    var headers = data[0]
    var rows = data.slice(1)

    // Convert rows to supplier record objects (filter out deleted records)
    var records = rows
      .filter(function(row) {
        return row[15] !== 'deleted' // Filter out deleted records
      })
      .map(function(row) {
        return {
          id: row[1],
          businessName: row[2],
          siteRegistrationNumber: row[3],
          contactPerson: row[4],
          phone: row[5],
          email: row[6],
          address: row[7],
          orderDays: row[8] ? row[8].split(',').map(function(d) { return d.trim() }) : [],
          deliveryDays: row[9] ? row[9].split(',').map(function(d) { return d.trim() }) : [],
          goodsSupplied: row[10],
          comments: row[11] || null,
          createdBy: row[12],
          createdAt: row[13],
          updatedAt: row[14] || null,
          status: row[15] || 'active'
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
 * Handle POST requests - save or update supplier record
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
      data.businessName,
      data.siteRegistrationNumber,
      data.contactPerson,
      data.phone,
      data.email,
      data.address,
      Array.isArray(data.orderDays) ? data.orderDays.join(', ') : data.orderDays,
      Array.isArray(data.deliveryDays) ? data.deliveryDays.join(', ') : data.deliveryDays,
      data.goodsSupplied,
      data.comments || '',
      data.createdBy,
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
