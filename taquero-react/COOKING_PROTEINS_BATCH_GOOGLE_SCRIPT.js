/**
 * Google Apps Script for Cooking Proteins Batch Temperature Checks
 *
 * SETUP INSTRUCTIONS:
 * 1. Create a new Google Sheet with the following headers in row 1:
 *    Unix Timestamp | Staff Name | Protein Cooked | Type of check | temperature | duration in that temperature | Cooking Protein Batch ID
 *
 * 2. Open Tools > Script editor
 * 3. Paste this code
 * 4. Deploy as Web App:
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5. Copy the deployment URL and paste it in:
 *    - src/store/batchCheckStore.ts (GOOGLE_SHEETS_WEBHOOK)
 *    - src/components/batch-check/BatchCheckWizard.tsx (GOOGLE_SHEETS_URL)
 */

// Your Google Sheet ID - REPLACE THIS with your actual Sheet ID
const SHEET_ID = 'YOUR_SHEET_ID_HERE'
const SHEET_NAME = 'Cooking Proteins Batch'

/**
 * Handles GET requests - fetches all batch check data
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
    const headers = data[0]
    const rows = data.slice(1)

    // Transform rows into objects
    const batchChecks = rows.map(row => {
      const timestamp = new Date(row[0] * 1000) // Convert Unix timestamp to Date

      // Parse type of check to get checkType value
      let checkType = 'initial'
      const typeOfCheckLower = String(row[3]).toLowerCase()
      if (typeOfCheckLower.includes('weekly')) {
        checkType = 'weekly'
      } else if (typeOfCheckLower.includes('one item')) {
        checkType = 'confirm'
      } else if (typeOfCheckLower.includes('doner')) {
        checkType = 'doner'
      }

      // Parse food type
      let foodType = String(row[2])
      let customFood = undefined

      if (foodType !== 'Chicken' && foodType !== 'Beef' && foodType !== 'Pork') {
        customFood = foodType
        foodType = 'Other'
      }

      return {
        id: row[6], // Cooking Protein Batch ID
        date: Utilities.formatDate(timestamp, Session.getScriptTimeZone(), 'yyyy-MM-dd'),
        time: Utilities.formatDate(timestamp, Session.getScriptTimeZone(), 'HH:mm'),
        foodType: foodType,
        customFood: customFood,
        checkType: checkType,
        temperature: Number(row[4]),
        timeAtTemperature: String(row[5]),
        completedBy: String(row[1]),
        timestamp: timestamp.toISOString(),
      }
    })

    // Sort by timestamp descending (newest first)
    batchChecks.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

    return ContentService.createTextOutput(
      JSON.stringify({
        success: true,
        data: batchChecks
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
 * Handles POST requests - adds new batch check
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
    // Unix Timestamp | Staff Name | Protein Cooked | Type of check | temperature | duration in that temperature | Cooking Protein Batch ID
    const rowData = [
      data.unixTimestamp,
      data.staffName,
      data.proteinCooked,
      data.typeOfCheck,
      data.temperature,
      data.durationInTemperature,
      data.cookingProteinBatchID
    ]

    // Append the row
    sheet.appendRow(rowData)

    Logger.log('Successfully added batch check: ' + data.cookingProteinBatchID)

    return ContentService.createTextOutput(
      JSON.stringify({
        success: true,
        message: 'Batch check added successfully',
        id: data.cookingProteinBatchID
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
