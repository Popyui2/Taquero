# Taquero - Setup Guide

## Quick Start (Development)

### 1. Install Node.js

Make sure you have Node.js 18+ installed:
```bash
node --version  # Should be v18 or higher
```

If not installed, download from: https://nodejs.org/

### 2. Install Dependencies

Navigate to the project directory and install all dependencies:

```bash
cd taquero-react
npm install
```

This will install all required packages including:
- React 18
- Vite
- TypeScript
- shadcn/ui components
- Tailwind CSS
- React Router
- Zustand
- And more...

### 3. Run Development Server

```bash
npm run dev
```

The app will be available at: `http://localhost:5173`

**Default Login:**
- Password: `123456`
- Then select a user (Martin, Andres, Hugo, Marcela, or Temp Employee)

### 4. Build for Production

```bash
npm run build
```

The production build will be in the `dist/` directory.

To preview the production build:
```bash
npm run preview
```

## Google Sheets Integration

### Setting Up Google Apps Script

1. Create a new Google Sheet for storing temperature data

2. Go to **Extensions > Apps Script**

3. Paste the following code:

```javascript
function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Temperature Logs');

    // Create sheet if it doesn't exist
    if (!sheet) {
      const newSheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet('Temperature Logs');
      newSheet.appendRow(['Date', 'Timestamp', 'User', 'Unit', 'Temperature (°C)']);
    }

    const data = JSON.parse(e.postData.contents);
    const activeSheet = sheet || SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Temperature Logs');

    // Add chiller data
    data.chillers.forEach(chiller => {
      activeSheet.appendRow([
        data.date,
        data.timestamp,
        data.user,
        chiller.unit,
        chiller.temperature
      ]);
    });

    // Add freezer data
    if (data.freezer) {
      activeSheet.appendRow([
        data.date,
        data.timestamp,
        data.user,
        data.freezer.unit,
        data.freezer.temperature
      ]);
    }

    return ContentService.createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

4. Click **Deploy > New deployment**

5. Choose **Web app**

6. Set:
   - Execute as: **Me**
   - Who has access: **Anyone**

7. Click **Deploy** and copy the web app URL

8. Update the URL in your code:
   - File: `src/components/temperature/TemperatureWizard.tsx`
   - Line 16: Replace the `GOOGLE_SHEETS_URL` with your URL

## Customization

### Changing Users

Edit `src/store/authStore.ts`:

```typescript
const AVAILABLE_USERS = ['Your', 'User', 'Names', 'Here']
```

### Changing Password

Edit `src/store/authStore.ts`:

```typescript
const APP_PASSWORD = 'your-password-here'
```

### Modifying Colors

The app uses CSS variables defined in `src/index.css`. The dark theme is default and uses pure blacks and whites for a minimalist Vercel-inspired look.

To customize colors, modify the `--background`, `--foreground`, and other CSS variables in the `.dark` section.

### Adding New Modules

1. Create a new component in `src/pages/modules/YourModule.tsx`
2. Add a route in `src/App.tsx`
3. Add a ModuleCard in the appropriate dashboard

## Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub

2. Go to https://vercel.com

3. Click **New Project**

4. Import your repository

5. Configure:
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`

6. Click **Deploy**

### Deploy to Netlify

1. Push your code to GitHub

2. Go to https://netlify.com

3. Click **Add new site > Import an existing project**

4. Configure:
   - Build command: `npm run build`
   - Publish directory: `dist`

5. Click **Deploy**

### Deploy as APK (Future)

To convert this PWA to an Android APK:

1. Go to https://www.pwabuilder.com/

2. Enter your deployed URL

3. Click **Package for Android**

4. Download and sign the APK

## Tablet Optimization

The app is optimized for tablets (especially Android 9 with 4GB RAM):

- **Touch targets:** Minimum 44px for easy tapping
- **Font sizes:** Large and readable
- **Dark theme:** Reduces battery usage and eye strain
- **Smooth animations:** Optimized for lower-end devices
- **Responsive grid:** Adapts from 1-3 columns based on screen size

## Troubleshooting

### Module not found errors

Run:
```bash
rm -rf node_modules package-lock.json
npm install
```

### TypeScript errors

Make sure your editor recognizes the path aliases. For VS Code, it should work automatically with the `tsconfig.json`.

### PWA not installing

Make sure:
1. You're using HTTPS (required for PWA)
2. Icons are present in the `public/` directory
3. `manifest.json` is correctly configured in `vite.config.ts`

### Google Sheets not saving

1. Check the Apps Script deployment URL is correct
2. Make sure the script has **Anyone** access
3. Check browser console for errors
4. Data is also saved locally to `localStorage` as backup

## Development Tips

### Hot Module Replacement (HMR)

Vite provides instant hot reload. Just save your files and see changes immediately.

### TypeScript

The project uses strict TypeScript. If you need to bypass type checking temporarily:

```typescript
// @ts-ignore
```

But try to fix types properly for production.

### State Management

We use Zustand with localStorage persistence:

- **Auth state:** `src/store/authStore.ts`
- **App state:** `src/store/appStore.ts`

State is automatically persisted and restored on page reload.

### Adding shadcn/ui Components

To add more shadcn/ui components:

```bash
npx shadcn-ui@latest add [component-name]
```

Example:
```bash
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add dropdown-menu
```

## Next Steps

1. Implement remaining FCP modules
2. Add inventory management
3. Build financial data visualization
4. Create admin dashboard for multi-tenancy
5. Add proper authentication (Firebase/Supabase)
6. Implement database backend
7. Add email notifications
8. Build reporting features

---

For questions or support, contact the development team.
