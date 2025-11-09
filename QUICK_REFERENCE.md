# Taquero Quick Reference Guide

## Key Files at a Glance

| File | Size | Purpose |
|------|------|---------|
| `index.html` | 8.7 KB | Single-page app structure |
| `css/styles.css` | 15 KB | All styling (Stripe design) |
| `js/app.js` | 7.4 KB | Core navigation & forms |
| `js/auth.js` | 4.9 KB | Google Sign-In & sessions |
| `js/sheets.js` | 5.0 KB | Google Sheets integration |
| `sw.js` | 2.2 KB | Service Worker (PWA) |
| `manifest.json` | 0.6 KB | PWA configuration |

## Tech Stack Cheat Sheet

```
Frontend:   HTML5 + CSS3 + JavaScript ES6+  (NO frameworks)
Backend:    Google Sheets API
Auth:       Google Sign-In SDK
Storage:    Google Sheets + localStorage
PWA:        Service Worker + Web Manifest
Deploy:     Traditional HTTP hosting
Build:      NONE (zero dependencies!)
```

## Most Important Code Patterns

### Pattern 1: View Navigation
```javascript
// Show a view
App.showView('temperature');

// HTML must have:
// <div id="temperature-view" class="view">

// Hides all views, shows requested one
```

### Pattern 2: Form Submission
```javascript
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    showLoading(true);
    // validate & save data
    showToast('Success', 'success');
    showLoading(false);
    App.showView('dashboard');
});
```

### Pattern 3: Card Grid Layout
```html
<div class="dashboard-grid">
    <div class="record-card" data-type="action">
        <div class="card-icon">🎯</div>
        <h3>Title</h3>
        <p>Description</p>
    </div>
</div>
```

### Pattern 4: Button Styles
```html
<button class="btn-primary">Main Action</button>
<button class="btn-secondary">Secondary</button>
<button class="btn-back">← Back</button>
<button class="btn-logout">Logout</button>
```

### Pattern 5: Toast Notifications
```javascript
showToast('Success message', 'success');  // green
showToast('Error message', 'error');      // red
showToast('Warning message', 'warning');  // orange
```

## Color Palette

| Name | Hex | Usage |
|------|-----|-------|
| Primary | #635BFF | Buttons, links, focus |
| Secondary | #0A2540 | Text, headers |
| Success | #00C48C | Positive feedback |
| Warning | #FFB23F | Warnings, alerts |
| Danger | #FF5A5F | Errors, destructive |
| BG Light | #F6F9FC | Page background |
| BG White | #FFFFFF | Cards, panels |

## CSS Variables Reference

```css
--primary-color: #635BFF
--text-primary: #0A2540
--bg-primary: #FFFFFF
--bg-secondary: #F6F9FC
--shadow-md: 0 4px 6px rgba(...)
--transition-base: 200ms
--radius-md: 12px
```

## Component Classes

| Class | Purpose | Example |
|-------|---------|---------|
| `.dashboard-grid` | Card grid layout | Dashboard cards |
| `.record-card` | Clickable card | Feature cards |
| `.record-form` | Form container | Data entry forms |
| `.btn-primary` | Primary button | Main actions |
| `.toast` | Notification | Success/error msgs |
| `.loading-overlay` | Full-screen loading | Async operations |
| `.view` | Switchable content | Dashboard views |
| `.screen` | Full-screen panel | Login, app |

## Global Objects & Methods

### Auth
```javascript
Auth.currentUser        // { name, email, picture }
Auth.accessToken        // JWT token string
Auth.init()            // Check session on load
Auth.testLogin('pwd')  // Demo login
Auth.saveSession()     // Store in localStorage
Auth.logout()          // Clear & show login
Auth.showApp()         // Show app screen
```

### App
```javascript
App.currentView        // Current active view
App.init()            // Initialize app
App.showView(name)    // Switch to view
App.setupNavigation() // Wire up events
App.setupForms()      // Wire up forms
```

### SheetsAPI
```javascript
SheetsAPI.appendRow(sheetName, values)
SheetsAPI.getSheetData(sheetName, range)
SheetsAPI.saveTemperatureLog(data)
```

### SimpleSheetsAPI
```javascript
SimpleSheetsAPI.saveRecord(type, data)
SimpleSheetsAPI.saveTemperatureLog(data)
```

## Utility Functions

