# MPI Compliance PWA - Setup Guide

Complete setup instructions for deploying your compliance system.

## 📋 Table of Contents
1. [Google Workspace Setup](#1-google-workspace-setup)
2. [Google Sheets Setup](#2-google-sheets-setup)
3. [Google Apps Script Setup](#3-google-apps-script-setup)
4. [Google OAuth Setup](#4-google-oauth-setup)
5. [Hosting Setup](#5-hosting-setup)
6. [Final Configuration](#6-final-configuration)
7. [Testing](#7-testing)

---

## 1. Google Workspace Setup

You mentioned you have Google Workspace. Make sure your 4 staff members have Google accounts.

---

## 2. Google Sheets Setup

### Create the Spreadsheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet called "MPI Compliance Records"
3. Create the following sheets (tabs):

#### Sheet 1: "Temperature Logs"
Create columns (Row 1):
```
Timestamp | Staff Name | Email | Equipment Type | Location | Temperature (°C) | Notes
```

#### Sheet 2: "Cleaning Checklist"
Create columns (Row 1):
```
Timestamp | Staff Name | Email | Task | Completed | Notes
```

#### Sheet 3: "Delivery Logs"
Create columns (Row 1):
```
Timestamp | Staff Name | Email | Supplier | Product | Temperature | Condition | Notes
```

#### Sheet 4: "Incident Reports"
Create columns (Row 1):
```
Timestamp | Staff Name | Email | Incident Type | Description | Corrective Action | Follow-up Required
```

#### Sheet 5: "Staff Records"
Create columns (Row 1):
```
Timestamp | Staff Name | Email | Record Type | Details | Expiry Date | Notes
```

4. **Copy the Spreadsheet ID** from the URL:
   - URL format: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID_HERE/edit`
   - Copy the long string between `/d/` and `/edit`

---

## 3. Google Apps Script Setup

This creates a simple API endpoint for saving data to your Google Sheet.

1. In your Google Sheet, click **Extensions > Apps Script**
2. Delete any existing code
3. Copy and paste this code:

```javascript
// Google Apps Script for MPI Compliance System
// This creates a web app endpoint to receive data from your PWA

function doPost(e) {
  try {
    // Parse the incoming data
    const data = JSON.parse(e.postData.contents);

    // Get the active spreadsheet
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // Get the appropriate sheet based on record type
    const sheetName = data.sheetName;
    let sheet = ss.getSheetByName(sheetName);

    // If sheet doesn't exist, create it
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }

    // Prepare the row data based on record type
    let row;

    if (sheetName === 'Temperature Logs') {
      row = [
        data.timestamp,
        data.user,
        data.email,
        data.data.type,
        data.data.location,
        data.data.temperature,
        data.data.notes || ''
      ];
    } else if (sheetName === 'Cleaning Checklist') {
      row = [
        data.timestamp,
        data.user,
        data.email,
        data.data.task,
        data.data.completed,
        data.data.notes || ''
      ];
    } else if (sheetName === 'Delivery Logs') {
      row = [
        data.timestamp,
        data.user,
        data.email,
        data.data.supplier,
        data.data.product,
        data.data.temperature,
        data.data.condition,
        data.data.notes || ''
      ];
    } else if (sheetName === 'Incident Reports') {
      row = [
        data.timestamp,
        data.user,
        data.email,
        data.data.incidentType,
        data.data.description,
        data.data.correctiveAction,
        data.data.followUpRequired
      ];
    } else if (sheetName === 'Staff Records') {
      row = [
        data.timestamp,
        data.user,
        data.email,
        data.data.recordType,
        data.data.details,
        data.data.expiryDate,
        data.data.notes || ''
      ];
    }

    // Append the row
    sheet.appendRow(row);

    // Return success
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: 'Record saved successfully'
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    // Return error
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Test function
function test() {
  const testData = {
    sheetName: 'Temperature Logs',
    timestamp: new Date().toISOString(),
    user: 'Test User',
    email: 'test@example.com',
    data: {
      type: 'fridge',
      location: 'Main Kitchen Fridge',
      temperature: 4.5,
      notes: 'Test entry'
    }
  };

  const result = doPost({
    postData: {
      contents: JSON.stringify(testData)
    }
  });

  Logger.log(result.getContent());
}
```

4. Click **Deploy > New deployment**
5. Click **Select type > Web app**
6. Configure:
   - Description: "MPI Compliance API"
   - Execute as: **Me**
   - Who has access: **Anyone** (this is safe - your PWA will be the only one using it)
7. Click **Deploy**
8. **Copy the Web App URL** - it will look like:
   `https://script.google.com/macros/s/SCRIPT_ID/exec`

9. Click **Authorize access** and grant permissions

---

## 4. Google OAuth Setup

To enable Google Sign-In on your PWA:

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project: "MPI Compliance"
3. Enable **Google+ API** (for sign-in)
4. Go to **APIs & Services > Credentials**
5. Click **Create Credentials > OAuth client ID**
6. Configure consent screen if prompted:
   - User Type: External (or Internal if you have Workspace)
   - App name: "MPI Compliance"
   - User support email: your email
   - Developer contact: your email
7. Create OAuth client ID:
   - Application type: **Web application**
   - Name: "MPI Compliance Web"
   - Authorized JavaScript origins:
     - `https://recordkeeping.hotlikeamexican.com`
     - `http://localhost:8000` (for testing)
   - Authorized redirect URIs: (leave empty for now)
8. **Copy the Client ID** - it will look like:
   `123456789-abcdefg.apps.googleusercontent.com`

---

## 5. Hosting Setup

### Upload to Your cPanel Hosting

1. **Create subdomain in cPanel:**
   - Go to cPanel > Domains > Subdomains
   - Create: `recordkeeping.hotlikeamexican.com`
   - Document root: `/public_html/recordkeeping` (or similar)

2. **Upload files:**
   - Use cPanel File Manager or FTP
   - Upload ALL files from `Proyecto_Compliance` folder to the subdomain directory:
     ```
     /public_html/recordkeeping/
       ├── index.html
       ├── manifest.json
       ├── sw.js
       ├── css/
       │   └── styles.css
       ├── js/
       │   ├── app.js
       │   ├── auth.js
       │   └── sheets.js
       └── icons/
           ├── icon-192.png
           └── icon-512.png
     ```

3. **Create icons** (simple method):
   - Use a free tool like [Favicon.io](https://favicon.io/) or [RealFaviconGenerator](https://realfavicongenerator.net/)
   - Generate 192x192 and 512x512 PNG icons
   - Upload to `/icons/` folder

---

## 6. Final Configuration

### Update index.html

Edit `index.html` line 25:
```html
<div id="g_id_onload"
     data-client_id="YOUR_GOOGLE_CLIENT_ID_HERE"
```
Replace `YOUR_GOOGLE_CLIENT_ID_HERE` with your actual Google OAuth Client ID

### Update js/sheets.js

Edit `js/sheets.js` line 46:
```javascript
const SimpleSheetsAPI = {
    WEB_APP_URL: 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE',
```
Replace with your actual Google Apps Script Web App URL

### Update js/app.js

In `js/app.js`, around line 42-45, uncomment the Google Sheets saving:
```javascript
// Change this:
await this.simulateSave(formData);

// To this:
await SimpleSheetsAPI.saveTemperatureLog(formData);
```

---

## 7. Testing

### Local Testing First

1. Navigate to project folder:
   ```bash
   cd /home/martin/Downloads/Proyecto_Compliance
   ```

2. Start a local server:
   ```bash
   python3 -m http.server 8000
   ```

3. Open browser: `http://localhost:8000`

4. Test:
   - Sign in with Google
   - Create a temperature log
   - Check your Google Sheet to see if data appears

### Production Testing

1. Go to `https://recordkeeping.hotlikeamexican.com`
2. Test Google Sign-In
3. Test saving a temperature record
4. Check Google Sheet for data

### Install as App on Tablet

1. Open `https://recordkeeping.hotlikeamexican.com` in Chrome on your tablet
2. Chrome will show "Install app" prompt (or tap menu > "Install app")
3. Tap "Install"
4. App icon will appear on home screen

---

## 🔐 Security Notes

- The Google Apps Script runs as YOU and has access to your sheets
- Only people with the Web App URL can submit data
- Google Sign-In ensures only authenticated users can access the app
- All data is stored in your Google Drive (encrypted by Google)

---

## 📱 Using the App

1. **Daily Temperature Logs:**
   - Tap "Temperature Logs"
   - Select equipment type
   - Enter location and temperature
   - Save

2. **Data is automatically saved to Google Sheets**
3. **View data in Google Sheets anytime**
4. **Export to Excel for MPI inspections** (File > Download > Excel)

---

## 🆘 Troubleshooting

**Sign-in doesn't work:**
- Check Google Client ID is correct in index.html
- Verify authorized origins in Google Cloud Console

**Data not saving:**
- Check Web App URL is correct in sheets.js
- Verify Apps Script deployment is active
- Check browser console for errors (F12)

**PWA won't install:**
- Make sure you're using HTTPS
- Check manifest.json has correct icon paths
- Try clearing browser cache

---

## 📞 Need Help?

Check browser console (F12) for any error messages - they usually tell you exactly what's wrong!
