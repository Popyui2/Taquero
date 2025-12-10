/**
 * SECURE Google Apps Script Template for Taquero
 *
 * This is an example of how to add security to your Google Apps Script webhooks
 *
 * SETUP INSTRUCTIONS:
 * 1. Copy this code to your Google Apps Script
 * 2. Replace 'YOUR_SHEET_ID' with your actual Google Sheets ID
 * 3. Replace 'Sheet1' with your actual sheet name
 * 4. Go to Project Settings → Script Properties
 * 5. Add property: GOOGLE_SHEETS_SECRET_TOKEN = (your random token)
 * 6. Save and deploy as Web App
 */

function doPost(e) {
  try {
    // ===== SECURITY: Token Verification =====
    const SECRET_TOKEN = PropertiesService.getScriptProperties()
      .getProperty('GOOGLE_SHEETS_SECRET_TOKEN');

    // Parse the incoming data
    const data = JSON.parse(e.postData.contents);

    // Verify the token
    if (!SECRET_TOKEN || !data.token || data.token !== SECRET_TOKEN) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'Unauthorized - Invalid or missing token',
        timestamp: new Date().toISOString()
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // Remove token from data before saving (don't save it to sheet)
    delete data.token;

    // ===== RATE LIMITING (Optional) =====
    // Check if same data was submitted in last 5 seconds
    const cache = CacheService.getScriptCache();
    const cacheKey = 'last_submission_' + JSON.stringify(data).substring(0, 100);
    const lastSubmission = cache.get(cacheKey);

    if (lastSubmission) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'Duplicate submission - please wait a moment',
        timestamp: new Date().toISOString()
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // Set cache for 5 seconds
    cache.put(cacheKey, 'true', 5);

    // ===== SAVE TO GOOGLE SHEETS =====
    const sheet = SpreadsheetApp.openById('YOUR_SHEET_ID')
      .getSheetByName('Sheet1');

    if (!sheet) {
      throw new Error('Sheet not found');
    }

    // Example: Append data as a new row
    // Customize this based on your data structure
    const row = [
      data.timestamp || new Date().toISOString(),
      data.userName || '',
      data.field1 || '',
      data.field2 || '',
      data.field3 || '',
      // Add more fields as needed
    ];

    sheet.appendRow(row);

    // Success response
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Data saved successfully',
      timestamp: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    // Error response
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString(),
      timestamp: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Optional: doGet function for testing
 * This allows you to test if the script is deployed correctly
 */
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'ok',
    message: 'Taquero Google Apps Script is running',
    timestamp: new Date().toISOString(),
    note: 'Use POST requests with token authentication'
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * How to deploy:
 * 1. Click "Deploy" → "New deployment"
 * 2. Type: Web app
 * 3. Execute as: Me
 * 4. Who has access: Anyone
 * 5. Click "Deploy"
 * 6. Copy the Web App URL
 * 7. Use this URL in your React app
 */
