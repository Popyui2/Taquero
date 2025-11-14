# Temperature Tracking - Google Apps Script Deployment

## Quick Setup Instructions

### Step 1: Copy the Script (No Changes Needed!)

The script is already configured for your sheet:
- Sheet name: `Temperature_Logs` ✅
- Column: `UNIX Timestamp` (saves timestamps as Unix milliseconds) ✅
- Just copy and paste the entire `GOOGLE_APPS_SCRIPT_TEMPERATURE.js` file!

### Step 2: Deploy to Google Sheets

1. Open your Google Sheet with temperature data
2. Go to **Extensions → Apps Script**
3. **Delete** any existing code in the editor
4. **Copy the entire contents** of `GOOGLE_APPS_SCRIPT_TEMPERATURE.js`
5. **Paste** it into the Apps Script editor
6. Click **Deploy → New deployment**
7. Click the gear icon ⚙️ and select **Web app**
8. Configure:
   - **Description:** Temperature Tracker API
   - **Execute as:** Me
   - **Who has access:** Anyone
9. Click **Deploy**
10. **Authorize** the app when prompted
11. **Copy the Web app URL** (it will look like: `https://script.google.com/macros/s/...`)

### Step 3: Update the Frontend

1. Open `src/store/temperatureStore.ts`
2. On **line 5**, replace the URL with your new Web app URL:
   ```typescript
   const GOOGLE_SHEETS_WEBHOOK = 'YOUR_NEW_URL_HERE'
   ```
3. Save the file

### Step 4: Update Your Sheet Header (Important!)

1. Open your `Temperature_Logs` sheet
2. **Rename the first column** from "Timestamp" to **"UNIX Timestamp"**
3. Your existing data will work fine - the script handles both Unix timestamps and ISO format automatically

### Step 5: Test It!

1. Refresh your tablet browser
2. Go to **Fridge/Chiller Temps**
3. You should see your existing records appear below the "Today's date" section
4. If you see records, the completion badge should appear on the dashboard automatically

## Troubleshooting

### "No temperature records found"
- Make sure your sheet tab is named exactly `Temperature_Logs` (case-sensitive!)
- Make sure you deployed the script as a **Web app** with "Anyone" access
- Check the browser console (F12) for error messages
- Verify the Web app URL is correctly set in `src/store/temperatureStore.ts`

### Completion badge not showing
- Make sure today's date exists in your Google Sheet in the format: `2025-11-14`
- Try refreshing the page

### Data structure
Your sheet should have these columns in this order:
1. UNIX Timestamp (Unix milliseconds like `1731466570998`)
2. Date (like `2025-11-13`)
3. Time (like `15:16:10`)
4. User (like `Martin`)
5. Chiller 1 (number)
6. Chiller 2 (number)
7. Chiller 3 (number)
8. Chiller 4 (number)
9. Chiller 5 (number)
10. Chiller 6 (number)
11. Freezer 1 (number)

**Note:** The script automatically converts between Unix timestamps (in Google Sheets) and ISO format (used by the app)

## Need Help?

Check the Apps Script logs:
1. In Apps Script editor, go to **Executions** (left sidebar)
2. Look for recent GET/POST requests
3. Check for any error messages
