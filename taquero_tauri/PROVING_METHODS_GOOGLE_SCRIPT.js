/**
 * Google Apps Script for Proving Your Method
 *
 * SETUP INSTRUCTIONS:
 * 1. Create a new Google Sheet with the following headers in row 1:
 *    Unix Timestamp | Method ID | Item Description | Cooking Method | Batch Number | Date | Temperature (°C) | Time at Temp | Completed By | Status | Created By | Created At
 *
 * 2. Go to Extensions > Apps Script
 * 3. Paste this code
 * 4. Click Deploy > New deployment
 * 5. Select type: Web app
 * 6. Execute as: Me
 * 7. Who has access: Anyone
 * 8. Click Deploy and copy the deployment URL
 * 9. Paste the URL in src/store/provingMethodStore.ts (line 6)
 */

var SHEET_NAME = 'Proving_Methods'

/**
 * Handles GET requests - fetches all proving methods with batches
 */
function doGet(e) {
  try {
    var sheet = getSheet()
    var data = sheet.getDataRange().getValues()

    // Skip header row
    if (data.length <= 1) {
      return createResponse({ success: true, data: [] })
    }

    var rows = data.slice(1)
    var methodsMap = {}

    for (var i = 0; i < rows.length; i++) {
      var row = rows[i]
      var unixTimestamp = row[0]
      var methodId = row[1]
      var itemDescription = row[2]
      var cookingMethod = row[3]
      var batchNumber = Number(row[4])
      var date = row[5]
      var temperature = Number(row[6])
      var timeAtTemp = row[7]
      var completedBy = row[8]
      var status = row[9]
      var createdBy = row[10]
      var createdAt = row[11]

      // Create batch object
      var batch = {
        batchNumber: batchNumber,
        date: date,
        temperature: temperature,
        timeAtTemp: timeAtTemp,
        completedBy: completedBy,
        timestamp: new Date(unixTimestamp * 1000).toISOString()
      }

      // Add to methods map
      if (!methodsMap[methodId]) {
        methodsMap[methodId] = {
          id: methodId,
          itemDescription: itemDescription,
          cookingMethod: cookingMethod,
          status: status,
          batches: [],
          createdAt: createdAt,
          createdBy: createdBy
        }
      }

      methodsMap[methodId].batches.push(batch)
    }

    // Convert map to array
    var methods = []
    for (var key in methodsMap) {
      methods.push(methodsMap[key])
    }

    // Sort batches within each method
    for (var j = 0; j < methods.length; j++) {
      methods[j].batches.sort(function(a, b) {
        return a.batchNumber - b.batchNumber
      })
    }

    // Sort methods by created date (newest first)
    methods.sort(function(a, b) {
      return new Date(b.createdAt) - new Date(a.createdAt)
    })

    return createResponse({ success: true, data: methods })

  } catch (error) {
    Logger.log('Error in doGet: ' + error.toString())
    return createResponse({
      success: false,
      error: error.toString()
    })
  }
}

/**
 * Handles POST requests - adds new method or batch
 */
function doPost(e) {
  try {
    var sheet = getSheet()

    // Parse the incoming data
    var data = JSON.parse(e.postData.contents)

    // Prepare row data matching the headers:
    // Unix Timestamp | Method ID | Item Description | Cooking Method | Batch Number | Date | Temperature (°C) | Time at Temp | Completed By | Status | Created By | Created At
    var rowData = [
      data.unixTimestamp,
      data.methodId,
      data.itemDescription,
      data.cookingMethod,
      data.batchNumber,
      data.date,
      data.temperature,
      data.timeAtTemp,
      data.completedBy,
      data.status,
      data.createdBy,
      data.createdAt
    ]

    // Append the row
    sheet.appendRow(rowData)

    // If this is batch 3, update all rows for this method to status "proven"
    if (data.batchNumber === 3) {
      updateMethodStatus(sheet, data.methodId, 'proven')
    }

    Logger.log('Successfully added batch ' + data.batchNumber + ' for method: ' + data.methodId)

    return createResponse({
      success: true,
      message: 'Batch added successfully',
      methodId: data.methodId,
      batchNumber: data.batchNumber
    })

  } catch (error) {
    Logger.log('Error in doPost: ' + error.toString())
    return createResponse({
      success: false,
      error: error.toString()
    })
  }
}

/**
 * Updates the status of all rows for a specific method
 */
function updateMethodStatus(sheet, methodId, newStatus) {
  var data = sheet.getDataRange().getValues()

  for (var i = 1; i < data.length; i++) { // Skip header
    if (data[i][1] === methodId) { // Method ID is in column 1 (index 1)
      sheet.getRange(i + 1, 10).setValue(newStatus) // Status is in column 10 (index 9)
    }
  }

  Logger.log('Updated status to "' + newStatus + '" for method: ' + methodId)
}

/**
 * Get the sheet
 */
function getSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet()
  var sheet = ss.getSheetByName(SHEET_NAME)

  if (!sheet) {
    throw new Error('Sheet not found: ' + SHEET_NAME + '. Please create a sheet with this name.')
  }

  return sheet
}

/**
 * Create JSON response
 */
function createResponse(obj) {
  var json = JSON.stringify(obj)
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON)
}

/**
 * Test function - run this to verify the script works
 */
function testScript() {
  Logger.log('Testing Proving Methods Google Apps Script...')

  // Test data for creating a new method with batch 1
  var testData = {
    unixTimestamp: Math.floor(Date.now() / 1000),
    methodId: 'method-test-123',
    itemDescription: '2kg chicken roast x4',
    cookingMethod: 'Put in pre-heated oven at 220°C for 2 hours',
    batchNumber: 1,
    date: '2025-11-17',
    temperature: 75,
    timeAtTemp: '30 minutes',
    completedBy: 'Test User',
    status: 'in-progress',
    createdBy: 'Test User',
    createdAt: new Date().toISOString()
  }

  // Test POST
  var postEvent = {
    postData: {
      contents: JSON.stringify(testData)
    }
  }

  var postResult = doPost(postEvent)
  Logger.log('POST test result: ' + postResult.getContent())

  // Test GET
  var getResult = doGet({})
  Logger.log('GET test result: ' + getResult.getContent())
}
