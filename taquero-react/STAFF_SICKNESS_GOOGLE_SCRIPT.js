/**
 * Google Apps Script for Staff Sickness Records
 *
 * SETUP INSTRUCTIONS:
 * 1. Create a new Google Sheet with the following headers in row 1:
 *    Unix Timestamp | Record ID | Staff Name | Symptoms | Date Sick | Date Returned | Action Taken | Checked By | Status
 *
 * 2. Name the sheet tab: "Staff_Sickness"
 * 3. Go to Extensions > Apps Script
 * 4. Paste this code
 * 5. Click Deploy > New deployment
 * 6. Select type: Web app
 * 7. Execute as: Me
 * 8. Who has access: Anyone
 * 9. Click Deploy and copy the deployment URL
 * 10. Paste the URL in src/store/staffSicknessStore.ts (line 6)
 */

var SHEET_NAME = 'Staff_Sickness'

/**
 * Handles GET requests - fetches all sickness records
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
    var records = []

    for (var i = 0; i < rows.length; i++) {
      var row = rows[i]
      var unixTimestamp = row[0]
      var recordId = row[1]
      var staffName = row[2]
      var symptoms = row[3]
      var dateSick = row[4]
      var dateReturned = row[5]
      var actionTaken = row[6]
      var checkedBy = row[7]
      var status = row[8]

      // Create record object
      var record = {
        id: recordId,
        staffName: staffName,
        symptoms: symptoms || undefined,
        dateSick: dateSick,
        dateReturned: dateReturned || undefined,
        actionTaken: actionTaken || undefined,
        checkedBy: checkedBy,
        timestamp: new Date(unixTimestamp * 1000).toISOString(),
        status: status
      }

      records.push(record)
    }

    // Sort records by timestamp (newest first)
    records.sort(function(a, b) {
      return new Date(b.timestamp) - new Date(a.timestamp)
    })

    return createResponse({ success: true, data: records })

  } catch (error) {
    Logger.log('Error in doGet: ' + error.toString())
    return createResponse({
      success: false,
      error: error.toString()
    })
  }
}

/**
 * Handles POST requests - adds new sickness record
 */
function doPost(e) {
  try {
    var sheet = getSheet()

    // Parse the incoming data
    var data = JSON.parse(e.postData.contents)

    // Prepare row data matching the headers:
    // Unix Timestamp | Record ID | Staff Name | Symptoms | Date Sick | Date Returned | Action Taken | Checked By | Status
    var rowData = [
      data.unixTimestamp,
      data.recordId,
      data.staffName,
      data.symptoms || '',
      data.dateSick,
      data.dateReturned || '',
      data.actionTaken || '',
      data.checkedBy,
      data.status
    ]

    // Append the row
    sheet.appendRow(rowData)

    Logger.log('Successfully added sickness record for: ' + data.staffName)

    return createResponse({
      success: true,
      message: 'Sickness record added successfully',
      recordId: data.recordId
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
  Logger.log('Testing Staff Sickness Google Apps Script...')

  // Test data for creating a new sickness record
  var testData = {
    unixTimestamp: Math.floor(Date.now() / 1000),
    recordId: 'sick-test-123',
    staffName: 'Samuel Smith',
    symptoms: 'Fever and vomiting',
    dateSick: '2025-11-17',
    dateReturned: '',
    actionTaken: 'Stayed home, symptoms stopped after 2 days',
    checkedBy: 'Test Manager',
    status: 'sick'
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
