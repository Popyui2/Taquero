/**
 * Google Apps Script for Taquero Temperature Logging
 *
 * Setup Instructions:
 * 1. Open your Google Sheet
 * 2. Go to Extensions > Apps Script
 * 3. Delete any existing code and paste this entire script
 * 4. Save the project (name it "Taquero Temperature Logger")
 * 5. Click "Deploy" > "New deployment"
 * 6. Choose type: "Web app"
 * 7. Execute as: "Me"
 * 8. Who has access: "Anyone"
 * 9. Click "Deploy" and copy the web app URL
 * 10. Update the URL in your React app (src/components/temperature/TemperatureWizard.tsx line 17)
 */

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Temperature Logs');

    // Create sheet if it doesn't exist
    if (!sheet) {
      const newSheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet('Temperature Logs');
      // Add headers
      newSheet.appendRow([
        'Timestamp',
        'Date',
        'Time',
        'User',
        'Chiller #1 (°C)',
        'Chiller #2 (°C)',
        'Chiller #3 (°C)',
        'Chiller #4 (°C)',
        'Chiller #5 (°C)',
        'Chiller #6 (°C)',
        'Freezer (°C)'
      ]);

      // Format header row
      const headerRange = newSheet.getRange(1, 1, 1, 11);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#000000');
      headerRange.setFontColor('#FFFFFF');
    }

    const activeSheet = sheet || SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Temperature Logs');

    // Extract the selected date (YYYY-MM-DD format)
    const selectedDate = data.date; // This is the date selected by the user
    const timestamp = data.timestamp; // This is when the submission happened

    // Extract time from timestamp for reference
    const timeOnly = new Date(timestamp).toLocaleTimeString('en-NZ', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });

    // Prepare the row data
    const rowData = [
      timestamp,           // Full timestamp (when submitted)
      selectedDate,        // Selected date (what date the temps are for)
      timeOnly,           // Time of submission
      data.user,          // Username
      data.chillers[0].temperature,  // Chiller #1
      data.chillers[1].temperature,  // Chiller #2
      data.chillers[2].temperature,  // Chiller #3
      data.chillers[3].temperature,  // Chiller #4
      data.chillers[4].temperature,  // Chiller #5
      data.chillers[5].temperature,  // Chiller #6
      data.freezer.temperature       // Freezer
    ];

    // Append the row
    activeSheet.appendRow(rowData);

    // Format the new row
    const lastRow = activeSheet.getLastRow();
    const dataRange = activeSheet.getRange(lastRow, 1, 1, 11);

    // Alternate row colors for better readability
    if (lastRow % 2 === 0) {
      dataRange.setBackground('#1a1a1a');
    }

    // Format temperature columns (check if out of range and highlight)
    for (let col = 5; col <= 10; col++) {
      const tempCell = activeSheet.getRange(lastRow, col);
      const temp = tempCell.getValue();

      // Highlight out-of-range temperatures
      if (col <= 10) { // Chillers (should be 0-5°C)
        if (temp < 0 || temp > 5) {
          tempCell.setBackground('#ff4444');
          tempCell.setFontColor('#ffffff');
        }
      }
      if (col === 11) { // Freezer (should be -25 to -15°C)
        if (temp > -15 || temp < -25) {
          tempCell.setBackground('#ff4444');
          tempCell.setFontColor('#ffffff');
        }
      }
    }

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Temperature data recorded successfully',
      date: selectedDate,
      timestamp: timestamp
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    // Check if this is a date check request
    if (e.parameter.action === 'checkDate' && e.parameter.date) {
      const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Temperature Logs');

      if (!sheet) {
        return ContentService.createTextOutput(JSON.stringify({
          exists: false,
          message: 'No data sheet found'
        })).setMimeType(ContentService.MimeType.JSON);
      }

      const dateToCheck = e.parameter.date;
      const data = sheet.getDataRange().getValues();

      // Skip header row and check for matching date
      for (let i = 1; i < data.length; i++) {
        const rowDate = data[i][1]; // Date column is at index 1
        const rowUser = data[i][3]; // User column is at index 3

        if (rowDate === dateToCheck) {
          return ContentService.createTextOutput(JSON.stringify({
            exists: true,
            date: dateToCheck,
            user: rowUser,
            message: `Temperature check already exists for ${dateToCheck} by ${rowUser}`
          })).setMimeType(ContentService.MimeType.JSON);
        }
      }

      return ContentService.createTextOutput(JSON.stringify({
        exists: false,
        date: dateToCheck,
        message: 'No existing temperature check for this date'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // Default response
    return ContentService.createTextOutput(JSON.stringify({
      status: 'online',
      message: 'Taquero Temperature Logger is running',
      version: '2.0',
      endpoints: {
        post: 'Submit temperature data',
        get: 'Check if date exists: ?action=checkDate&date=YYYY-MM-DD'
      }
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
