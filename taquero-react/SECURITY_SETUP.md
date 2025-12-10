# 🔐 Security Setup Instructions for Taquero

## Quick Start (5 minutes)

### Step 1: Generate Your Password Hash

Run this command in your terminal:

```bash
node generate-password-hash.js
```

Follow the prompts and it will generate a hash for you.

### Step 2: Create .env.local File

Create a file called `.env.local` in the root directory with this content:

```bash
# Taquero App Password Hash
# NEVER commit this file to git (already in .gitignore)
VITE_APP_PASSWORD_HASH=paste_your_hash_here

# Google Sheets API Secret (optional - for webhook protection)
VITE_GOOGLE_SHEETS_TOKEN=generate_random_string_here
```

**Example:**
```bash
VITE_APP_PASSWORD_HASH=5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8
VITE_GOOGLE_SHEETS_TOKEN=taquero_secret_2024_xyz789abc
```

### Step 3: Test Locally

```bash
npm run dev
```

Visit http://localhost:5173 and try logging in with:
- **Username:** Martin (or any user from the list)
- **Password:** (the password you used to generate the hash)

### Step 4: Build for Production

```bash
npm run build
```

This creates a `dist/` folder with your production files.

### Step 5: Deploy to Shared Hosting

Upload everything from the `dist/` folder to your hosting:

```
dist/
├── index.html
├── assets/
│   ├── index-[hash].js
│   └── index-[hash].css
├── manifest.webmanifest
├── sw.js
└── registerSW.js
```

---

## Important: GitHub Secrets for GitHub Pages Deployment

If deploying via GitHub Pages/Actions, add your password hash as a GitHub Secret:

1. Go to your GitHub repo
2. Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Name: `VITE_APP_PASSWORD_HASH`
5. Value: (your password hash)
6. Click "Add secret"

Then update your `.github/workflows/deploy.yml`:

```yaml
- name: Build
  env:
    VITE_APP_PASSWORD_HASH: ${{ secrets.VITE_APP_PASSWORD_HASH }}
  run: npm run build
```

---

## Security Features Implemented

✅ **No Hardcoded Passwords** - Password is hashed and stored in environment variable
✅ **SHA-256 Hashing** - Password is hashed before comparison
✅ **Rate Limiting** - 5 failed attempts = 15 minute lockout
✅ **User Selection** - Combined username + password authentication
✅ **Session Management** - Automatic session clearing on logout
✅ **Environment Variables** - Secrets kept out of source code

---

## Google Sheets Webhook Protection (Optional)

To protect your Google Apps Script webhooks from spam:

### 1. Generate a Random Token

```bash
# On Linux/Mac:
openssl rand -hex 32

# Or use any random string generator
```

### 2. Add to .env.local

```bash
VITE_GOOGLE_SHEETS_TOKEN=your_random_token_here
```

### 3. Update Your Google Apps Script

For each Google Apps Script file, add this at the top of `doPost`:

```javascript
function doPost(e) {
  // Get the secret token from Script Properties
  const SECRET_TOKEN = PropertiesService.getScriptProperties()
    .getProperty('GOOGLE_SHEETS_SECRET_TOKEN');

  const data = JSON.parse(e.postData.contents);

  // Verify the token
  if (!data.token || data.token !== SECRET_TOKEN) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Unauthorized - Invalid token'
    })).setMimeType(ContentService.MimeType.JSON);
  }

  // Remove token from data before processing
  delete data.token;

  // Your existing code continues here...
  const sheet = SpreadsheetApp.openById('your-sheet-id')
    .getSheetByName('Sheet1');
  // ... etc
}
```

### 4. Set the Secret in Google Apps Script

1. Open your Google Apps Script
2. Go to Project Settings (gear icon)
3. Scroll to "Script Properties"
4. Add property:
   - **Key:** `GOOGLE_SHEETS_SECRET_TOKEN`
   - **Value:** (same random token from .env.local)
5. Save

### 5. Update Your Store Files

Find all instances where you POST to Google Sheets and add the token:

```typescript
// Example: in temperatureStore.ts or any store with Google Sheets
const GOOGLE_SHEETS_TOKEN = import.meta.env.VITE_GOOGLE_SHEETS_TOKEN || '';

const saveToGoogleSheets = async (data: any) => {
  const response = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...data,
      token: GOOGLE_SHEETS_TOKEN  // Add this line
    })
  });

  return response.json();
};
```

---

## Password Management

### Changing Your Password

1. Run `node generate-password-hash.js` with new password
2. Update `.env.local` with new hash
3. Rebuild: `npm run build`
4. Redeploy to hosting
5. Update GitHub Secret if using GitHub Actions

### If You Forget Your Password

1. Generate a new hash with `node generate-password-hash.js`
2. Replace the hash in `.env.local`
3. Rebuild and redeploy

---

## Troubleshooting

### "Invalid password" even with correct password
- Make sure you copied the entire hash from the generator
- Check there are no extra spaces in `.env.local`
- Rebuild after changing `.env.local`

### Login not working after deployment
- Did you set the GitHub Secret?
- Check browser console for errors
- Verify environment variable is being loaded

### Google Sheets not saving data
- Check if token protection is enabled
- Verify token matches in both `.env.local` and Google Apps Script
- Check browser network tab for 401 errors

---

## Security Checklist Before Deployment

- [ ] Password hash generated and stored in `.env.local`
- [ ] `.env.local` is NOT committed to git (check `.gitignore`)
- [ ] Tested login locally with correct password
- [ ] Tested login locally with wrong password (should fail)
- [ ] Rate limiting works (test 5 wrong attempts)
- [ ] GitHub Secret added (if using GitHub Pages)
- [ ] Google Sheets token added (optional)
- [ ] Google Apps Script updated with token verification (optional)
- [ ] Build completed without errors
- [ ] Deployed to hosting successfully

---

## What Changed From Before

**Before (INSECURE):**
```typescript
const APP_PASSWORD = "#Apim957012"  // ❌ Exposed in bundle
```

**After (SECURE):**
```typescript
const VALID_PASSWORD_HASH = import.meta.env.VITE_APP_PASSWORD_HASH  // ✅ Not in bundle
```

The password is now:
1. Never stored in source code
2. Hashed before comparison
3. Protected by environment variables
4. Not visible in the production bundle

---

## Need Help?

If you run into issues:
1. Check the browser console for errors (F12)
2. Verify `.env.local` exists and has correct format
3. Make sure you rebuilt after adding environment variables
4. Test locally before deploying

---

**Remember:** Your `.env.local` file should NEVER be committed to git!
