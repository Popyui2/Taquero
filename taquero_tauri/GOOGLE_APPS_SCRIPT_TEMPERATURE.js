/**
 * Google Apps Script for Taquero - Fridge/Chiller Temperature Tracking
 *
 * DEPLOYMENT INSTRUCTIONS:
 * 1. Open Google Sheets with your temperature data
 * 2. Go to Extensions > Apps Script
 * 3. Delete any existing code
 * 4. Paste this entire script
 * 5. Click "Deploy" > "New deployment"
 * 6. Select "Web app"
 * 7. Execute as: "Me"
 * 8. Who has access: "Anyone"
 * 9. Click "Deploy" and copy the Web app URL
 * 10. Update the URL in src/store/temperatureStore.ts (line 5)
 */

// Name of the sheet to store temperature data
const SHEET_NAME = 'Temperature_Logs';

/**
 * Handle GET requests - Fetch temperature records
 */
function doGet(e) {
  try {
    const sheet = getOrCreateSheet();
    const data = sheet.getDataRange().getValues();

    // Skip header row
    if (data.length <= 1) {
      return jsonResponse({ success: true, data: [] });
    }

    // Parse rows into temperature records
    // Expected columns: UNIX Timestamp, Date, Time, User, Chiller 1-6, Freezer 1
    const records = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];

      // Skip empty rows
      if (!row[0] && !row[1]) continue;

      try {
        const unixTimestamp = row[0] || '';
        const date = row[1] || '';
        const time = row[2] || '';
        const user = row[3] || '';

        // Convert Unix timestamp to ISO string for frontend
        let isoTimestamp = '';
        if (unixTimestamp) {
          // Check if it's already a Unix timestamp (number) or ISO string
          if (typeof unixTimestamp === 'number') {
            isoTimestamp = new Date(unixTimestamp).toISOString();
          } else if (typeof unixTimestamp === 'string' && unixTimestamp.includes('T')) {
            // Already ISO format
            isoTimestamp = unixTimestamp;
          } else {
            // Try to parse as number
            const unixNum = parseFloat(unixTimestamp);
            if (!isNaN(unixNum)) {
              isoTimestamp = new Date(unixNum).toISOString();
            }
          }
        }

        const record = {
          id: `temp-${i}`,
          date: date,
          timestamp: isoTimestamp || unixTimestamp,
          user: user,
          chillers: [
            { unit: 'Chiller #1', temperature: parseFloat(row[4]) || 0 },
            { unit: 'Chiller #2', temperature: parseFloat(row[5]) || 0 },
            { unit: 'Chiller #3', temperature: parseFloat(row[6]) || 0 },
            { unit: 'Chiller #4', temperature: parseFloat(row[7]) || 0 },
            { unit: 'Chiller #5', temperature: parseFloat(row[8]) || 0 },
            { unit: 'Chiller #6', temperature: parseFloat(row[9]) || 0 },
          ],
          freezer: {
            unit: 'Freezer',
            temperature: parseFloat(row[10]) || 0
          }
        };

        records.push(record);
      } catch (parseError) {
        console.error('Error parsing row', i, parseError);
      }
    }

    // Return records in reverse order (newest first)
    records.reverse();

    return jsonResponse({ success: true, data: records });
  } catch (error) {
    console.error('Error in doGet:', error);
    return jsonResponse({
      success: false,
      error: error.toString()
    });
  }
}

/**
 * Handle POST requests - Save new temperature record
 */
function doPost(e) {
  try {
    const sheet = getOrCreateSheet();

    // Parse incoming data
    let tempData;
    try {
      tempData = JSON.parse(e.postData.contents);
    } catch (parseError) {
      return jsonResponse({
        success: false,
        error: 'Invalid JSON: ' + parseError.toString()
      });
    }

    // Convert ISO timestamp to Unix timestamp (milliseconds)
    const isoTimestamp = tempData.timestamp;
    const unixTimestamp = new Date(isoTimestamp).getTime();
    const date = tempData.date;
    const timeOnly = new Date(isoTimestamp).toTimeString().split(' ')[0]; // HH:MM:SS format

    // Extract temperatures from chillers array
    const chillerTemps = tempData.chillers.map(c => c.temperature);
    const freezerTemp = tempData.freezer ? tempData.freezer.temperature : -18;

    // Prepare row data to match existing format:
    // UNIX Timestamp, Date, Time, User, Chiller 1-6, Freezer 1
    const rowData = [
      unixTimestamp,
      date,
      timeOnly,
      tempData.user,
      ...chillerTemps,
      freezerTemp
    ];

    // Append to sheet
    sheet.appendRow(rowData);

    return jsonResponse({
      success: true,
      message: 'Temperature record saved'
    });

  } catch (error) {
    console.error('Error in doPost:', error);
    return jsonResponse({
      success: false,
      error: error.toString()
    });
  }
}

/**
 * Get or create the temperature sheet
 */
function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);

  // Create sheet if it doesn't exist
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);

    // Add headers to match existing format
    const headers = [
      'UNIX Timestamp',
      'Date',
      'Time',
      'User',
      'Chiller 1',
      'Chiller 2',
      'Chiller 3',
      'Chiller 4',
      'Chiller 5',
      'Chiller 6',
      'Freezer 1'
    ];

    sheet.appendRow(headers);

    // Format header row
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#4285f4');
    headerRange.setFontColor('#ffffff');

    // Freeze header row
    sheet.setFrozenRows(1);

    // Auto-resize columns
    for (let i = 1; i <= headers.length; i++) {
      sheet.autoResizeColumn(i);
    }
  }

  return sheet;
}

/**
 * Create JSON response
 */
function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Test function - run this to verify the script works
 */
function testScript() {
  // Test creating/getting sheet
  const sheet = getOrCreateSheet();
  Logger.log('Sheet created/found: ' + sheet.getName());

  // Test data (frontend sends ISO timestamp, we convert to Unix)
  const testData = {
    date: '2025-11-14',
    timestamp: new Date().toISOString(),
    user: 'Test User',
    chillers: [
      { unit: 'Chiller #1', temperature: 3.0 },
      { unit: 'Chiller #2', temperature: 3.5 },
      { unit: 'Chiller #3', temperature: 2.8 },
      { unit: 'Chiller #4', temperature: 3.2 },
      { unit: 'Chiller #5', temperature: 3.1 },
      { unit: 'Chiller #6', temperature: 3.3 }
    ],
    freezer: { unit: 'Freezer', temperature: -18.0 }
  };

  Logger.log('Test data timestamp (ISO): ' + testData.timestamp);
  Logger.log('Will be saved as Unix: ' + new Date(testData.timestamp).getTime());

  // Test POST
  const postEvent = {
    postData: {
      contents: JSON.stringify(testData)
    }
  };

  const postResult = doPost(postEvent);
  Logger.log('POST test result: ' + postResult.getContent());

  // Test GET
  const getResult = doGet({});
  Logger.log('GET test result: ' + getResult.getContent());
}
