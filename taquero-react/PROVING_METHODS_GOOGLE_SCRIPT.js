/**
 * Google Apps Script for Proving Your Method
 *
 * SETUP INSTRUCTIONS:
 * 1. Create a new Google Sheet with the following headers in row 1:
 *    Method ID | Item Description | Cooking Method | Batch Number | Date | Temperature (°C) | Time at Temp | Completed By | Unix Timestamp | Status | Created By | Created At
 *
 * 2. Open Tools > Script editor
 * 3. Paste this code
 * 4. Deploy as Web App:
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5. Copy the deployment URL and paste it in:
 *    - src/store/provingMethodStore.ts (GOOGLE_SHEETS_URL constant)
 */

// Your Google Sheet ID - REPLACE THIS with your actual Sheet ID
const SHEET_ID = 'YOUR_SHEET_ID_HERE'
const SHEET_NAME = 'Proving_Methods'

/**
 * Handles GET requests - fetches all proving methods with batches
 */
function doGet(e) {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME)

    if (!sheet) {
      return ContentService.createTextOutput(
        JSON.stringify({
          success: false,
          error: 'Sheet not found: ' + SHEET_NAME
        })
      ).setMimeType(ContentService.MimeType.JSON)
    }

    const data = sheet.getDataRange().getValues()

    // Skip header row
    if (data.length <= 1) {
      return ContentService.createTextOutput(
        JSON.stringify({
          success: true,
          data: []
        })
      ).setMimeType(ContentService.MimeType.JSON)
    }

    const rows = data.slice(1)

    // Group rows by Method ID
    const methodsMap = {}

    rows.forEach(row => {
      const methodId = row[0]
      const itemDescription = row[1]
      const cookingMethod = row[2]
      const batchNumber = Number(row[3])
      const date = row[4]
      const temperature = Number(row[5])
      const timeAtTemp = row[6]
      const completedBy = row[7]
      const unixTimestamp = Number(row[8])
      const status = row[9]
      const createdBy = row[10]
      const createdAt = row[11]

      // Create batch object
      const batch = {
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
    })

    // Convert map to array
    const methods = Object.values(methodsMap)

    // Sort batches within each method
    methods.forEach(method => {
      method.batches.sort((a, b) => a.batchNumber - b.batchNumber)
    })

    // Sort methods by created date (newest first)
    methods.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

    return ContentService.createTextOutput(
      JSON.stringify({
        success: true,
        data: methods
      })
    ).setMimeType(ContentService.MimeType.JSON)

  } catch (error) {
    Logger.log('Error in doGet: ' + error.toString())
    return ContentService.createTextOutput(
      JSON.stringify({
        success: false,
        error: error.toString()
      })
    ).setMimeType(ContentService.MimeType.JSON)
  }
}

/**
 * Handles POST requests - adds new method or batch
 * Expected data format:
 * {
 *   methodId: string,
 *   itemDescription: string,
 *   cookingMethod: string,
 *   batchNumber: number,
 *   date: string,
 *   temperature: number,
 *   timeAtTemp: string,
 *   completedBy: string,
 *   unixTimestamp: number,
 *   status: string,
 *   createdBy: string,
 *   createdAt: string
 * }
 */
function doPost(e) {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME)

    if (!sheet) {
      return ContentService.createTextOutput(
        JSON.stringify({
          success: false,
          error: 'Sheet not found: ' + SHEET_NAME
        })
      ).setMimeType(ContentService.MimeType.JSON)
    }

    // Parse the incoming data
    const data = JSON.parse(e.postData.contents)

    // Prepare row data matching the headers:
    // Method ID | Item Description | Cooking Method | Batch Number | Date | Temperature (°C) | Time at Temp | Completed By | Unix Timestamp | Status | Created By | Created At
    const rowData = [
      data.methodId,
      data.itemDescription,
      data.cookingMethod,
      data.batchNumber,
      data.date,
      data.temperature,
      data.timeAtTemp,
      data.completedBy,
      data.unixTimestamp,
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

    return ContentService.createTextOutput(
      JSON.stringify({
        success: true,
        message: 'Batch added successfully',
        methodId: data.methodId,
        batchNumber: data.batchNumber
      })
    ).setMimeType(ContentService.MimeType.JSON)

  } catch (error) {
    Logger.log('Error in doPost: ' + error.toString())
    return ContentService.createTextOutput(
      JSON.stringify({
        success: false,
        error: error.toString()
      })
    ).setMimeType(ContentService.MimeType.JSON)
  }
}

/**
 * Updates the status of all rows for a specific method
 */
function updateMethodStatus(sheet, methodId, newStatus) {
  const data = sheet.getDataRange().getValues()

  for (let i = 1; i < data.length; i++) { // Skip header
    if (data[i][0] === methodId) { // Method ID is in column 0
      sheet.getRange(i + 1, 10).setValue(newStatus) // Status is in column 10 (index 9)
    }
  }

  Logger.log('Updated status to "' + newStatus + '" for method: ' + methodId)
}

/**
 * Test function - run this to verify the script works
 */
function testScript() {
  Logger.log('Testing Proving Methods Google Apps Script...')

  // Test data for creating a new method with batch 1
  const testData = {
    methodId: 'method-test-123',
    itemDescription: '2kg chicken roast x4',
    cookingMethod: 'Put in pre-heated oven at 220°C for 2 hours',
    batchNumber: 1,
    date: '2025-11-17',
    temperature: 75,
    timeAtTemp: '30 minutes',
    completedBy: 'Test User',
    unixTimestamp: Math.floor(Date.now() / 1000),
    status: 'in-progress',
    createdBy: 'Test User',
    createdAt: new Date().toISOString()
  }

  // Test POST
  const postEvent = {
    postData: {
      contents: JSON.stringify(testData)
    }
  }

  const postResult = doPost(postEvent)
  Logger.log('POST test result: ' + postResult.getContent())

  // Test GET
  const getResult = doGet({})
  Logger.log('GET test result: ' + getResult.getContent())
}
