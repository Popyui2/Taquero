# 📦 Deployment Checklist for Taquero

## Before You Start

Make sure you have completed the security setup first! See `SECURITY_SETUP.md`

---

## Pre-Deployment Steps

### 1. Environment Variables ✓

- [ ] Created `.env.local` file
- [ ] Added `VITE_APP_PASSWORD_HASH` with your password hash
- [ ] (Optional) Added `VITE_GOOGLE_SHEETS_TOKEN` for webhook security
- [ ] Verified `.env.local` is in `.gitignore` (already there)

### 2. Test Locally ✓

```bash
npm run dev
```

- [ ] Login page loads correctly
- [ ] Can login with correct username + password
- [ ] Cannot login with wrong password
- [ ] Rate limiting works (5 failed attempts locks for 15 min)
- [ ] Can access dashboard after login
- [ ] Can logout successfully
- [ ] All modules load correctly

### 3. Build Production Version ✓

```bash
npm run build
```

- [ ] Build completes without errors
- [ ] `dist/` folder created
- [ ] Check build output - should see all assets

Expected output:
```
dist/index.html                   X.XX kB
dist/assets/index-[hash].css      XX.XX kB
dist/assets/index-[hash].js       XXX.XX kB
```

---

## Deployment Methods

Choose ONE method based on your hosting:

### Method 1: Shared Hosting (cPanel/FTP) - RECOMMENDED FOR YOU

#### Upload Files:

1. **Connect to your hosting** via FTP or File Manager
2. **Navigate to** your public_html folder (or subdomain folder)
3. **Upload entire contents** of `dist/` folder:
   ```
   dist/index.html           → public_html/index.html
   dist/assets/*             → public_html/assets/*
   dist/manifest.webmanifest → public_html/manifest.webmanifest
   dist/sw.js                → public_html/sw.js
   dist/registerSW.js        → public_html/registerSW.js
   dist/vite.svg             → public_html/vite.svg
   ```