```javascript
showLoading(true/false)        // Show/hide loading overlay
showToast(msg, type)           // Show notification
formatDate(dateString)         // Format dates
parseJwt(token)               // Decode JWT
```

## Responsive Breakpoints

```css
/* Mobile (default) */
< 768px - Single column, full width

/* Tablet */
768px - 1024px - 2-column grid, larger touch targets

/* Desktop */
> 1024px - Auto-fit grid, hover effects
```

## localStorage Keys

```javascript
'mpi_user'           // Current user object
'mpi_token'          // Auth token
'mpi_temp_records'   // Temperature log array
'current_dashboard'  // Selected dashboard (for multi-dashboard)
```

## Common Tasks

### Add a New Record Type
1. Add card in dashboard HTML
2. Add view HTML with `id="{type}-view"`
3. Add form HTML with inputs
4. Add form handler in App.setupForms()
5. Add validation if needed
6. Add to SheetsAPI.SHEETS

### Create a New Dashboard
1. Copy existing dashboard structure
2. Create new module JS file
3. Add init() method with setupNavigation()
4. Add showView() method
5. Add HTML views
6. Add CSS styling
7. Update selector to route to it

### Connect to Google Sheets
1. Get Spreadsheet ID
2. Create sheets for each record type
3. Set SheetsAPI.SPREADSHEET_ID
4. Set SimpleSheetsAPI.WEB_APP_URL
5. Uncomment data save calls
6. Test in browser

### Enable PWA Installation
1. HTTPS required
2. Icons in /icons/ (192x192 + 512x512)
3. manifest.json configured
4. Service Worker registered
5. Test on tablet/mobile

## Testing Checklist

- [ ] Login works (test + Google)
- [ ] Navigation between views works
- [ ] Forms submit without errors
- [ ] Data saves to localStorage
- [ ] Notifications appear
- [ ] Loading overlay shows/hides
- [ ] Cards are clickable
- [ ] Back buttons work
- [ ] Logout works
- [ ] Responsive on mobile
- [ ] Responsive on tablet
- [ ] Service Worker caches
- [ ] PWA installs on tablet
- [ ] HTTPS working

## Performance Tips

1. All resources < 50KB total
2. No external dependencies
3. Service Worker enables offline
4. Optimized for 2018 tablet hardware
5. Loads in < 1 second

## Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| Login doesn't work | Check Google Client ID |
| Data not saving | Check SimpleSheets URL |
| PWA won't install | Check HTTPS, icons, manifest |
| Navigation broken | Check view IDs match |
| Styling looks weird | Clear cache (Ctrl+Shift+Del) |
| Cards not clickable | Check event listeners |
| Overlay stuck | Check showLoading(false) calls |

## File Organization Rules

- **HTML**: All in index.html (single-page app)
- **CSS**: All in styles.css (one file)
- **JS**: Separate files per module (app, auth, sheets, etc.)
- **Images**: SVG preferred, PNGs for icons
- **Icons**: Must be 192x192 and 512x512 PNG

## Naming Conventions

- **IDs**: `kebab-case` (e.g., `login-screen`)
- **Classes**: `kebab-case` (e.g., `.record-card`)
- **JS Objects**: `PascalCase` (e.g., `App`, `Auth`)
- **Methods**: `camelCase` (e.g., `showView()`)
- **Variables**: `camelCase` (e.g., `currentUser`)
- **CSS Variables**: `--kebab-case` (e.g., `--primary-color`)

## Deployment Checklist

- [ ] No console errors
- [ ] All forms tested
- [ ] Data saving tested
- [ ] HTTPS enabled
- [ ] Icons created (192x512)
- [ ] manifest.json updated
- [ ] Service Worker cached files
- [ ] .htaccess configured
- [ ] Google credentials set
- [ ] Test on actual device
- [ ] Performance acceptable
- [ ] Responsive on target devices

## Support Documentation

- `CODEBASE_ANALYSIS.md` - Detailed architecture
- `VISUAL_SUMMARY.txt` - Visual overview
- `DUAL_DASHBOARD_GUIDE.md` - Multi-dashboard setup
- `SETUP_GUIDE.md` - Google integration setup
- `DEPLOYMENT_CHECKLIST.md` - Pre-deployment steps
- `QUICKSTART.md` - Quick start guide

---

**Last Updated**: November 2024
**Current Version**: 1.0
**Status**: Production Ready
