# Cooking Proteins Batch - Setup Guide

This guide will help you set up Google Sheets integration for the Cooking Proteins Batch module.

## Overview

The module tracks temperature batch checks for chicken, beef, and pork with the following data:
- Unix Timestamp
- Staff Name
- Protein Cooked
- Type of check
- Temperature (°C)
- Duration in that temperature
- Cooking Protein Batch ID

---

## Step 1: Create Google Sheet

1. Create a new Google Sheet
2. Name it something like "Taquero - Cooking Proteins Batch"
3. Create a sheet tab named **"Cooking Proteins Batch"**
4. Add these headers in row 1:

| A | B | C | D | E | F | G |
|---|---|---|---|---|---|---|
| Unix Timestamp | Staff Name | Protein Cooked | Type of check | temperature | duration in that temperature | Cooking Protein Batch ID |

---

## Step 2: Deploy Google Apps Script

1. In your Google Sheet, go to **Extensions > Apps Script**
2. Delete any default code
3. Copy the entire contents of `COOKING_PROTEINS_BATCH_GOOGLE_SCRIPT.js`
4. Paste it into the Apps Script editor
5. Update the `SHEET_ID` variable:
   - Get your Sheet ID from the URL: `https://docs.google.com/spreadsheets/d/[SHEET_ID]/edit`
   - Replace `YOUR_SHEET_ID_HERE` with your actual Sheet ID
6. Save the script (Ctrl+S or File > Save)
7. Click **Deploy > New deployment**
8. Configure deployment:
   - Type: **Web app**
   - Description: "Cooking Proteins Batch API"
   - Execute as: **Me**
   - Who has access: **Anyone**
9. Click **Deploy**
10. **Copy the deployment URL** (you'll need this in Step 3)

---

## Step 3: Update React App URLs

You need to update the Google Sheets URLs in two files:

### File 1: `src/store/batchCheckStore.ts`

Find line 6:
```typescript
const GOOGLE_SHEETS_WEBHOOK = 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE'
```

Replace with your deployment URL:
```typescript
const GOOGLE_SHEETS_WEBHOOK = 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec'
```

### File 2: `src/components/batch-check/BatchCheckWizard.tsx`

Find line 19:
```typescript
const GOOGLE_SHEETS_URL = 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE'
```

Replace with the same deployment URL:
```typescript
const GOOGLE_SHEETS_URL = 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec'
```

---

## Step 4: Test the Integration

### Test 1: Submit a Batch Check
1. Rebuild and deploy your React app: `npm run build`
2. Open the Cooking Proteins Batch module
3. Click "Add Batch Check"
4. Fill out the wizard:
   - Food: Chicken
   - Check Type: Weekly Batch
   - Temperature: 75°C
   - Duration: 15 minutes
5. Click "Save & Close"
6. Check your Google Sheet - a new row should appear

### Test 2: Fetch from Google Sheets
1. Add a row manually to your Google Sheet:
   ```
   Unix Timestamp: 1700000000
   Staff Name: Test User
   Protein Cooked: Beef
   Type of check: Individual
   temperature: 68
   duration in that temperature: 20 minutes
   Cooking Protein Batch ID: batch-test-123
   ```
2. Refresh the Cooking Proteins Batch page
3. The manually added record should appear

---

## Step 5: AppSheet Setup (Optional)

If you want a mobile app interface:

1. Follow the guide in `COOKING_PROTEINS_BATCH_APPSHEET.md`
2. AppSheet will connect to the same Google Sheet
3. Both the web app and AppSheet app will sync data automatically

---

## Troubleshooting

### "Sheet not found" error
- Check that the sheet name is exactly **"Cooking Proteins Batch"** (case-sensitive)
- Check that the `SHEET_ID` in Apps Script matches your Google Sheet ID

### Data not appearing after submission
- Open browser console (F12) and check for errors
- Verify the deployment URL is correct in both files
- Check Apps Script logs: Apps Script editor > Executions

### CORS errors
- The app uses `mode: 'no-cors'` for POST requests, which is correct
- You won't get detailed error messages, but the data should still save

### Permissions error
- Make sure the deployment is set to "Anyone" for access
- You may need to authorize the script to access your Google Sheet

---

## Data Format Reference

### From React App to Google Sheets (POST)
```json
{
  "unixTimestamp": 1700000000,
  "staffName": "John Doe",
  "proteinCooked": "Chicken",
  "typeOfCheck": "Weekly Batch",
  "temperature": 75.5,
  "durationInTemperature": "15 minutes",
  "cookingProteinBatchID": "batch-123456789-abc"
}
```

### From Google Sheets to React App (GET)
```json
{
  "success": true,
  "data": [
    {
      "id": "batch-123456789-abc",
      "date": "2024-01-15",
      "time": "14:30",
      "foodType": "Chicken",
      "customFood": undefined,
      "checkType": "weekly",
      "temperature": 75.5,
      "timeAtTemperature": "15 minutes",
      "completedBy": "John Doe",
      "timestamp": "2024-01-15T14:30:00.000Z"
    }
  ]
}
```

---

## Security Notes

- The Apps Script runs with "Anyone" access but requires the exact URL
- Only authorized users of your app can submit data (they must be logged in)
- Consider adding authentication to the Apps Script if needed
- The Google Sheet should be shared only with authorized personnel

---

## Maintenance

### Updating the Apps Script
1. Make changes in the Apps Script editor
2. Save the script
3. Deploy > Manage deployments
4. Click the edit icon (pencil)
5. Version: New version
6. Deploy

The URL stays the same, so you don't need to update your React app.

### Archiving Old Data
Periodically move old records to an "Archive" sheet to keep the main sheet performant.

---

## Support

If you encounter issues:
1. Check the browser console for errors
2. Check Apps Script execution logs
3. Verify all URLs are correct
4. Test with a simple manual Google Sheet entry first
