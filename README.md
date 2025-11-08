# MPI Compliance Record Keeping System

A Progressive Web App (PWA) for managing food safety compliance records for Hot Like A Mexican restaurant in New Zealand.

## Features

- ✅ **Progressive Web App** - Install on tablet home screen
- ✅ **Google Sign-In** - Secure authentication
- ✅ **Google Sheets Backend** - Easy data management and exports
- ✅ **Tablet Optimized** - Large touch targets, clean UI
- ✅ **Multiple Record Types:**
  - Temperature Logs (fridge, freezer, hot holding)
  - Cleaning Checklists
  - Delivery Logs
  - Incident Reports
  - Staff Records

## Quick Start

1. Read `SETUP_GUIDE.md` for complete setup instructions
2. Configure Google OAuth and Google Apps Script
3. Upload to `recordkeeping.hotlikeamexican.com`
4. Install on tablet

## Technology Stack

- Pure HTML/CSS/JavaScript (no frameworks)
- Google Sign-In for authentication
- Google Sheets API for data storage
- Service Worker for PWA functionality

## File Structure

```
Proyecto_Compliance/
├── index.html              # Main app file
├── manifest.json           # PWA manifest
├── sw.js                   # Service worker
├── css/
│   └── styles.css          # All styles
├── js/
│   ├── app.js              # Main app logic
│   ├── auth.js             # Authentication
│   └── sheets.js           # Google Sheets integration
├── icons/
│   ├── icon-192.png        # PWA icon (192x192)
│   └── icon-512.png        # PWA icon (512x512)
├── SETUP_GUIDE.md          # Complete setup instructions
└── README.md               # This file
```

## Browser Support

- Chrome/Edge (recommended for tablet)
- Firefox
- Safari

## License

Private use for Hot Like A Mexican restaurant.

## Author

Created for MPI compliance record keeping.
