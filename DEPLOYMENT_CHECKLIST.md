# Deployment Checklist

Use this checklist to ensure everything is set up correctly.

## ☐ Pre-Deployment Setup

### Google Sheets
- [ ] Created "MPI Compliance Records" spreadsheet
- [ ] Created all 5 sheets with correct column headers:
  - [ ] Temperature Logs
  - [ ] Cleaning Checklist
  - [ ] Delivery Logs
  - [ ] Incident Reports
  - [ ] Staff Records
- [ ] Copied Spreadsheet ID

### Google Apps Script
- [ ] Created Apps Script in Google Sheet
- [ ] Pasted the doPost() code
- [ ] Deployed as Web App
- [ ] Set permissions (Execute as: Me, Access: Anyone)
- [ ] Copied Web App URL
- [ ] Tested using the test() function

### Google OAuth
- [ ] Created Google Cloud project
- [ ] Enabled Google+ API
- [ ] Created OAuth Client ID
- [ ] Added authorized JavaScript origin: `https://recordkeeping.hotlikeamexican.com`
- [ ] Copied Client ID

### Icons
- [ ] Generated or created 192x192 icon
- [ ] Generated or created 512x512 icon
- [ ] Named as icon-192.png and icon-512.png
- [ ] Placed in /icons/ folder

---

## ☐ Hosting Setup

### cPanel Configuration
- [ ] Created subdomain: recordkeeping.hotlikeamexican.com
- [ ] Noted document root path
- [ ] Verified SSL certificate is active (HTTPS working)

### File Upload
- [ ] Uploaded all files via FTP or File Manager:
  - [ ] index.html
  - [ ] manifest.json
  - [ ] sw.js
  - [ ] .htaccess
  - [ ] css/styles.css
  - [ ] js/app.js
  - [ ] js/auth.js
  - [ ] js/sheets.js
  - [ ] icons/icon-192.png
  - [ ] icons/icon-512.png

---

## ☐ Configuration

### Update index.html
- [ ] Replaced `YOUR_GOOGLE_CLIENT_ID` (line 25) with actual Client ID

### Update js/sheets.js
- [ ] Replaced `YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE` (line 46) with actual Web App URL

### Update js/app.js
- [ ] Uncommented the SimpleSheetsAPI.saveTemperatureLog() call (around line 44)
- [ ] Commented out or removed the simulateSave() call

---

## ☐ Testing

### Local Testing
- [ ] Tested on local server (python -m http.server)
- [ ] Google Sign-In works
- [ ] Can create temperature log
- [ ] Data appears in Google Sheet

### Production Testing
- [ ] Visited https://recordkeeping.hotlikeamexican.com
- [ ] Site loads correctly (no 404 errors)
- [ ] HTTPS is working (padlock icon in browser)
- [ ] Google Sign-In works
- [ ] Created test temperature log
- [ ] Verified data saved to Google Sheet
- [ ] Checked browser console for errors (F12 > Console)

### Tablet Testing
- [ ] Opened on tablet in Chrome
- [ ] Install prompt appears
- [ ] Installed as PWA
- [ ] App opens from home screen icon
- [ ] Touch targets are easy to tap
- [ ] Forms work properly
- [ ] Data saves successfully

---

## ☐ User Setup

### Staff Accounts
- [ ] All 4 staff members have Google accounts
- [ ] Staff members know how to access the app
- [ ] Staff members can sign in successfully

### Training
- [ ] Showed staff how to install the app
- [ ] Demonstrated how to log temperatures
- [ ] Explained the importance of accurate records
- [ ] Showed where to find data in Google Sheets

---

## ☐ MPI Compliance

### Documentation
- [ ] Printed backup instructions
- [ ] Documented where to find records for inspectors
- [ ] Set up regular data backups (Google Sheets auto-saves)
- [ ] Know how to export to Excel for audits

### Record Types Enabled
- [x] Temperature Logs (working)
- [ ] Cleaning Checklist (to be built)
- [ ] Delivery Logs (to be built)
- [ ] Incident Reports (to be built)
- [ ] Staff Records (to be built)

---

## ☐ Maintenance

### Regular Checks
- [ ] Weekly: Check Google Sheet has recent entries
- [ ] Monthly: Verify all staff can still access
- [ ] Quarterly: Review and export records
- [ ] Yearly: Renew SSL certificate (usually automatic)

### Backups
- [ ] Google Sheets auto-saves (built-in)
- [ ] Consider: Download monthly Excel backups
- [ ] Store in multiple locations (Google Drive + local)

---

## 🚀 Launch

When all items above are checked:
- [ ] Official launch announced to staff
- [ ] Old paper/Google Drive system retired
- [ ] First week: Monitor daily for issues
- [ ] First month: Gather staff feedback

---

## 📞 Support Contacts

**Google Workspace Issues:**
- Google Workspace support

**Hosting Issues:**
- Your hosting provider support
- cPanel documentation

**App Errors:**
- Check browser console (F12)
- Review SETUP_GUIDE.md
- Check Google Apps Script logs

---

## ✅ Completion

Date deployed: _______________

Deployed by: _______________

All staff trained: _______________

Ready for MPI inspection: ☐ Yes ☐ No

Notes:
_______________________________________________
_______________________________________________
_______________________________________________
