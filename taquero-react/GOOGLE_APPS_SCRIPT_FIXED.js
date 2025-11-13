/**
 * Google Apps Script for Taquero Temperature Logging
 * FIXED VERSION - Uses the date from the submitted data
 */

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Temperature Logs');

    // Create sheet if it doesn't exist
    if (!sheet) {
      const newSheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet('Temperature Logs');
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
      newSheet.getRange(1, 1, 1, 11).setFontWeight('bold').setBackground('#000000').setFontColor('#FFFFFF');
    }

    const activeSheet = sheet || SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Temperature Logs');

    // IMPORTANT: Use the date from the data payload (user-selected date)
    const selectedDate = data.date; // This is YYYY-MM-DD format from the app
    const timestamp = data.timestamp; // This is when it was submitted

    // Extract time from timestamp
    const timeOnly = new Date(timestamp).toLocaleTimeString('en-NZ', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });

    // Prepare the row data - USE selectedDate, NOT current date
    const rowData = [
      timestamp,           // Full ISO timestamp (when submitted)
      selectedDate,        // The date selected by the user (YYYY-MM-DD)
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

    // Alternate row colors
    if (lastRow % 2 === 0) {
      dataRange.setBackground('#1a1a1a');
    }

    // Highlight out-of-range temperatures
    for (let col = 5; col <= 10; col++) {
      const tempCell = activeSheet.getRange(lastRow, col);
      const temp = tempCell.getValue();

      if (col <= 10) { // Chillers (should be 0-5°C)
        if (temp < 0 || temp > 5) {
          tempCell.setBackground('#ff4444').setFontColor('#ffffff');
        }
      }
      if (col === 11) { // Freezer (should be -25 to -15°C)
        if (temp > -15 || temp < -25) {
          tempCell.setBackground('#ff4444').setFontColor('#ffffff');
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
  return ContentService.createTextOutput(JSON.stringify({
    status: 'online',
    message: 'Taquero Temperature Logger is running',
    version: '2.1'
  })).setMimeType(ContentService.MimeType.JSON);
}
