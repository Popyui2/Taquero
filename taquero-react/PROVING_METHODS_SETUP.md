# Proving Your Method - Google Sheets Setup Guide

This guide will help you connect the Proving Your Method module to Google Sheets for permanent record keeping.

## Step 1: Create Your Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet
3. Name it something like "Taquero - Proving Methods"
4. Rename the first sheet tab to **"Proving_Methods"** (exact name, with underscore)
5. In the first row (header row), add these exact column names:

```
Unix Timestamp | Method ID | Item Description | Cooking Method | Batch Number | Date | Temperature (°C) | Time at Temp | Completed By | Status | Created By | Created At
```

**Important:** Make sure the headers match exactly (case-sensitive, with spaces)

## Step 2: Create the Apps Script

1. In your Google Sheet, go to **Extensions** > **Apps Script**
2. Delete any existing code in the editor
3. Open the file `PROVING_METHODS_GOOGLE_SCRIPT.js` in this project
4. Copy ALL the code
5. Paste it into the Apps Script editor
6. Click the **Save** icon (💾)

## Step 3: Deploy as Web App

1. Click the **Deploy** button (top right) > **New deployment**
2. Click the gear icon ⚙️ next to "Select type"
3. Choose **Web app**
4. Fill in the settings:
   - **Description:** "Proving Methods API v1"
   - **Execute as:** Me (your email)
   - **Who has access:** Anyone
5. Click **Deploy**
6. You might need to authorize the script:
   - Click **Authorize access**
   - Choose your Google account
   - Click **Advanced** > **Go to [project name] (unsafe)**
   - Click **Allow**
7. Copy the **Web app URL** - it should look like:
   ```
   https://script.google.com/macros/s/LONG_DEPLOYMENT_ID_HERE/exec
   ```

## Step 4: Update the React App

1. Open `src/store/provingMethodStore.ts`
2. Find this line near the top (around line 6):
   ```typescript
   const GOOGLE_SHEETS_URL = ''
   ```
3. Paste your Web app URL between the quotes:
   ```typescript
   const GOOGLE_SHEETS_URL = 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec'
   ```
4. Save the file

## Step 5: Test the Integration

1. Run the app and log in
2. Go to **Proving Your Method**
3. Click **Create New Method**
4. Fill in the wizard and create a method with Batch 1
5. Check your Google Sheet - you should see a new row with the data!

## How It Works

### Creating a New Method
When you create a new method with Batch 1:
- A row is added to Google Sheets with all method details
- Status is set to "in-progress"
- Batch number is set to 1
- Unix timestamp is in the first column

### Adding Batches 2 & 3
When you add additional batches:
- Each batch creates a new row in Google Sheets
- The Method ID links all batches together
- When Batch 3 is added, ALL rows for that method automatically update to status "proven"

### Data Structure
Each row in Google Sheets represents ONE batch for a method:
- Methods with 3 batches will have 3 rows
- All rows share the same Method ID
- Status changes from "in-progress" to "proven" when Batch 3 is complete

### Reading Data
The app fetches all rows from Google Sheets and groups them by Method ID to reconstruct the full method with all its batches.

## Troubleshooting

### "Sheet not found" error
- Make sure your sheet tab is named exactly **"Proving_Methods"** (with underscore, case-sensitive)

### No data appearing in Google Sheets
- Check browser console for errors (F12 in most browsers)
- Verify the Web app URL is correct in `provingMethodStore.ts`
- Make sure you deployed with "Who has access: Anyone"

### Permission errors
- Re-deploy the script
- Make sure you authorized the script when prompted
- Try accessing the Web app URL directly in your browser - it should return JSON with `{"success":true,"data":[]}`

### Testing the Script
In Apps Script editor, you can run the `testScript()` function to test if everything works:
1. Select `testScript` from the function dropdown
2. Click the **Run** button
3. Check the **Execution log** (View > Logs) for results

## Security Note

The Google Apps Script is deployed as "Anyone" can access it. This is necessary for the web app to work. However, only people with the exact URL can access it. Keep your deployment URL private and don't share it publicly.

## Need Help?

If you run into issues:
1. Check the Apps Script logs: **View** > **Execution log** in the Apps Script editor
2. Run the `testScript()` function in Apps Script to test the integration
3. Check your browser's Developer Console (F12) for errors
4. Make sure the sheet tab is named exactly "Proving_Methods"