4. **IMPORTANT:** The environment variable is already baked into the JavaScript during build!
   - Your password hash is embedded in the JS bundle (but it's a hash, not the actual password)
   - This is secure because attackers can't reverse a SHA-256 hash

5. **Set up Apache security headers** (create/edit `.htaccess` in public_html):

```apache
# Security Headers
<IfModule mod_headers.c>
    Header set X-Content-Type-Options "nosniff"
    Header set X-Frame-Options "SAMEORIGIN"
    Header set X-XSS-Protection "1; mode=block"
    Header set Referrer-Policy "strict-origin-when-cross-origin"

    # Content Security Policy
    Header set Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://script.google.com; img-src 'self' data:; font-src 'self' data:;"
</IfModule>

# Force HTTPS
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
</IfModule>

# Cache Control
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/html "access plus 0 seconds"
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/x-icon "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 year"
</IfModule>
```

6. **Test the deployment:**
   - Visit https://taquero.hotlikeamexican.com/
   - Try logging in
   - Check all modules work

---

### Method 2: GitHub Pages (Automated)

If you're using GitHub Pages deployment:

1. **Add GitHub Secret:**
   - Go to GitHub repo → Settings → Secrets and variables → Actions
   - New repository secret
   - Name: `VITE_APP_PASSWORD_HASH`
   - Value: (your password hash from .env.local)

2. **Update deploy.yml** (if not already done):

```yaml
- name: Build
  env:
    VITE_APP_PASSWORD_HASH: ${{ secrets.VITE_APP_PASSWORD_HASH }}
    VITE_GOOGLE_SHEETS_TOKEN: ${{ secrets.VITE_GOOGLE_SHEETS_TOKEN }}
  run: npm run build
```

3. **Push to GitHub:**
```bash
git add .
git commit -m "Security improvements"
git push origin main
```

4. **GitHub Action will automatically deploy**

---

## Post-Deployment Verification

### Security Checks ✓

- [ ] Visit your deployed site
- [ ] Open browser DevTools (F12) → Network tab
- [ ] Try to login with WRONG password
- [ ] Check that it fails correctly
- [ ] Try to login with CORRECT password
- [ ] Check that it succeeds
- [ ] Verify you can access the dashboard
- [ ] Test a few modules (temperature, cleaning, etc.)

### Verify Password Not Exposed ✓

- [ ] Open DevTools → Sources tab
- [ ] Find the bundled JavaScript file (index-[hash].js)
- [ ] Search (Ctrl+F) for your actual password
- [ ] **Should NOT find it** (only hash should exist, which is secure)

### Test Google Sheets (if using token protection) ✓

- [ ] Submit data from a module (e.g., Temperature Check)
- [ ] Check if data appears in Google Sheet
- [ ] If it fails with "Unauthorized", check:
  - Token in `.env.local` matches token in Google Apps Script
  - You rebuilt after adding token
  - Google Apps Script has token in Script Properties

---

## Rollback Plan (If Something Goes Wrong)

If deployment fails:

1. **Keep your old files** as backup before uploading new ones
2. **If site is broken:**
   - Re-upload old files from backup
   - Or remove all files and re-upload from previous `dist/` folder

3. **If login doesn't work:**
   - Check browser console for errors
   - Verify you copied the complete hash
   - Rebuild locally and test before re-deploying

---

## Updating Your App Later

When you make changes:

1. Make code changes
2. Test locally: `npm run dev`
3. Build: `npm run build`
4. Upload new `dist/` contents to hosting
5. **Clear browser cache** and test (Ctrl+Shift+R)

**Note:** You don't need to regenerate the password hash unless you're changing the password!

---

## Security Maintenance

### Monthly Checklist:

- [ ] Review Google Sheets for suspicious data
- [ ] Check server logs for unusual activity
- [ ] Update dependencies: `npm update`
- [ ] Consider changing password every 3-6 months

### When to Change Password:

- Someone leaves the team
- You suspect password was compromised
- Every 3-6 months (best practice)
- After security incident

**To change password:**
1. Run `node generate-password-hash.js` with new password
2. Update `.env.local`
3. Rebuild: `npm run build`
4. Redeploy to hosting
5. Tell team the new password

---

## Troubleshooting Common Issues

### "Cannot connect to server"
- Check if hosting is up
- Verify files uploaded correctly
- Check .htaccess for syntax errors

### "Login not working"
- Clear browser cache (Ctrl+Shift+R)
- Check console for JavaScript errors
- Verify environment variable was included in build

### "Google Sheets not saving"
- Check token matches in both .env.local and Apps Script
- Verify Apps Script is deployed as Web App
- Check network tab for 401/403 errors

### "Page not loading correctly"
- Clear browser cache
- Check if all files uploaded (especially index.html)
- Verify folder permissions (755 for folders, 644 for files)

---

## Files You Should Have Now

```
taquero-react/
├── src/
│   ├── store/
│   │   └── authStore.ts              ← UPDATED (secure auth)
│   └── components/
│       └── auth/
│           └── LoginScreen.tsx       ← UPDATED (username + password)
├── .env.local                        ← CREATE THIS (your secrets)
├── .gitignore                        ← Already has .env.local
├── generate-password-hash.js         ← NEW (generates hash)
├── SECURITY_SETUP.md                 ← NEW (setup guide)
├── DEPLOYMENT_CHECKLIST.md           ← NEW (this file)
└── GOOGLE_APPS_SCRIPT_SECURE_EXAMPLE.js  ← NEW (example)
```

---

## Ready to Deploy?

Go through this checklist one more time:

1. ✓ Password hash generated
2. ✓ `.env.local` created with hash
3. ✓ Tested locally (login works)
4. ✓ Built for production (`npm run build`)
5. ✓ dist/ folder exists and has files
6. ✓ Ready to upload to hosting

**If all checked, you're ready to deploy! 🚀**
